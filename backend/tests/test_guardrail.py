import json
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.schemas import (
    BeliefsRequest,
    BeliefsResponse,
    GuardrailValidationResult,
    ReflectRequest,
    ReflectResponse,
)
from app.services.gemini import GeminiService
from app.services.guardrail import (
    extract_all_text,
    get_fallback_beliefs,
    get_fallback_checkin,
    get_fallback_experiment,
    get_fallback_questions,
    get_fallback_reflect,
    regex_prefilter,
)
from tests.conftest import MockGenAIResponse


def test_extract_all_text_from_nested_structures():
    data = {
        "title": "Exploration",
        "nested": {
            "question": "What is the goal?",
            "items": ["Skill A", "Skill B"],
        },
    }
    extracted = extract_all_text(data)
    assert "Exploration" in extracted
    assert "What is the goal?" in extracted
    assert "Skill A" in extracted
    assert "Skill B" in extracted


@pytest.mark.parametrize(
    "violating_text,expected_subphrase",
    [
        ("You should definitely start learning this today.", "you should"),
        ("I recommend that you pick up Rust immediately.", "i recommend"),
        ("It is definitely worth it for your career.", "worth it"),
        ("Don't learn this skill right now.", "don't learn"),
        ("Do not learn this because it is outdated.", "do not learn"),
        ("You must study at least 2 hours daily.", "you must"),
        ("The best choice is to switch to TypeScript.", "the best choice is"),
        ("I advise focusing on backend development.", "i advise"),
        ("You will regret not learning this now.", "you will regret"),
    ],
)
def test_regex_prefilter_catches_violations(violating_text: str, expected_subphrase: str):
    passed, violations = regex_prefilter(violating_text)
    assert passed is False
    assert len(violations) > 0
    assert any(expected_subphrase in v.lower() for v in violations)


@pytest.mark.parametrize(
    "valid_socratic_text",
    [
        "What specific project or problem would learning this enable for you?",
        "What if your existing toolset is already sufficient for your current milestone?",
        "What is the realistic cost of deciding to pause this exploration for 90 days?",
        "How might a 2-hour sandbox test help you observe your genuine interest?",
        "Which underlying concepts from your past work overlap with this domain?",
    ],
)
def test_regex_prefilter_allows_socratic_inquiries(valid_socratic_text: str):
    passed, violations = regex_prefilter(valid_socratic_text)
    assert passed is True
    assert len(violations) == 0


def test_fallback_factories_return_valid_models():
    beliefs = get_fallback_beliefs("Rust")
    assert isinstance(beliefs, BeliefsResponse)
    assert len(beliefs.assumptions) >= 4
    assert regex_prefilter(beliefs)[0] is True

    questions = get_fallback_questions("Rust")
    assert len(questions.questions) >= 4
    assert regex_prefilter(questions)[0] is True

    reflect = get_fallback_reflect("Rust")
    assert len(reflect.reflective_questions) >= 2
    assert regex_prefilter(reflect)[0] is True

    experiment = get_fallback_experiment("Rust")
    assert experiment.experiment.duration_minutes == 120
    assert regex_prefilter(experiment)[0] is True

    checkin = get_fallback_checkin("Rust")
    assert len(checkin.checkin_plan.reflection_prompts) >= 3
    assert regex_prefilter(checkin)[0] is True


@pytest.mark.asyncio
async def test_guardrail_regenerates_on_first_attempt_violation():
    """If attempt 1 fails the regex or checker, it regenerates once with a stricter prompt."""
    mock_client = MagicMock()
    mock_generate = AsyncMock()

    # Attempt 1 returns violating content: "You should learn Rust"
    bad_beliefs = {
        "skill": "Rust",
        "assumptions": [
            {
                "id": "A1",
                "statement": "You should learn this to be a real engineer.",
                "tag": "Career Expectation",
                "counter_perspective": "Is this true?",
            },
            {
                "id": "A2",
                "statement": "Valid assumption without issue.",
                "tag": "Time Investment",
                "counter_perspective": "Counter point.",
            },
            {
                "id": "A3",
                "statement": "Valid assumption 3.",
                "tag": "Opportunity Cost",
                "counter_perspective": "Counter point 3.",
            },
            {
                "id": "A4",
                "statement": "Valid assumption 4.",
                "tag": "Skill Identity",
                "counter_perspective": "Counter point 4.",
            },
        ],
        "thinking_summary": "Summary of thinking",
    }

    # Attempt 2 returns valid Socratic content
    good_beliefs = {
        "skill": "Rust",
        "assumptions": [
            {
                "id": "A1",
                "statement": "You believe Rust is essential for systems engineering.",
                "tag": "Career Expectation",
                "counter_perspective": "What if existing languages achieve your goal?",
            },
            {
                "id": "A2",
                "statement": "You assume the learning curve will take months.",
                "tag": "Time Investment",
                "counter_perspective": "Could a weekend project test this?",
            },
            {
                "id": "A3",
                "statement": "You assume memory safety is mandatory for your tools.",
                "tag": "Skill Identity",
                "counter_perspective": "Where does memory safety matter in your domain?",
            },
            {
                "id": "A4",
                "statement": "You assume peers expect this knowledge.",
                "tag": "Market Pressure",
                "counter_perspective": "How much does peer conversation influence you?",
            },
        ],
        "thinking_summary": "Reflecting on your assumptions neutrally.",
    }

    # Checker mock returning is_valid=True for the second attempt
    checker_valid = json.dumps({"is_valid": True, "violating_phrases": [], "reason": "Purely Socratic"})

    mock_generate.side_effect = [
        MockGenAIResponse(json.dumps(bad_beliefs)),  # Attempt 1 (fails regex)
        MockGenAIResponse(json.dumps(good_beliefs)), # Attempt 2 (passes regex)
        MockGenAIResponse(checker_valid),            # Checker on Attempt 2
    ]
    mock_client.aio.models.generate_content = mock_generate

    service = GeminiService(client=mock_client)
    req = BeliefsRequest(skill="Rust", context="Frontend dev wondering about systems programming")
    res = await service.get_beliefs(req)

    assert res.skill == "Rust"
    assert "You should" not in res.assumptions[0].statement
    assert "You believe Rust is essential" in res.assumptions[0].statement
    assert mock_generate.call_count == 3


@pytest.mark.asyncio
async def test_guardrail_returns_fallback_when_both_attempts_fail():
    """If both attempt 1 and attempt 2 violate guardrails, return the safe fallback response."""
    mock_client = MagicMock()
    mock_generate = AsyncMock()

    bad_reflect = {
        "skill": "Rust",
        "reflective_questions": [
            {
                "id": "R1",
                "prompt": "I recommend you start with Python first.",
                "focus_area": "Motivation",
            },
            {
                "id": "R2",
                "prompt": "You should not rush this decision.",
                "focus_area": "Mastery",
            },
        ],
    }

    mock_generate.side_effect = [
        MockGenAIResponse(json.dumps(bad_reflect)),  # Attempt 1 (fails regex)
        MockGenAIResponse(json.dumps(bad_reflect)),  # Attempt 2 (fails regex)
    ]
    mock_client.aio.models.generate_content = mock_generate

    service = GeminiService(client=mock_client)
    req = ReflectRequest(skill="Rust", context="Considering learning Rust")
    res = await service.get_reflect(req)

    assert isinstance(res, ReflectResponse)
    assert res.skill == "Rust"
    assert len(res.reflective_questions) >= 2
    # Ensure fallback content was returned and contains no violations
    passed, _ = regex_prefilter(res)
    assert passed is True
