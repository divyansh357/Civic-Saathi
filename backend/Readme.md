# 🚀 Civic Saathi - Backend Service

This is the Spring Boot backend service for the Civic Saathi platform. It is built as a modular monolith following Domain-Driven Design (DDD) principles to ensure clear boundaries between core domains while maintaining a simplified deployment structure.

## 🛠️ Tech Stack
- **Java 17**
- **Spring Boot 3.3.6**
- **Spring Security** (Stateless JWT Authentication)
- **Spring Data JPA** & **Hibernate Spatial**
- **PostGIS** integration for geographic routing (`GEOGRAPHY(Point, 4326)`)
- **pgvector** support (ready for AI embedding layers)

## 📂 Architecture
The backend is structured into self-contained domain modules located under `src/main/java/com/civic/modules`:
- `auth`: JWT generation, User entity management, Role-Based Access Control.
- `complaint`: Lifecycle state machine for civic issues, PostGIS spatial point creation, media attachments.
- `assignment`: Geographic algorithmic routing, manual officer dispatch logic, and Worker SLAs.
- `department`: Management of departments and their geographical boundaries.

## 🚦 Getting Started

### Prerequisites
- JDK 17+
- Maven
- PostgreSQL with PostGIS extension (We highly recommend running the provided `infra` docker-compose stack)

### Environment
The application expects environment variables defined in the `.env` file at the repository root. Key variables:
```env
SERVER_PORT=8080
DB_URL=jdbc:postgresql://localhost:5432/Civic
DB_USERNAME=postgres
DB_PASSWORD=root
JWT_SECRET=your_super_secret_key_here
```

### Run Locally
From this directory, execute:
```bash
# On Linux/Mac:
./mvnw clean spring-boot:run

# On Windows:
.\mvnw.cmd clean spring-boot:run
```

The API will be available at `http://localhost:8080/api/v1`.

## 🧪 Testing
To run the automated test suite:
```bash
./mvnw test
```
