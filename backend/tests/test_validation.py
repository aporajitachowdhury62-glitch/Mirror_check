import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.schemas import (
    BeliefInputItem,
    BeliefsRequest,
    CheckinRequest,
    ExperimentRequest,
    QuestionsRequest,
    ReflectRequest,
)


def test_valid_request_schemas():
    """Verify that correctly formatted inputs parse and validate cleanly."""
    b_req = BeliefsRequest(
        skill="Rust programming",
        context="I want to build performant web services.",
        current_doubts="Is the borrow checker too steep of a learning curve?",
    )
    assert b_req.skill == "Rust programming"

    q_req = QuestionsRequest(
        skill="Rust",
        context="Evaluating Rust vs Go for backend.",
        beliefs=[BeliefInputItem(statement="Rust is only for low level OS code", tag="Skill Identity")],
        source_of_doubt="Team is already using Go",
    )
    assert len(q_req.beliefs) == 1

    r_req = ReflectRequest(
        skill="TypeScript",
        context="Working in JavaScript for 5 years.",
        user_notes="Feel like my type safety skills could improve.",
    )
    assert r_req.skill == "TypeScript"

    e_req = ExperimentRequest(
        skill="Swift",
        context="Considering iOS app development.",
        focal_doubt="Not sure if mobile UI development fits my interest.",
    )
    assert e_req.skill == "Swift"

    c_req = CheckinRequest(
        skill="Docker & Kubernetes",
        context="Decided to pause DevOps learning for now.",
        decision_state="Paused",
    )
    assert c_req.decision_state == "Paused"


@pytest.mark.parametrize(
    "invalid_skill",
    [
        "",          # Empty
        "a",         # < 2 chars
        "a" * 101,   # > 100 chars
    ],
)
def test_skill_length_bounds(invalid_skill: str):
    with pytest.raises(ValidationError):
        BeliefsRequest(
            skill=invalid_skill,
            context="Valid context string here.",
        )


@pytest.mark.parametrize(
    "invalid_context",
    [
        "",          # Empty
        "tiny",      # < 5 chars
        "x" * 1001,  # > 1000 chars
    ],
)
def test_context_length_bounds(invalid_context: str):
    with pytest.raises(ValidationError):
        BeliefsRequest(
            skill="Valid Skill",
            context=invalid_context,
        )


def test_optional_field_max_lengths():
    with pytest.raises(ValidationError):
        BeliefsRequest(
            skill="Rust",
            context="Valid context here",
            current_doubts="x" * 501,
        )

    with pytest.raises(ValidationError):
        QuestionsRequest(
            skill="Rust",
            context="Valid context here",
            source_of_doubt="x" * 501,
        )

    with pytest.raises(ValidationError):
        ReflectRequest(
            skill="Rust",
            context="Valid context here",
            user_notes="x" * 1001,
        )

    with pytest.raises(ValidationError):
        ExperimentRequest(
            skill="Rust",
            context="Valid context here",
            focal_doubt="x" * 501,
        )

    with pytest.raises(ValidationError):
        CheckinRequest(
            skill="Rust",
            context="Valid context here",
            decision_state="x" * 501,
        )


def test_extra_fields_forbidden():
    with pytest.raises(ValidationError):
        BeliefsRequest.model_validate(
            {
                "skill": "Rust",
                "context": "Valid context here",
                "unexpected_field": "disallowed",
            }
        )


def test_endpoint_input_validation_errors_via_http(client: TestClient):
    """Test that FastAPI returns 422 JSON with structured error code on validation failures."""
    # Missing required 'context'
    resp = client.post("/api/beliefs", json={"skill": "Rust"})
    assert resp.status_code == 422
    data = resp.json()
    assert data["error"] == "Validation Error"
    assert data["code"] == "INVALID_INPUT"
    assert "context" in data["detail"]

    # Skill too short
    resp = client.post(
        "/api/questions",
        json={"skill": "X", "context": "Valid context text"},
    )
    assert resp.status_code == 422
    data = resp.json()
    assert data["code"] == "INVALID_INPUT"

    # Context too short
    resp = client.post(
        "/api/reflect",
        json={"skill": "Valid Skill", "context": "no"},
    )
    assert resp.status_code == 422

    # Completely empty payload
    resp = client.post("/api/experiment", json={})
    assert resp.status_code == 422
