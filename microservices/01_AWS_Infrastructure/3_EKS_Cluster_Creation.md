# AWS EKS: Cluster & Node Group Creation

This document guides you through creating the EKS (Elastic Kubernetes Service) cluster that will host your microservices.

## 📋 Infrastructure Summary
| Component | Purpose | Cost Status | Hourly Fee |
| :--- | :--- | :--- | :--- |
| **IAM Roles** | Permissions for EKS to manage AWS resources. | Free | $0.00 |
| **EKS Cluster** | The Kubernetes "Brain" (Control Plane). | **💸 PAID** | **$0.10** |
| **Node Group** | The "Body" (EC2 Workers) where containers run. | **💸 PAID** | ~$0.04/node |

---

## 🏗️ 1. IAM Roles (The Security Foundation)

**Purpose:** EKS needs permission to talk to other AWS services (like ELB, EC2, and CloudWatch).
**Why it's needed:** Without these roles, the cluster cannot create Load Balancers or manage its own worker nodes.

### 1.1 Create Cluster Role
```bash
# Variables
PROJECT="microservice-playground"
ROLE_NAME="$PROJECT-cluster-role"

# 1. Create Trust Policy
cat <<EOF > cluster-trust-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "eks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# 2. Create the Role
CLUSTER_ROLE_ARN=$(aws iam create-role --role-name $ROLE_NAME --assume-role-policy-document file://01_AWS_Infrastructure/policies/cluster-trust-policy.json --query 'Role.Arn' --output text)

# 3. Attach Required Managed Policy
aws iam attach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy
```

### 1.2 Create Node Instance Role
```bash
NODE_ROLE_NAME="$PROJECT-node-role"

# 1. Create Trust Policy for EC2 Nodes
cat <<EOF > node-trust-policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# 2. Create the Role
NODE_ROLE_ARN=$(aws iam create-role --role-name $NODE_ROLE_NAME --assume-role-policy-document file://node-trust-policy.json --query 'Role.Arn' --output text)

# 3. Attach Required Policies for Workers
aws iam attach-role-policy --role-name $NODE_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
aws iam attach-role-policy --role-name $NODE_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
aws iam attach-role-policy --role-name $NODE_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
```

---

## 🧠 2. EKS Cluster Creation (Management Plane)

**Purpose:** This provisions the Kubernetes API server and etcd.
**💸 COST ALERT:** AWS charges **$0.10/hour** ($72/month) for the cluster itself, regardless of traffic.

```bash
CLUSTER_NAME="microservice-eks-cluster"

# 1. Create Cluster
# Note: Use the Subnets (A and B) created in Networking_EKS.md
aws eks create-cluster \
    --name $CLUSTER_NAME \
    --role-arn $CLUSTER_ROLE_ARN \
    --resources-vpc-config subnetIds=$PRIV_SUB_A,$PRIV_SUB_B,endpointPublicAccess=true

# 2. Wait for Cluster to be 'ACTIVE' (takes ~10-15 mins)
echo "Waiting for cluster to start..."
aws eks wait cluster-active --name $CLUSTER_NAME

# 3. Update local Kubeconfig
aws eks update-kubeconfig --name $CLUSTER_NAME --region us-east-1
```

---

## 🚀 3. Managed Node Group (Worker Nodes)

**Purpose:** Provisioning the actual EC2 instances where your Spring Boot, Kafka, and Postgres pods will live.
**💸 COST ALERT:** Each `t3.medium` costs ~$0.04/hr. With 2 nodes, you pay ~$0.08/hr (~$1.92/day).

```bash
NODE_GROUP_NAME="$PROJECT-node-group"

aws eks create-nodegroup \
    --cluster-name $CLUSTER_NAME \
    --nodegroup-name $NODE_GROUP_NAME \
    --node-role $NODE_ROLE_ARN \
    --subnets $PRIV_SUB_A $PRIV_SUB_B \
    --scaling-config minSize=2,maxSize=3,desiredSize=2 \
    --instance-types t3.medium \
    --ami-type AL2023_x86_64_STANDARD \
    --remote-access ec2SshKey=anju,sourceSecurityGroups=$BASTION_SG

# Wait for nodes to join
echo "Waiting for Node Group..."
aws eks wait nodegroup-active --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP_NAME
```

### 3.1 Authorize Bastion Tunnels (Crucial for Local Access)
**Purpose:** By default, EKS creates a strict Security Group for its nodes. Even though your Bastion has SSH access, EKS will block traffic on the database ports. We must explicitly tell the EKS Node Security Group to accept traffic coming from the Bastion on ports 5432, 6379, 8080, and 9092.

```bash
# 1. Get the auto-generated EKS Node Security Group ID
NODE_SG=$(aws ec2 describe-instances --filters "Name=tag:eks:cluster-name,Values=$CLUSTER_NAME" --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text)

# 2. Allow Bastion to access infrastructure ports
# Postgres
aws ec2 authorize-security-group-ingress --group-id $NODE_SG --protocol tcp --port 5432 --source-group $BASTION_SG
# Redis
aws ec2 authorize-security-group-ingress --group-id $NODE_SG --protocol tcp --port 6379 --source-group $BASTION_SG
# Schema Registry
aws ec2 authorize-security-group-ingress --group-id $NODE_SG --protocol tcp --port 8080 --source-group $BASTION_SG
# Kafka
aws ec2 authorize-security-group-ingress --group-id $NODE_SG --protocol tcp --port 9092 --source-group $BASTION_SG
```

#### 🗑️ Stop Compute Charges (Nodes Only)
Run this if you want to stop the $0.08/hr compute bill but keep your cluster settings/APIs alive (Cluster fee of $0.10/hr will continue).
```bash
aws eks delete-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP_NAME
aws eks wait nodegroup-deleted --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP_NAME
```

---

## 🔍 4. Verification
```bash
# Check cluster status
kubectl cluster-info

# Check running nodes
kubectl get nodes -o wide

# Check if you can see all the Kubernetes "System" pods
kubectl get pods -n kube-system
```

---

## 🗑️ 5. CLEANUP (Stop Hourly Fees)

**Crucial:** EKS and Node Groups charge by the hour. Run this to stop the bill.

```bash
# 1. Delete Node Group first (Wait for this to finish before deleting cluster)
aws eks delete-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP_NAME
aws eks wait nodegroup-deleted --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP_NAME

# 2. Delete Cluster (Stops the $0.10/hr fee)
aws eks delete-cluster --name $CLUSTER_NAME
aws eks wait cluster-deleted --name $CLUSTER_NAME

# 3. Delete IAM Roles
aws iam detach-role-policy --role-name $ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonEKSClusterPolicy
aws iam delete-role --role-name $ROLE_NAME

aws iam detach-role-policy --role-name $NODE_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy
aws iam detach-role-policy --role-name $NODE_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
aws iam detach-role-policy --role-name $NODE_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy
aws iam delete-role --role-name $NODE_ROLE_NAME

echo "EKS infrastructure removed."
```
