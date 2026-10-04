import React, { useState, useEffect } from 'react';
import {
  Clock,
  Save,
  Calendar,
  Download,
  RotateCcw,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import {
  BeliefsResponse,
  BeliefTag,
  QuestionsResponse,
  ReflectResponse,
  ExperimentResponse,
  SavedReasoningRecord,
} from '@/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { apiClient, ApiError } from '@/lib/api';
import { saveReasoningRecord, getCheckinDueDate } from '@/lib/storage';
import { buildGoogleCalendarUrl } from '@/lib/calendar';

interface ExperimentScreenProps {
  skill: string;
  context: string;
  initialConfidence: number;
  postConfidence: number;
  beliefs: BeliefsResponse;
  tags: Record<string, BeliefTag>;
  questions: QuestionsResponse | null;
  questionAnswers: Record<string, string>;
  reflection: ReflectResponse | null;
  experiment: ExperimentResponse | null;
  onExperimentLoaded: (data: ExperimentResponse) => void;
  onStartOver: () => void;
  onBack: () => void;
}

export function ExperimentScreen({
  skill,
  context,
  initialConfidence,
  postConfidence,
  beliefs,
  tags,
  questions,
  questionAnswers,
  reflection,
  experiment,
  onExperimentLoaded,
  onStartOver,
  onBack,
}: ExperimentScreenProps) {
  const [isLoading, setIsLoading] = useState(!experiment);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [savedDate, setSavedDate] = useState<Date | null>(null);

  // Fetch experiment from /api/experiment if not present
  useEffect(() => {
    if (experiment) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const fetchExperiment = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const guessItems = beliefs.assumptions.filter((a) => tags[a.id] === 'guess');
        const focalDoubt = guessItems.length > 0 ? guessItems[0].statement : context;

        const res = await apiClient.generateExperiment({
          skill,
          context,
          focal_doubt: focalDoubt,
        });

        if (isMounted) {
          onExperimentLoaded(res);
        }
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof ApiError) {
            setError(err.message);
          } else {
            setError((err as Error)?.message || 'Failed to generate 2-hour sandbox test');
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchExperiment();

    return () => {
      isMounted = false;
    };
  }, [experiment, skill, context, beliefs, tags, onExperimentLoaded]);

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const guessItems = beliefs.assumptions.filter((a) => tags[a.id] === 'guess');
      const focalDoubt = guessItems.length > 0 ? guessItems[0].statement : context;

      const res = await apiClient.generateExperiment({
        skill,
        context,
        focal_doubt: focalDoubt,
      });
      onExperimentLoaded(res);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError((err as Error)?.message || 'Failed to generate 2-hour sandbox test');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Button 1: Save my reasoning
  const handleSaveReasoning = () => {
    try {
      const now = new Date();
      const dueDate = getCheckinDueDate(now, 30);

      const record: SavedReasoningRecord = {
        id: `reasoning_${Date.now()}`,
        skill,
        context,
        initialConfidence,
        postConfidence,
        confidenceChange: postConfidence - initialConfidence,
        beliefs,
        tags,
        questionAnswers,
        reflection,
        experiment,
        savedAt: now.getTime(),
        checkinDueAt: dueDate.getTime(),
      };

      const success = saveReasoningRecord(record);
      if (success) {
        setIsSaved(true);
        setSavedDate(dueDate);
      }
    } catch (err) {
      console.error('Failed to save reasoning:', err);
    }
  };

  // Button 2: Add 30-day check-in to Google Calendar
  const handleAddToCalendar = () => {
    const checkinDate = savedDate || getCheckinDueDate(new Date(), 30);
    const calUrl = buildGoogleCalendarUrl({
      skill,
      checkinDate,
      initialConfidence,
      postConfidence,
      customDetails: `Initial Conviction: ${initialConfidence}% -> Now: ${postConfidence}%\nUnsure Context: ${context}`,
    });
    window.open(calUrl, '_blank', 'noopener,noreferrer');
  };

  // Button 3: Download .txt report
  const handleDownloadTxt = () => {
    const knowItems = beliefs.assumptions.filter((a) => tags[a.id] === 'know');
    const guessItems = beliefs.assumptions.filter((a) => tags[a.id] === 'guess');
    const notSureItems = beliefs.assumptions.filter((a) => tags[a.id] === 'not_sure');

    const exp = experiment?.experiment;

    const content = `=====================================================
MIRROR CHECK — SOCRATIC INQUIRY REPORT
"Check your blind spot before you switch lanes."
=====================================================
Inquiry Target: ${skill}
Date: ${new Date().toLocaleDateString()}
Initial Conviction (Screen 1): ${initialConfidence}%
Post-Examination Conviction (Screen 4): ${postConfidence}% (Change: ${postConfidence - initialConfidence > 0 ? '+' : ''}${postConfidence - initialConfidence} pts)

-----------------------------------------------------
1. YOUR INITIAL CONTEXT & HESITATION
-----------------------------------------------------
${context}

-----------------------------------------------------
2. SURFACED ASSUMPTIONS & BELIEF TAGS
-----------------------------------------------------
Summary: ${beliefs.thinking_summary}

Grounded Facts (${knowItems.length}):
${knowItems.map((k) => `* [KNOW] ${k.statement}\n  Lens: ${k.counter_perspective}`).join('\n') || '  (None)'}

Working Hypotheses (${guessItems.length}):
${guessItems.map((g) => `* [GUESS] ${g.statement}\n  Lens: ${g.counter_perspective}`).join('\n') || '  (None)'}

Unexamined Blind Spots (${notSureItems.length}):
${notSureItems.map((n) => `* [NOT SURE] ${n.statement}\n  Lens: ${n.counter_perspective}`).join('\n') || '  (None)'}

-----------------------------------------------------
3. TARGETED INQUIRY NOTES (WHAT YOU MISSED)
-----------------------------------------------------
${
  questions?.questions
    .map((q, idx) => {
      const ans = questionAnswers[`q_${idx}`] || '(Skipped)';
      return `Q${idx + 1} [${q.category}]: ${q.question}\nYour Notes: ${ans}\n`;
    })
    .join('\n') || 'N/A'
}

-----------------------------------------------------
4. DEEP REFLECTIVE PROMPTS
-----------------------------------------------------
${
  reflection?.reflective_questions
    .map((rq, idx) => `${idx + 1}. [${rq.focus_area}] ${rq.prompt}`)
    .join('\n') || 'N/A'
}

-----------------------------------------------------
5. 2-HOUR LOW-RISK SANDBOX TEST
-----------------------------------------------------
Title: ${exp?.title || 'N/A'}
Duration: ${exp?.duration_minutes || 120} Minutes
Framing: ${exp?.framing || 'N/A'}

Phase 1 (Setup ~20m):
${exp?.step_1_setup || 'N/A'}

Phase 2 (Build & Explore ~70m):
${exp?.step_2_build || 'N/A'}

Phase 3 (Self-Observation & Debrief ~30m):
${exp?.step_3_reflect || 'N/A'}

Self-Observation Prompts:
${exp?.observation_questions?.map((oq) => `* ${oq}`).join('\n') || 'N/A'}

-----------------------------------------------------
30-DAY CHECK-IN DUE: ${getCheckinDueDate(new Date(), 30).toLocaleDateString()}
=====================================================
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const sanitizedSkill = skill.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);
    link.href = url;
    link.download = `mirror-check-${sanitizedSkill}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const expData = experiment?.experiment;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Low-Risk Action Option</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Your 2-Hour Sandbox Test
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
          Instead of debating in your head, run this structured 2-hour taste test to gather real behavioral data on <span className="font-semibold text-slate-200">{skill}</span>.
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <Card variant="glass" className="p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" aria-hidden="true" />
          <div className="space-y-1" role="status" aria-live="polite">
            <p className="text-base font-semibold text-white">Formulating 2-Hour Sandbox Test...</p>
            <p className="text-xs text-slate-400">
              Structuring setup, hands-on exploration, and self-observation phases
            </p>
          </div>
        </Card>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <Card variant="glass" className="p-6 text-center space-y-4 border-rose-800/60 bg-rose-950/30">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" aria-hidden="true" />
          <div className="space-y-1" role="alert">
            <p className="text-base font-semibold text-rose-200">Could not generate experiment</p>
            <p className="text-xs text-rose-300/80">{error}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry
          </Button>
        </Card>
      )}

      {/* Experiment Details Card */}
      {!isLoading && !error && expData && (
        <>
          <Card variant="glass" className="space-y-5 border-emerald-500/30 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Exploratory Taste Test
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                  {expData.title}
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-700/60 text-emerald-300 font-mono text-xs font-semibold self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                {expData.duration_minutes} min total
              </span>
            </div>

            {/* Non-prescriptive framing */}
            <p className="text-xs sm:text-sm text-slate-300 italic bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/90 leading-relaxed">
              &ldquo;{expData.framing}&rdquo;
            </p>

            {/* 3 Step Phases */}
            <div className="space-y-3.5">
              {/* Phase 1 */}
              <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Phase 1: Setup (~20 min)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Frictionless entry</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
                  {expData.step_1_setup}
                </p>
              </div>

              {/* Phase 2 */}
              <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Phase 2: Build & Explore (~70 min)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Direct hands-on</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
                  {expData.step_2_build}
                </p>
              </div>

              {/* Phase 3 */}
              <div className="p-4 bg-slate-900/70 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Phase 3: Self-Observation & Debrief (~30 min)
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">Energy check</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-1">
                  {expData.step_3_reflect}
                </p>
              </div>
            </div>

            {/* Observation Questions */}
            {expData.observation_questions && expData.observation_questions.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                  What to observe in yourself during the test:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {expData.observation_questions.map((oq, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-amber-400 font-bold">&bull;</span>
                      <span>{oq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Action Grid Buttons */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block text-center">
              Next Actions & 30-Day Check-in
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Button 1: Save reasoning */}
              <Button
                variant={isSaved ? 'secondary' : 'primary'}
                size="md"
                onClick={handleSaveReasoning}
                leftIcon={isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
                className="w-full justify-start text-xs sm:text-sm"
              >
                {isSaved ? 'Reasoning Saved!' : 'Save My Reasoning'}
              </Button>

              {/* Button 2: Add to Google Calendar */}
              <Button
                variant="secondary"
                size="md"
                onClick={handleAddToCalendar}
                leftIcon={<Calendar className="w-4 h-4 text-sky-400" />}
                className="w-full justify-start text-xs sm:text-sm"
              >
                Add 30-Day Check-in to Google Calendar
              </Button>

              {/* Button 3: Download .txt */}
              <Button
                variant="outline"
                size="md"
                onClick={handleDownloadTxt}
                leftIcon={<Download className="w-4 h-4 text-slate-300" />}
                className="w-full justify-start text-xs sm:text-sm"
              >
                Download Inquiry Summary (.txt)
              </Button>

              {/* Button 4: Start over */}
              <Button
                variant="ghost"
                size="md"
                onClick={onStartOver}
                leftIcon={<RotateCcw className="w-4 h-4 text-slate-400" />}
                className="w-full justify-start text-xs sm:text-sm text-slate-400 hover:text-white"
              >
                Start New Inquiry
              </Button>
            </div>

            {/* Saved Notification Card */}
            {isSaved && savedDate && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
                <span>
                  Saved locally! A 30-day reflection reminder is set for{' '}
                  <strong>{savedDate.toLocaleDateString()}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={onBack}
              leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
            >
              Back to Mirror
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
