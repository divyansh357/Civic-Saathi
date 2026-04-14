FROM maven:3.9.9-eclipse-temurin-17 AS build

WORKDIR /app

COPY backend/pom.xml backend/pom.xml
RUN mvn -f backend/pom.xml -B -DskipTests dependency:go-offline

COPY backend/src backend/src
RUN mvn -f backend/pom.xml -B clean package -DskipTests

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

RUN addgroup --system spring && adduser --system spring --ingroup spring

COPY --from=build /app/backend/target/*.jar app.jar

EXPOSE 8080

USER spring:spring

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
