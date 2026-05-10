# CivicPulse Development Context

This document tracks the current implementation status, architectural decisions, and development progress for the CivicPulse project.

## 📋 Project Architecture Summary

CivicPulse is a **modular monolith** built with Spring Boot, following domain-driven design principles. The system supports role-based civic issue reporting and resolution with the following key roles:

- **Citizens**: Report civic issues via mobile app
- **Workers**: Field workers who resolve issues
- **Officers**: Department supervisors who manage assignments
- **Admins**: System administrators with full access

### Technology Stack
- **Backend**: Spring Boot 3.3.6 + Java 17
- **Database**: PostgreSQL 16 + PostGIS 3.4 + pgvector
- **Frontend**: React Native (mobile) + React/Vite (web)
- **Infrastructure**: Docker Compose for local development
- **External Services**: Cloudinary (storage), Firebase FCM (notifications), Cerebras API (AI)

## ✅ Completed Modules (Production Ready)

### 1. Authentication Module (`com.civic.modules.auth`)
**Status**: ✅ **FULLY IMPLEMENTED**
- JWT-based authentication with access/refresh tokens
- User registration, login, logout, token refresh
- Role-based access control (RBAC)
- Password encryption with BCrypt
- Comprehensive security configuration
- Global exception handling for auth errors

**Key Files**:
- `AuthController.java` - REST endpoints
- `AuthService.java` - Business logic
- `JwtTokenProvider.java` - Token management
- `SecurityConfig.java` - Spring Security configuration

### 2. User Management Module (`com.civic.modules.user`)
**Status**: ✅ **FULLY IMPLEMENTED**
- Complete User entity with JPA annotations
- User CRUD operations with proper validation
- Role-based user queries and filtering
- Profile management endpoints
- Proper DTO mapping to avoid entity exposure

**Key Files**:
- `User.java` - JPA entity with spatial support
- `UserController.java` - REST endpoints
- `UserService.java` - Business logic
- `UserRepository.java` - Data access layer

### 3. Complaint Management Module (`com.civic.modules.complaint`)
**Status**: ✅ **CORE FUNCTIONALITY IMPLEMENTED**
- Complete Complaint entity with geolocation support (PostGIS)
- Complaint lifecycle management with state transitions
- Status workflow validation and business rules
- CRUD operations with proper authorization
- Feedback and rating system
- Statistics and analytics queries

**Key Files**:
- `Complaint.java` - JPA entity with spatial data
- `ComplaintController.java` - REST endpoints
- `ComplaintService.java` - Business logic with workflow
- `ComplaintWorkflow.java` - State transition validation

### 4. Assignment & Routing Module (`com.civic.modules.assignment`)
**Status**: ✅ **FULLY IMPLEMENTED**
- Auto-assignment logic based on complaint category and location
- Manual assignment to specific workers by officers
- Reassignment with reason tracking
- Workload balancing (assigns to worker with fewest active complaints)
- SLA deadline calculation based on priority (Critical: 4h, High: 12h, Medium: 2d, Low: 5d, Very Low: 10d)
- Automatic escalation scheduler (runs hourly via `@Scheduled`)
- Paginated queries for department and worker assignment views

**Key Files**:
- `Assignment.java` - JPA entity with full relationships
- `AssignmentController.java` - REST endpoints
- `AssignmentService.java` - Business logic with auto-routing
- `AssignmentScheduler.java` - Hourly escalation cron job
- `AssignmentRepository.java` - Data access with JPQL queries

### 5. Database Infrastructure
**Status**: ✅ **FULLY CONFIGURED**
- PostgreSQL 16 with PostGIS 3.4 extensions
- pgvector extension for AI/ML features
- Proper spatial data types and indexing
- Docker Compose setup with health checks
- Database initialization scripts

### 5. Security & Configuration
**Status**: ✅ **PRODUCTION READY**
- JWT token management with proper expiration
- Role-based method security
- CORS configuration for frontend integration
- Global exception handling
- Input validation with Bean Validation
- Environment-based configuration

## 🚧 Partially Implemented Modules

### 1. Department Management Module (`com.civic.modules.department`)
**Status**: 🚧 **CONTROLLER EXISTS, SERVICE INCOMPLETE**
- Basic Department entity structure
- REST endpoints defined
- **Missing**: Complete service layer implementation
- **Missing**: Department-complaint routing logic

### 2. Worker Management Module (`com.civic.modules.worker`)
**Status**: 🚧 **CONTROLLER EXISTS, SERVICE INCOMPLETE**
- Basic Worker entity structure
- REST endpoints defined
- **Missing**: Task assignment workflow
- **Missing**: Worker availability management
- **Missing**: Performance tracking

### 3. Notification Module (`com.civic.modules.notification`)
**Status**: 🚧 **PLACEHOLDER IMPLEMENTATION**
- Basic notification entity structure
- **Missing**: Firebase FCM integration
- **Missing**: Real-time WebSocket notifications
- **Missing**: Notification preferences management

