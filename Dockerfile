# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build
# Using the official Eclipse Temurin JDK 21 on Alpine for a lean build layer.
# ─────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS build

WORKDIR /workspace/app

# Copy Maven wrapper and POM first to exploit layer caching.
# Dependencies are re-downloaded only when pom.xml changes.
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Pre-download dependencies (cache layer)
RUN ./mvnw dependency:go-offline -B --no-transfer-progress

# Copy source code
COPY src src

# Build production JAR, skip tests (tests run in CI against a real database)
RUN ./mvnw package -B -DskipTests --no-transfer-progress

# Extract Spring Boot layered JAR for optimised image layers
RUN java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime
# Minimal JRE image; no build tools in production.
# ─────────────────────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

# Create a non-root user for security
RUN addgroup -S labledger && adduser -S labledger -G labledger

WORKDIR /app

# Copy layered JAR contents in dependency order for efficient caching
COPY --from=build /workspace/app/target/extracted/dependencies/ ./
COPY --from=build /workspace/app/target/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/app/target/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/app/target/extracted/application/ ./

# Transfer ownership to the non-root user
RUN chown -R labledger:labledger /app

USER labledger

EXPOSE 8080

# Spring Boot Layered JAR entry point
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]

# Health check — uses the Spring Boot Actuator liveness probe
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=5 \
  CMD wget -qO- http://localhost:8080/actuator/health/liveness || exit 1
