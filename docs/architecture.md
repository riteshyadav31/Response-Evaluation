# Architecture Notes

## Runtime boundaries

The React application owns navigation, presentation, and user interaction. The FastAPI application owns HTTP handling, configuration, and database connectivity. The frontend communicates through the centralized Axios instance; the backend exposes versionable API routes below `/api`.

## Backend lifecycle

Settings are read once from environment variables. FastAPI lifespan initialization creates a reusable PyMongo client when `MONGODB_URI` is present and closes it during shutdown. The database health route sends a `ping` and returns a sanitized status; network failures do not disclose driver exception details or connection credentials.

## Authentication boundary

Registration validates and normalizes email, stores only a bcrypt password hash, and assigns the `evaluator` role on the server. MongoDB enforces a unique index on normalized email. Login uses generic credential errors, rate limits auth endpoints, and issues an HS256 JWT whose subject is the MongoDB ObjectId. The JWT is held in an HttpOnly, SameSite=Lax cookie; the frontend validates it with `/api/auth/me` after refresh and does not trust client-provided roles.

Logout removes the browser cookie but does not revoke a copied stateless token; it remains usable until expiry. The local SlowAPI memory store is per process. Production deployments should use HTTPS with Secure cookies, a shared rate-limit store or edge limits, and same-site frontend/API hosting or an explicit CSRF strategy for cross-site cookies.

## User document

The `users` collection stores `_id` (ObjectId), `full_name`, normalized `email`, `hashed_password`, `role`, `is_active`, `created_at`, and `updated_at`. API response schemas deliberately omit the password hash and other authentication material.

## Human decision boundary

The platform is designed to support human evaluation. Future AI assistance must remain advisory, and the human evaluator must retain control of the final preference and rationale. This module does not implement those workflows.