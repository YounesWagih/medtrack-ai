# MedTrack AI: Backend-First Medicine Tracking

MedTrack AI is a backend-focused MVP for managing medicines at home: tracking expiry dates, searching medicine details, and asking AI-assisted questions around the medicines a user already owns.

The frontend exists mainly to visualize the backend workflows. The core of the project is the API design, database model, validation, background jobs, AI safety flow, observability, caching, and tests.

## Why I Built This

The idea started from a normal home problem.

I had medicines at home, but when I needed something simple, like medicine for fever, I had to search through boxes, check names, check expiry dates, and sometimes Google unknown medicines. I wanted to automate that process for home use: add medicines once, know what is available, know what is expired or close to expiry, and search medicine information faster.

Then the project became more than a CRUD app. I used it as a serious backend playground to learn how production applications are observed: logs, metrics, traces, dashboards, background jobs, dependency monitoring, and the trade-offs behind each decision.

This is still an MVP, and because the real use case is personal and home-based, the next natural step is turning it into a mobile app.

## What The System Does

- Tracks medicines per user.
- Marks medicines as `ACTIVE`, `EXPIRING_SOON`, `EXPIRED`, or `REMOVED`.
- Searches medicine information using an external API from a large Egyptian pharmacy.
- Caches medicine details in Redis.
- Provides an AI chat assistant using OpenRouter with a configurable model.
- Adds safety questions before discussing medicine usage or dosage.
- Runs a cron job to sync medicine expiry statuses.
- Exposes logs, metrics, and traces through a local observability stack.

> This project is not medical advice. The AI flow is designed as a helper around stored medicine context, not a replacement for doctors, pharmacists, or official medication instructions.

## Backend Is The Main Project

The backend is built with TypeScript, Express, Prisma, PostgreSQL, Redis, OpenRouter, Prometheus metrics, OpenTelemetry tracing, and structured logging.

The shape is intentionally simple and production-minded:

```text
Request
  -> Middleware
  -> Route
  -> Controller
  -> Service
  -> Repository
  -> PostgreSQL / Redis / External APIs
```

The frontend was built with AI assistance to demonstrate and test the backend ideas visually. It is useful for showing the flows, but the backend is the part I designed, studied, and optimized deeply.

## Backend Features

### API And Data

- Express 5 API under `/api/v1`.
- PostgreSQL database managed with Prisma.
- Repository/service/controller separation.
- Zod request validation.
- JWT authentication.
- Argon2 password hashing.
- Soft remove for medicines using `REMOVED` status.
- Offset pagination for medicine lists.
- Filtering and sorting by medicine status, name, and expiry date.

I chose offset pagination because this is a home medicine tracker, not a pharmacy inventory system. The expected number of medicines is small, so offset pagination keeps the API simpler and fits the actual product.

### Medicine Search

At first, I considered web scraping. Then I found an open API from a major Egyptian pharmacy, so the project uses that instead.

The backend wraps the external API behind a client and service layer, then maps the external response into application-owned schemas. Details responses are cached in Redis because medicine information does not need to be fetched repeatedly on every request.

### AI Chat

The AI chat uses OpenRouter. The model is configurable through environment variables, and the project is designed around the idea that users can bring their own API key.

Current MVP behavior:

- The user creates a chat session.
- Each message includes previous session messages.
- The backend adds the user's medicine context.
- The LLM response is parsed into a structured response shape.
- Medical recommendation-like prompts trigger safety questions first.

I know sending the full chat history on every request is not ideal at scale. For an MVP it is simple and understandable. A future version can store a rolling session summary to reduce context size while keeping the conversation useful.

## Observability

One of the biggest goals of this project was learning observability from the backend developer side.

I wanted to understand the full picture:

- What should be logged?
- What should become a metric?
- When are traces useful?
- How do production Node.js apps apply these ideas?
- What are the trade-offs between tools like the Grafana stack and the Elasticsearch stack?
- How can bad observability decisions create new problems?

For example, Prometheus creates time series for each variation of metric labels. That means unbounded labels can quietly create huge storage problems. Learning details like that changed how I think about metrics.

### Observability Stack

The local stack runs through Docker Compose:

- Grafana for dashboards.
- Prometheus for metrics.
- Loki for logs.
- Tempo for traces.
- Alloy for collection and forwarding.
- PostgreSQL and Redis exporters.

The backend exposes:

- HTTP request count, duration, and in-flight requests.
- External dependency request metrics.
- Redis/cache metrics.
- Workflow operation metrics.
- AI chat metrics.
- Background job metrics.
- Rate limit rejection metrics.
- Notification attempt metrics.

