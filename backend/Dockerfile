# syntax=docker/dockerfile:1.7

# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline
COPY src ./src
RUN mvn -B -ntp clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre-jammy
LABEL org.opencontainers.image.title="SIVU Backend"
LABEL org.opencontainers.image.source="https://github.com/uempresarial/sivu"

RUN apt-get update && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -r sivu && useradd --no-log-init -r -g sivu sivu
WORKDIR /app
COPY --from=builder /workspace/target/sivu-backend.jar /app/app.jar
USER sivu

EXPOSE 8080
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -Duser.timezone=America/Bogota"

ENTRYPOINT ["sh","-c","exec java $JAVA_OPTS -jar /app/app.jar"]
