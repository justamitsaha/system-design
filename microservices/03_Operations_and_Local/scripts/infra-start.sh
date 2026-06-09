#!/bin/bash

# Configuration
export AWS_PAGER=""
PROJECT="microservice-playground"
CLUSTER_NAME="microservice-eks-cluster"
REGION="us-east-1"

echo "=========================================="
echo "🚀 STARTING COST-INCURRING INFRASTRUCTURE"
echo "=========================================="

# 1. Look up existing foundational resources
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=$PROJECT-vpc" --query 'Vpcs[0].VpcId' --output text)
PUB_SUB_A=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=$PROJECT-pub-a" --query 'Subnets[0].SubnetId' --output text)
PRIV_SUB_A=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=$PROJECT-priv-a" --query 'Subnets[0].SubnetId' --output text)
PRIV_SUB_B=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=$PROJECT-priv-b" --query 'Subnets[0].SubnetId' --output text)
RT_PRIV=$(aws ec2 describe-route-tables --filters "Name=tag:Name,Values=$PROJECT-rt-priv" --query 'RouteTables[0].RouteTableId' --output text)
BASTION_SG=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=$PROJECT-bastion-sg" --query 'SecurityGroups[0].GroupId' --output text)
CLUSTER_ROLE_ARN=$(aws iam get-role --role-name $PROJECT-cluster-role --query 'Role.Arn' --output text)
NODE_ROLE_ARN=$(aws iam get-role --role-name $PROJECT-node-role --query 'Role.Arn' --output text)

if [ "$VPC_ID" == "None" ]; then
    echo "❌ ERROR: Foundational VPC not found. Run Networking_EKS.md steps first."
    exit 1
fi

# 2. Provision NAT Gateway (Networking)
echo "⏳ Allocating EIP and creating NAT Gateway..."
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
aws ec2 create-tags --resources $EIP_ALLOC --tags Key=Name,Value=$PROJECT-eip Key=Project,Value=$PROJECT

NAT_GW=$(aws ec2 create-nat-gateway --subnet-id $PUB_SUB_A --allocation-id $EIP_ALLOC --query 'NatGateway.NatGatewayId' --output text)
aws ec2 create-tags --resources $NAT_GW --tags Key=Name,Value=$PROJECT-nat-gw Key=Project,Value=$PROJECT

echo "⌛ Waiting for NAT Gateway ($NAT_GW) to be available..."
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW

# 3. Update Private Route Table
echo "⏳ Updating Route Table $RT_PRIV to use NAT Gateway..."
aws ec2 replace-route --route-table-id $RT_PRIV --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_GW 2>/dev/null || \
aws ec2 create-route --route-table-id $RT_PRIV --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_GW
echo "✅ Routing updated."

# 4. Provision Bastion Host
echo "⏳ Starting Bastion Host..."
AMI_ID=$(aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-2023*-x86_64" --query 'Images[0].ImageId' --output text)
BASTION_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type t3.micro \
    --key-name anju \
    --security-group-ids $BASTION_SG \
    --subnet-id $PUB_SUB_A \
    --associate-public-ip-address \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$PROJECT-bastion},{Key=Project,Value=$PROJECT}]" \
    --query 'Instances[0].InstanceId' --output text)
echo "✅ Bastion started: $BASTION_ID"

# 5. Provision EKS Cluster
echo "⏳ Creating EKS Cluster (Brain)..."
aws eks create-cluster \
    --name $CLUSTER_NAME \
    --role-arn $CLUSTER_ROLE_ARN \
    --resources-vpc-config subnetIds=$PRIV_SUB_A,$PRIV_SUB_B,endpointPublicAccess=true

echo "⌛ Waiting for Cluster to be ACTIVE (takes ~15 mins)..."
aws eks wait cluster-active --name $CLUSTER_NAME
aws eks update-kubeconfig --name $CLUSTER_NAME --region $REGION
echo "✅ EKS Cluster is active."

# 6. Provision Managed Node Group
echo "⏳ Creating Node Group (Workers)..."
aws eks create-nodegroup \
    --cluster-name $CLUSTER_NAME \
    --nodegroup-name $PROJECT-node-group \
    --node-role $NODE_ROLE_ARN \
    --subnets $PRIV_SUB_A $PRIV_SUB_B \
    --scaling-config minSize=2,maxSize=3,desiredSize=2 \
    --instance-types t3.medium \
    --ami-type AL2023_x86_64_STANDARD \
    --remote-access ec2SshKey=anju,sourceSecurityGroups=$BASTION_SG

echo "⌛ Waiting for Node Group to be ACTIVE..."
aws eks wait nodegroup-active --cluster-name $CLUSTER_NAME --nodegroup-name $PROJECT-node-group

# 6.5 Allow Bastion to access Node Group ports
echo "⏳ Configuring Node Security Group for Bastion Tunneling..."
NODE_SG=$(aws ec2 describe-instances --filters "Name=tag:eks:cluster-name,Values=$CLUSTER_NAME" --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text)
if [ -n "$NODE_SG" ] && [ "$NODE_SG" != "None" ]; then
    aws ec2 authorize-security-group-ingress --group-id $NODE_SG --protocol tcp --port 5432 --source-group $BASTION_SG 2>/dev/null || true
    aws ec2 authorize-security-group-ingress --group-id $NODE_SG --protocol tcp --port 6379 --source-group $BASTION_SG 2>/dev/null || true
    aws ec2 authorize-security-group-ingress --group-id $NODE_SG --protocol tcp --port 8080 --source-group $BASTION_SG 2>/dev/null || true
    aws ec2 authorize-security-group-ingress --group-id $NODE_SG --protocol tcp --port 9092 --source-group $BASTION_SG 2>/dev/null || true
    echo "✅ Tunnel ports authorized on Node SG: $NODE_SG"
fi

# 7. Deploy Infrastructure Components (Kafka, Redis, Postgres)
echo "⏳ Deploying Infrastructure components (Kafka, Postgres, Redis) to 'infra' namespace..."

# 7.1 Install Strimzi Operator
echo "Installing Strimzi Kafka Operator..."
kubectl create namespace infra || true
kubectl create -f 'https://strimzi.io/install/latest?namespace=infra' -n infra

# 7.2 Deploy Postgres
echo "Deploying Postgres Database..."
kubectl apply -f ../../02_Kubernetes_Data_Tier/Postgres/postgres.yaml

# 7.3 Deploy Redis
echo "Deploying Redis Cache..."
kubectl apply -f ../../02_Kubernetes_Data_Tier/Redis/redis.yaml

# 7.4 Deploy Kafka Cluster
echo "Deploying Kafka Cluster..."
sleep 15
kubectl apply -f ../../02_Kubernetes_Data_Tier/Kafka/kafka-cluster.yaml -n infra

# 8. Verification
echo "⏳ Verifying resources are starting..."
echo "Waiting for Postgres and Redis pods to become ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n infra --timeout=120s || true
kubectl wait --for=condition=ready pod -l app=redis -n infra --timeout=120s || true

echo "=========================================="
echo "🎉 SUCCESS: Infrastructure is fully up!"
echo "Current pod status in 'infra' namespace:"
kubectl get pods -n infra
echo "=========================================="

