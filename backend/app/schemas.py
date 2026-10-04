from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


# ==========================================
# Common / Base Request Models
# ==========================================

class SkillBaseRequest(BaseModel):
    """Base request model with core validation constraints."""
    skill: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="The skill under consideration (e.g., 'Rust programming', 'Product Management')",
    )
    context: str = Field(
        ...,
        min_length=5,
        max_length=1000,
        description="Context surrounding the user's situation and doubt",
    )

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )


# ==========================================
# 1. Beliefs / Hidden Assumptions
# ==========================================

class BeliefsRequest(SkillBaseRequest):
    """Input payload for surfacing hidden assumptions."""
    current_doubts: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Specific doubts or hesitation the user is currently feeling",
    )


class AssumptionItem(BaseModel):
    """A surfaced hidden belief or assumption."""
    id: str = Field(..., description="Identifier (e.g., 'A1', 'A2')")
    statement: str = Field(..., description="The unstated assumption behind the user's doubt")
    tag: str = Field(
        ...,
        description="Categorization tag (e.g., 'Career Expectation', 'Time Investment', 'Opportunity Cost', 'Skill Identity', 'Market Pressure', 'Transferability')",
    )
    counter_perspective: str = Field(
        ...,
        description="A neutral Socratic counter-question or perspective offering an alternative lens",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class BeliefsResponse(BaseModel):
    """Output payload containing 4-6 surfaced assumptions."""
    skill: str
    assumptions: List[AssumptionItem] = Field(
        ...,
        min_length=4,
        max_length=6,
        description="List of 4-6 surfaced hidden assumptions",
    )
    thinking_summary: str = Field(
        ...,
        description="A neutral Socratic summary reflecting back the underlying mental model without advice or judgment",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


# ==========================================
# 2. Targeted Inquiry Questions
# ==========================================

class BeliefInputItem(BaseModel):
    """Optional belief/assumption passed into questions endpoint."""
    statement: str = Field(..., min_length=2, max_length=300)
    tag: Optional[str] = Field(default=None, max_length=50)

    model_config = ConfigDict(str_strip_whitespace=True)


class QuestionsRequest(SkillBaseRequest):
    """Input payload for generating structured Socratic inquiry questions."""
    beliefs: Optional[List[BeliefInputItem]] = Field(
        default=None,
        max_length=10,
        description="List of previously surfaced assumptions/beliefs",
    )
    source_of_doubt: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Specific trigger or root source of the doubt",
    )


class CategorizedQuestion(BaseModel):
    """A structured inquiry question examining a core dimension."""
    category: str = Field(
        ...,
        description="Category: 'goal', 'deadline', 'trade-offs', 'transferable_skills', or 'source_of_doubt'",
    )
    question: str = Field(..., description="The Socratic question examining this dimension")
    reasoning: str = Field(..., description="Why answering this question clarifies the user's doubt")
    related_assumption_tag: Optional[str] = Field(
        default=None,
        description="Tag of the belief/assumption this question probes",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class QuestionsResponse(BaseModel):
    """Output payload containing 4-5 targeted inquiry questions."""
    skill: str
    questions: List[CategorizedQuestion] = Field(
        ...,
        min_length=4,
        max_length=5,
        description="List of 4-5 questions spanning goal, deadline, trade-offs, transferable skills, and source of doubt",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


# ==========================================
# 3. Reflection Questions
# ==========================================

class ReflectRequest(SkillBaseRequest):
    """Input payload for generating deep reflective questions."""
    user_notes: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="User's notes or answers to earlier questions",
    )


class ReflectiveQuestionItem(BaseModel):
    """A reflective prompt probing internal motivations and priorities."""
    id: str = Field(..., description="Identifier (e.g., 'R1', 'R2')")
    prompt: str = Field(..., description="Deep reflective inquiry prompt")
    focus_area: str = Field(
        ...,
        description="Focus area (e.g., 'Internal vs External Motivation', 'Definition of Mastery', 'Cost of Inaction')",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class ReflectResponse(BaseModel):
    """Output payload containing 2-3 reflective questions."""
    skill: str
    reflective_questions: List[ReflectiveQuestionItem] = Field(
        ...,
        min_length=2,
        max_length=3,
        description="List of 2-3 deep reflective questions",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


# ==========================================
# 4. Two-Hour Low-Risk Experiment
# ==========================================

class ExperimentRequest(SkillBaseRequest):
    """Input payload for generating a 2-hour exploratory option."""
    focal_doubt: Optional[str] = Field(
        default=None,
        max_length=500,
        description="The primary doubt or blocker the experiment seeks to test",
    )


class TwoHourExperiment(BaseModel):
    """A low-risk 2-hour exploratory test phrased strictly as an option."""
    title: str = Field(..., description="Descriptive title of the exploratory test")
    framing: str = Field(
        ...,
        description="Explicit framing emphasizing this is an optional exploratory taste test, not advice",
    )
    duration_minutes: int = Field(
        default=120,
        description="Estimated duration in minutes (120 minutes = 2 hours)",
    )
    step_1_setup: str = Field(..., description="Setup phase (approx. 20 min) without complex tooling")
    step_2_build: str = Field(..., description="Hands-on exploration phase (approx. 70 min)")
    step_3_reflect: str = Field(..., description="Self-observation & debrief phase (approx. 30 min)")
    observation_questions: List[str] = Field(
        ...,
        min_length=2,
        max_length=4,
        description="Questions to evaluate your personal energy, friction, and interest during the test",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class ExperimentResponse(BaseModel):
    """Output payload containing the 2-hour experiment."""
    skill: str
    experiment: TwoHourExperiment

    model_config = ConfigDict(str_strip_whitespace=True)


# ==========================================
# 5. 30-Day Check-in Plan
# ==========================================

class CheckinRequest(SkillBaseRequest):
    """Input payload for generating 30-day follow-up check-in reflection prompts."""
    decision_state: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Current direction or paused state of the user's thinking",
    )


class CheckinPlan(BaseModel):
    """30-day follow-up plan with self-evaluation reflection prompts."""
    timeline: str = Field(default="30 Days", description="Follow-up timeframe")
    reflection_prompts: List[str] = Field(
        ...,
        min_length=3,
        max_length=5,
        description="Questions to reflect on 30 days later to assess if urgency or clarity changed",
    )
    trigger_events: List[str] = Field(
        ...,
        min_length=2,
        max_length=4,
        description="Observable events or signals indicating when it might be time to revisit this inquiry",
    )
    drift_check_question: str = Field(
        ...,
        description="A question assessing whether external hype or peer pressure has faded",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


class CheckinResponse(BaseModel):
    """Output payload containing 30-day follow-up prompts."""
    skill: str
    checkin_plan: CheckinPlan

    model_config = ConfigDict(str_strip_whitespace=True)


# ==========================================
# Guardrail Checker Response Schema
# ==========================================

class GuardrailValidationResult(BaseModel):
    """Structured output from Gemini guardrail checker."""
    is_valid: bool = Field(
        ...,
        description="True if the text is purely non-judgmental, Socratic, and non-prescriptive. False if it contains advice, recommendations, verdicts, or commands.",
    )
    violating_phrases: List[str] = Field(
        default_factory=list,
        description="List of specific phrases found that violate the non-prescriptive rule",
    )
    reason: str = Field(
        default="",
        description="Brief explanation of the evaluation",
    )

    model_config = ConfigDict(str_strip_whitespace=True)


# ==========================================
# Error Response Schema
# ==========================================

class ErrorDetail(BaseModel):
    """Standard error response format."""
    error: str
    detail: str
    code: str

    model_config = ConfigDict(str_strip_whitespace=True)
