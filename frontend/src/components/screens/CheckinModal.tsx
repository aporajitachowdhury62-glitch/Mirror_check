import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Sparkles,
  HelpCircle,
  Loader2,
  AlertCircle,
  Compass,
} from 'lucide-react';
import { CheckinResponse, SavedReasoningRecord } from '@/types';
import { Button } from '../ui/Button';
import { apiClient, ApiError } from '@/lib/api';

interface CheckinModalProps {
  record: SavedReasoningRecord;
  isOpen: boolean;
  onClose: () => void;
}

export function CheckinModal({ record, isOpen, onClose }: CheckinModalProps) {
  const [data, setData] = useState<CheckinResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchCheckin = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.generateCheckin({
          skill: record.skill,
          context: record.context,
          decision_state: `Initial conviction was ${record.initialConfidence}%, post-examination was ${record.postConfidence}%.`,
        });

        if (isMounted) {
          setData(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError((err as Error)?.message || 'Failed to generate 30-day reflection check-in');
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCheckin();

    return () => {
      isMounted = false;
    };
  }, [isOpen, record]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const plan = data?.checkin_plan;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-modal-title"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-5 relative my-8 text-slate-100">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-sky-400"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>30-Day Reflection Check-in</span>
          </div>
          <h2 id="checkin-modal-title" className="text-xl font-bold text-white">
            Re-Evaluating: {record.skill}
          </h2>
          <p className="text-xs text-slate-400">
            Original inquiry saved on {new Date(record.savedAt).toLocaleDateString()} (Initial: {record.initialConfidence}% &bull; Post: {record.postConfidence}%)
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" aria-hidden="true" />
            <p className="text-sm text-slate-300" role="status" aria-live="polite">
              Synthesizing 30-day reflection questions...
            </p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl space-y-2 text-center">
            <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" aria-hidden="true" />
            <p className="text-xs text-rose-200">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setError(null);
                setIsLoading(true);
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Check-in Content (Questions Only) */}
        {!isLoading && !error && plan && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Drift Check (Hype Filter) */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-800/50 space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                Hype & Drift Check
              </span>
              <p className="text-sm text-slate-100 font-medium leading-snug">
                {plan.drift_check_question}
              </p>
            </div>

            {/* Reflection Prompts */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                30-Day Self-Reflection Questions
              </span>
              <div className="space-y-2">
                {plan.reflection_prompts.map((prompt, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/70 text-xs sm:text-sm text-slate-200 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-sky-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                      {idx + 1}
                    </span>
                    <p className="font-medium leading-relaxed">{prompt}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trigger Events */}
            {plan.trigger_events && plan.trigger_events.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  Observable Trigger Signals
                </span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  {plan.trigger_events.map((trig, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/50 flex items-start gap-2"
                    >
                      <span className="text-amber-400 font-bold">&bull;</span>
                      <span>{trig}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <Button variant="secondary" size="md" onClick={onClose}>
            Done Reviewing
          </Button>
        </div>
      </div>
    </div>
  );
}