## ❌ Pending Implementation

### 1. Assignment & Routing System
**Priority**: ✅ **COMPLETED**
- Auto-routing complaints to appropriate departments ✅
- Workload balancing across workers ✅
- SLA management and escalation rules ✅
- Manual override by officers ✅

### 2. Frontend Applications
**Priority**: 🔴 **HIGH - IN PROGRESS**
- **Mobile App**: Complete React Native UI for citizens and workers
- **Web Dashboard**: Complete React admin interface for officers and admins
- **Integration**: API integration with backend services

### 3. File Upload & Storage
**Priority**: 🟡 **MEDIUM**
- Cloudinary integration for image/document storage
- File upload endpoints with validation
- Image compression and optimization

### 4. Analytics & Reporting
**Priority**: 🟡 **MEDIUM**
- Dashboard metrics and KPIs
- Report generation (PDF, Excel)
- Performance analytics for departments

### 5. AI Features
**Priority**: 🟢 **LOW**
- Cerebras API integration for LLM features
- Complaint category suggestion
- Duplicate detection using semantic similarity
- Summary generation

## 🏗️ Current Module in Progress

**Current Module**: **Frontend Applications (Web Dashboard + Mobile App)**

This module will implement:
1. Web Dashboard - Full admin/officer/department UI with React + Vite
2. Mobile App - Citizen and worker screens with React Native + Expo
3. API integration with all backend services
4. Role-based navigation and views

## 🔑 Key Architectural Decisions

### 1. Modular Monolith Architecture
- **Decision**: Use modular monolith instead of microservices
- **Rationale**: Simpler deployment, easier development, can evolve to microservices later
- **Impact**: All modules in single Spring Boot application with clear boundaries

### 2. PostGIS for Spatial Data
- **Decision**: Use PostGIS extension for geolocation features
- **Rationale**: Native spatial queries, proximity calculations, mapping support
- **Impact**: Enables location-based assignment and analytics

### 3. JWT-based Authentication
- **Decision**: Stateless JWT tokens with refresh token rotation
- **Rationale**: Scalable, mobile-friendly, supports role-based access
- **Impact**: No server-side session storage required

### 4. Domain-Driven Design
- **Decision**: Organize code by domain modules, not technical layers
- **Rationale**: Better maintainability, clear business boundaries
- **Impact**: Each module has its own controller/service/repository/entity structure

### 5. Environment-based Configuration
- **Decision**: Use Spring Boot profiles and environment variables
- **Rationale**: Easy deployment across environments, secure secret management
- **Impact**: No hardcoded configuration, Docker-friendly setup

## ⚠️ Known Issues & Technical Debt

### 1. Database Schema Issues
- **Issue**: Foreign key constraint warnings during tests
- **Impact**: Test failures, potential data integrity issues
- **Priority**: 🔴 High - needs immediate attention

### 2. Placeholder Service Implementations
- **Issue**: Analytics and AI modules throw "Not implemented" exceptions
- **Impact**: API endpoints exist but return errors
- **Priority**: 🟡 Medium - implement when reaching those phases

### 3. Missing Integration Tests
- **Issue**: Limited integration test coverage
- **Impact**: Potential regression issues
- **Priority**: 🟡 Medium - add as modules are completed

## 📈 Development Progress

### Phase 1: Core Working System (Current - ~75% Complete)
- ✅ Authentication and user management
- ✅ Basic complaint lifecycle
- ✅ Assignment and routing workflow with SLA tracking
- 🚧 Department and worker management (partial)
- 🚧 Frontend applications (in progress)
- ❌ Notification system

### Phase 2: Operational Hardening (Planned)
- SLA management and escalation
- Duplicate detection
- Advanced workflow management
- Public transparency features

### Phase 3: AI & Intelligence (Future)
- LLM integration for category suggestion
- Semantic duplicate detection
- Predictive analytics
- Smart routing optimization

## 🎯 Immediate Next Steps

1. **Build Web Dashboard** - Complete React admin interface with all module pages
2. **Build Mobile App** - Complete React Native citizen/worker screens
3. **Complete Department module** - implement service layer and routing logic
4. **Complete Worker module** - implement assignment workflow
5. **Notification system** - Firebase FCM integration

## 📝 Development Guidelines

### Code Quality Standards
- All endpoints must have proper validation and authorization
- Use DTOs for all API requests/responses (never expose entities)
- Implement comprehensive error handling
- Add audit logging for all state changes
- Follow Spring Boot best practices

### Testing Requirements
- Unit tests for all service methods
- Integration tests for API endpoints
- Test both success and error scenarios
- Maintain >80% code coverage

### Documentation Requirements
- Update README.md when adding new endpoints
- Update this context.md when completing modules
- Document all architectural decisions
- Maintain API documentation

---

**Last Updated**: May 10, 2026  
**Current Sprint**: Frontend Applications (Web Dashboard + Mobile App)  
**Next Review**: After frontend completion