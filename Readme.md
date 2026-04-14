# Civic Saathi Monorepo

Role-based civic issue reporting and resolution platform with:

- Spring Boot backend (`backend/`)
- React Native mobile app (`mobile-app/`)
- React + Vite web dashboard (`web-dashboard/`)
- Docker-based local infrastructure (`infra/`)

## Repository Layout

```text
backend/         Spring Boot APIs and domain modules
mobile-app/      Citizen and worker mobile application
web-dashboard/   Admin and department dashboard
docs/            Product, workflow, architecture and roadmap docs
infra/           Docker Compose and container build files
```

## Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 18+
- npm 9+
- Docker Desktop (optional but recommended)

## Local Setup

### 1. Backend (Spring Boot)

```powershell
cd backend
copy .env.example .env
.\mvnw.cmd spring-boot:run
```

If your shell already has Maven on PATH, `mvn spring-boot:run` also works.

Backend runs on `http://localhost:8080` by default.

### 2. Mobile App (React Native + Expo)

```powershell
cd mobile-app
copy .env.example .env
npm install
npm run start
```

Use Expo dev tools for Android/iOS launch.

### 3. Web Dashboard (React + Vite)

```powershell
cd web-dashboard
copy .env.example .env
npm install
npm run dev
```

Dashboard runs on `http://localhost:5173` by default.

## Docker Setup

To run backend + PostgreSQL together:

```powershell
cd infra
docker compose up --build
```

Services:

- PostgreSQL + PostGIS: `localhost:5432`
- Backend API: `localhost:8080`

## Documentation

Primary architecture and planning docs are in `docs/`:

- `00_Project_Context.md`
- `01_Roles_Workflows_RBAC.md`
- `02_Features_Modules.md`
- `03_Technical_Architecture.md`
- `04_Data_API_Design_Guidelines.md`
- `05_Roadmap_and_Build_Order.md`

## Notes

- This repository is structured as a modular monolith at the backend level.
- AI, advanced analytics and scaling components are intentionally staged behind core workflow completion.
- Backend Maven Wrapper is included (`backend/mvnw` and `backend/mvnw.cmd`) so teammates can build/run without local Maven PATH setup.
