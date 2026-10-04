import React from 'react';
import { Compass, RotateCcw } from 'lucide-react';
import { Button } from './Button';

interface HeaderProps {
  onReset?: () => void;
  showReset?: boolean;
}

export function Header({ onReset, showReset = false }: HeaderProps) {
  return (
    <header className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm shadow-sky-500/10">
            <Compass className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                Mirror Check
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-sky-400/80 px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/30 hidden sm:inline-block">
                Socratic Partner
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal">
              Check your blind spot before you switch lanes.
            </p>
          </div>
        </div>

        {showReset && onReset && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />}
            className="text-xs text-slate-400 hover:text-slate-200"
            aria-label="Start a new inquiry"
          >
            Start Over
          </Button>
        )}
      </div>
    </header>
  );
}
