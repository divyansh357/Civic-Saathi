FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY backend/pom.xml backend/pom.xml
RUN mvn -f backend/pom.xml -B -DskipTests dependency:go-offline

COPY backend/src backend/src
RUN mvn -f backend/pom.xml -B clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

RUN addgroup --system spring && adduser --system spring --ingroup spring \
    && apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/backend/target/*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

USER spring:spring

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/app.jar"]
