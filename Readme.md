# Civic Saathi - Civic Issue Reporting & Resolution Platform

A comprehensive role-based civic issue reporting and resolution platform that connects citizens with government departments and workers to efficiently handle civic complaints and issues.

## 🏗️ Tech Stack

### Backend
- **Java 17** with **Spring Boot 3.3.6**
- **PostgreSQL 16** with **PostGIS 3.4** (spatial data)
- **pgvector** (AI/ML vector operations)
- **Hibernate Spatial** (geospatial data handling)
- **JWT (jjwt 0.12.6)** (token-based authentication)
- **Maven** (build system and dependency management)

### Frontend
- **React Native 0.81.5 + Expo 54.0** (mobile app)
- **React 18.3 + Vite** (web dashboard)
- **TypeScript** (type safety)
- **Zustand** (state management)
- **Axios** (HTTP client)

### Infrastructure
- **Docker Compose** (local development orchestration)
- **PostgreSQL + PostGIS** (database with spatial extensions)

## 📁 Repository Structure

```text
Civic-Saathi/           # Monorepo root
├── backend/            # Spring Boot API server
├── mobile-app/         # React Native + Expo mobile app
├── web-dashboard/      # React + Vite admin dashboard
├── docs/               # Architecture and planning documentation
├── infra/              # Docker Compose and container configs
├── db/                 # Database schema and scripts
├── .env                # Shared environment variables
└── .env.example        # Environment template
```

## 🚀 Prerequisites

- **Java 17+** (OpenJDK or Oracle JDK)
- **Maven 3.9+** (or use included wrapper)
- **Node.js 18+** and **npm 9+**
- **Docker Desktop** (recommended for local development)

## ⚙️ Environment Setup

### 1. Environment Variables

Create environment files from examples:

```powershell
# Root environment (backend, web dashboard, Docker)
copy .env.example .env

# Mobile app environment (Expo-specific)
cd mobile-app
copy .env.example .env
cd ..
```

### 2. Required Environment Variables

**Root `.env` file:**
```env
# Server Configuration
SERVER_PORT=8080
JWT_SECRET=your-jwt-secret-key-min-32-chars

# Database Configuration
DB_URL=jdbc:postgresql://localhost:5432/civic_saathi
DB_USERNAME=postgres
DB_PASSWORD=your-password
JPA_DDL_AUTO=update

# PostgreSQL Docker Configuration
POSTGRES_DB=civic_saathi
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password

# Frontend Configuration
VITE_API_URL=http://localhost:8080/api/v1
VITE_API_TIMEOUT=30000
```

**Mobile `.env` file:**
```env
EXPO_PUBLIC_API_URL=http://localhost:8080/api/v1
EXPO_PUBLIC_API_TIMEOUT=30000
```

## 🐳 Quick Start with Docker

### 1. Start Infrastructure Services

```powershell
cd infra
docker compose up --build
```

This starts:
- PostgreSQL 16 + PostGIS 3.4 on `localhost:5432`
- Complete database schema with 25+ tables
- All extensions: postgis, pgcrypto, uuid-ossp

### 2. Start Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

**Backend runs on:** `http://localhost:8080`  
**API base path:** `http://localhost:8080/api/v1`

### 3. Verify Setup

```powershell
# Check database
docker exec civic_postgres psql -U postgres -d civic_saathi -c "SELECT version();"

# Check backend health
curl http://localhost:8080/actuator/health
```

## 🛠️ Development Commands

### Backend (Spring Boot)

```powershell
cd backend

# Start development server
.\mvnw.cmd spring-boot:run

# Run tests
.\mvnw.cmd test

# Build JAR
.\mvnw.cmd clean package

# Build Docker image
.\mvnw.cmd spring-boot:build-image
```

### Web Dashboard (React + Vite)

```powershell
cd web-dashboard

# Install dependencies
npm install

# Start dev server (localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking and linting
npm run typecheck
npm run lint
```

### Mobile App (React Native + Expo)

```powershell
cd mobile-app

# Install dependencies
npm install

# Start Expo dev server
npm run start

# Run on specific platforms
npm run android
npm run ios

# Type checking and linting
npm run typecheck
npm run lint
```

## 📊 Implementation Status

### ✅ **Backend Infrastructure (Production Ready)**

| Component | Status | Description |
|-----------|--------|-------------|
| **Database Schema** | ✅ Complete | 25+ tables with PostGIS, pgvector, full relationships |
| **Entity Layer** | ✅ Complete | 20 JPA entities with UUID, spatial data, enums |
| **Authentication** | ✅ Complete | JWT-based auth, role management, security config |
| **User Management** | ✅ Complete | Multi-role users, geography relationships |
| **Complaint System** | ✅ Complete | PostGIS location, multi-category, AI-ready fields |
| **Assignment System** | ✅ Complete | Worker assignment, status tracking, SLA management |
| **Service Layer** | ✅ Complete | All services updated for new entity structure |
| **API Layer** | ✅ Complete | REST endpoints, validation, error handling |
| **Compilation** | ✅ Complete | 0 errors, backend starts successfully |

