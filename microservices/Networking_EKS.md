# AWS Networking & Compute: EKS-Ready Architecture

This document outlines the cost-optimized, EKS-ready infrastructure for the Microservice Patterns Playground.

## 📋 Infrastructure Summary & Cost Awareness
| Component | Count | Purpose | Cost Status | Monthly Estimate |
| :--- | :--- | :--- | :--- | :--- |
| **VPC / Subnets** | 1 / 4 | Core Network. | Free | $0 |
| **IGW** | 1 | Internet Entry. | Free | $0 |
| **NAT Gateway** | 1 | Private Node Internet. | **💸 PAID** | ~$33.00 |
| **Bastion Host** | 1 | Admin Access. | **💸 PAID** | ~$8.00 (or Free Tier) |
| **EKS Control Plane** | 1 | K8s Management. | **💸 PAID** | ~$72.00 |
| **Worker Nodes** | 2 | Run Pods. | **💸 PAID** | ~$58.00 (t3.medium) |

---

## 🏗️ 1. Networking Foundation (Multi-AZ for EKS)

**Purpose:** Physical network boundaries. Multi-AZ is mandatory for EKS High Availability.
**Cost:** $0.

### 1.1 VPC & Core Variables
```bash
PROJECT="microservice-playground"
CLUSTER_NAME="microservice-eks-cluster"
VPC_CIDR="10.0.0.0/16"

VPC_ID=$(aws ec2 create-vpc --cidr-block $VPC_CIDR --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=$PROJECT-vpc Key=Project,Value=$PROJECT

IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
aws ec2 create-tags --resources $IGW_ID --tags Key=Name,Value=$PROJECT-igw Key=Project,Value=$PROJECT
```

### 1.2 Subnet Strategy with EKS Tags
```bash
# --- AZ-A ---
PUB_SUB_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources $PUB_SUB_A --tags Key=Name,Value=$PROJECT-pub-a Key=Project,Value=$PROJECT Key=kubernetes.io/role/elb,Value=1 Key=kubernetes.io/cluster/$CLUSTER_NAME,Value=shared

PRIV_SUB_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 --availability-zone us-east-1a --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources $PRIV_SUB_A --tags Key=Name,Value=$PROJECT-priv-a Key=Project,Value=$PROJECT Key=kubernetes.io/role/internal-elb,Value=1 Key=kubernetes.io/cluster/$CLUSTER_NAME,Value=shared

# --- AZ-B ---
PUB_SUB_B=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1b --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources $PUB_SUB_B --tags Key=Name,Value=$PROJECT-pub-b Key=Project,Value=$PROJECT Key=kubernetes.io/role/elb,Value=1 Key=kubernetes.io/cluster/$CLUSTER_NAME,Value=shared

PRIV_SUB_B=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.12.0/24 --availability-zone us-east-1b --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources $PRIV_SUB_B --tags Key=Name,Value=$PROJECT-priv-b Key=Project,Value=$PROJECT Key=kubernetes.io/role/internal-elb,Value=1 Key=kubernetes.io/cluster/$CLUSTER_NAME,Value=shared
```

---

## 🔒 2. Connectivity & Routing

### 2.1 Public Routing (Direct Internet)
**Purpose:** Maps for Load Balancers.
**Cost:** $0.

```bash
RT_PUB=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-tags --resources $RT_PUB --tags Key=Name,Value=$PROJECT-rt-pub Key=Project,Value=$PROJECT
aws ec2 create-route --route-table-id $RT_PUB --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID
aws ec2 associate-route-table --subnet-id $PUB_SUB_A --route-table-id $RT_PUB
aws ec2 associate-route-table --subnet-id $PUB_SUB_B --route-table-id $RT_PUB
```

### 2.2 Private Routing (via NAT Gateway)
**Purpose:** Outbound internet for Private Nodes (Crucial for registration/images).
**💸 COST ALERT:** ~$0.045 per hour (~$1.08 per day).

```bash
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
aws ec2 create-tags --resources $EIP_ALLOC --tags Key=Name,Value=$PROJECT-eip Key=Project,Value=$PROJECT

NAT_GW=$(aws ec2 create-nat-gateway --subnet-id $PUB_SUB_A --allocation-id $EIP_ALLOC --query 'NatGateway.NatGatewayId' --output text)
aws ec2 create-tags --resources $NAT_GW --tags Key=Name,Value=$PROJECT-nat-gw Key=Project,Value=$PROJECT

aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW

RT_PRIV=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-tags --resources $RT_PRIV --tags Key=Name,Value=$PROJECT-rt-priv Key=Project,Value=$PROJECT
aws ec2 create-route --route-table-id $RT_PRIV --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_GW
aws ec2 associate-route-table --subnet-id $PRIV_SUB_A --route-table-id $RT_PRIV
aws ec2 associate-route-table --subnet-id $PRIV_SUB_B --route-table-id $RT_PRIV
```

