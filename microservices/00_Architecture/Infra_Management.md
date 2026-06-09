# Infrastructure Management Guide

This project includes automated scripts to manage high-cost AWS resources while preserving foundational networking. This allows you to stop paying for compute and high-fee networking when you are not working, without having to rebuild your entire VPC setup.

---

## 🛠️ Management Scripts

### 1. `infra-stop.sh` (Stop Billing)
Use this script to delete all resources that incur hourly fees.
*   **Deletes:** EKS Cluster, Node Groups, NAT Gateway, Bastion Host, and Elastic IP.
*   **Preserves:** VPC, Subnets, Internet Gateway, Route Tables, Security Groups, and IAM Roles.
*   **Savings:** ~$5.50 - $6.50 per day.

### 2. `infra-start.sh` (Resume Work)
Use this script to restore the infrastructure using the preserved networking foundation.
*   **Restores:** NAT Gateway (plus route updates), Bastion Host, EKS Cluster, and Node Groups.
*   **Process:** Takes approximately **15-20 minutes** (primarily due to EKS provisioning).
*   **Automation:** Automatically updates your local `kubeconfig` upon completion.

---

## 🚀 Usage Instructions

### Step 1: Permissions
Ensure both scripts are executable:
```bash
chmod +x infra-start.sh infra-stop.sh
```

### Step 2: Stopping the Environment
When you are done for the day:
```bash
./infra-stop.sh
```

### Step 3: Starting the Environment
When you are ready to resume:
```bash
./infra-start.sh
```

---

## 📋 Cost Awareness Summary

| Component | Daily Cost (approx) | Status when Stopped |
| :--- | :--- | :--- |
| **EKS Cluster** | $2.40 | Deleted ($0) |
| **Worker Nodes (2x t3.medium)** | $1.92 | Deleted ($0) |
| **NAT Gateway** | $1.08 | Deleted ($0) |
| **Bastion Host (t3.micro)** | $0.24 | Deleted ($0) |
| **VPC / Subnets** | $0.00 | Preserved ($0) |

---

## 🔍 Verification
After running `infra-start.sh`, verify your environment:
```bash
# Check EKS Nodes
kubectl get nodes

# Check Kafka Status (if deployed)
kubectl get pods -n kafka
```

*Note: After a restart, you may need to re-apply your Kubernetes manifests (like `kafka-cluster.yaml`) if you didn't use persistent volumes or if the cluster was completely removed.*
