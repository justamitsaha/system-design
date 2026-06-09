# Setting Up GitHub Actions with AWS OIDC

To allow GitHub Actions to deploy infrastructure and applications to your AWS account, it needs permission. 

**The Old Way (Insecure):** Creating an IAM User, generating long-lived Access Keys, and storing them as secrets in GitHub. If these leak, your account is compromised.
**The New Way (Secure):** OpenID Connect (OIDC). GitHub asks AWS for temporary credentials for a specific workflow run. AWS verifies the request comes from *your specific repository* and grants a temporary token valid only for a few hours.

---

## 🔒 1. Configure the Identity Provider in AWS

First, we must tell AWS to trust GitHub as an Identity Provider.

1. Open your terminal in the `microservices/` directory.
2. Run the following AWS CLI command to register GitHub's OIDC thumbprint.

```bash
# This registers GitHub as a trusted Identity Provider in your AWS Account
aws iam create-open-id-connect-provider \
    --url "https://token.actions.githubusercontent.com" \
    --client-id-list "sts.amazonaws.com" \
    --thumbprint-list "1b511abead59c6ce207077c0bf0e0043b1382612" \
    --tags Key=Project,Value=microservice-playground
```
*(Note: The thumbprint is standard for GitHub Actions).*

---

## 🔑 2. Create the IAM Role for GitHub Actions

Now we create a specific IAM Role that GitHub can assume. This role dictates exactly what the CI/CD pipeline is allowed to do.

**CRITICAL:** You must update the `GITHUB_ORG` and `GITHUB_REPO` variables below before running the script. This ensures *only* your repository can assume this role.

### Implementation Script

```bash
# 1. Configuration (Auto-filled for your repository)
GITHUB_ORG="justamitsaha"
GITHUB_REPO="system-design"
ROLE_NAME="github-actions-eks-role"

# 2. Get your AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# 3. Create the Trust Policy (Temporary File)
# This policy says: "Allow GitHub Actions to assume this role, BUT ONLY IF the request comes from my specific repository."
cat <<EOF > github-oidc-trust-policy-temp.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": "repo:${GITHUB_ORG}/${GITHUB_REPO}:*"
                }
            }
        }
    ]
}
EOF

# 4. Create the Role
aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document file://github-oidc-trust-policy-temp.json \
    --tags Key=Project,Value=microservice-playground

# 5. Attach Permissions
# For CI/CD to deploy EKS, ECR, and Networking, it needs broad permissions. 
# For this lab, AdministratorAccess is easiest, but in production, you would scope this down significantly.
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# 6. Cleanup Temporary File
rm github-oidc-trust-policy-temp.json

echo "✅ GitHub Actions Role Created: arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"
echo "Save this ARN! You will need it in your GitHub Actions YAML."
```

---

## 🛠️ What's Next?
Once the role is created, we will create the actual pipeline definition files in `.github/workflows/`. These files will instruct GitHub to use this new role, connect to AWS, authenticate with ECR (Elastic Container Registry), and deploy your code to EKS.