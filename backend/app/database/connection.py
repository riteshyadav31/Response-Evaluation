import logging

from pymongo import MongoClient
from pymongo.errors import PyMongoError

from app.core.config import settings

logger = logging.getLogger(__name__)


class MongoDBConnection:
    def __init__(self) -> None:
        self.client: MongoClient | None = None
        self._initialization_failed = False

    def connect(self) -> None:
        if not settings.mongodb_uri:
            logger.info("MongoDB URI is not configured; database features are unavailable.")
            return

        try:
            self.client = MongoClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
                appname="ai-response-quality-platform",
            )
        except (PyMongoError, ValueError):
            self._initialization_failed = True
            logger.exception("Could not initialize the MongoDB client.")

    def check(self) -> tuple[bool, str]:
        if not settings.mongodb_uri:
            return False, "MongoDB is not configured."
        if self._initialization_failed or self.client is None:
            return False, "MongoDB is unavailable. Check the server configuration and connectivity."

        try:
            self.client.admin.command("ping")
            return True, "MongoDB connection is available."
        except PyMongoError:
            logger.exception("MongoDB health check failed.")
            return False, "MongoDB is unavailable. Check the server configuration and connectivity."

    def ensure_user_indexes(self) -> None:
        if self.client is None:
            return
        try:
            self.client[settings.database_name]["users"].create_index(
                "email",
                unique=True,
                name="users_email_unique",
            )
        except PyMongoError:
            logger.exception("Could not ensure the users email index.")

    def ensure_evaluation_indexes(self) -> None:
        if self.client is None:
            return
        collection = self.client[settings.database_name]["evaluations"]
        try:
            collection.create_index(
                [("user_id", 1), ("created_at", -1)],
                name="evaluations_user_created_idx",
            )
            collection.create_index(
                [("user_id", 1), ("status", 1)],
                name="evaluations_user_status_idx",
            )
        except PyMongoError:
            logger.exception("Could not ensure the evaluation indexes.")

    def close(self) -> None:
        if self.client is not None:
            self.client.close()
            self.client = None


mongodb = MongoDBConnection()