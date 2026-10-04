import json
import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.routers.api import get_gemini_service
from app.schemas import (
    AssumptionItem,
    BeliefsRequest,
    BeliefsResponse,
    CategorizedQuestion,
    CheckinPlan,
    CheckinRequest,
    CheckinResponse,
    ExperimentRequest,
    ExperimentResponse,
    QuestionsRequest,
    QuestionsResponse,
    ReflectRequest,
    ReflectResponse,
    ReflectiveQuestionItem,
    TwoHourExperiment,
)
from app.services.gemini import GeminiService
from tests.conftest import MockGenAIResponse


def test_health_check(client: TestClient):
    """GET /health should return 200 OK with status and version."""
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "mirror-check-api"
    assert "version" in data


def test_beliefs_endpoint_with_mocked_gemini(client: TestClient):
    """POST /api/beliefs returns 4-6 assumptions and caches the result."""
    mock_service = MagicMock(spec=GeminiService)
    mock_response = BeliefsResponse(
        skill="Rust",
        assumptions=[
            AssumptionItem(
                id="A1",
                statement="You believe you must use Rust professionally for it to be useful.",
                tag="Career Expectation",
                counter_perspective="What if learning it deepens your conceptual understanding of systems?",
            ),
            AssumptionItem(
                id="A2",
                statement="You assume the syntax difficulty will halt your progress.",
                tag="Time Investment",
                counter_perspective="How would a 2-hour sandbox project challenge that belief?",
            ),
            AssumptionItem(
                id="A3",
                statement="You feel other developers in your space are judging your toolkit.",
                tag="Market Pressure",
                counter_perspective="Is the urgency coming from peer chatter or real work needs?",
            ),
            AssumptionItem(
                id="A4",
                statement="You assume time spent on Rust is wasted if you stick with TypeScript.",
                tag="Opportunity Cost",
                counter_perspective="Which memory models might improve your TypeScript design?",
            ),
        ],
        thinking_summary="You are balancing perceived career necessity against immediate learning friction.",
    )
    mock_service.get_beliefs = AsyncMock(return_value=mock_response)

    app.dependency_overrides[get_gemini_service] = lambda: mock_service

    payload = {
        "skill": "Rust",
        "context": "Frontend engineer deciding whether to learn systems programming.",
        "current_doubts": "Takes too much time away from work.",
    }
    resp = client.post("/api/beliefs", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["skill"] == "Rust"
    assert len(data["assumptions"]) == 4
    assert data["assumptions"][0]["id"] == "A1"
    assert "Career Expectation" in data["assumptions"][0]["tag"]

    app.dependency_overrides.clear()


def test_questions_endpoint_with_mocked_gemini(client: TestClient):
    """POST /api/questions returns 4-5 structured Socratic questions."""
    mock_service = MagicMock(spec=GeminiService)
    mock_response = QuestionsResponse(
        skill="Rust",
        questions=[
            CategorizedQuestion(
                category="goal",
                question="What specific outcome or capability will Rust unlock for you?",
                reasoning="Clarifies concrete goals.",
                related_assumption_tag="Career Expectation",
            ),
            CategorizedQuestion(
                category="deadline",
                question="Is there an upcoming project forcing a timeline, or is this open-ended?",
                reasoning="Distinguishes real urgency from artificial pressure.",
                related_assumption_tag="Time Investment",
            ),
            CategorizedQuestion(
                category="trade-offs",
                question="What other commitments or rest will you trade to study this week?",
                reasoning="Surfaces opportunity cost.",
                related_assumption_tag="Opportunity Cost",
            ),
            CategorizedQuestion(
                category="transferable_skills",
                question="Which concepts from your C++ or JS knowledge map over to Rust?",
                reasoning="Examines knowledge transfer.",
                related_assumption_tag="Transferability",
            ),
            CategorizedQuestion(
                category="source_of_doubt",
                question="What is the single biggest unknown causing hesitation?",
                reasoning="Pinpoints core hesitation.",
                related_assumption_tag="Skill Identity",
            ),
        ],
    )
    mock_service.get_questions = AsyncMock(return_value=mock_response)
    app.dependency_overrides[get_gemini_service] = lambda: mock_service

    payload = {
        "skill": "Rust",
        "context": "Frontend engineer exploring WebAssembly backend.",
        "source_of_doubt": "Not sure if WebAssembly is needed for my work.",
    }
    resp = client.post("/api/questions", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["skill"] == "Rust"
    assert len(data["questions"]) == 5
    assert data["questions"][0]["category"] == "goal"

    app.dependency_overrides.clear()


def test_reflect_endpoint_with_mocked_gemini(client: TestClient):
    """POST /api/reflect returns 2-3 deep reflective questions."""
    mock_service = MagicMock(spec=GeminiService)
    mock_response = ReflectResponse(
        skill="Machine Learning",
        reflective_questions=[
            ReflectiveQuestionItem(
                id="R1",
                prompt="If nobody ever saw your machine learning projects, would you still be excited to train models?",
                focus_area="Internal vs External Motivation",
            ),
            ReflectiveQuestionItem(
                id="R2",
                prompt="What is the minimal viable understanding of ML math that would give you confidence?",
                focus_area="Definition of Mastery",
            ),
            ReflectiveQuestionItem(
                id="R3",
                prompt="What is the concrete risk if you decide not to pursue this for the rest of this year?",
                focus_area="Cost of Inaction",
            ),
        ],
    )
    mock_service.get_reflect = AsyncMock(return_value=mock_response)
    app.dependency_overrides[get_gemini_service] = lambda: mock_service

    payload = {
        "skill": "Machine Learning",
        "context": "Full-stack developer seeing AI everywhere.",
        "user_notes": "Want to know if I need deep math or just API usage.",
    }
    resp = client.post("/api/reflect", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["skill"] == "Machine Learning"
    assert len(data["reflective_questions"]) == 3
    assert data["reflective_questions"][0]["id"] == "R1"

    app.dependency_overrides.clear()


def test_experiment_endpoint_with_mocked_gemini(client: TestClient):
    """POST /api/experiment returns a 2-hour low-risk exploratory option."""
    mock_service = MagicMock(spec=GeminiService)
    mock_response = ExperimentResponse(
        skill="Go",
        experiment=TwoHourExperiment(
            title="2-Hour CLI Tool Exploration",
            framing="This is an optional exploratory sandbox to evaluate your engagement, not a prescription.",
            duration_minutes=120,
            step_1_setup="Spend 20 minutes installing Go and verifying a basic main.go runs.",
            step_2_build="Spend 70 minutes writing a simple CLI tool that fetches JSON from a public API.",
            step_3_reflect="Spend 30 minutes writing down your reactions: did the simplicity feel clean or restrictive?",
            observation_questions=[
                "Did Go's explicit error handling feel clear or tedious?",
                "Were you eager to explore concurrency, or did you want to return to your primary language?",
            ],
        ),
    )
    mock_service.get_experiment = AsyncMock(return_value=mock_response)
    app.dependency_overrides[get_gemini_service] = lambda: mock_service

    payload = {
        "skill": "Go",
        "context": "Evaluating backend services language.",
        "focal_doubt": "Not sure if language simplicity suits complex domain logic.",
    }
    resp = client.post("/api/experiment", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["skill"] == "Go"
    assert data["experiment"]["duration_minutes"] == 120
    assert len(data["experiment"]["observation_questions"]) == 2

    app.dependency_overrides.clear()


def test_checkin_endpoint_with_mocked_gemini(client: TestClient):
    """POST /api/checkin returns 30-day follow-up plan."""
    mock_service = MagicMock(spec=GeminiService)
    mock_response = CheckinResponse(
        skill="Kubernetes",
        checkin_plan=CheckinPlan(
            timeline="30 Days",
            reflection_prompts=[
                "In the last 30 days, did you encounter any deployment obstacle that Kubernetes would have solved?",
                "Has your interest in container orchestration grown or settled down?",
                "Do you feel relief or regret having paused this exploration?",
            ],
            trigger_events=[
                "Your company mandates migrating services to K8s clusters.",
                "You take ownership of cloud infrastructure provisioning.",
            ],
            drift_check_question="Was the desire to learn K8s influenced by conference talks or an immediate system bottleneck?",
        ),
    )
    mock_service.get_checkin = AsyncMock(return_value=mock_response)
    app.dependency_overrides[get_gemini_service] = lambda: mock_service

    payload = {
        "skill": "Kubernetes",
        "context": "Decided to pause DevOps learning for 1 month.",
        "decision_state": "Paused for 30 days",
    }
    resp = client.post("/api/checkin", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["skill"] == "Kubernetes"
    assert data["checkin_plan"]["timeline"] == "30 Days"
    assert len(data["checkin_plan"]["reflection_prompts"]) == 3

    app.dependency_overrides.clear()


def test_endpoint_error_handling_sanitizes_500(client: TestClient):
    """Verify that unhandled service errors do not leak internal stack traces to the client."""
    mock_service = MagicMock(spec=GeminiService)
    mock_service.get_beliefs = AsyncMock(side_effect=RuntimeError("Internal database or API failure"))
    app.dependency_overrides[get_gemini_service] = lambda: mock_service

    resp = client.post(
        "/api/beliefs",
        json={"skill": "Rust", "context": "Testing error sanitization"},
    )
    assert resp.status_code == 500
    data = resp.json()
    assert data["detail"] == "Failed to surface assumptions. Please try again."
    # Ensure sensitive internal traceback is NOT in response
    assert "Traceback" not in json.dumps(data)
    assert "RuntimeError" not in json.dumps(data)

    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_service_caching_returns_cached_response_without_recalling_gemini():
    """Verify that identical requests hit the TTL cache and avoid redundant Gemini calls."""
    mock_client = MagicMock()
    mock_generate = AsyncMock()

    beliefs_data = {
        "skill": "Rust",
        "assumptions": [
            {
                "id": "A1",
                "statement": "You assume Rust is only relevant for low-level systems code.",
                "tag": "Career Expectation",
                "counter_perspective": "What about WebAssembly and tooling applications?",
            },
            {
                "id": "A2",
                "statement": "You assume the time investment will take months before any payoff.",
                "tag": "Time Investment",
                "counter_perspective": "Could writing a small CLI in a weekend provide clarity?",
            },
            {
                "id": "A3",
                "statement": "You assume you must reach complete mastery.",
                "tag": "Skill Identity",
                "counter_perspective": "What if basic reading literacy is enough?",
            },
            {
                "id": "A4",
                "statement": "You assume your peers expect you to know this.",
                "tag": "Market Pressure",
                "counter_perspective": "How much of this is external pressure vs genuine curiosity?",
            },
        ],
        "thinking_summary": "Balancing expected career utility against perceived difficulty.",
    }
    checker_valid = json.dumps({"is_valid": True, "violating_phrases": [], "reason": "Purely Socratic"})

    # Setup mock for 1st call (generation + checker)
    mock_generate.side_effect = [
        MockGenAIResponse(json.dumps(beliefs_data)),
        MockGenAIResponse(checker_valid),
    ]
    mock_client.aio.models.generate_content = mock_generate

    service = GeminiService(client=mock_client)
    req = BeliefsRequest(skill="Rust", context="Frontend dev exploring systems", current_doubts="Takes too long")

    # Call 1: Misses cache, calls Gemini
    res1 = await service.get_beliefs(req)
    assert res1.skill == "Rust"
    assert mock_generate.call_count == 2

    # Call 2: Identical request, hits cache, should NOT call Gemini
    res2 = await service.get_beliefs(req)
    assert res2.skill == "Rust"
    assert mock_generate.call_count == 2  # Call count remains 2!
    assert res1.model_dump() == res2.model_dump()


@pytest.mark.asyncio
async def test_direct_gemini_service_experiment_end_to_end():
    """Verify GeminiService.get_experiment properly parses structured JSON and passes guardrails."""
    mock_client = MagicMock()
    mock_generate = AsyncMock()

    experiment_data = {
        "skill": "Rust",
        "experiment": {
            "title": "2-Hour WebAssembly Micro-Module Test",
            "framing": "This is an optional exploratory sandbox to observe your own engagement.",
            "duration_minutes": 120,
            "step_1_setup": "Spend 20 minutes installing wasm-pack and generating a minimal template.",
            "step_2_build": "Spend 70 minutes compiling a single Rust function to WebAssembly and calling it from JS.",
            "step_3_reflect": "Spend 30 minutes noting your feelings regarding toolchain friction.",
            "observation_questions": [
                "Did the compiler feedback feel helpful or overwhelming?",
                "Did you feel excited when the function executed in the browser?",
            ],
        },
    }
    checker_valid = json.dumps({"is_valid": True, "violating_phrases": [], "reason": "Socratic"})

    mock_generate.side_effect = [
        MockGenAIResponse(json.dumps(experiment_data)),
        MockGenAIResponse(checker_valid),
    ]
    mock_client.aio.models.generate_content = mock_generate

    service = GeminiService(client=mock_client)
    req = ExperimentRequest(skill="Rust", context="Frontend engineer exploring WebAssembly")
    res = await service.get_experiment(req)

    assert res.skill == "Rust"
    assert res.experiment.duration_minutes == 120
    assert len(res.experiment.observation_questions) == 2


@pytest.mark.asyncio
async def test_direct_gemini_service_questions_end_to_end():
    """Verify GeminiService.get_questions properly parses structured JSON and passes guardrails."""
    mock_client = MagicMock()
    mock_generate = AsyncMock()

    questions_data = {
        "skill": "Rust",
        "questions": [
            {
                "category": "goal",
                "question": "What concrete capability will Rust enable for you?",
                "reasoning": "Clarifies goals.",
                "related_assumption_tag": "Career Expectation",
            },
            {
                "category": "deadline",
                "question": "Is there a real deadline or self-imposed timeline?",
                "reasoning": "Examines time urgency.",
                "related_assumption_tag": "Time Investment",
            },
            {
                "category": "trade-offs",
                "question": "What will you sacrifice to study?",
                "reasoning": "Surfaces opportunity cost.",
                "related_assumption_tag": "Opportunity Cost",
            },
            {
                "category": "transferable_skills",
                "question": "What prior experience carries over?",
                "reasoning": "Evaluates transferability.",
                "related_assumption_tag": "Transferability",
            },
            {
                "category": "source_of_doubt",
                "question": "What is the primary unknown causing hesitation?",
                "reasoning": "Probes doubt root.",
                "related_assumption_tag": "Skill Identity",
            },
        ],
    }
    checker_valid = json.dumps({"is_valid": True, "violating_phrases": [], "reason": "Socratic"})

    mock_generate.side_effect = [
        MockGenAIResponse(json.dumps(questions_data)),
        MockGenAIResponse(checker_valid),
    ]
    mock_client.aio.models.generate_content = mock_generate

    service = GeminiService(client=mock_client)
    req = QuestionsRequest(skill="Rust", context="Frontend engineer exploring systems")
    res = await service.get_questions(req)

    assert res.skill == "Rust"
    assert len(res.questions) == 5


@pytest.mark.asyncio
async def test_direct_gemini_service_checkin_end_to_end():
    """Verify GeminiService.get_checkin properly parses structured JSON and passes guardrails."""
    mock_client = MagicMock()
    mock_generate = AsyncMock()

    checkin_data = {
        "skill": "Rust",
        "checkin_plan": {
            "timeline": "30 Days",
            "reflection_prompts": [
                "Has your interest in Rust persisted over the last 30 days?",
                "Did you face any problem that Rust would have solved?",
                "How do you feel about having paused this decision?",
            ],
            "trigger_events": [
                "A project requires high performance systems code.",
                "You finish your primary roadmap goals.",
            ],
            "drift_check_question": "Has the external social media hype around Rust settled down?",
        },
    }
    checker_valid = json.dumps({"is_valid": True, "violating_phrases": [], "reason": "Socratic"})

    mock_generate.side_effect = [
        MockGenAIResponse(json.dumps(checkin_data)),
        MockGenAIResponse(checker_valid),
    ]
    mock_client.aio.models.generate_content = mock_generate

    service = GeminiService(client=mock_client)
    req = CheckinRequest(skill="Rust", context="Frontend engineer taking a 30 day pause")
    res = await service.get_checkin(req)

    assert res.skill == "Rust"
    assert res.checkin_plan.timeline == "30 Days"
    assert len(res.checkin_plan.reflection_prompts) == 3


