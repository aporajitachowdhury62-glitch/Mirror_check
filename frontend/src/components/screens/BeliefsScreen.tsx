import React from 'react';
import {
  CheckCircle2,
  HelpCircle,
  HelpCircle as QuestionIcon,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { BeliefsResponse, BeliefTag } from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { isAllBeliefsTagged } from '@/lib/storage';

interface BeliefsScreenProps {
  data: BeliefsResponse;
  tags: Record<string, BeliefTag>;
  onTagChange: (assumptionId: string, tag: BeliefTag) => void;
  onNext: () => void;
  onBack: () => void;
}

const TAG_OPTIONS: Array<{
  value: BeliefTag;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClasses: string;
  borderClasses: string;
}> = [
  {
    value: 'know',
    label: 'Know',
    shortDesc: 'Backed by direct facts or first-hand experience',
    icon: CheckCircle2,
    activeClasses: 'bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/50',
    borderClasses: 'hover:border-emerald-700/60 text-slate-300',
  },
  {
    value: 'guess',
    label: 'Guess',
    shortDesc: 'A working hypothesis or assumption',
    icon: HelpCircle,
    activeClasses: 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/50',
    borderClasses: 'hover:border-amber-700/60 text-slate-300',
  },
  {
    value: 'not_sure',
    label: 'Not sure',
    shortDesc: 'Completely untested or unexamined',
    icon: QuestionIcon,
    activeClasses: 'bg-indigo-950/80 text-indigo-300 border-indigo-500 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/50',
    borderClasses: 'hover:border-indigo-700/60 text-slate-300',
  },
];

export function BeliefsScreen({
  data,
  tags,
  onTagChange,
  onNext,
  onBack,
}: BeliefsScreenProps) {
  const assumptionIds = data.assumptions.map((a) => a.id);
  const taggedCount = assumptionIds.filter((id) => Boolean(tags[id])).length;
  const totalCount = assumptionIds.length;
  const isComplete = isAllBeliefsTagged(assumptionIds, tags);
  const remainingCount = totalCount - taggedCount;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header section */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/70 border border-sky-800/40 text-sky-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Surfaced Mental Models</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Examine Your Assumptions
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Here is what is currently underlying your thinking about <span className="font-semibold text-slate-200">{data.skill}</span>. Tag each belief: is it something you truly <em>Know</em>, a <em>Guess</em>, or <em>Not sure</em>?
        </p>
      </div>

      {/* Socratic Thinking Summary reflection */}
      {data.thinking_summary && (
        <div
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 to-sky-950/40 border border-sky-500/20 text-slate-300 text-sm leading-relaxed relative overflow-hidden"
          role="region"
          aria-label="Mental model reflection"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                Mental Model Reflection
              </span>
              <p className="text-slate-200 text-sm">{data.thinking_summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress pill & status */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs"
        role="status"
        aria-live="polite"
      >
        <span className="text-slate-400 font-medium">
          Examined: <strong className="text-slate-200">{taggedCount}</strong> of <strong className="text-slate-200">{totalCount}</strong> assumptions
        </span>
        <div className="flex items-center gap-2">
          {isComplete ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              All assumptions tagged
            </span>
          ) : (
            <span className="text-amber-400 font-medium">
              {remainingCount} more to review
            </span>
          )}
        </div>
      </div>

      {/* Assumption Cards List */}
      <div className="space-y-4" role="feed" aria-label="Surfaced assumptions list">
        {data.assumptions.map((item, index) => {
          const currentTag = tags[item.id];

          return (
            <Card
              key={item.id}
              variant="elevated"
              className="space-y-4 border-slate-800/90 transition-all duration-200 hover:border-slate-700/90"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                      Assumption {index + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-400 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-medium text-slate-100 mt-2 leading-snug">
                    &ldquo;{item.statement}&rdquo;
                  </p>
                </div>
              </div>

              {/* Socratic Counter-Perspective */}
              {item.counter_perspective && (
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 text-xs sm:text-sm text-slate-300 flex items-start gap-2.5">
                  <span className="text-sky-400 font-bold shrink-0 mt-0.5">Socratic lens:</span>
                  <span className="text-slate-300 italic">{item.counter_perspective}</span>
                </div>
              )}

              {/* Tag Selection Radiogroup */}
              <div
                role="radiogroup"
                aria-label={`Categorize assumption ${item.id}: ${item.statement}`}
                className="pt-2 border-t border-slate-800/70"
              >
                <div className="text-xs font-semibold text-slate-400 mb-2">
                  What is your certainty on this belief?
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {TAG_OPTIONS.map((opt) => {
                    const isSelected = currentTag === opt.value;
                    const Icon = opt.icon;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => onTagChange(item.id, opt.value)}
                        className={`flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none ${
                          isSelected
                            ? opt.activeClasses
                            : `bg-slate-900/60 border-slate-800 ${opt.borderClasses}`
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isSelected ? 'text-current' : 'text-slate-500'
                          }`}
                          aria-hidden="true"
                        />
                        <span className="font-semibold">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Navigation footer */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <Button
          variant="outline"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
          className="w-full sm:w-auto"
        >
          Edit Frame
        </Button>

        <div className="w-full sm:w-auto flex flex-col sm:items-end gap-1">
          <Button
            variant="primary"
            size="lg"
            onClick={onNext}
            disabled={!isComplete}
            rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
            className="w-full sm:w-auto"
          >
            Synthesize Blind Spots
          </Button>
          {!isComplete && (
            <span className="text-[11px] text-slate-500 text-center sm:text-right" aria-live="polite">
              Tag all {totalCount} assumptions to proceed ({remainingCount} left)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
