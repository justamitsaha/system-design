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

---

## 🔐 4. The "Creator Identity" Lockout (Local `kubectl` fails)

**The Problem:**
You ran the GitHub Actions pipeline successfully, the cluster exists, but when you run `kubectl get pods -n infra` on your local laptop, you get this error:
> `error: You must be logged in to the server (the server has asked for the client to provide credentials)`

**Why this happens:**
In AWS EKS, the IAM identity (User or Role) that *creates* the cluster is automatically granted `system:masters` administrator privileges in the Kubernetes RBAC configuration. 
Because your **GitHub Actions Role** created the cluster, *it* is the only identity allowed to talk to the API. Your local laptop (which uses your personal IAM User) is completely locked out by default!

**The Fix (Daily Restoration Guide):**
Since you teardown and redeploy daily, copy and paste this **entire block** into your terminal after each deployment. 

It is designed to be "smart": it will find your ARN automatically and only apply settings that are actually missing.

```bash
# 1. Configuration
CLUSTER="microservice-eks-cluster"
REGION="us-east-1"
LOCAL_ARN=$(aws sts get-caller-identity --query Arn --output text)

echo "--- 🛠️ Restoring Access for: $LOCAL_ARN ---"

# 2. Sync Kubeconfig
aws eks update-kubeconfig --name $CLUSTER --region $REGION

# 3. Enable API Authentication (Only if not already set)
CURRENT_MODE=$(aws eks describe-cluster --name $CLUSTER --query 'cluster.accessConfig.authenticationMode' --output text)
if [ "$CURRENT_MODE" != "API_AND_CONFIG_MAP" ]; then
    echo "Updating cluster authentication mode..."
    aws eks update-cluster-config --name $CLUSTER --access-config authenticationMode=API_AND_CONFIG_MAP
    aws eks wait cluster-active --name $CLUSTER
else
    echo "✅ API Authentication already enabled."
fi

# 4. Create Access Entry & Bind Policy (Ignore error if already exists)
echo "Ensuring Admin access entry exists..."
aws eks create-access-entry --cluster-name $CLUSTER --principal-arn $LOCAL_ARN 2>/dev/null || echo "ℹ️ Entry already exists."

aws eks associate-access-policy \
    --cluster-name $CLUSTER \
    --principal-arn $LOCAL_ARN \
    --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
    --access-scope type=cluster 2>/dev/null || echo "ℹ️ Policy already associated."

echo "--- 🎉 SUCCESS: Your local kubectl is now authenticated! ---"
```
