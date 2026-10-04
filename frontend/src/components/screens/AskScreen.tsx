import React, { useState } from 'react';
import { ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { SavedReasoningRecord } from '@/types';
import { Card } from '../ui/Card';
import { Slider } from '../ui/Slider';
import { Button } from '../ui/Button';
import { CheckinBanner } from './CheckinBanner';
import { isCheckinDue } from '@/lib/storage';

interface AskScreenProps {
  initialSkill?: string;
  initialContext?: string;
  initialConfidence?: number;
  isLoading?: boolean;
  errorMessage?: string | null;
  savedReasoning?: SavedReasoningRecord | null;
  onOpenCheckin?: (record: SavedReasoningRecord) => void;
  onSubmit: (data: { skill: string; context: string; confidence: number }) => void;
}

const EXAMPLE_PROMPTS = [
  {
    skill: 'Rust Programming',
    context:
      'I already know Go and Python. I wonder if learning Rust is worth the steep learning curve for my backend career, or if I am just feeling tech FOMO.',
  },
  {
    skill: 'Engineering Management',
    context:
      'I have been a Senior IC for 4 years. Leadership wants me to transition to EM, but I am worried I will lose my technical edge and hate endless meetings.',
  },
  {
    skill: 'Full-Stack Web3 & Solidity',
    context:
      'There is a lot of noise about crypto smart contracts. I am unsure if it will open durable freelance opportunities or if the market is too speculative.',
  },
];

export function AskScreen({
  initialSkill = '',
  initialContext = '',
  initialConfidence = 50,
  isLoading = false,
  errorMessage = null,
  savedReasoning = null,
  onOpenCheckin,
  onSubmit,
}: AskScreenProps) {
  const [skill, setSkill] = useState(initialSkill);
  const [context, setContext] = useState(initialContext);
  const [confidence, setConfidence] = useState(initialConfidence);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const isSkillValid = skill.trim().length >= 2;
  const isContextValid = context.trim().length >= 5;
  const isFormValid = isSkillValid && isContextValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;
    onSubmit({
      skill: skill.trim(),
      context: context.trim(),
      confidence,
    });
  };

  const handleApplyExample = (ex: { skill: string; context: string }) => {
    setSkill(ex.skill);
    setContext(ex.context);
  };

  // Show banner if saved reasoning is 30+ days old (or available) and not dismissed
  const showCheckinBanner =
    !isBannerDismissed &&
    savedReasoning &&
    (isCheckinDue(savedReasoning.savedAt) || savedReasoning.checkinDueAt <= Date.now());

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* 30-Day Check-in Banner */}
      {showCheckinBanner && onOpenCheckin && (
        <CheckinBanner
          record={savedReasoning}
          onOpenCheckin={() => onOpenCheckin(savedReasoning)}
          onDismiss={() => setIsBannerDismissed(true)}
        />
      )}

      {/* Intro text */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Examine Your Learning Doubt
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
          Mirror Check won&apos;t tell you what to do. It surfaces your hidden assumptions and reflects your mental model back to you.
        </p>
      </div>

      {/* Main interactive form card */}
      <Card variant="glass" className="space-y-6 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Error banner if any */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-200 text-sm flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium">Could not analyze assumptions</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Skill field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="skill-input"
                className="text-sm font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <span>Skill or transition under consideration</span>
                <span className="text-rose-400 text-xs" aria-hidden="true">*</span>
              </label>
              <span className="text-[11px] text-slate-500">{skill.length}/100</span>
            </div>
            <input
              id="skill-input"
              type="text"
              required
              maxLength={100}
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              placeholder="e.g., Rust programming, Product Management, System Design"
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:border-sky-400 text-sm transition-colors"
              aria-describedby="skill-hint"
            />
            <p id="skill-hint" className="text-xs text-slate-400">
              Name the specific discipline, framework, or role you are debating.
            </p>
          </div>

          {/* Context / Unsure About Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="context-input"
                className="text-sm font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <span>What are you unsure about?</span>
                <span className="text-rose-400 text-xs" aria-hidden="true">*</span>
              </label>
              <span className="text-[11px] text-slate-500">{context.length}/1000</span>
            </div>
            <textarea
              id="context-input"
              required
              rows={4}
              maxLength={1000}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe what is causing you hesitation. Is it time? Opportunity cost? Career relevance? What assumptions are you currently making?"
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:border-sky-400 text-sm transition-colors resize-y min-h-[110px]"
              aria-describedby="context-hint"
            />
            <p id="context-hint" className="text-xs text-slate-400">
              Be honest about your fears, trade-offs, or external pressures.
            </p>
          </div>

          {/* Confidence Slider */}
          <div className="pt-2 border-t border-slate-800/80">
            <Slider
              value={confidence}
              onChange={setConfidence}
              min={0}
              max={100}
              label="Where is your gut conviction right now?"
            />
          </div>

          {/* Action button */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isFormValid || isLoading}
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
            >
              {isLoading ? 'Surfacing Assumptions...' : 'Examine Blind Spots'}
            </Button>
            {!isFormValid && (
              <p className="text-center text-xs text-slate-500 mt-2" aria-live="polite">
                {!isSkillValid
                  ? 'Please provide the skill name to continue.'
                  : 'Please describe what you are unsure about.'}
              </p>
            )}
          </div>
        </form>
      </Card>

      {/* Example inspirations */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
          <span>Need inspiration? Try an example scenario</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {EXAMPLE_PROMPTS.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyExample(ex)}
              className="text-left p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/60 transition-all text-xs group focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <div className="font-semibold text-slate-200 group-hover:text-sky-300 transition-colors">
                {ex.skill}
              </div>
              <p className="text-slate-400 line-clamp-2 mt-1 text-[11px] leading-relaxed">
                {ex.context}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
