#!/bin/bash

# Configuration
export AWS_PAGER=""
PROJECT="microservice-playground"
CLUSTER_NAME="microservice-eks-cluster"

echo "=========================================="
echo "🔍 AWS INFRASTRUCTURE & COST AUDIT"
echo "=========================================="
echo "Checking for resources tagged with Project: $PROJECT..."
echo ""

COST_WARNING=false

# 1. Check EKS Cluster ($0.10 / hr)
echo "--- 🧠 EKS Management Plane ---"
CLUSTER_STATUS=$(aws eks describe-cluster --name $CLUSTER_NAME --query 'cluster.status' --output text 2>/dev/null)
if [ -n "$CLUSTER_STATUS" ]; then
    echo "⚠️  ACTIVE (💸 ~$0.10/hour)"
    COST_WARNING=true
else
    echo "✅ Not Found (No Charge)"
fi

# 2. Check Node Group (Compute Cost)
echo ""
echo "--- 🚀 EKS Worker Nodes ---"
NODE_STATUS=$(aws eks describe-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $PROJECT-node-group --query 'nodegroup.status' --output text 2>/dev/null)
if [ -n "$NODE_STATUS" ]; then
    echo "⚠️  ACTIVE: $NODE_STATUS (💸 ~$0.08/hour for 2x t3.medium)"
    COST_WARNING=true
else
    echo "✅ Not Found (No Charge)"
fi

# 3. Check NAT Gateway (~$0.045 / hr)
echo ""
echo "--- 🌐 NAT Gateway ---"
NAT_GW=$(aws ec2 describe-nat-gateways --filter "Name=tag:Project,Values=$PROJECT" --query 'NatGateways[?State!=`deleted`].State' --output text)
if [ -n "$NAT_GW" ]; then
    echo "⚠️  ACTIVE: $NAT_GW (💸 ~$0.045/hour)"
    COST_WARNING=true
else
    echo "✅ Not Found (No Charge)"
fi

# 4. Check Bastion Host
echo ""
echo "--- 🛡️ Bastion Host ---"
BASTION_STATE=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=$PROJECT-bastion" "Name=instance-state-name,Values=running,pending" --query 'Reservations[].Instances[].State.Name' --output text)
if [ -n "$BASTION_STATE" ]; then
    echo "⚠️  RUNNING (💸 ~$0.01/hour or Free Tier)"
    COST_WARNING=true
else
    echo "✅ Not Found / Terminated (No Charge)"
fi

# 5. Check Elastic IPs (Charge if not attached to a running instance)
echo ""
echo "--- 📌 Elastic IPs ---"
EIP_ALLOC=$(aws ec2 describe-addresses --filters "Name=tag:Project,Values=$PROJECT" --query 'Addresses[].AllocationId' --output text)
if [ -n "$EIP_ALLOC" ]; then
    echo "⚠️  ALLOCATED (💸 Small charge if NAT GW is deleted but IP remains)"
    COST_WARNING=true
else
    echo "✅ Not Found (No Charge)"
fi

echo ""
echo "=========================================="
if [ "$COST_WARNING" = true ]; then
    echo "🚨 WARNING: YOU ARE CURRENTLY INCURRING AWS CHARGES."
    echo "If you are done testing, run the Teardown GitHub Action"
    echo "or execute './infra-stop.sh' to stop billing."
else
    echo "🎉 ALL CLEAR: No cost-incurring resources found."
    echo "Your teardown was 100% successful."
    exit 0
fi
echo "=========================================="
echo ""

# 6. If Cluster is Active, Check Kubernetes Pods
if [ "$CLUSTER_STATUS" == "ACTIVE" ]; then
    echo "📦 Checking Kubernetes Infrastructure Tier..."
    if kubectl get namespace infra &>/dev/null; then
        kubectl get pods -n infra
    else
        echo "Namespace 'infra' not found. Pods might not be deployed yet."
    fi
fi