Tracing is handled with OpenTelemetry, and logs are structured with request/job context so one request can be followed across the backend.

## Cron Job Story

The medicine expiry job started simple:

1. Find medicines that are expired or expiring soon.
2. Loop over them.
3. Calculate the current status.
4. Update each medicine one by one.

That worked, but it was not the best version.

The first optimization was to avoid updating one row at a time. Instead of fetching a mixed set of medicines and calculating each new state in application code, the query can be split by meaning: one query for expired medicines and one query for expiring-soon medicines. If a medicine appears in the expired query, the new state is already known.

Then I pushed the idea further: why fetch rows, calculate statuses, update rows, and then fetch updated data again if the database can do the status transition directly?

The final version delegates the sync to PostgreSQL using raw SQL with `RETURNING`. Prisma `updateMany` returns only the affected count, but PostgreSQL can return the updated rows. That gives the job both efficiency and the data needed for notifications and observability.

## Main API Areas

Base path:

```text
/api/v1
```

### Auth

```text
POST /auth/register
POST /auth/login
```

### Medicines

```text
POST  /medicines
GET   /medicines
GET   /medicines/:id
PATCH /medicines/:id
PATCH /medicines/:id/remove
POST  /medicines/search
GET   /medicines/details/:slug
```

### Chat

```text
POST   /chat/sessions
GET    /chat/sessions
POST   /chat/sessions/:id/messages
GET    /chat/sessions/:id/messages
DELETE /chat/sessions/:id
```

### Health

```text
GET /health
```

## Database Model

The main entities are:

- `User`
- `Medicine`
- `ChatSession`
- `ChatMessage`

Important design points:

- Medicines belong to users.
- Chat sessions belong to users.
- Chat messages belong to sessions.
- User deletion cascades to medicines and chat sessions.
- Medicine indexes support filtering, sorting, and the expiry cron job.

## Tech Stack

### Backend

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL
- Redis
- Zod
- JWT
- Argon2
- OpenRouter
- OpenTelemetry
- Prometheus client
- Pino
- Node Cron

### Observability

- Grafana
- Prometheus
- Loki
- Tempo
- Alloy
- PostgreSQL exporter
- Redis exporter

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

The frontend is included to make the backend workflows visible, not to be the main focus of the project.

## Running Locally

### Backend Only

```bash
cd backend
npm install
npm run generate
npm run db:migrate
npm run dev
```

The backend runs on:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

Metrics server:

```text
http://localhost:9464/metrics
```

### Full Observability Stack

From the project root:

```bash
docker compose -f docker-compose.loki.yml up --build
```

Useful local ports:

```text
Backend:    http://localhost:3000
Grafana:    http://localhost:3001
Prometheus: http://localhost:9090
Loki:       http://localhost:3100
Tempo:      http://localhost:3200
Alloy:      http://localhost:12345
```

## Environment Variables

The backend validates environment variables at startup and fails fast if required config is missing.

Common variables:

```env
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://user:password@localhost:5432/medicine_db
JWT_SECRET=replace-with-at-least-32-characters
JWT_EXPIRES_IN=7d
OPENROUTER_API_KEY=your-openrouter-key
MODEL_NAME=your-selected-model
REDIS_URL=redis://localhost:6379
MEDICINE_EXPIRING_SOON_DAYS=30
MEDICINE_EXPIRY_CRON=0 0 * * *
MEDICINE_EXPIRY_CRON_TIMEZONE=UTC
METRICS_ENABLED=true
METRICS_PORT=9464
TRACING_ENABLED=true
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

## Testing

```bash
cd backend
npm test
```

The test suite covers important backend behavior, including:

- authentication
- environment validation
- database access
- repositories
- medicine expiry job behavior
- external medicine API client behavior
- AI response parsing
- medical safety gate
- rate limiting
- metrics
- tracing

## Project Status

This is an MVP.

The backend is the strongest and most important part of the project. The frontend is a working visualization layer. The next product direction is a mobile app because the project is meant for home use, where checking medicines from a phone makes more sense than opening a desktop web app.

## What I Learned

This project helped me move from "I know what observability means" to "I understand how it starts showing up in real backend decisions."

I learned how logs, metrics, and traces answer different questions. I learned why metric labels need discipline. I learned how background jobs should be measured. I learned that every tool choice has a cost, even when the tool is good. I also practiced backend decisions outside observability, like pagination strategy, LLM context handling, caching, external API boundaries, and when raw SQL is the right tool.

The most valuable lesson was that production thinking is not one feature. It is many small decisions that make the system easier to understand when something goes wrong.