#### 🗑️ Stop NAT Gateway Charges
Run this if you want to keep the network but stop paying for the NAT Gateway.
```bash
NAT_ID=$(aws ec2 describe-nat-gateways --filter "Name=tag:Project,Values=$PROJECT" --query 'NatGateways[?State!=`deleted`].NatGatewayId' --output text)
if [ -n "$NAT_ID" ]; then
  aws ec2 delete-nat-gateway --nat-gateway-id $NAT_ID
  echo "NAT Gateway deletion triggered. Wait 3 mins before releasing EIP."
fi

# Release EIP (Once NAT is deleted)
EIP_ID=$(aws ec2 describe-addresses --filters "Name=tag:Project,Values=$PROJECT" --query 'Addresses[].AllocationId' --output text)
[ -n "$EIP_ID" ] && aws ec2 release-address --allocation-id $EIP_ID
```

---

## 🚀 3. Compute Tier (Cost-Optimized)

### 3.1 Provision Bastion Host
**Purpose:** Entry point for management.
**💸 COST ALERT:** ~$0.01 per hour (~$0.24 per day).

```bash
AMI_ID=$(aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-2023*-x86_64" --query 'Images[0].ImageId' --output text)

BASTION_SG=$(aws ec2 create-security-group --group-name $PROJECT-bastion-sg --description "Allow SSH" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 create-tags --resources $BASTION_SG --tags Key=Name,Value=$PROJECT-bastion-sg Key=Project,Value=$PROJECT
aws ec2 authorize-security-group-ingress --group-id $BASTION_SG --protocol tcp --port 22 --cidr 0.0.0.0/0

BASTION_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type t3.micro \
    --key-name anju \
    --security-group-ids $BASTION_SG \
    --subnet-id $PUB_SUB_A \
    --associate-public-ip-address \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$PROJECT-bastion},{Key=Project,Value=$PROJECT}]" \
    --query 'Instances[0].InstanceId' --output text)
```

#### 🗑️ Stop Bastion Charges
```bash
B_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=$PROJECT-bastion" "Name=instance-state-name,Values=running,pending" --query 'Reservations[].Instances[].InstanceId' --output text)
[ -n "$B_ID" ] && aws ec2 terminate-instances --instance-ids $B_ID
```

---

## 🗑️ 4. EXHAUSTIVE CLEANUP (Full Reset)

**Purpose:** Wipes everything to ensure $0 billing.

```bash
PROJECT="microservice-playground"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=$PROJECT" --query 'Vpcs[0].VpcId' --output text)

if [ "$VPC_ID" != "None" ] && [ "$VPC_ID" != "" ]; then
  # 1. Terminate all project instances
  INST_IDS=$(aws ec2 describe-instances --filters "Name=vpc-id,Values=$VPC_ID" --query 'Reservations[].Instances[].InstanceId' --output text)
  [ -n "$INST_IDS" ] && aws ec2 terminate-instances --instance-ids $INST_IDS && aws ec2 wait instance-terminated --instance-ids $INST_IDS

  # 2. Delete NAT Gateways
  NAT_GW_IDS=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" --query 'NatGateways[?State!=`deleted`].NatGatewayId' --output text)
  for gw in $NAT_GW_IDS; do aws ec2 delete-nat-gateway --nat-gateway-id $gw; done
  [ -n "$NAT_GW_IDS" ] && aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_GW_IDS

  # 3. Release EIPs
  EIP_ALLOCS=$(aws ec2 describe-addresses --filters "Name=tag:Project,Values=$PROJECT" --query 'Addresses[].AllocationId' --output text)
  for eip in $EIP_ALLOCS; do aws ec2 release-address --allocation-id $eip; done

  # 4. Detach/Delete IGW
  IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGatewayIds[0]' --output text)
  if [ "$IGW_ID" != "None" ]; then
    aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID
    aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID
  fi

  # 5. Delete Subnets, RTs, SGs
  SUB_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[].SubnetId' --output text)
  for sub in $SUB_IDS; do aws ec2 delete-subnet --subnet-id $sub; done
  RT_IDS=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[?Associations[0].Main!=`true`].RouteTableId' --output text)
  for rt in $RT_IDS; do aws ec2 delete-route-table --route-table-id $rt; done
  SG_IDS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[?GroupName!=`default`].GroupId' --output text)
  for sg in $SG_IDS; do aws ec2 delete-security-group --group-id $sg; done

  # 6. Delete VPC
  aws ec2 delete-vpc --vpc-id $VPC_ID
  echo "Full Cleanup Success."
fi
```
