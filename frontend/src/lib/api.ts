import {
  BeliefsRequest,
  BeliefsResponse,
  QuestionsRequest,
  QuestionsResponse,
  ReflectRequest,
  ReflectResponse,
  ExperimentRequest,
  ExperimentResponse,
  CheckinRequest,
  CheckinResponse,
  ApiErrorResponse,
} from '@/types';

export class ApiError extends Error {
  public status: number;
  public details?: unknown;
  public code?: string;

  constructor(message: string, status: number, details?: unknown, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.code = code;
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Trim trailing slashes for consistent URL formatting
    const rawUrl = baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    this.baseUrl = rawUrl.replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Internal request executor with timeout, error normalization, and exponential backoff retry.
   */
  public async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      timeoutMs = 15000,
      retries = 2,
      retryDelayMs = 500,
      headers = {},
      ...fetchOptions
    } = options;

    const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${normalizedPath}`;

    let lastError: unknown = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...headers,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorData: ApiErrorResponse = {};
          try {
            errorData = await response.json();
          } catch {
            // Non-JSON error body
          }

          let errorMessage = `Request failed with status ${response.status}`;
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
            errorMessage = errorData.detail.map((d) => d.msg || '').join(', ');
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }

          const apiErr = new ApiError(
            errorMessage,
            response.status,
            errorData.detail || errorData,
            errorData.code
          );

          // Only retry on transient 5xx server errors or 429 rate limit
          const isTransient = response.status >= 500 || response.status === 429;
          if (isTransient && attempt < retries) {
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelayMs * Math.pow(2, attempt))
            );
            continue;
          }

          throw apiErr;
        }

        return (await response.json()) as T;
      } catch (err: unknown) {
        clearTimeout(timeoutId);

        if (err instanceof ApiError) {
          throw err;
        }

        const isAbort = (err as Error)?.name === 'AbortError';
        const netErrMsg = isAbort
          ? `Request timed out after ${timeoutMs}ms`
          : (err as Error)?.message || 'Network error occurred';

        lastError = new ApiError(netErrMsg, 0, err);

        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelayMs * Math.pow(2, attempt))
          );
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new ApiError('Unexpected request failure', 0);
  }

  /**
   * Surface 4-6 hidden assumptions and mental models from user doubt
   */
  public async surfaceBeliefs(payload: BeliefsRequest, options?: RequestOptions): Promise<BeliefsResponse> {
    return this.request<BeliefsResponse>('/api/beliefs', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    });
  }

  /**
   * Generate 4-5 structured Socratic questions
   */
  public async generateQuestions(payload: QuestionsRequest, options?: RequestOptions): Promise<QuestionsResponse> {
    return this.request<QuestionsResponse>('/api/questions', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    });
  }

  /**
   * Generate 2-3 deep reflective prompts
   */
  public async generateReflection(payload: ReflectRequest, options?: RequestOptions): Promise<ReflectResponse> {
    return this.request<ReflectResponse>('/api/reflect', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    });
  }

  /**
   * Formulate a 2-hour exploratory sandbox test
   */
  public async generateExperiment(payload: ExperimentRequest, options?: RequestOptions): Promise<ExperimentResponse> {
    return this.request<ExperimentResponse>('/api/experiment', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    });
  }

  /**
   * Generate 30-day follow-up plan
   */
  public async generateCheckin(payload: CheckinRequest, options?: RequestOptions): Promise<CheckinResponse> {
    return this.request<CheckinResponse>('/api/checkin', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...options,
    });
  }

  /**
   * Check backend health status
   */
  public async checkHealth(): Promise<{ status: string; service: string }> {
    return this.request<{ status: string; service: string }>('/health', {
      method: 'GET',
      retries: 1,
    });
  }
}

export const apiClient = new ApiClient();
