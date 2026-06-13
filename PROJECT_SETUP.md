# Civic Saathi Project Setup Guide

This guide provides an end-to-end setup for the Civic Saathi monorepo on a fresh machine.

## 1. Project Overview

Repository components:

- `backend/`: Spring Boot 3.3 backend (Java 17, Maven Wrapper)
- `mobile-app/`: Expo + React Native TypeScript app
- `web-dashboard/`: React + Vite + TypeScript admin dashboard
- `infra/`: Docker Compose setup for PostgreSQL/PostGIS and backend
- `db/`: SQL schema reference
- `docs/`: architecture and product documentation

## 2. Prerequisites

Install the following tools:

- Git
- Java 17 (JDK)
- Node.js 18+ and npm 9+
- Docker Desktop (recommended)

Recommended checks (PowerShell):

```powershell
git --version
java -version
node -v
npm -v
docker --version
docker compose version
```

## 3. Clone And Enter Repository

```powershell
git clone <your-repo-url>
cd Civic-Saathi
```

## 4. Environment Configuration

Environment strategy:

- Shared root env file for backend, web dashboard, and Docker infra: `.env`
- Mobile app uses its own env file because Expo reads env files from app root: `mobile-app/.env`

Initialize env files from templates:

```powershell
copy .env.example .env
cd mobile-app
copy .env.example .env
cd ..
```

### 4.1 Shared Root Environment (`.env`)

Used by:

- Backend Spring Boot app
- Web dashboard (Vite `envDir` points to repo root)
- Docker Compose services in `infra/`

Root `.env` keys:

```powershell
SERVER_PORT=8080
DB_URL=jdbc:postgresql://localhost:5432/Civic
DB_USERNAME=postgres
DB_PASSWORD=root
JPA_DDL_AUTO=update
POSTGRES_DB=Civic
POSTGRES_USER=postgres
POSTGRES_PASSWORD=root
VITE_API_URL=http://localhost:8080/api/v1
VITE_API_TIMEOUT=30000
```

Backend fallback defaults if values are not set:

- `SERVER_PORT=8080`
- `DB_URL=jdbc:postgresql://localhost:5432/Civic`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=root`
- `JPA_DDL_AUTO=update`

### 4.2 Mobile App Environment

Mobile app uses `mobile-app/.env` (separate from root):

```powershell
cd mobile-app
copy .env.example .env
```

Used variables:

- `EXPO_PUBLIC_API_URL` (default fallback: `http://localhost:8080/api/v1`)
- `EXPO_PUBLIC_API_TIMEOUT`

Example `.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1
EXPO_PUBLIC_API_TIMEOUT=30000
```

### 4.3 Web Dashboard Environment

Web dashboard reads from root `.env` via Vite `envDir` configuration.

Example `.env`:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_API_TIMEOUT=30000
```

### 4.4 Infrastructure Environment

Docker Compose uses root `.env` through `env_file: ../.env` in `infra/docker-compose.yml`.

## 5. Database Setup Options

### Option A: Docker (recommended)

From repository root:

```powershell
cd infra
docker compose up -d postgres
```

This starts PostgreSQL/PostGIS with:

- Host: `localhost`
- Port: `5432`
- Database: `Civic`
- User: `postgres`
- Password: `root`

`infra/docker/init.sql` enables extensions (`postgis`, `uuid-ossp`, and best-effort `vector`).

### Option B: Existing Local/Postgres Server

If using your own PostgreSQL instance:

1. Create database `Civic` (or update `DB_URL` in root `.env`).
2. Apply `db/schema.sql` manually if needed.
3. Point backend to your connection details via environment variables.

## 6. Run Backend

From repo root:

```powershell
cd backend
.\mvnw.cmd clean spring-boot:run
```
.\mvnw.cmd spring-boot:run

Backend URL:

- `http://localhost:8080`

Health endpoint:

- `http://localhost:8080/actuator/health`

## 7. Run Web Dashboard

From repo root:

```powershell
cd web-dashboard
npm install
npm run dev
```

Dashboard URL:

- `http://localhost:5173`

## 8. Run Mobile App (Expo)

From repo root:

```powershell
cd mobile-app
npm install
npm run start
```

Then launch on emulator/device using Expo UI or run:

```powershell
npm run android
```

For iOS (macOS only):

```powershell
npm run ios
```

## 9. Full Docker Stack (Backend + DB)

If you want backend and database both in Docker:

```powershell
cd infra
docker compose up --build
```

Services:

- Backend: `http://localhost:8080`
- Postgres: `localhost:5432`

Stop services:

```powershell
docker compose down
```

Stop and remove volumes:

```powershell
docker compose down -v
```

## 10. Validation Checklist

After setup, verify all layers:

1. Postgres container is healthy (`docker ps`).
2. Backend health endpoint returns `UP`.
3. Web dashboard loads at `localhost:5173` without API base URL errors.
4. Mobile app starts in Expo and can hit backend API URL.

## 11. Common Troubleshooting

- Port conflict on 5432/8080/5173:
  - Stop conflicting process or change exposed ports/environment variables.
- Backend cannot connect to DB:
  - Confirm DB container is healthy and `DB_URL` points to correct host/port.
- Mobile app cannot reach localhost backend from physical device:
  - Replace localhost with your machine's LAN IP in `EXPO_PUBLIC_API_URL`.
- Dashboard API timeout or 404:
  - Verify `VITE_API_URL` and backend route prefix (`/api/v1`) alignment.

## 12. Useful Project Commands

Backend:

```powershell
cd backend
.\mvnw.cmd test
.\mvnw.cmd clean package
```

Web Dashboard:

```powershell
cd web-dashboard
npm run typecheck
npm run build
```

Mobile App:

```powershell
cd mobile-app
npm run typecheck
npm run lint
```

## 13. Suggested Setup Order

1. Start database (Docker postgres service).
2. Start backend and confirm health.
3. Start web dashboard.
4. Start mobile app.

This order ensures API consumers (web/mobile) can connect to an already running backend.