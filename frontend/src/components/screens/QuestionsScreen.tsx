import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Loader2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { QuestionsResponse, BeliefsResponse, BeliefTag } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { apiClient, ApiError } from '@/lib/api';

interface QuestionsScreenProps {
  skill: string;
  context: string;
  beliefs: BeliefsResponse;
  tags: Record<string, BeliefTag>;
  questions: QuestionsResponse | null;
  answers: Record<string, string>;
  onAnswerChange: (questionKey: string, text: string) => void;
  onQuestionsLoaded: (data: QuestionsResponse) => void;
  onNext: () => void;
  onBack: () => void;
}

const CATEGORY_COLORS: Record<string, { badge: string; text: string }> = {
  goal: { badge: 'bg-emerald-950/80 border-emerald-800/60 text-emerald-300', text: 'Ultimate Goal' },
  deadline: { badge: 'bg-amber-950/80 border-amber-800/60 text-amber-300', text: 'Timeline & Urgency' },
  'trade-offs': { badge: 'bg-rose-950/80 border-rose-800/60 text-rose-300', text: 'Trade-offs & Sacrifices' },
  transferable_skills: { badge: 'bg-indigo-950/80 border-indigo-800/60 text-indigo-300', text: 'Transferable Overlap' },
  source_of_doubt: { badge: 'bg-purple-950/80 border-purple-800/60 text-purple-300', text: 'Root Source of Doubt' },
};

export function QuestionsScreen({
  skill,
  context,
  beliefs,
  tags,
  questions,
  answers,
  onAnswerChange,
  onQuestionsLoaded,
  onNext,
  onBack,
}: QuestionsScreenProps) {
  const [isLoading, setIsLoading] = useState(!questions);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (questions) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const beliefInputs = beliefs.assumptions.map((a) => ({
          statement: a.statement,
          tag: tags[a.id] ? `${a.tag} (${tags[a.id]})` : a.tag,
        }));

        const res = await apiClient.generateQuestions({
          skill,
          context,
          beliefs: beliefInputs,
        });

        if (isMounted) {
          onQuestionsLoaded(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError((err as Error)?.message || 'Failed to load inquiry questions');
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchQuestions();

    return () => {
      isMounted = false;
    };
  }, [questions, skill, context, beliefs, tags, onQuestionsLoaded]);

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const beliefInputs = beliefs.assumptions.map((a) => ({
        statement: a.statement,
        tag: tags[a.id] ? `${a.tag} (${tags[a.id]})` : a.tag,
      }));

      const res = await apiClient.generateQuestions({
        skill,
        context,
        beliefs: beliefInputs,
      });
      onQuestionsLoaded(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError((err as Error)?.message || 'Failed to load inquiry questions');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const answeredCount = Object.values(answers).filter((a) => a && a.trim().length > 0).length;
  const totalQuestions = questions?.questions.length || 0;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-800/40 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Blind Spot Examination</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          What You Might Have Missed
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          These Socratic questions target your unexamined angles about <span className="font-semibold text-slate-200">{skill}</span>. Jot quick thoughts below, or feel free to skip any.
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <Card variant="glass" className="p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin mx-auto" aria-hidden="true" />
          <div className="space-y-1" role="status" aria-live="polite">
            <p className="text-base font-semibold text-white">Formulating Targeted Questions...</p>
            <p className="text-xs text-slate-400">
              Examining goals, deadlines, trade-offs, and skill transferability
            </p>
          </div>
        </Card>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Card variant="glass" className="p-6 text-center space-y-4 border-rose-800/60 bg-rose-950/30">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" aria-hidden="true" />
          <div className="space-y-1" role="alert">
            <p className="text-base font-semibold text-rose-200">Could not generate questions</p>
            <p className="text-xs text-rose-300/80 max-w-md mx-auto">{error}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            leftIcon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}
          >
            Retry
          </Button>
        </Card>
      )}

      {/* Questions list */}
      {!isLoading && !error && questions && (
        <>
          {/* Progress / Skipping banner */}
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs"
            role="status"
            aria-live="polite"
          >
            <span className="text-slate-400 font-medium">
              Notes entered: <strong className="text-slate-200">{answeredCount}</strong> of <strong className="text-slate-200">{totalQuestions}</strong> questions
            </span>
            <span className="text-slate-500 italic">
              Optional &bull; Skipping is allowed
            </span>
          </div>

          <div className="space-y-4" role="feed" aria-label="Targeted inquiry questions">
            {questions.questions.map((q, idx) => {
              const qKey = `q_${idx}`;
              const answerVal = answers[qKey] || '';
              const catConfig = CATEGORY_COLORS[q.category.toLowerCase()] || {
                badge: 'bg-slate-800 text-slate-300 border-slate-700',
                text: q.category,
              };

              return (
                <Card
                  key={idx}
                  variant="elevated"
                  className="space-y-3.5 border-slate-800/90 hover:border-slate-700/80 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                          Q{idx + 1}
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catConfig.badge}`}>
                          {catConfig.text}
                        </span>
                        {q.related_assumption_tag && (
                          <span className="text-[11px] text-slate-500">
                            Probing: {q.related_assumption_tag}
                          </span>
                        )}
                      </div>

                      <h2 className="text-base sm:text-lg font-semibold text-white leading-snug pt-1">
                        {q.question}
                      </h2>
                    </div>
                  </div>

                  {/* Why this question matters */}
                  {q.reasoning && (
                    <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{q.reasoning}</span>
                    </div>
                  )}

                  {/* Response Textarea */}
                  <div className="space-y-1 pt-1">
                    <label
                      htmlFor={`answer-${idx}`}
                      className="sr-only"
                    >
                      Your notes for question {idx + 1}: {q.question}
                    </label>
                    <textarea
                      id={`answer-${idx}`}
                      rows={2}
                      value={answerVal}
                      onChange={(e) => onAnswerChange(qKey, e.target.value)}
                      placeholder="Your honest thought or observation (optional)..."
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:border-sky-400 text-xs sm:text-sm transition-colors resize-y min-h-[60px]"
                    />
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={onBack}
              leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              Back to Beliefs
            </Button>

            <Button
              variant="primary"
              size="lg"
              onClick={onNext}
              rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              See Your Mirror
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
