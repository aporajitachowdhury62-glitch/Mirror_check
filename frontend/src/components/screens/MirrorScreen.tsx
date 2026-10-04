import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { BeliefsResponse, BeliefTag, ReflectResponse } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Slider } from '../ui/Slider';
import { apiClient, ApiError } from '@/lib/api';

interface MirrorScreenProps {
  skill: string;
  context: string;
  initialConfidence: number;
  postConfidence: number;
  onPostConfidenceChange: (val: number) => void;
  beliefs: BeliefsResponse;
  tags: Record<string, BeliefTag>;
  reflection: ReflectResponse | null;
  onReflectionLoaded: (data: ReflectResponse) => void;
  questionAnswers: Record<string, string>;
  onNext: () => void;
  onBack: () => void;
}

export function MirrorScreen({
  skill,
  context,
  initialConfidence,
  postConfidence,
  onPostConfidenceChange,
  beliefs,
  tags,
  reflection,
  onReflectionLoaded,
  questionAnswers,
  onNext,
  onBack,
}: MirrorScreenProps) {
  const [isLoading, setIsLoading] = useState(!reflection);
  const [error, setError] = useState<string | null>(null);

  // Calculate statistics
  const totalAssumptions = beliefs.assumptions.length;
  const knowCount = beliefs.assumptions.filter((a) => tags[a.id] === 'know').length;
  const guessCount = beliefs.assumptions.filter((a) => tags[a.id] === 'guess').length;
  const notSureCount = beliefs.assumptions.filter((a) => tags[a.id] === 'not_sure').length;

  const confidenceDelta = postConfidence - initialConfidence;

  // Load reflective questions from /api/reflect if not already present
  useEffect(() => {
    if (reflection) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchReflection = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const notesSummary = Object.entries(questionAnswers)
          .map(([k, v]) => (v && v.trim() ? `${k}: ${v.trim()}` : ''))
          .filter(Boolean)
          .join('\n');

        const res = await apiClient.generateReflection({
          skill,
          context,
          user_notes: notesSummary || undefined,
        });

        if (isMounted) {
          onReflectionLoaded(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError((err as Error)?.message || 'Failed to load reflection questions');
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchReflection();

    return () => {
      isMounted = false;
    };
  }, [reflection, skill, context, questionAnswers, onReflectionLoaded]);

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const notesSummary = Object.entries(questionAnswers)
        .map(([k, v]) => (v && v.trim() ? `${k}: ${v.trim()}` : ''))
        .filter(Boolean)
        .join('\n');

      const res = await apiClient.generateReflection({
        skill,
        context,
        user_notes: notesSummary || undefined,
      });
      onReflectionLoaded(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError((err as Error)?.message || 'Failed to load reflection questions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/70 border border-purple-800/40 text-purple-400 text-xs font-semibold">
          <Eye className="w-3.5 h-3.5" aria-hidden="true" />
          <span>The Mirror Reflection</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Your Thinking in the Mirror
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
          Notice how your perspective has evolved after surfacing assumptions and examining blind spots.
        </p>
      </div>

      {/* Confidence Shift Section (Side-by-side with Delta) */}
      <Card variant="glass" className="space-y-5 border-sky-500/20 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Conviction Shift Comparison
          </span>
          {/* Change Indicator Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono border ${
              confidenceDelta > 0
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                : confidenceDelta < 0
                ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {confidenceDelta > 0 ? (
              <>
                <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
                <span>+{confidenceDelta} pts (Shifted Higher)</span>
              </>
            ) : confidenceDelta < 0 ? (
              <>
                <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{confidenceDelta} pts (Caution Surfaced)</span>
              </>
            ) : (
              <>
                <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>0 pts (Unchanged)</span>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Initial Value Display */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-xs font-medium text-slate-400 block">Initial Conviction (Screen 1)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-200 font-mono">{initialConfidence}%</span>
              <span className="text-xs text-slate-500 font-normal">at start of inquiry</span>
            </div>
          </div>

          {/* Second Interactive Confidence Slider */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-sky-500/30 space-y-2">
            <span className="text-xs font-medium text-sky-400 block font-semibold">
              Post-Examination Conviction (Now)
            </span>
            <Slider
              value={postConfidence}
              onChange={onPostConfidenceChange}
              min={0}
              max={100}
              label="Re-assess your gut conviction"
            />
          </div>
        </div>
      </Card>

      {/* Assumptions Breakdown Summary */}
      <Card variant="elevated" className="space-y-3.5 border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Assumptions Breakdown Summary
          </h2>
        </div>

        {/* Highlight Callout */}
        <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-sm leading-relaxed text-slate-200">
          <span className="font-bold text-amber-300">
            {guessCount} of {totalAssumptions} beliefs are guesses
          </span>
          {notSureCount > 0 && (
            <span className="text-indigo-300 font-medium">
              {' '}and {notSureCount} are unexamined blind spots.
            </span>
          )}
          {knowCount > 0 && (
            <span className="text-emerald-300 font-medium">
              {' '}({knowCount} grounded in direct facts).
            </span>
          )}
        </div>

        {/* Stat badges */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
            <div className="text-lg font-bold text-emerald-300 font-mono">{knowCount}</div>
            <div className="text-[11px] text-slate-400">Direct Facts</div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40">
            <div className="text-lg font-bold text-amber-300 font-mono">{guessCount}</div>
            <div className="text-[11px] text-slate-400">Hypotheses</div>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40">
            <div className="text-lg font-bold text-indigo-300 font-mono">{notSureCount}</div>
            <div className="text-[11px] text-slate-400">Untested</div>
          </div>
        </div>
      </Card>

      {/* Deep Reflective Questions from /api/reflect */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <HelpCircle className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
          <span>Deep Reflective Prompts</span>
        </div>

        {isLoading && (
          <Card variant="glass" className="p-8 text-center space-y-3">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin mx-auto" aria-hidden="true" />
            <p className="text-xs text-slate-400" role="status" aria-live="polite">
              Synthesizing reflective questions on internal motivation and mastery...
            </p>
          </Card>
        )}

        {error && !isLoading && (
          <Card variant="glass" className="p-5 text-center space-y-3 border-rose-800/50 bg-rose-950/20">
            <p className="text-xs text-rose-300">{error}</p>
            <Button variant="secondary" size="sm" onClick={handleRetry}>
              Retry Reflection
            </Button>
          </Card>
        )}

        {!isLoading && !error && reflection && (
          <div className="space-y-3" role="feed" aria-label="Deep reflective prompts">
            {reflection.reflective_questions.map((rq, idx) => (
              <Card
                key={rq.id || idx}
                variant="elevated"
                className="p-4 space-y-2 border-slate-800/90"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                    {rq.focus_area}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-medium text-slate-100 leading-snug">
                  {rq.prompt}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Non-judgmental Socratic Framing (No Verdict) */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
        <strong className="text-slate-300 block mb-1">Non-Prescriptive Principle:</strong>
        Mirror Check does not give advice or verdicts. Rather than taking a blind leap or stalling indefinitely, you can now run a rapid low-risk test to observe reality directly.
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <Button
          variant="outline"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
          className="w-full sm:w-auto"
        >
          Back to Questions
        </Button>

        <Button
          variant="primary"
          size="lg"
          onClick={onNext}
          rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
          className="w-full sm:w-auto"
        >
          Explore 2-Hour Test
        </Button>
      </div>
    </div>
  );
}
