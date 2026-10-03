# AI Response Quality Evaluation Platform

A modular foundation for a human-led workspace to compare AI-generated responses. The platform currently provides a responsive application shell, JWT authentication, MongoDB user accounts, and health endpoints. Evaluators retain responsibility for all final decisions; AI evaluation, reports, and analytics are not implemented.

## Technology

- Frontend: React, Vite, JavaScript, Tailwind CSS v4, React Router, Axios, Lucide React
- Backend: Python, FastAPI, Pydantic Settings, PyMongo, bcrypt, PyJWT, SlowAPI, Uvicorn
- Database: MongoDB Atlas (required for registration and login; API can still start without it)

## Architecture

The frontend and backend run independently. React uses a centralized Axios client and auth context; private routes wait for `GET /api/auth/me` before rendering. Local Vite requests use a same-origin `/api` proxy. FastAPI reads configuration centrally, keeps one PyMongo client for the application lifespan, and stores normalized evaluator accounts in the `users` collection with a unique email index. Login issues a short-lived JWT in an HttpOnly cookie; passwords are bcrypt-hashed.

```text
frontend/
  src/
    components/       Shared navigation, feedback, form, and auth components
    context/          Frontend authentication state
    layouts/          Application shell
    pages/            Auth, profile, dashboard, and route placeholders
    routes/           React Router configuration and auth guards
    services/         Central Axios client
backend/
  app/
    api/routes/       Health and authentication endpoints
    core/             Settings, JWT/password security, rate limiter
    database/         MongoDB client lifecycle and health
    schemas/           Auth request and response validation
    services/          Registration and authentication logic
    main.py           FastAPI app, CORS, lifecycle, error handling
  tests/              Authentication and health tests
docs/                 Project architecture notes
```

## Requirements

- Node.js 20.19+ or 22.12+ (Vite 7 requirement) and npm
- Python 3.10+
- MongoDB Atlas account and network access for registration and login

## Configure environment

Copy the examples and fill in values for your environment:

```powershell
Copy-Item frontend/.env.example frontend/.env
Copy-Item backend/.env.example backend/.env
```

`frontend/.env`:

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | API base URL used by Axios; local Vite proxies `/api` | `/api` |

`backend/.env`:

| Variable | Purpose | Default |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string; leave empty to disable database checks | unset |
| `DATABASE_NAME` | MongoDB database name | `ai_response_quality` |
| `CORS_ORIGINS` | Comma-separated allowed browser origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `MONGODB_SERVER_SELECTION_TIMEOUT_MS` | Maximum wait for a MongoDB server selection | `3000` |
| `JWT_SECRET` | Secret used to sign access tokens; set a random value of at least 32 characters | required |
| `JWT_ACCESS_TOKEN_MINUTES` | Access-token lifetime in minutes | `30` |
| `AUTH_COOKIE_SECURE` | Add the Secure cookie flag; enable for HTTPS deployments | `false` locally |

Never commit populated `.env` files. `.gitignore` excludes them while keeping `.env.example` files tracked. Set a unique random `JWT_SECRET` in `backend/.env`; do not use a shared or checked-in value. Use `AUTH_COOKIE_SECURE=true` in HTTPS deployments.

## MongoDB Atlas

1. Create an Atlas cluster and database user.
2. Add your development IP address under **Network Access**.
3. Copy the application connection string from **Connect > Drivers**.
4. Set `MONGODB_URI` in `backend/.env`, replacing the username, password, and cluster placeholders. URL-encode special characters in credentials.
5. Keep `DATABASE_NAME=ai_response_quality` or choose another database name.
6. Set a random `JWT_SECRET` of at least 32 characters in `backend/.env`.

The app never returns the connection string or raw driver error details. Without a configured URI, the API runs normally and `/api/health/database` returns HTTP 503 with a safe status message; auth operations return 503 until MongoDB is reachable.

## Run locally

Open two terminals from the repository root.

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Vite proxies `/api` to the backend so the local HttpOnly cookie stays same-origin.

Backend, in a second terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

On macOS or Linux, activate with `source .venv/bin/activate`. The API runs at `http://localhost:8000`; interactive API documentation is at `http://localhost:8000/docs`.

## API health checks

```powershell
Invoke-RestMethod http://localhost:8000/api/health
Invoke-WebRequest http://localhost:8000/api/health/database
```

- `GET /api/health` returns HTTP 200 when the API process is running.
- `GET /api/health/database` returns HTTP 200 when MongoDB responds to `ping`, otherwise HTTP 503. A missing URI is reported as unavailable rather than as an API startup failure.
- CORS permits the local Vite origins listed in `CORS_ORIGINS`. Add any different frontend origin there as a comma-separated value.

## Frontend routes

- `/` Dashboard
- `/evaluations/new` New evaluation placeholder
- `/history` Evaluation history placeholder
- `/reports` Reports placeholder
- `/settings` Settings placeholder

The navigation and responsive application shell are functional. Evaluation workflows, AI suggestions, reports, and analytics remain out of scope.

## Authentication API

All endpoints are under `/api/auth`:

| Method and path | Authentication | Behavior |
| --- | --- | --- |
| `POST /register` | Public | Creates an evaluator account; returns `201`, or `409` for a duplicate email |
| `POST /login` | Public | Verifies credentials and sets the HttpOnly access-token cookie; invalid credentials return a generic `401` |
| `GET /me` | Required | Returns the authenticated user's ID, name, email, and creation time |
| `POST /logout` | Cookie optional | Clears the browser cookie |

Registration accepts `full_name`, `email`, `password`, and `confirm_password`. Passwords must be at least 12 characters and at most 72 UTF-8 bytes. Public registration always assigns the `evaluator` role. Protected UI routes include the dashboard, evaluation placeholders, reports, settings, and `/profile`; `/login` and `/register` redirect signed-in users to the dashboard.

The JWT is stored in an HttpOnly, SameSite=Lax cookie and is never written to localStorage. Logout clears that browser cookie, but JWTs are stateless: a copied token remains valid until its expiration. The default lifetime is 30 minutes. For deployment, use HTTPS with `AUTH_COOKIE_SECURE=true`, serve frontend/API on the same site (or configure an appropriate same-site cookie and CSRF strategy), and use a shared rate-limit store/reverse-proxy limit when running multiple API workers. The included SlowAPI in-memory limits are per-process.

## Run tests

```powershell
cd backend
python -m pip install -r requirements-dev.txt
python -m pytest -q
```

The tests use an in-memory user collection and do not create test accounts in Atlas. A real MongoDB connection is still needed for manual registration/login testing.