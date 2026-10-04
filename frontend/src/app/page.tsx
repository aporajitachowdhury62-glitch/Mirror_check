'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  StepId,
  BeliefsResponse,
  BeliefTag,
  QuestionsResponse,
  ReflectResponse,
  ExperimentResponse,
  SavedReasoningRecord,
} from '@/types';
import { apiClient, ApiError } from '@/lib/api';
import {
  saveSession,
  loadSession,
  clearSession,
  getLatestSavedReasoning,
} from '@/lib/storage';
import { Header } from '@/components/ui/Header';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AskScreen } from '@/components/screens/AskScreen';
import { BeliefsScreen } from '@/components/screens/BeliefsScreen';
import { QuestionsScreen } from '@/components/screens/QuestionsScreen';
import { MirrorScreen } from '@/components/screens/MirrorScreen';
import { ExperimentScreen } from '@/components/screens/ExperimentScreen';
import { CheckinModal } from '@/components/screens/CheckinModal';

export default function HomePage() {
  const [step, setStep] = useState<StepId>(1);
  const [skill, setSkill] = useState('');
  const [context, setContext] = useState('');
  const [confidence, setConfidence] = useState(50);
  const [postConfidence, setPostConfidence] = useState(50);

  const [beliefs, setBeliefs] = useState<BeliefsResponse | null>(null);
  const [tags, setTags] = useState<Record<string, BeliefTag>>({});

  const [questions, setQuestions] = useState<QuestionsResponse | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

  const [reflection, setReflection] = useState<ReflectResponse | null>(null);
  const [experiment, setExperiment] = useState<ExperimentResponse | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [savedReasoning, setSavedReasoning] = useState<SavedReasoningRecord | null>(null);
  const [activeCheckinRecord, setActiveCheckinRecord] = useState<SavedReasoningRecord | null>(null);

  // Restore saved active session and latest saved reasoning on mount
  useEffect(() => {
    const latestSaved = getLatestSavedReasoning();
    if (latestSaved) {
      setSavedReasoning(latestSaved);
    }

    const session = loadSession();
    if (session) {
      if (session.skill) setSkill(session.skill);
      if (session.context) setContext(session.context);
      if (typeof session.confidence === 'number') setConfidence(session.confidence);
      if (typeof session.postConfidence === 'number') {
        setPostConfidence(session.postConfidence);
      } else if (typeof session.confidence === 'number') {
        setPostConfidence(session.confidence);
      }
      if (session.beliefs) setBeliefs(session.beliefs);
      if (session.tags) setTags(session.tags);
      if (session.questions) setQuestions(session.questions);
      if (session.questionAnswers) setQuestionAnswers(session.questionAnswers);
      if (session.reflection) setReflection(session.reflection);
      if (session.experiment) setExperiment(session.experiment);
      if (session.step && session.step >= 1 && session.step <= 5) {
        setStep(session.step);
      }
    }
  }, []);

  // Save active session state when changes occur
  useEffect(() => {
    if (skill || context || beliefs) {
      saveSession({
        skill,
        context,
        confidence,
        postConfidence,
        step,
        beliefs,
        tags,
        questions,
        questionAnswers,
        reflection,
        experiment,
      });
    }
  }, [
    skill,
    context,
    confidence,
    postConfidence,
    step,
    beliefs,
    tags,
    questions,
    questionAnswers,
    reflection,
    experiment,
  ]);

  // Screen 1: Submit Inquiry -> calls /api/beliefs
  const handleAskSubmit = async (formData: {
    skill: string;
    context: string;
    confidence: number;
  }) => {
    setSkill(formData.skill);
    setContext(formData.context);
    setConfidence(formData.confidence);
    setPostConfidence(formData.confidence); // Default second slider to initial value
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.surfaceBeliefs({
        skill: formData.skill,
        context: formData.context,
      });
      setBeliefs(response);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          (err as Error)?.message || 'Failed to surface assumptions. Please try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Screen 2: Tag toggle changes
  const handleTagChange = (assumptionId: string, tag: BeliefTag) => {
    setTags((prev) => ({
      ...prev,
      [assumptionId]: tag,
    }));
  };

  // Screen 3: Answer changes for questions
  const handleQuestionAnswerChange = (questionKey: string, text: string) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [questionKey]: text,
    }));
  };

  // Step navigation helpers
  const handleNavigate = (targetStep: StepId) => {
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset session
  const handleReset = useCallback(() => {
    clearSession();
    setSkill('');
    setContext('');
    setConfidence(50);
    setPostConfidence(50);
    setBeliefs(null);
    setTags({});
    setQuestions(null);
    setQuestionAnswers({});
    setReflection(null);
    setExperiment(null);
    setErrorMessage(null);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
      <Header onReset={handleReset} showReset={step > 1 || Boolean(skill || context)} />

      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* 5-Step Progress Bar */}
        <div className="mb-8">
          <ProgressBar
            currentStep={step}
            totalSteps={5}
            onStepClick={(targetStep) => {
              if (targetStep === 1) handleNavigate(1);
              else if (targetStep === 2 && beliefs) handleNavigate(2);
              else if (targetStep === 3 && beliefs) handleNavigate(3);
              else if (targetStep === 4 && beliefs) handleNavigate(4);
              else if (targetStep === 5 && beliefs) handleNavigate(5);
            }}
          />
        </div>

        {/* Dynamic Screen Flow */}
        <div className="transition-all duration-300">
          {step === 1 && (
            <AskScreen
              initialSkill={skill}
              initialContext={context}
              initialConfidence={confidence}
              isLoading={isLoading}
              errorMessage={errorMessage}
              savedReasoning={savedReasoning}
              onOpenCheckin={(rec) => setActiveCheckinRecord(rec)}
              onSubmit={handleAskSubmit}
            />
          )}

          {step === 2 && beliefs && (
            <BeliefsScreen
              data={beliefs}
              tags={tags}
              onTagChange={handleTagChange}
              onNext={() => handleNavigate(3)}
              onBack={() => handleNavigate(1)}
            />
          )}

          {step === 3 && beliefs && (
            <QuestionsScreen
              skill={skill}
              context={context}
              beliefs={beliefs}
              tags={tags}
              questions={questions}
              answers={questionAnswers}
              onAnswerChange={handleQuestionAnswerChange}
              onQuestionsLoaded={(qData) => setQuestions(qData)}
              onNext={() => handleNavigate(4)}
              onBack={() => handleNavigate(2)}
            />
          )}

          {step === 4 && beliefs && (
            <MirrorScreen
              skill={skill}
              context={context}
              initialConfidence={confidence}
              postConfidence={postConfidence}
              onPostConfidenceChange={setPostConfidence}
              beliefs={beliefs}
              tags={tags}
              reflection={reflection}
              onReflectionLoaded={(rData) => setReflection(rData)}
              questionAnswers={questionAnswers}
              onNext={() => handleNavigate(5)}
              onBack={() => handleNavigate(3)}
            />
          )}

          {step === 5 && beliefs && (
            <ExperimentScreen
              skill={skill}
              context={context}
              initialConfidence={confidence}
              postConfidence={postConfidence}
              beliefs={beliefs}
              tags={tags}
              questions={questions}
              questionAnswers={questionAnswers}
              reflection={reflection}
              experiment={experiment}
              onExperimentLoaded={(eData) => setExperiment(eData)}
              onStartOver={handleReset}
              onBack={() => handleNavigate(4)}
            />
          )}
        </div>
      </main>

      {/* 30-Day Check-in Modal */}
      {activeCheckinRecord && (
        <CheckinModal
          record={activeCheckinRecord}
          isOpen={Boolean(activeCheckinRecord)}
          onClose={() => setActiveCheckinRecord(null)}
        />
      )}

      <footer className="w-full border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Mirror Check &copy; {new Date().getFullYear()} — Non-prescriptive Socratic Companion</span>
          <span>Examines assumptions &bull; Never advises or commands</span>
        </div>
      </footer>
    </div>
  );
}
