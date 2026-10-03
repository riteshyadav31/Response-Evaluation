import os

os.environ["JWT_SECRET"] = "test-only-jwt-secret-that-is-at-least-32-bytes-long"
os.environ["MONGODB_URI"] = ""
os.environ["AUTH_COOKIE_SECURE"] = "false"

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_evaluations_collection, get_users_collection
from app.core.rate_limit import limiter
from app.main import app


class FakeUsersCollection:
    def __init__(self) -> None:
        self.documents: list[dict] = []

    def find_one(self, query: dict, projection: dict | None = None) -> dict | None:
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return document
        return None

    def insert_one(self, document: dict):
        from bson import ObjectId
        from pymongo.errors import DuplicateKeyError

        if self.find_one({"email": document["email"]}):
            raise DuplicateKeyError("duplicate email")
        saved_document = {**document, "_id": ObjectId()}
        self.documents.append(saved_document)
        return type("InsertResult", (), {"inserted_id": saved_document["_id"]})()


@pytest.fixture
def users() -> FakeUsersCollection:
    return FakeUsersCollection()


class FakeEvaluationsCollection:
    def __init__(self) -> None:
        self.documents: list[dict] = []

    def insert_one(self, document: dict):
        from bson import ObjectId

        saved_document = {**document, "_id": ObjectId()}
        self.documents.append(saved_document)
        return type("InsertResult", (), {"inserted_id": saved_document["_id"]})()

    def _matches(self, document: dict, query: dict) -> bool:
        for key, value in query.items():
            if isinstance(value, dict) and "$regex" in value:
                current = document.get(key, "")
                if not isinstance(current, str):
                    return False
                import re
                if re.search(value["$regex"], current, re.IGNORECASE | (re.MULTILINE if value.get("$options") else 0)) is None:
                    return False
            else:
                if document.get(key) != value:
                    return False
        return True

    def count_documents(self, query: dict) -> int:
        return sum(1 for document in self.documents if self._matches(document, query))

    def find(self, query: dict):
        matches = [document for document in self.documents if self._matches(document, query)]

        class _Cursor:
            def __init__(self, items: list[dict]):
                self.items = items

            def sort(self, field: str, direction: int):
                self.items = sorted(self.items, key=lambda item: item.get(field, 0), reverse=direction > 0)
                return self

            def limit(self, count: int):
                self.items = self.items[:count]
                return self

            def skip(self, count: int):
                self.items = self.items[count:]
                return self

            def __iter__(self):
                return iter(self.items)

        return _Cursor(matches)

    def find_one(self, query: dict, projection: dict | None = None) -> dict | None:
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                return document
        return None

    def delete_one(self, query: dict):
        for index, document in enumerate(self.documents):
            if all(document.get(key) == value for key, value in query.items()):
                del self.documents[index]
                return type("DeleteResult", (), {"deleted_count": 1})()
        return type("DeleteResult", (), {"deleted_count": 0})()

    def update_one(self, query: dict, update: dict):
        for document in self.documents:
            if all(document.get(key) == value for key, value in query.items()):
                document.update(update.get("$set", {}))
                return type("UpdateResult", (), {"matched_count": 1, "modified_count": 1})()
        return type("UpdateResult", (), {"matched_count": 0, "modified_count": 0})()


@pytest.fixture
def evaluations() -> FakeEvaluationsCollection:
    return FakeEvaluationsCollection()


@pytest.fixture
def client(users: FakeUsersCollection, evaluations: FakeEvaluationsCollection):
    limiter.reset()
    app.dependency_overrides[get_users_collection] = lambda: users
    app.dependency_overrides[get_evaluations_collection] = lambda: evaluations
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    limiter.reset()