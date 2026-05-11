# Civic Saathi 🏙️

A role-based civic issue reporting and resolution platform connecting citizens with government departments and field workers.

## Platform Overview

| Layer | Technology | Status |
|---|---|---|
| Backend API | Spring Boot 3.3.6 + Java 17 | ✅ Production Ready |
| Mobile App | React Native 0.81.5 + Expo 54 | ✅ Level A–C Complete |
| Web Dashboard | React 18 + Vite + TypeScript | ✅ Level A–C Complete |
| Database | PostgreSQL 16 + PostGIS 3.4 + pgvector | ✅ 26 tables |
| AI Layer | Cerebras LLM + Rule-based fallback | ✅ Functional |

## Features Implemented

### Level A — Core Workflow ✅
- JWT authentication with role-based access (Citizen, Worker, Officer, Admin)
- Complaint creation with images, voice notes, and GPS location
- Auto-assignment and manual assignment to workers
- Full complaint lifecycle (15 states: SUBMITTED → CLOSED)
- Real-time notifications
- Role-specific dashboards
- Comprehensive audit logging

### Level B — Operational Hardening ✅
- SLA deadline tracking with auto-escalation
- Feedback and star ratings for resolved complaints
- Reopen request workflow with officer approval
- Duplicate detection and linking
- Department and worker management with availability toggle
- Real analytics from live database queries

### Level C — AI Intelligence ✅
- AI complaint classification (6 categories, rule-based + optional LLM)
- Duplicate detection using text similarity (Jaccard)
- AI-generated dashboard insights
- Priority scoring and resolution time prediction
- Ward-level heatmap analytics
- Department performance ranking

## Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- Docker Desktop

### 1. Clone and configure

```bash
git clone https://github.com/divyansh357/Civic-Saathi.git
cd Civic-Saathi
cp .env.example .env
# Edit .env with your values
```

### 2. Start the database

```bash
cd infra
docker compose up -d postgres
```

Wait for the health check to pass, then apply the schema:

```bash
# Connect to the running container and apply schema
docker exec -i civic_postgres psql -U postgres -d Civic < ../db/schema.sql
```

### 3. Start the backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
# API available at http://localhost:8080
```

### 4. Start the web dashboard

```powershell
cd web-dashboard
npm install
npm run dev
# Dashboard at http://localhost:5173
```

### 5. Start the mobile app

```powershell
cd mobile-app
npm install
npm run start
# Scan QR code with Expo Go app
```

## Docker (Full Stack)

```bash
cd infra
docker compose up --build
```

## Production Deployment

```bash
cd infra
docker compose -f docker-compose.prod.yml up --build -d
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description | Required |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC URL | ✅ |
| `DB_USERNAME` | Database username | ✅ |
| `DB_PASSWORD` | Database password | ✅ |
| `JWT_SECRET` | JWT signing secret (32+ chars) | ✅ |
| `CEREBRAS_API_KEY` | Cerebras LLM API key | Optional |
| `VITE_API_URL` | Backend URL for web dashboard | ✅ |

## API Reference

Base URL: `http://localhost:8080/api/v1`

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate tokens |
| GET | `/auth/me` | Get current user |

### Complaints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/complaints` | List all (officer/admin) |
| GET | `/complaints/public` | Public complaints (no auth) |
| GET | `/complaints/search?q=` | Search by keyword |
| POST | `/complaints` | Create complaint |
| GET | `/complaints/{id}` | Get by ID |
| PUT | `/complaints/{id}/status` | Update status |
| POST | `/complaints/{id}/escalate` | Escalate complaint |
| GET | `/complaints/{id}/comments` | Get comments |
| POST | `/complaints/{id}/comments` | Add comment |
| POST | `/complaints/{id}/vote` | Toggle support vote |

### Assignments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/assignments` | All assignments |
| POST | `/assignments/auto-assign` | Auto-assign complaint |
| POST | `/assignments/manual-assign` | Manual assignment |
| POST | `/assignments/{id}/acknowledge` | Worker acknowledges |
| POST | `/assignments/{id}/start` | Worker starts work |
| POST | `/assignments/{id}/complete` | Worker completes |
| POST | `/assignments/{id}/reject` | Worker rejects |
| GET | `/assignments/overdue` | SLA-breached assignments |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/classify` | Classify complaint category |
| GET | `/ai/summary/{id}` | Generate complaint summary |
| GET | `/ai/insights` | Dashboard AI insights |
| POST | `/ai/duplicate-check` | Check for duplicates |
| GET | `/ai/predict-resolution?category=` | Predict resolution time |
| GET | `/ai/status` | AI provider status |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics/dashboard` | Full dashboard metrics |
| GET | `/analytics/heatmap` | Ward-level complaint heatmap |
| GET | `/analytics/departments/ranking` | Department performance ranking |
| GET | `/analytics/resolution-time` | Resolution time analytics |

## Architecture

```
Civic-Saathi/
├── backend/          # Spring Boot modular monolith
│   └── src/main/java/com/civic/
│       ├── modules/  # Domain modules (auth, complaint, assignment, ...)
│       ├── config/   # Security, WebSocket configuration
│       └── infrastructure/  # AI, storage, messaging clients
├── mobile-app/       # React Native + Expo
│   └── src/
│       ├── screens/  # citizen/, worker/ screens
│       ├── services/ # API client, notifications
│       └── store/    # Zustand state management
├── web-dashboard/    # React + Vite admin dashboard
│   └── src/
│       ├── pages/    # Dashboard, Complaints, Assignments, ...
│       └── store/    # Auth, complaint, notification stores
├── db/               # PostgreSQL schema and migration scripts
└── infra/            # Docker Compose (dev + prod)
```

## User Roles

| Role | Access |
|---|---|
| **Citizen** | Submit complaints, track status, give feedback, request reopen |
| **Worker** | View assigned tasks, accept/complete/reject, update progress |
| **Officer** | Assign complaints, manage workers, approve reopens, view analytics |
| **Admin** | Full system access, user management, configuration |

## Tech Stack

- **Backend**: Spring Boot 3.3.6, Spring Security, Spring Data JPA, Hibernate Spatial
- **Database**: PostgreSQL 16, PostGIS 3.4, pgvector
- **Auth**: JWT (jjwt 0.12.6), BCrypt
- **Mobile**: React Native 0.81.5, Expo 54, TypeScript, Zustand, Axios
- **Web**: React 18, Vite, TypeScript, Recharts, Zustand
- **AI**: Cerebras LLM API (optional), rule-based fallback
- **Infrastructure**: Docker, Docker Compose

---

Built with ❤️ for civic governance
