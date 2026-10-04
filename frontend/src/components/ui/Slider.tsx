import React, { useId } from 'react';

export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function getConfidenceDescriptor(value: number): string {
  if (value <= 20) return 'Heavy Doubt (Leaning strongly against)';
  if (value <= 40) return 'Unsure (Leaning against)';
  if (value <= 60) return 'Neutral / 50-50 Split';
  if (value <= 80) return 'Optimistic (Leaning towards)';
  return 'High Conviction (Ready to dive in)';
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label = 'Initial Confidence Level',
  id: customId,
  disabled = false,
  className = '',
}: SliderProps) {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const descriptor = getConfidenceDescriptor(value);
  const percentage = Math.round(((value - min) / (max - min)) * 100);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-200 select-none flex items-center gap-2"
        >
          <span>{label}</span>
        </label>
        <div className="flex items-baseline gap-2">
          <span
            className="text-xs font-medium text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-800/40"
            aria-hidden="true"
          >
            {descriptor}
          </span>
          <span
            className="text-base font-semibold text-slate-100 min-w-[3rem] text-right font-mono"
            aria-hidden="true"
          >
            {value}%
          </span>
        </div>
      </div>

      <div className="relative py-2">
        <input
          id={inputId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value}% confidence: ${descriptor}`}
          className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed accent-sky-400"
          style={{
            background: `linear-gradient(to right, #38bdf8 0%, #818cf8 ${percentage}%, #1e293b ${percentage}%, #1e293b 100%)`,
          }}
        />

        {/* Accessible markers */}
        <div className="flex justify-between text-[11px] text-slate-500 font-medium px-1 mt-1.5 select-none" aria-hidden="true">
          <span>0% (Strong Doubt)</span>
          <span>50% (Torn)</span>
          <span>100% (Certain)</span>
        </div>
      </div>
    </div>
  );
}
