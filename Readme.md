# CivicPulse - Crowdsourced Civic Issue Reporting System

A comprehensive role-based civic issue reporting and resolution platform built with modern technologies for government departments and citizens.

## 🏗️ Tech Stack

### Backend
- **Java 17** with **Spring Boot 3.3.6**
- **PostgreSQL 16** with **PostGIS 3.4** (spatial data)
- **pgvector** (AI/ML vector operations)
- **Redis** (caching and sessions)
- **Cloudinary** (image/file storage)
- **Firebase FCM** (push notifications)
- **Cerebras Cloud API** (Llama 3.1 8B for AI features)

### Frontend
- **React Native + Expo 54.0** (mobile app)
- **React 18.3 + Vite** (web dashboard)
- **TypeScript** (type safety)
- **Zustand** (state management)

### Infrastructure
- **Docker Compose** (local development)
- **Maven** (build system)
- **JWT** (authentication)

## 📁 Repository Structure

```text
backend/         Spring Boot modular monolith API
├── src/main/java/com/civic/
│   ├── config/          Spring Security, WebSocket, etc.
│   ├── common/          Shared constants and utilities
│   ├── exception/       Global exception handling
│   ├── infrastructure/  External service integrations
│   └── modules/         Domain modules (auth, user, complaint, etc.)
mobile-app/      React Native + Expo citizen/worker app
web-dashboard/   React + Vite admin/department dashboard
docs/            Architecture, features, and roadmap documentation
infra/           Docker Compose and container configurations
```

## 🚀 Prerequisites

- **Java 17+** (OpenJDK or Oracle JDK)
- **Maven 3.9+** (or use included wrapper)
- **Node.js 18+** and **npm 9+**
- **Docker Desktop** (recommended for database)
- **PostgreSQL 16+** with PostGIS (if not using Docker)
- **Redis** (if not using Docker)

## ⚙️ Environment Setup

### 1. Environment Variables

Create environment files from examples:

```powershell
# Root environment (backend + web dashboard + Docker)
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
DB_URL=jdbc:postgresql://localhost:5432/Civic
DB_USERNAME=postgres
DB_PASSWORD=your-password
JPA_DDL_AUTO=update

# PostgreSQL Docker Configuration
POSTGRES_DB=Civic
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password

# Frontend Configuration
VITE_API_URL=http://localhost:8080/api/v1
VITE_API_TIMEOUT=30000

# External Services (add when implementing)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FIREBASE_SERVER_KEY=your-firebase-server-key
CEREBRAS_API_KEY=your-cerebras-api-key
REDIS_URL=redis://localhost:6379
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
docker compose up -d
```

This starts:
- PostgreSQL 16 + PostGIS 3.4 on `localhost:5432`
- Spring Boot backend on `localhost:8080`

### 2. Verify Services

```powershell
# Check container status
docker compose ps

# Check backend health
curl http://localhost:8080/actuator/health

# Check database
docker exec civic_postgres psql -U postgres -d Civic -c "SELECT version();"
```

## 🛠️ Development Setup

### 1. Backend (Spring Boot)

```powershell
cd backend

# Using Maven wrapper (recommended)
.\mvnw.cmd spring-boot:run

# Or with system Maven
mvn spring-boot:run

# Run tests
.\mvnw.cmd test

# Build JAR
.\mvnw.cmd clean package
```

**Backend runs on:** `http://localhost:8080`  
**API base path:** `http://localhost:8080/api/v1`

### 2. Web Dashboard (React + Vite)

```powershell
cd web-dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

**Dashboard runs on:** `http://localhost:5173`

### 3. Mobile App (React Native + Expo)

```powershell
cd mobile-app

# Install dependencies
npm install

# Start Expo development server
npm run start

# Run on specific platforms
npm run android
npm run ios
npm run web

# Type checking and linting
npm run typecheck
npm run lint
```

**Access via:** Expo Go app (scan QR code)

## 📊 Implementation Status

### ✅ **Completed Modules (Production Ready)**

