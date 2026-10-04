import React from 'react';
import { Calendar, ArrowRight, X, Clock } from 'lucide-react';
import { SavedReasoningRecord } from '@/types';
import { Button } from '../ui/Button';
import { getDaysSince } from '@/lib/storage';

interface CheckinBannerProps {
  record: SavedReasoningRecord;
  onOpenCheckin: () => void;
  onDismiss?: () => void;
}

export function CheckinBanner({ record, onOpenCheckin, onDismiss }: CheckinBannerProps) {
  const daysPassed = getDaysSince(record.savedAt);

  return (
    <div
      className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-slate-900 border border-indigo-500/30 text-slate-100 shadow-xl relative overflow-hidden"
      role="region"
      aria-label="30-Day Check-in Due"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-900/60 border border-indigo-700/60 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5 sm:mt-0">
            <Calendar className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                30-Day Reflection Due
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
                <Clock className="w-3 h-3 text-indigo-400" aria-hidden="true" />
                {daysPassed} days ago
              </span>
            </div>
            <p className="text-sm font-semibold text-white">
              You evaluated &ldquo;{record.skill}&rdquo; {daysPassed} days ago.
            </p>
            <p className="text-xs text-slate-300">
              Ready to revisit your assumptions and test if the hype or hesitation shifted?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCheckin}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />}
            className="text-xs shadow-none w-full sm:w-auto"
          >
            Review Check-in
          </Button>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
