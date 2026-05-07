# HireFlow — Microservices Hiring Platform

A production-shaped hiring platform built with event-driven microservices architecture. Every architectural decision in this project was made deliberately — not just to use microservices, but to understand the trade-offs behind each pattern.

---

## Architecture Overview

```
                        ┌─────────────────┐
                        │   Client App    │
                        └────────┬────────┘
                                 │ HTTP
                        ┌────────▼────────┐
                        │   API Gateway   │  ← single entry point
                        │   port: 3000    │    JWT auth, roles, rate limiting
                        └────────┬────────┘
                                 │
          ┌──────────┬───────────┼───────────┬──────────┐
          │          │           │           │          │
    ┌─────▼────┐ ┌───▼────┐ ┌───▼──────┐ ┌──▼───────┐  │
    │   Auth   │ │  Jobs  │ │  Apply   │ │Interview │  │
    │ port:3001│ │port:3002│ │port:3003 │ │port:3004 │  │
    └─────┬────┘ └───┬────┘ └───┬──────┘ └──┬───────┘  │
          │          │          │            │          │
        Auth DB   Jobs DB   Apply DB   Interview DB     │
                                                        │
                        ┌───────────────────────────────▼──┐
                        │           RabbitMQ                │
                        │      hireflow.exchange            │
                        └───────────────────────────────┬──┘
                                                        │
                                              ┌─────────▼────────┐
                                              │  Notifications   │
                                              │  (no HTTP port)  │
                                              │  broker only     │
                                              └──────────────────┘
```

---

## Services

| Service | Port | Database | Responsibility |
|---|---|---|---|
| API Gateway | 3000 | — | Single entry point, JWT auth, rate limiting |
| Auth Service | 3001 | PostgreSQL :5433 | Register, login, JWT issuance |
| Jobs Service | 3002 | PostgreSQL :5434 | Job posting and search (CQRS) |
| Applications Service | 3003 | PostgreSQL :5435 | Apply to jobs, Saga orchestration |
| Interviews Service | 3004 | PostgreSQL :5436 | Schedule interviews |
| Notifications Service | 3005 | — | Pure event consumer, emails |

---

## Key Architectural Decisions

### Why microservices?
Each service deploys, scales, and fails independently. A slow Notifications Service never affects job search. A Jobs Service deployment never requires restarting Auth.

### Why RabbitMQ?
Direct HTTP calls between services create runtime coupling — if Notifications is down, candidates can't apply. RabbitMQ decouples services so each operates independently. Events are consumed whenever the service is ready, not immediately.

### Why local JWT verification?
Originally Jobs Service called Auth Service over HTTP to verify tokens. This meant Jobs could not function if Auth was down. Local verification using the shared JWT_SECRET removes this runtime dependency entirely.

### Why CQRS in Jobs Service?
Reads and writes have different requirements. Job search (read) needs to be fast and return lightweight data. Job creation (write) needs careful validation. CQRS separates them so each can be optimized independently without affecting the other.

### Why the Saga pattern?
When a candidate applies, two things must happen: save the application and update the job's applicant count. These happen in two separate services with two separate databases — a single SQL transaction is impossible. The Saga pattern publishes a compensation event if any step fails, restoring data consistency without blocking the candidate's request.

### Why Correlation IDs?
A single request touches five services and produces five separate log streams. Without a shared identifier, debugging is impossible at scale. Every request gets a UUID at the Gateway that travels through every service and every RabbitMQ event, so filtering logs by one ID shows the complete story of any request.

---

## Patterns Used

