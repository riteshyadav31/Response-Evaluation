from bson import ObjectId

FULL_NAME = "Taylor Evaluator"
EMAIL = "taylor@example.com"
PASSWORD = "a-strong-passphrase-2026"
VALID_INPUT = {
    "original_prompt": "Compare these responses.",
    "response_a": "First response.",
    "response_b": "Second response.",
}


def registration_payload(**overrides) -> dict:
    payload = {
        "full_name": FULL_NAME,
        "email": EMAIL,
        "password": PASSWORD,
        "confirm_password": PASSWORD,
    }
    return {**payload, **overrides}


def register_and_login(client):
    response = client.post("/api/auth/register", json=registration_payload())
    assert response.status_code == 201
    login = client.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert login.status_code == 200
    return login


def test_dashboard_stats_are_user_scoped_and_zero_when_empty(client):
    response = client.get("/api/evaluations/stats")
    assert response.status_code == 401
    assert client.get("/api/evaluations/recent").status_code == 401
    assert client.get("/api/evaluations/").status_code == 401
    assert client.post("/api/evaluations/", json={"input": VALID_INPUT}).status_code == 401
    assert client.put(f"/api/evaluations/{ObjectId()}", json={"input": VALID_INPUT}).status_code == 401

    register_and_login(client)

    stats = client.get("/api/evaluations/stats")
    assert stats.status_code == 200
    assert stats.json() == {
        "total_evaluations": 0,
        "completed_evaluations": 0,
        "draft_evaluations": 0,
        "total_issues_found": 0,
    }


def test_user_can_create_draft_and_see_recent_evaluations(client):
    register_and_login(client)

    created = client.post("/api/evaluations/", json={"title": " Response Quality Review ", "input": VALID_INPUT})
    assert created.status_code == 201
    payload = created.json()
    assert payload["title"] == "Response Quality Review"
    assert payload["status"] == "draft"
    assert payload["completed_at"] is None
    assert payload["input"] == VALID_INPUT
    assert payload["context"]["user_context"] == ""

    detail = client.get(f"/api/evaluations/{payload['id']}")
    assert detail.status_code == 200
    assert detail.json()["input"] == VALID_INPUT

    recent = client.get("/api/evaluations/recent")
    assert recent.status_code == 200
    assert len(recent.json()) == 1
    assert recent.json()[0]["id"] == payload["id"]

    history = client.get("/api/evaluations/?page=1&page_size=10")
    assert history.status_code == 200
    assert history.json()["total"] == 1
    assert history.json()["items"][0]["status"] == "draft"


def test_user_cannot_view_or_delete_another_users_evaluation(client, users):
    first = client.post("/api/auth/register", json=registration_payload(email="first@example.com"))
    second = client.post("/api/auth/register", json={
        "full_name": "Second Evaluator",
        "email": "second@example.com",
        "password": PASSWORD,
        "confirm_password": PASSWORD,
    })
    assert first.status_code == 201
    assert second.status_code == 201

    first_login = client.post("/api/auth/login", json={"email": "first@example.com", "password": PASSWORD})
    assert first_login.status_code == 200

    created = client.post("/api/evaluations/", json={"title": "Private review", "input": VALID_INPUT})
    evaluation_id = created.json()["id"]

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 200

    second_login = client.post("/api/auth/login", json={"email": "second@example.com", "password": PASSWORD})
    assert second_login.status_code == 200

    view = client.get(f"/api/evaluations/{evaluation_id}")
    assert view.status_code == 404

    update = client.put(f"/api/evaluations/{evaluation_id}", json={"input": VALID_INPUT})
    assert update.status_code == 404

    delete = client.delete(f"/api/evaluations/{evaluation_id}")
    assert delete.status_code == 404