| Module | Status | Description |
|--------|--------|-------------|
| **Authentication** | ✅ Complete | JWT-based auth, role management, password encryption |
| **User Management** | ✅ Complete | User CRUD, profile management, role-based queries |
| **Complaint Core** | ✅ Complete | Complaint lifecycle, status transitions, geolocation |
| **Assignment & Routing** | ✅ Complete | Auto-assign, manual assign, SLA tracking, escalation scheduler |
| **Database Schema** | ✅ Complete | PostgreSQL + PostGIS, spatial data support |
| **Infrastructure** | ✅ Complete | Docker setup, environment configuration |

### 🚧 **In Progress / Partial**

| Module | Status | Next Steps |
|--------|--------|------------|
| **Department Management** | 🚧 Partial | Complete service layer implementation |
| **Worker Management** | 🚧 Partial | Complete assignment and task workflows |
| **Notification System** | 🚧 Partial | Implement FCM integration |

### ❌ **Pending Implementation**

| Module | Priority | Description |
|--------|----------|-------------|
| **Assignment & Routing** | 🔴 High | Auto-routing, workload balancing |
| **Mobile App UI** | 🔴 High | Citizen and worker interfaces |
| **Web Dashboard UI** | 🔴 High | Admin and department interfaces |
| **File Upload (Cloudinary)** | 🟡 Medium | Image/document storage |
| **Analytics & Reporting** | 🟡 Medium | Dashboard metrics, reports |
| **AI Features** | 🟢 Low | Category suggestion, duplicate detection |

## 🔗 API Reference

### Authentication Endpoints
- `POST /api/v1/auth/signup` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/logout` - User logout

### User Management
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users` - List users (admin only)

### Complaint Management
- `POST /api/v1/complaints` - Create complaint
- `GET /api/v1/complaints` - List complaints
- `GET /api/v1/complaints/{id}` - Get complaint details
- `PUT /api/v1/complaints/{id}/status` - Update complaint status
- `POST /api/v1/complaints/{id}/feedback` - Add feedback

### Assignment & Routing
- `POST /api/v1/assignments/auto-assign` - Auto-assign complaint to department/worker
- `POST /api/v1/assignments/manual-assign` - Manually assign complaint to specific worker
- `PUT /api/v1/assignments/{id}/reassign` - Reassign complaint to different worker
- `GET /api/v1/assignments/department/{id}` - Get assignments by department (paginated)
- `GET /api/v1/assignments/worker/{id}` - Get assignments by worker (paginated)
- `GET /api/v1/assignments/overdue` - Get all overdue assignments
- `POST /api/v1/assignments/escalate-overdue` - Trigger manual escalation of overdue assignments

## 🧪 Testing

### Backend Tests
```powershell
cd backend
.\mvnw.cmd test
```

### Frontend Tests
```powershell
# Web dashboard
cd web-dashboard
npm run test

# Mobile app
cd mobile-app
npm run test
```

## 🚀 Deployment

### Production Environment Variables
- Change `JWT_SECRET` to a secure 32+ character string
- Use production database credentials
- Configure external service API keys
- Set `JPA_DDL_AUTO=validate` for production

### Docker Production Build
```powershell
cd infra
docker compose -f docker-compose.prod.yml up -d
```

## 📚 Documentation

Comprehensive documentation in `docs/`:
- **[Project Context](docs/00_Project_Context.md)** - Overview and objectives
- **[Roles & Workflows](docs/01_Roles_Workflows_RBAC.md)** - User roles and permissions
- **[Features & Modules](docs/02_Features_Modules.md)** - Feature specifications
- **[Technical Architecture](docs/03_Technical_Architecture.md)** - System design
- **[API Design Guidelines](docs/04_Data_API_Design_Guidelines.md)** - API standards
- **[Roadmap & Build Order](docs/05_Roadmap_and_Build_Order.md)** - Development phases

## 🐛 Known Issues

- Database schema migration warnings (foreign key constraints)
- Analytics and AI modules are placeholder implementations
- Frontend applications need complete UI implementation

## 🤝 Contributing

1. Follow the modular development approach outlined in `docs/05_Roadmap_and_Build_Order.md`
2. Implement one module at a time following the defined build order
3. Ensure all endpoints have proper validation, authorization, and error handling
4. Update documentation when adding new features
5. Run tests before committing changes

## 📄 License

[Add your license information here]

---

**Current Phase:** Phase 1 - Core Working System (75% complete)  
**Next Module:** Frontend Applications (Web Dashboard + Mobile App)  
**Last Updated:** May 2026
