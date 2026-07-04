# Microservice Development & Integration Guide

This document provides a step-by-step blueprint for building, testing, and deploying your custom business logic microservices into the EKS ecosystem.

---

## 🏗️ 1. Core Technology Stack

All core services in this playground are built using a **Reactive, Event-Driven** architecture:
*   **Framework:** Spring Boot 3.x with **WebFlux** (Non-blocking I/O).
*   **Service Discovery:** Netflix Eureka.
*   **Configuration:** Spring Cloud Config.
*   **Database:** Reactive Spring Data **R2DBC** (for Postgres/MySQL).
*   **Messaging:** Spring Cloud Stream with **Kafka**.

---

## 🚀 2. Development Lifecycle

### Step 1: Bootstrap the Project
Use [start.spring.io](https://start.spring.io/) to generate your project with these dependencies:
*   `Spring Reactive Web`
*   `Eureka Discovery Client`
*   `Config Client`
*   `Spring Data R2DBC`
*   `Spring for Apache Kafka`
*   `Lombok` & `Spring Boot Actuator`

### Step 2: Local Configuration (`bootstrap.yml`)
Configure your service to fetch its settings from the centralized `config-service`.

```yaml
spring:
  application:
    name: customer-service # Your service name
  cloud:
    config:
      uri: http://localhost:8888 # Path to config-service via tunnel
      fail-fast: true
```

### Step 3: Local Development (The Tunnel Strategy)
To develop locally without running the whole cluster on your laptop:
1.  **Open Tunnels:** Run `ssh -F 03_Operations_and_Local/ssh-config-template -N ms-bastion`.
2.  **Hosts File:** Ensure `my-cluster-dual-role-X...` are mapped to `127.0.0.X`.
3.  **Local Env:** Your local app will connect to `localhost:5432` for Postgres and `localhost:9092` for Kafka.

---

## 📦 3. Containerization (Dockerfile)

Use a multi-stage build to keep your images small and secure.

```dockerfile
# Stage 1: Build
FROM maven:3-eclipse-temurin-17 AS build
COPY . /app
WORKDIR /app
RUN mvn clean package -DskipTests

# Stage 2: Run
FROM eclipse-temurin:17-jre-alpine
COPY --from=build /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

---

## 🚀 4. Deployment Architecture

To deploy your new service, you need to add it to the **Source of Truth** repo (this one).

### 1. Create Manifests
Create a new folder: `microservices/02_Kubernetes_Data_Tier/App_Services/<your-service>/`.
Add a `deployment.yaml` and `service.yaml`.

### 2. Service Discovery (Eureka)
In Kubernetes, your service will automatically register with Eureka using its **Pod IP**. Ensure your deployment includes the Eureka environment variable:
```yaml
env:
  - name: EUREKA_CLIENT_SERVICEURL_DEFAULTZONE
    value: "http://discovery-service.infra.svc:8761/eureka/"
```

### 3. CI/CD Integration
1.  **Build Repo:** Create a GitHub Action in your *Microservice* repository to build the Docker image and push it to **AWS ECR**.
2.  **Deploy Repo (This one):** Update the `deploy-component.yml` workflow in this repo to include your new service in the dropdown list.

---

## 📋 5. Best Practices Checklist

- [ ] **Health Checks:** Always implement `/actuator/health/liveness` and `/actuator/health/readiness` for Kubernetes probes.
- [ ] **Observability:** Use the OTel (OpenTelemetry) agent to export traces to the OTel Collector.
- [ ] **Secrets:** Never hardcode passwords. Use Kubernetes Secrets or AWS Secrets Manager.
- [ ] **Resilience:** Wrap external calls (to other microservices) in **Resilience4j** circuit breakers.
