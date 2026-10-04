import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient, ApiError } from '@/lib/api';
import { BeliefsRequest, BeliefsResponse } from '@/types';

describe('ApiClient (Typed Fetch Client)', () => {
  let client: ApiClient;
  const mockBaseUrl = 'http://localhost:8000';

  beforeEach(() => {
    client = new ApiClient(mockBaseUrl);
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('correctly constructs baseURL and cleans trailing slashes', () => {
    const c1 = new ApiClient('http://localhost:8000/');
    expect(c1.getBaseUrl()).toBe('http://localhost:8000');

    const c2 = new ApiClient('http://localhost:8000///');
    expect(c2.getBaseUrl()).toBe('http://localhost:8000');
  });

  it('successfully surfaces beliefs via /api/beliefs', async () => {
    const mockResponse: BeliefsResponse = {
      skill: 'Rust',
      assumptions: [
        {
          id: 'A1',
          statement: 'Rust will instantly replace Python in my job.',
          tag: 'Career Expectation',
          counter_perspective: 'What if Python remains dominant for data and AI workloads?',
        },
        {
          id: 'A2',
          statement: 'I will struggle without a CS degree.',
          tag: 'Skill Identity',
          counter_perspective: 'How does your practical engineering experience transfer?',
        },
      ],
      thinking_summary: 'You are associating Rust mastery with immediate job security.',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', mockFetch);

    const payload: BeliefsRequest = {
      skill: 'Rust',
      context: 'I have 5 years Python experience.',
    };

    const result = await client.surfaceBeliefs(payload);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe('http://localhost:8000/api/beliefs');
    expect(calledInit.method).toBe('POST');
    expect(JSON.parse(calledInit.body)).toEqual(payload);
    expect(calledInit.headers['Content-Type']).toBe('application/json');
    expect(result).toEqual(mockResponse);
  });

  it('throws ApiError with detail message on non-200 responses', async () => {
    const mockErrorBody = {
      detail: 'Validation failed: skill must be at least 2 characters.',
      code: 'VALIDATION_ERROR',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => mockErrorBody,
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      client.surfaceBeliefs({ skill: 'R', context: 'Too short' })
    ).rejects.toThrow('Validation failed: skill must be at least 2 characters.');
  });

  it('retries on 500 server errors up to specified retries before failing', async () => {
    const mockErrorBody = { detail: 'Internal Server Error' };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => mockErrorBody,
    });
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      client.request('/api/beliefs', {
        method: 'POST',
        body: JSON.stringify({ skill: 'Rust', context: 'Test' }),
        retries: 2,
        retryDelayMs: 10,
      })
    ).rejects.toThrow('Internal Server Error');

    // Initial attempt + 2 retries = 3 calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('retries transient network error and succeeds on subsequent attempt', async () => {
    const mockSuccess = { status: 'ok', service: 'mirror-check-api' };

    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network disconnected'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockSuccess,
      });
    vi.stubGlobal('fetch', mockFetch);

    const result = await client.request<{ status: string; service: string }>('/health', {
      method: 'GET',
      retries: 2,
      retryDelayMs: 10,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual(mockSuccess);
  });

  it('handles request timeout error gracefully', async () => {
    const abortErr = new Error('The operation was aborted');
    abortErr.name = 'AbortError';

    const mockFetch = vi.fn().mockRejectedValue(abortErr);
    vi.stubGlobal('fetch', mockFetch);

    await expect(
      client.request('/health', {
        method: 'GET',
        timeoutMs: 50,
        retries: 0,
      })
    ).rejects.toThrow('Request timed out after 50ms');
  });

  it('calls health endpoint successfully', async () => {
    const mockHealth = { status: 'ok', service: 'mirror-check-api' };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockHealth,
    });
    vi.stubGlobal('fetch', mockFetch);

    const res = await client.checkHealth();
    expect(res).toEqual(mockHealth);
    expect(mockFetch.mock.calls[0][0]).toBe('http://localhost:8000/health');
  });
});
