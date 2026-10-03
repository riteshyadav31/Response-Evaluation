from datetime import timedelta

from app.core.security import create_access_token, hash_password

FULL_NAME = "Taylor Evaluator"
EMAIL = "taylor@example.com"
PASSWORD = "a-strong-passphrase-2026"


def registration_payload(**overrides) -> dict:
    payload = {
        "full_name": FULL_NAME,
        "email": EMAIL,
        "password": PASSWORD,
        "confirm_password": PASSWORD,
    }
    return {**payload, **overrides}


def test_registration_normalizes_email_and_stores_only_hash(client, users):
    response = client.post("/api/auth/register", json=registration_payload(email=" Taylor@Example.com "))

    assert response.status_code == 201
    assert response.json()["email"] == EMAIL
    assert response.json()["created_at"].endswith(("Z", "+00:00"))
    assert "hashed_password" not in response.json()
    saved_user = users.find_one({"email": EMAIL})
    assert saved_user["hashed_password"].startswith("$2b$")
    assert saved_user["hashed_password"] != PASSWORD
    assert saved_user["role"] == "evaluator"
    assert saved_user["is_active"] is True


def test_duplicate_email_is_rejected(client):
    assert client.post("/api/auth/register", json=registration_payload()).status_code == 201
    duplicate = client.post("/api/auth/register", json=registration_payload(email=EMAIL.upper()))

    assert duplicate.status_code == 409


def test_registration_rejects_invalid_email_and_mismatched_passwords(client):
    invalid_email = client.post("/api/auth/register", json=registration_payload(email="not-an-email"))
    mismatch = client.post(
        "/api/auth/register",
        json=registration_payload(confirm_password="a-different-passphrase-2026"),
    )

    assert invalid_email.status_code == 422
    assert mismatch.status_code == 422


def test_registration_rejects_weak_password(client):
    response = client.post(
        "/api/auth/register",
        json=registration_payload(password="short", confirm_password="short"),
    )

    assert response.status_code == 422


def test_registration_rate_limit(client):
    responses = [client.post("/api/auth/register", json=registration_payload()) for _ in range(6)]

    assert responses[-1].status_code == 429


def test_login_sets_http_only_cookie_and_me_returns_public_profile(client, users):
    client.post("/api/auth/register", json=registration_payload())

    response = client.post("/api/auth/login", json={"email": EMAIL.upper(), "password": PASSWORD})
    assert response.status_code == 200
    assert "httponly" in response.headers["set-cookie"].lower()
    assert "hashed_password" not in response.json()

    profile = client.get("/api/auth/me")
    assert profile.status_code == 200
    assert profile.json()["id"] == response.json()["id"]
    assert profile.json()["email"] == EMAIL


def test_login_uses_same_error_for_unknown_email_and_wrong_password(client, users):
    client.post("/api/auth/register", json=registration_payload())

    wrong_password = client.post("/api/auth/login", json={"email": EMAIL, "password": "incorrect-passphrase"})
    unknown_email = client.post("/api/auth/login", json={"email": "unknown@example.com", "password": PASSWORD})

    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_invalid_and_expired_tokens_are_rejected(client, users):
    registration = client.post("/api/auth/register", json=registration_payload())
    user_id = registration.json()["id"]

    client.cookies.set("rq_access_token", "not-a-jwt", path="/api/auth")
    assert client.get("/api/auth/me").status_code == 401

    expired = create_access_token(user_id, expires_delta=timedelta(seconds=-1))
    client.cookies.set("rq_access_token", expired, path="/api/auth")
    assert client.get("/api/auth/me").status_code == 401


def test_logout_clears_cookie_and_profile_access(client):
    client.post("/api/auth/register", json=registration_payload())
    client.post("/api/auth/login", json={"email": EMAIL, "password": PASSWORD})

    response = client.post("/api/auth/logout")

    assert response.status_code == 200
    assert "max-age=0" in response.headers["set-cookie"].lower()
    assert client.get("/api/auth/me").status_code == 401


def test_dashboard_health_route_remains_available(client):
    assert client.get("/api/health").status_code == 200