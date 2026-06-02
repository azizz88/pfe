# syntax=docker/dockerfile:1.7
# ============================================================
# employee-service — Spring Boot 3.2.5
# Multi-stage : Maven build -> layered JAR extract -> JRE alpine
# Port : 8081 | User : non-root (app) | Healthcheck : /actuator/health
# ============================================================

# ---------- Stage 1 : build ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

# Pre-download deps (couche cache : ne se réinvalide que si pom.xml change)
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -e -DskipTests dependency:go-offline

# Build du jar (layered JAR activé par défaut en Spring Boot 2.4+)
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -e -DskipTests package \
 && mv target/*.jar target/app.jar

# ---------- Stage 2 : extraction des layers ----------
FROM eclipse-temurin:17-jre-alpine AS extractor
WORKDIR /extracted
COPY --from=build /build/target/app.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

# ---------- Stage 3 : runtime ----------
FROM eclipse-temurin:17-jre-alpine

# fontconfig + ttf-dejavu : requis par PDFBox pour l'extraction CV
# tini             : reaper PID 1 (signaux propres)
# busybox wget     : déjà présent pour le HEALTHCHECK
RUN apk add --no-cache fontconfig ttf-dejavu tini \
 && addgroup -S app && adduser -S app -G app -h /app \
 && mkdir -p /app/uploads \
 && chown -R app:app /app

WORKDIR /app
USER app

# Ordre des COPY = du moins volatile au plus volatile (cache friendly)
COPY --from=extractor --chown=app:app /extracted/dependencies/         ./
COPY --from=extractor --chown=app:app /extracted/spring-boot-loader/   ./
COPY --from=extractor --chown=app:app /extracted/snapshot-dependencies/ ./
COPY --from=extractor --chown=app:app /extracted/application/          ./

EXPOSE 8081

# JVM tuning : 75 % de la RAM container, G1GC, entropie non-bloquante
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=20s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8081/actuator/health/liveness || exit 1

ENTRYPOINT ["/sbin/tini", "--", "sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
