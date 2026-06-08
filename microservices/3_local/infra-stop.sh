#!/bin/bash

# Configuration
export AWS_PAGER=""
PROJECT="microservice-playground"
CLUSTER_NAME="microservice-eks-cluster"
NODE_GROUP_NAME="$PROJECT-node-group"

echo "=========================================="
echo "🛑 STOPPING COST-INCURRING INFRASTRUCTURE"
echo "=========================================="

# 0. Delete Infrastructure Pods (Clean up EKS resources)
if aws eks describe-cluster --name $CLUSTER_NAME &>/dev/null; then
    echo "⏳ Checking for running infrastructure pods..."
    if kubectl get namespace infra &>/dev/null; then
        echo "Deleting 'infra' namespace and all its resources..."
        kubectl delete namespace infra --wait=false
        echo "Waiting for pods to terminate..."
        sleep 10
        kubectl get pods -n infra || echo "No pods remaining or namespace terminating."
    fi
fi

# 1. Delete Node Group (Compute)
if aws eks describe-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP_NAME &>/dev/null; then
    echo "⏳ Deleting Node Group: $NODE_GROUP_NAME..."
    aws eks delete-nodegroup --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP_NAME --output text > /dev/null
    aws eks wait nodegroup-deleted --cluster-name $CLUSTER_NAME --nodegroup-name $NODE_GROUP_NAME
    echo "✅ Node Group deleted."
else
    echo "ℹ️ Node Group not found or already deleted."
fi

# 2. Delete EKS Cluster (Control Plane Fee)
if aws eks describe-cluster --name $CLUSTER_NAME &>/dev/null; then
    echo "⏳ Waiting for cluster updates to finish before deletion..."
    aws eks wait cluster-active --name $CLUSTER_NAME || true
    echo "⏳ Deleting EKS Cluster: $CLUSTER_NAME..."
    aws eks delete-cluster --name $CLUSTER_NAME --output text > /dev/null
    aws eks wait cluster-deleted --name $CLUSTER_NAME
    echo "✅ EKS Cluster deleted."
else
    echo "ℹ️ EKS Cluster not found or already deleted."
fi

# 3. Terminate Bastion Host
BASTION_ID=$(aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=$PROJECT-bastion" "Name=instance-state-name,Values=running,pending" \
    --query 'Reservations[].Instances[].InstanceId' --output text)

if [ -n "$BASTION_ID" ]; then
    echo "⏳ Terminating Bastion Host: $BASTION_ID..."
    aws ec2 terminate-instances --instance-ids $BASTION_ID
    echo "✅ Bastion termination triggered."
else
    echo "ℹ️ No running Bastion host found."
fi

# 4. Delete NAT Gateway (Networking Fee)
NAT_ID=$(aws ec2 describe-nat-gateways \
    --filter "Name=tag:Project,Values=$PROJECT" "Name=state,Values=available,pending" \
    --query 'NatGateways[0].NatGatewayId' --output text)

if [ -n "$NAT_ID" ] && [ "$NAT_ID" != "None" ]; then
    echo "⏳ Deleting NAT Gateway: $NAT_ID..."
    aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
    echo "⌛ Waiting for NAT Gateway deletion (this takes ~3 mins)..."
    aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_ID
    echo "✅ NAT Gateway deleted."
else
    echo "ℹ️ No active NAT Gateway found."
fi

# 5. Release Elastic IP
EIP_ALLOC=$(aws ec2 describe-addresses \
    --filters "Name=tag:Project,Values=$PROJECT" \
    --query 'Addresses[0].AllocationId' --output text)

if [ -n "$EIP_ALLOC" ] && [ "$EIP_ALLOC" != "None" ]; then
    echo "⏳ Releasing Elastic IP: $EIP_ALLOC..."
    aws ec2 release-address --allocation-id $EIP_ALLOC
    echo "✅ Elastic IP released."
else
    echo "ℹ️ No Elastic IP found to release."
fi

echo "=========================================="
echo "🎉 SUCCESS: High-cost resources removed."
echo "VPC, Subnets, and IAM roles remain intact."
echo "=========================================="
