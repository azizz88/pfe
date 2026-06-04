# syntax=docker/dockerfile:1.7
# ============================================================
# api-gateway — Spring Cloud Gateway 2023.0.1 (WebFlux/Netty)
# Multi-stage : Maven build -> layered JAR extract -> JRE alpine
# Port : 8888 | User : non-root (app) | Healthcheck : /actuator/health/liveness
# Pas de DB, pas de fonts → image plus légère que les services métier.
# ============================================================

# ---------- Stage 1 : build ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build

COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -e -DskipTests dependency:go-offline

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -e -DskipTests package \
 && mv target/*.jar target/app.jar

# ---------- Stage 2 : extraction des layers ----------
FROM eclipse-temurin:25-jre-alpine AS extractor
WORKDIR /extracted
COPY --from=build /build/target/app.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

# ---------- Stage 3 : runtime ----------
FROM eclipse-temurin:25-jre-alpine

RUN apk add --no-cache tini \
 && addgroup -S app && adduser -S app -G app -h /app \
 && chown -R app:app /app

WORKDIR /app
USER app

COPY --from=extractor --chown=app:app /extracted/dependencies/         ./
COPY --from=extractor --chown=app:app /extracted/spring-boot-loader/   ./
COPY --from=extractor --chown=app:app /extracted/snapshot-dependencies/ ./
COPY --from=extractor --chown=app:app /extracted/application/          ./

EXPOSE 8888

# Netty/Reactor est plus économe en threads que Tomcat → on peut rester à 75 %.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseG1GC -Djava.security.egd=file:/dev/./urandom"

HEALTHCHECK --interval=20s --timeout=5s --start-period=60s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8888/actuator/health/liveness || exit 1

ENTRYPOINT ["/sbin/tini", "--", "sh", "-c", "exec java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