def test_stats_count_statuses_and_sorting(client, evaluations, users):
    register_and_login(client)
    user = users.find_one({"email": EMAIL})
    base_time = 1700000000

    evaluations.documents.extend([
        {
            "_id": ObjectId(),
            "user_id": user["_id"],
            "title": "Draft review",
            "status": "draft",
            "category": None,
            "created_at": __import__('datetime').datetime.fromtimestamp(base_time, tz=__import__('datetime').timezone.utc),
            "updated_at": __import__('datetime').datetime.fromtimestamp(base_time, tz=__import__('datetime').timezone.utc),
            "completed_at": None,
        },
        {
            "_id": ObjectId(),
            "user_id": user["_id"],
            "title": "Completed review",
            "status": "completed",
            "category": None,
            "created_at": __import__('datetime').datetime.fromtimestamp(base_time + 30, tz=__import__('datetime').timezone.utc),
            "updated_at": __import__('datetime').datetime.fromtimestamp(base_time + 30, tz=__import__('datetime').timezone.utc),
            "completed_at": __import__('datetime').datetime.fromtimestamp(base_time + 30, tz=__import__('datetime').timezone.utc),
        },
    ])

    stats = client.get("/api/evaluations/stats")
    assert stats.status_code == 200
    payload = stats.json()
    assert payload["total_evaluations"] == 2
    assert payload["completed_evaluations"] == 1
    assert payload["draft_evaluations"] == 1
    assert payload["total_issues_found"] == 0

    history = client.get("/api/evaluations/?status=draft&page=1&page_size=10")
    assert history.status_code == 200
    assert history.json()["items"][0]["title"] == "Draft review"

    filtered = client.get("/api/evaluations/?search=completed&page=1&page_size=10")
    assert filtered.status_code == 200
    assert filtered.json()["items"][0]["title"] == "Completed review"


def test_required_evaluation_inputs_reject_blank_and_whitespace(client):
    register_and_login(client)

    for field in VALID_INPUT:
        payload = {"input": {**VALID_INPUT, field: "   "}}
        response = client.post("/api/evaluations/", json=payload)
        assert response.status_code == 422

    too_long = client.post("/api/evaluations/", json={"input": {**VALID_INPUT, "original_prompt": "x" * 12001}})
    assert too_long.status_code == 422


def test_evaluation_input_is_trimmed_and_context_is_saved(client):
    register_and_login(client)
    payload = {
        "title": "  Quality check  ",
        "input": {key: f"  {value}  " for key, value in VALID_INPUT.items()},
        "context": {
            "user_context": "  Audience detail  ",
            "previous_conversation": "",
            "reference_evidence": "  Source text  ",
            "evaluation_notes": "",
        },
    }

    created = client.post("/api/evaluations/", json=payload)
    assert created.status_code == 201
    result = created.json()
    assert result["title"] == "Quality check"
    assert result["input"] == VALID_INPUT
    assert result["context"]["user_context"] == "Audience detail"
    assert result["context"]["reference_evidence"] == "Source text"


def test_user_can_update_existing_draft_without_duplicate(client, evaluations):
    from datetime import datetime, timezone

    register_and_login(client)
    created = client.post("/api/evaluations/", json={"input": VALID_INPUT})
    evaluation_id = created.json()["id"]
    evaluations.documents[0]["updated_at"] = datetime(2000, 1, 1, tzinfo=timezone.utc)
    updated_input = {**VALID_INPUT, "response_a": "Updated first response."}

    response = client.put(
        f"/api/evaluations/{evaluation_id}",
        json={"title": "Updated title", "input": updated_input, "context": {"evaluation_notes": "Check clarity."}},
    )

    assert response.status_code == 200
    assert response.json()["id"] == evaluation_id
    assert response.json()["title"] == "Updated title"
    assert response.json()["input"] == updated_input
    assert response.json()["context"]["evaluation_notes"] == "Check clarity."
    updated_at = datetime.fromisoformat(response.json()["updated_at"].replace("Z", "+00:00"))
    assert updated_at > datetime(2000, 1, 1, tzinfo=timezone.utc)
    assert len(evaluations.documents) == 1


def test_completed_evaluation_cannot_be_updated(client, evaluations):
    register_and_login(client)
    created = client.post("/api/evaluations/", json={"input": VALID_INPUT})
    evaluation_id = created.json()["id"]
    evaluations.documents[0]["status"] = "completed"

    response = client.put(f"/api/evaluations/{evaluation_id}", json={"input": VALID_INPUT})

    assert response.status_code == 409
