# GitHub Actions Workflows & Automation

This document explains the architecture of our CI/CD pipelines, how they are triggered, and how we use them to manage infrastructure costs.

---

## 📂 1. The `.github/workflows` Directory

You might wonder: *"Why aren't our pipeline YAML files stored here in the `04_CI_CD` folder?"*

**The Rule:** GitHub has a strict architectural constraint. It will **only** read and execute CI/CD pipelines if the YAML files are placed inside the `.github/workflows/` folder at the absolute root of your repository. 

**Our Pattern:**
*   **`.github/workflows/`**: Contains the *execution code* (the actual YAML files that GitHub runs).
*   **`microservices/04_CI_CD/`**: Contains the *knowledge repository* (markdown files, OIDC setup scripts, architectural diagrams, and documentation).

---

## 🚀 2. Our Pipelines

We have configured three primary workflows for managing the EKS ecosystem. All workflows use **AWS OIDC** for secure, keyless authentication.

| Workflow File | Display Name | Purpose | Trigger |
| :--- | :--- | :--- | :--- |
| `deploy-eks.yml` | **Deploy EKS...** | Provisions VPC, EKS, and Data Tier. | Auto (on push) / Manual |
| `teardown-eks.yml` | **Teardown EKS...** | Destroys all cost-incurring resources. | Manual Only |
| `k8s-debug.yml` | **K8s Debug...** | Runs `kubectl` commands from UI. | Manual Only |

---

### A. The Deployment Pipeline (`deploy-eks.yml`)
**Goal:** Automatically spin up the foundational infrastructure and the data tier (Kafka, Postgres, Redis).

**How it works (Monorepo Path Filtering):**
Because we keep all our code in one large repository (a Monorepo), we don't want to spin up heavy AWS infrastructure if a developer just changes a CSS file in the frontend.

This pipeline uses `paths:` filtering. It will **only** trigger automatically on a push to the `main` branch if files within these specific folders are changed:
*   `microservices/01_AWS_Infrastructure/**`
*   `microservices/02_Kubernetes_Data_Tier/**`
*   `microservices/03_Operations_and_Local/scripts/**`

If it runs, it executes the `infra-start.sh` script securely from the GitHub runner.

### B. The Teardown Pipeline (`teardown-eks.yml`)
**Goal:** Safely destroy the EKS cluster, Node Groups, and NAT Gateways to stop all hourly billing.

**Why it's needed:** EKS costs $0.10/hour even if idle. This pipeline is your "Off Switch" to save money when you are done for the day. It executes the `infra-stop.sh` script.

### C. The Granular Deployment Pipeline (`deploy-component.yml`)
**Goal:** Allows you to redeploy or update just ONE component (e.g., only Postgres) if your EKS cluster is already running.

This workflow is **Manual Only**. It provides a dropdown menu where you can choose:
*   `postgres`: Applies only the Postgres YAML.
*   `redis`: Applies only the Redis YAML.
*   `kafka_cluster`: Applies only the Kafka Cluster YAML.
*   `strimzi_operator`: Re-installs the Kafka operator if needed.

### D. The K8s Operations Pipeline (`k8s-debug.yml`)
**Goal:** Provides a web-based "Control Panel" to inspect your cluster without needing a local terminal or SSH tunnel.

This workflow is **Manual Only**. You can select operations from a dropdown menu in the GitHub UI:
*   `get_pods`: Lists all running pods and their nodes.
*   `get_services`: Shows internal IPs and ports.
*   `get_pod_logs`: Retrieves the last 100 lines of logs for a specific pod.
*   `describe_pod`: Shows detailed events and status for a specific pod.

---

## 🖱️ 3. Manual Triggers (`workflow_dispatch`)

**You do NOT have to push code to trigger a pipeline.**

Sometimes you just want to bring up the environment to run some tests, or tear it down at the end of the day. To support this, both of our workflows include the `workflow_dispatch` event trigger:

```yaml
on:
  workflow_dispatch:
```

### How to Manually Trigger a Pipeline:

1.  Navigate to your repository on **GitHub.com**.
2.  Click on the **Actions** tab at the top of the repository.
3.  Look at the left-hand sidebar under "Workflows". You will see:
    *   `Deploy EKS Infrastructure & Data Tier`
    *   `Teardown EKS Infrastructure (Stop Billing)`
4.  Click on the workflow you want to run (e.g., Teardown).
5.  On the right side of the screen, a blue banner will appear with a **"Run workflow"** dropdown button.
6.  Click **"Run workflow"**, select the `main` branch, and GitHub will instantly spawn a runner to execute your teardown scripts.

This gives you an absolute "On/Off" switch for your AWS cloud costs directly from the GitHub UI!
