# 🐳 Civic Saathi - Infrastructure

This directory contains the Docker configuration, compose files, and deployment scripts for both local development and production deployment of the Civic Saathi platform.

## 📂 Architecture Components

- `docker-compose.yml`: Primarily used for local development. It sets up the PostgreSQL database equipped with PostGIS and pgvector extensions.
- `docker-compose.prod.yml`: The full-stack production setup that containerizes both the Database and the Spring Boot backend API.
- `docker/init.sql`: The database initialization script that automatically runs when the PostgreSQL container is created. It applies the necessary PostGIS spatial extensions.

## 🚦 Getting Started

### Local Database Only (Recommended for Dev)
If you are running the backend via IntelliJ, Eclipse, or Maven directly on your host machine, you only need the database container:

```bash
docker compose up -d postgres
```
This starts PostgreSQL on `localhost:5432` with the `Civic` database created and spatial extensions enabled.

### Full Stack Deployment
To spin up both the database and the backend simultaneously in an isolated network:

```bash
docker compose up --build
```
This configuration handles networking and ensures the backend waits for the database to become healthy before starting.

### Tear Down
To stop the services and preserve data:
```bash
docker compose down
```

To stop the services and completely wipe the database volumes (Fresh Start):
```bash
docker compose down -v
```

## ⚙️ Environment Configuration
Docker uses the `.env` file located in the root of the repository via the `env_file: ../.env` directive. Ensure your root `.env` has the correct `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` values.
