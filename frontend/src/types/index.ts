/**
 * Type definitions for Mirror Check Socratic Companion
 */

export interface SkillBaseRequest {
  skill: string;
  context: string;
}

export interface BeliefsRequest extends SkillBaseRequest {
  current_doubts?: string;
}

export interface AssumptionItem {
  id: string;
  statement: string;
  tag: string;
  counter_perspective: string;
}

export interface BeliefsResponse {
  skill: string;
  assumptions: AssumptionItem[];
  thinking_summary: string;
}

export type BeliefTag = 'know' | 'guess' | 'not_sure';

export interface TaggedAssumption extends AssumptionItem {
  status?: BeliefTag;
}

export interface BeliefInputItem {
  statement: string;
  tag?: string;
}

export interface QuestionsRequest extends SkillBaseRequest {
  beliefs?: BeliefInputItem[];
  source_of_doubt?: string;
}

export interface CategorizedQuestion {
  category: string;
  question: string;
  reasoning: string;
  related_assumption_tag?: string;
}

export interface QuestionsResponse {
  skill: string;
  questions: CategorizedQuestion[];
}

export interface ReflectRequest extends SkillBaseRequest {
  user_notes?: string;
}

export interface ReflectiveQuestionItem {
  id: string;
  prompt: string;
  focus_area: string;
}

export interface ReflectResponse {
  skill: string;
  reflective_questions: ReflectiveQuestionItem[];
}

export interface ExperimentRequest extends SkillBaseRequest {
  focal_doubt?: string;
}

export interface TwoHourExperiment {
  title: string;
  framing: string;
  duration_minutes: number;
  step_1_setup: string;
  step_2_build: string;
  step_3_reflect: string;
  observation_questions: string[];
}

export interface ExperimentResponse {
  skill: string;
  experiment: TwoHourExperiment;
}

export interface CheckinRequest extends SkillBaseRequest {
  decision_state?: string;
}

export interface CheckinPlan {
  timeline: string;
  reflection_prompts: string[];
  trigger_events: string[];
  drift_check_question: string;
}

export interface CheckinResponse {
  skill: string;
  checkin_plan: CheckinPlan;
}

export interface ApiErrorResponse {
  error?: string;
  detail?: string | Array<{ msg?: string; loc?: string[] }>;
  code?: string;
  message?: string;
}

export type StepId = 1 | 2 | 3 | 4 | 5;

export interface SessionData {
  id?: string;
  skill: string;
  context: string;
  confidence: number;
  postConfidence?: number;
  step: StepId;
  beliefs: BeliefsResponse | null;
  tags: Record<string, BeliefTag>;
  questionAnswers: Record<string, string>;
  questions: QuestionsResponse | null;
  reflection: ReflectResponse | null;
  experiment: ExperimentResponse | null;
  savedAt?: number;
  checkinDueAt?: number;
  lastUpdated?: number;
  isCompleted?: boolean;
}

export interface SavedReasoningRecord {
  id: string;
  skill: string;
  context: string;
  initialConfidence: number;
  postConfidence: number;
  confidenceChange: number;
  beliefs: BeliefsResponse;
  tags: Record<string, BeliefTag>;
  questionAnswers: Record<string, string>;
  reflection: ReflectResponse | null;
  experiment: ExperimentResponse | null;
  savedAt: number;
  checkinDueAt: number;
}
