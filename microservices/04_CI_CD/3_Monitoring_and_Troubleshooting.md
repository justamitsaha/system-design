# Monitoring & Troubleshooting GitHub Actions

Once your CI/CD pipelines are running, you need to know how to monitor them and debug them if a script fails.

---

## 🚦 1. The Execution Flow

### The Initial Run
Yes, the very first time you commit and push the `.github/workflows/deploy-eks.yml` file to the `main` branch, **GitHub will automatically trigger the pipeline**. 
*Why?* Because the commit includes a change inside the `.github/workflows` folder, which satisfies the trigger condition.

### Subsequent Runs
After that initial push, the deployment pipeline will only run automatically if you modify files inside the `01_AWS_Infrastructure`, `02_Kubernetes_Data_Tier`, or `scripts` folders. 
If you simply want to start the infrastructure for the day without changing code, you will use the **Manual Trigger** (`workflow_dispatch`) from the Actions tab.

---

## 🖥️ 2. Where to See the Logs

If your pipeline fails (or if you just want to watch it build), you can view the real-time logs directly in GitHub.

1.  **Go to the Actions Tab:** Open your repository on GitHub.com and click the **Actions** tab.
2.  **Select the Workflow:** On the left sidebar, click the name of the workflow (e.g., `Deploy EKS Infrastructure & Data Tier`).
3.  **Click the Run:** You will see a list of recent executions (Runs). They will have a green checkmark (✅), a red X (❌), or a yellow spinning circle (in progress). Click on the specific run you want to investigate.
4.  **Open the Job:** On the left side of the summary page, click on the job name (e.g., `Provision EKS and Deploy Manifests`).

### The Log Console
You are now in the interactive log console! You will see a list of the exact steps defined in your YAML file:
*   `Checkout Repository`
*   `Configure AWS Credentials via OIDC`
*   `Verify AWS Connection`
*   `Make Scripts Executable`
*   `Run Infrastructure Deployment Script`

**Debugging:**
*   You can click on any of these steps to expand it and see the raw console output.
*   If a step fails, GitHub will automatically expand it and highlight the error in red.
*   Because your pipeline runs standard bash scripts (`infra-start.sh` and `infra-stop.sh`), the logs you see in GitHub Actions will look **exactly the same** as the logs you see when you run the scripts on your local terminal!

---

## 🐛 3. Common EKS Pipeline Errors

If your pipeline fails, check the logs for these common issues:

*   **`OIDC provider not found`**: You forgot to run the OIDC setup script (Step 1 in `1_GitHub_OIDC_Setup.md`) in your AWS account.
*   **`AccessDenied: User is not authorized to perform: sts:AssumeRoleWithWebIdentity`**: The `GITHUB_ORG` or `GITHUB_REPO` variables in your AWS IAM Trust Policy don't match your actual GitHub repository name perfectly.
*   **`ResourceInUseException` (During Teardown)**: AWS is slow to clean up the Node Group network interfaces. The script is designed to wait, but occasionally it times out. If the teardown fails here, just click the **"Re-run all jobs"** button in the GitHub UI 5 minutes later.