| Pattern | Where | Why |
|---|---|---|
| API Gateway | Gateway Service | Single entry point, centralized auth |
| Local JWT Verification | All services | Remove Auth runtime dependency |
| Event-driven Architecture | RabbitMQ | Async decoupling between services |
| Saga (choreography) | Applications → Jobs → Notifications | Distributed consistency without shared DB |
| CQRS | Jobs Service | Separate read/write concerns |
| Data Denormalization | Applications, Interviews | Avoid cross-service DB queries |
| Correlation IDs | All services | Full request tracing across services |
| Dead Letter Queue | RabbitMQ | Safe retry with failure handling |

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: NestJS (TypeScript)
- **Databases**: PostgreSQL + TypeORM
- **Message Broker**: RabbitMQ
- **Containerization**: Docker + Docker Compose
- **Authentication**: JWT (local verification)
- **Architecture**: Microservices, Event-driven

---

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+

### Run the entire system with one command

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/hireflow.git
cd hireflow

# Start everything
docker-compose up --build
```

That's it. Docker Compose will:
1. Start RabbitMQ and wait until healthy
2. Start all four PostgreSQL databases and wait until healthy
3. Start all six services in the correct order

### Verify everything is running

```bash
# Check all containers
docker-compose ps

# All should show "Up" and "healthy"
```

### RabbitMQ Management UI

Open [http://localhost:15672](http://localhost:15672)

```
Username: hireflow
Password: hireflow_pass
```

You can see exchanges, queues, and messages flowing in real time.

---

## API Reference

All requests go through the Gateway on port **3000**. No other ports are exposed publicly.

### Auth

```
POST /auth/register    Register a new user
POST /auth/login       Login and receive JWT token
```

### Jobs

```
GET  /jobs             Browse all active jobs (public)
GET  /jobs/:id         Get a single job (public)
POST /jobs             Post a job (recruiter only)
```

### Applications

```
POST /applications     Apply to a job (candidate only)
GET  /applications/my  View my applications (candidate only)
```

### Interviews

```
POST /interviews       Schedule an interview (recruiter only)
GET  /interviews/my    View my interviews (recruiter only)
```

---

## The Complete Hiring Flow

```
1. Recruiter registers and posts a job
         ↓
2. Candidate browses jobs and applies
         ↓
3. Applications Service saves application
   → publishes application.created to RabbitMQ
         ↓
4. Jobs Service consumes application.created
   → updates applicant count
   → publishes applicant.count.updated
         ↓
5. Notifications Service consumes applicant.count.updated
   → emails recruiter: "New application received"
         ↓
6. Recruiter reviews and schedules interview
   → publishes interview.scheduled to RabbitMQ
         ↓
7. Notifications Service consumes interview.scheduled
   → emails candidate: "Interview scheduled"
```

If any step fails — a compensation event flows backward to restore data consistency. The candidate's request is never affected.

---

## Debugging with Correlation IDs

Every response from the Gateway includes an `x-correlation-id` header. To trace any request across all services:

1. Open browser DevTools → Network tab
2. Find the request → copy `x-correlation-id` header value
3. Search all service logs for that ID
4. See the complete journey of that request across all services

```
[abc-123] Gateway: POST /applications received
[abc-123] Applications: application #4 saved ✅
[abc-123] Jobs: applicant count updated ✅
[abc-123] Notifications: email sent to recruiter ✅
```

---

## Project Structure

```
hireflow/
├── apps/
│   ├── gateway/          ← API Gateway
│   ├── auth/             ← Auth Service
│   ├── jobs/             ← Jobs Service (CQRS)
│   ├── applications/     ← Applications Service (Saga)
│   ├── interviews/       ← Interviews Service
│   └── notifications/    ← Notifications Service (broker only)
├── libs/
│   └── common/           ← Shared: Role enum, UserPayload, CorrelationLogger
├── docker-compose.yml
└── nest-cli.json
```

---

## Key Learning from This Project

Microservices is not an upgrade from monolith — it is a trade-off.

The goal is never to eliminate all coupling. The goal is to eliminate coupling that has no real business reason. Some coupling is unavoidable because the business requires it. What microservices gives you is the ability to identify which coupling is necessary and which is accidental — and remove the accidental kind.

---

## License

MIT
