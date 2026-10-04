import React from 'react';
import { Check } from 'lucide-react';
import { StepId } from '@/types';

interface ProgressBarProps {
  currentStep: StepId;
  totalSteps?: number;
  onStepClick?: (step: StepId) => void;
  className?: string;
}

const STEPS: Array<{ id: StepId; title: string; label: string }> = [
  { id: 1, title: 'Ask', label: 'Frame Doubt' },
  { id: 2, title: 'Beliefs', label: 'Tag Beliefs' },
  { id: 3, title: 'Questions', label: 'Blind Spots' },
  { id: 4, title: 'Mirror', label: 'Reflection' },
  { id: 5, title: 'Test', label: '2-Hr Sandbox' },
];

export function ProgressBar({
  currentStep,
  totalSteps = 5,
  onStepClick,
  className = '',
}: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-label="Inquiry progress"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={currentStep}
      aria-valuetext={`Step ${currentStep} of ${totalSteps}: ${STEPS[currentStep - 1]?.title}`}
      className={`w-full max-w-3xl mx-auto ${className}`}
    >
      <div className="flex items-center justify-between relative">
        {/* Background track connecting steps */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 -z-0" />

        {/* Active progress fill */}
        <div
          className="absolute top-4 left-4 h-0.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 transition-all duration-500 -z-0"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            maxWidth: 'calc(100% - 2rem)',
          }}
        />

        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isAccessible = currentStep >= step.id;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isAccessible || !onStepClick}
              onClick={() => onStepClick && isAccessible && onStepClick(step.id)}
              className={`relative z-10 flex flex-col items-center group focus-visible:outline-none ${
                !isAccessible ? 'cursor-default' : onStepClick ? 'cursor-pointer' : 'cursor-default'
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 ${
                  isCompleted
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : isCurrent
                    ? 'bg-slate-900 border-2 border-sky-400 text-sky-400 shadow-lg shadow-sky-500/20 ring-4 ring-sky-400/10'
                    : 'bg-slate-800/80 border border-slate-700 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" aria-hidden="true" />
                ) : (
                  <span>{step.id}</span>
                )}
              </div>
              <div className="mt-1.5 text-center">
                <span
                  className={`text-[11px] sm:text-xs font-medium block transition-colors ${
                    isCurrent
                      ? 'text-sky-400 font-semibold'
                      : isCompleted
                      ? 'text-slate-300'
                      : 'text-slate-500'
                  }`}
                >
                  {step.title}
                </span>
                <span className="hidden md:block text-[10px] text-slate-500">
                  {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