### 🚧 **Frontend Applications (In Progress)**

| Component | Status | Next Steps |
|-----------|--------|------------|
| **Mobile App** | ❌ Pending | Citizen complaint reporting, worker task management |
| **Web Dashboard** | ❌ Pending | Officer assignment management, admin configuration |
| **API Integration** | ❌ Pending | Connect frontends to backend services |

### 📋 **Feature Implementation (Based on docs/02_Features_Modules.md)**

#### Level A: Must Build Next
- [ ] **Mobile App UI** - Citizen and worker interfaces
- [ ] **Web Dashboard UI** - Officer and admin interfaces  
- [ ] **File Upload** - Image/document storage integration
- [ ] **Push Notifications** - Real-time alerts and updates

#### Level B: Strong Product Layer
- [ ] **Advanced Analytics** - Department performance, heatmaps
- [ ] **SLA Management** - Automatic escalation, deadline tracking
- [ ] **Public Transparency** - Public complaint map, progress visibility
- [ ] **Duplicate Detection** - Link similar complaints

#### Level C: AI & Intelligence
- [ ] **Category Suggestion** - AI-powered complaint categorization
- [ ] **Semantic Search** - Vector-based duplicate detection
- [ ] **Summary Generation** - Automated complaint summaries
- [ ] **Predictive Analytics** - Hotspot detection, trend analysis

## 🔗 API Reference

### Authentication
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login  
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout

### Complaint Management
- `POST /api/v1/complaints` - Create complaint with location
- `GET /api/v1/complaints` - List complaints (paginated)
- `GET /api/v1/complaints/{id}` - Get complaint details
- `PUT /api/v1/complaints/{id}/status` - Update status
- `POST /api/v1/complaints/{id}/feedback` - Submit feedback

### Assignment & Routing
- `POST /api/v1/assignments/auto-assign` - Auto-assign to worker
- `POST /api/v1/assignments/manual-assign` - Manual assignment
- `PUT /api/v1/assignments/{id}/reassign` - Reassign complaint
- `GET /api/v1/assignments/department/{id}` - Department assignments
- `GET /api/v1/assignments/worker/{id}` - Worker assignments

### User Management
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update profile
- `GET /api/v1/users` - List users (admin only)

## 🏗️ Architecture Highlights

### Modern Backend Architecture
- **Modular Monolith** - Domain-driven design with clear module boundaries
- **PostGIS Integration** - Native spatial queries and geographic data
- **UUID Primary Keys** - Distributed-system ready, secure identifiers
- **Multi-Category Support** - Flexible complaint categorization
- **Comprehensive Audit Trail** - Full change tracking and compliance
- **AI-Ready** - Vector storage for semantic search and ML features

### Database Schema Features
- **25+ Tables** - Complete civic management data model
- **Spatial Data** - PostGIS GEOGRAPHY columns for precise location
- **Relationship Integrity** - Proper foreign keys and constraints
- **Audit Logging** - Track all changes with timestamps and actors
- **Multi-Tenancy Ready** - City/ward/zone hierarchy support

### Security & Compliance
- **JWT Authentication** - Stateless, scalable token-based auth
- **Role-Based Access** - Granular permissions for different user types
- **Input Validation** - Comprehensive request validation
- **Audit Trails** - Government-grade change tracking
- **Data Privacy** - Secure handling of citizen information

## 🧪 Testing

### Backend Tests
```powershell
cd backend
.\mvnw.cmd test
```

### Frontend Tests (When Implemented)
```powershell
# Web dashboard
cd web-dashboard
npm run test

# Mobile app  
cd mobile-app
npm run test
```

## 📚 Documentation

Comprehensive documentation in `docs/`:
- **[Project Context](docs/00_Project_Context.md)** - Overview and objectives
- **[Roles & Workflows](docs/01_Roles_Workflows_RBAC.md)** - User roles and permissions
- **[Features & Modules](docs/02_Features_Modules.md)** - Complete feature specifications
- **[Technical Architecture](docs/03_Technical_Architecture.md)** - System design
- **[API Design Guidelines](docs/04_Data_API_Design_Guidelines.md)** - API standards
- **[Roadmap & Build Order](docs/05_Roadmap_and_Build_Order.md)** - Development phases

## 🎯 Current Development Phase

**Phase**: Frontend Applications Development  
**Priority**: Level A Features (Must Build Next)

**Immediate Goals**:
1. Build React Native mobile app for citizens and workers
2. Build React web dashboard for officers and admins
3. Integrate frontends with backend APIs
4. Implement file upload and push notifications

## 🤝 Contributing

1. Follow the feature specifications in `docs/02_Features_Modules.md`
2. Implement Level A features first (mobile app, web dashboard)
3. Ensure proper validation, authorization, and error handling
4. Update documentation when adding new features
5. Run tests before committing changes

## 📄 License

[Add your license information here]

---

**Backend Status**: ✅ Production Ready (20 entities, full API, 0 compilation errors)  
**Current Phase**: Frontend Applications Development  
**Next Milestone**: Working mobile app and web dashboard  
**Last Updated**: May 11, 2026
