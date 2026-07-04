# AWS Networking Lab: The "Fail-Fix-Verify" Learning Path

This document is a hands-on lab designed to teach you AWS networking through iterative discovery. We will build, break, fix, and clean up at every stage.

**Prerequisites:** 
- AWS CLI configured for `us-east-1`.
- Key pair named `anju` already exists.
- `microservices/ec2-user-data.sh` exists.

---

## 🏗️ Phase 1: The Bastion Foundation (Isolated State)

We create the VPC and the subnet that will eventually host our Bastion host.

### 1.1 Provision Infrastructure
```bash
PROJECT="microservice-playground"
VPC_CIDR="10.0.0.0/16"

# 1. Create VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block $VPC_CIDR --query 'Vpc.VpcId' --output text)
aws ec2 create-tags --resources $VPC_ID --tags Key=Name,Value=$PROJECT-vpc Key=Project,Value=$PROJECT

# 2. Create Subnet (10.0.1.0/24 is private by default)
PUB_SUB_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources $PUB_SUB_A --tags Key=Name,Value=$PROJECT-pub-subnet-a Key=Project,Value=$PROJECT

# 3. Create Security Group
SG_ID=$(aws ec2 create-security-group --group-name $PROJECT-lab-sg --description "Lab Traffic" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 create-tags --resources $SG_ID --tags Key=Name,Value=$PROJECT-lab-sg Key=Project,Value=$PROJECT

# Allow SSH (Port 22) and HTTP (Port 80) for our web server
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
```

### 1.2 Observe Failure
```bash
AMI_ID=$(aws ec2 describe-images --owners amazon --filters "Name=name,Values=al2023-ami-2023*-x86_64" --query 'Images[0].ImageId' --output text)

# Launch Bastion Candidate with Public IP
INST_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type t3.micro \
    --key-name anju \
    --security-group-ids $SG_ID \
    --subnet-id $PUB_SUB_A \
    --associate-public-ip-address \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$PROJECT-bastion-temp},{Key=Project,Value=$PROJECT}]" \
    --query 'Instances[0].InstanceId' --output text)

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INST_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo "Attempting SSH to $PUBLIC_IP..."
ssh -i anju.pem -o ConnectTimeout=10 ec2-user@$PUBLIC_IP
# RESULT: Connection Timeout.
```

### 1.3 Reset
```bash
aws ec2 terminate-instances --instance-ids $INST_ID
aws ec2 wait instance-terminated --instance-ids $INST_ID
```

---

## 🌐 Phase 2: Opening the Door (IGW & Routing)

### 2.1 Apply Fix
```bash
# 1. Create and Attach Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway --query 'InternetGateway.InternetGatewayId' --output text)
aws ec2 attach-internet-gateway --vpc-id $VPC_ID --internet-gateway-id $IGW_ID
aws ec2 create-tags --resources $IGW_ID --tags Key=Name,Value=$PROJECT-igw Key=Project,Value=$PROJECT

# 2. Create Route Table
RT_PUB=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-tags --resources $RT_PUB --tags Key=Name,Value=$PROJECT-rt-pub Key=Project,Value=$PROJECT

# 3. Route to Internet
aws ec2 create-route --route-table-id $RT_PUB --destination-cidr-block 0.0.0.0/0 --gateway-id $IGW_ID

# 4. Associate with Subnet
aws ec2 associate-route-table --subnet-id $PUB_SUB_A --route-table-id $RT_PUB
```

### 2.2 Verify Success
```bash
# Launch fresh Bastion with CORRECT user-data path
INST_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type t3.micro \
    --key-name anju \
    --security-group-ids $SG_ID \
    --subnet-id $PUB_SUB_A \
    --associate-public-ip-address \
    --user-data file://microservices/ec2-user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$PROJECT-bastion-final},{Key=Project,Value=$PROJECT}]" \
    --query 'Instances[0].InstanceId' --output text)

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INST_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo "Success! Wait 2-3 mins, then check: http://$PUBLIC_IP"
```

---

## 🔍 Troubleshooting: Why can't I reach my Web Server?

If you can SSH but can't reach the HTTP page, check these:

1. **User Data Progress:** Run `sudo tail -f /var/log/cloud-init-output.log`. If you see `yum update` still running, wait.
2. **Service Status:** Run `sudo systemctl status httpd`. It should say `active (running)`.
3. **Security Group:** Verify port 80 is open:
   `aws ec2 describe-security-groups --group-ids $SG_ID --query 'SecurityGroups[0].IpPermissions'`
4. **Route Table:** Ensure `0.0.0.0/0` points to the `igw-xxxx`.


---

## 🔒 Phase 3: The Private Wall (Isolation)

### 3.1 Provision Private Subnet
```bash
APP_SUB_A=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.11.0/24 --availability-zone us-east-1a --query 'Subnet.SubnetId' --output text)
aws ec2 create-tags --resources $APP_SUB_A --tags Key=Name,Value=$PROJECT-app-subnet-a Key=Project,Value=$PROJECT
```

### 3.2 Observe Failure
```bash
# Launch in Private Subnet
INST_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type t3.micro \
    --key-name anju \
    --security-group-ids $SG_ID \
    --subnet-id $APP_SUB_A \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$PROJECT-app-temp},{Key=Project,Value=$PROJECT}]" \
    --query 'Instances[0].InstanceId' --output text)
# Result: Isolated. No internet for yum updates.
```

### 3.3 Reset
```bash
aws ec2 terminate-instances --instance-ids $INST_ID
aws ec2 wait instance-terminated --instance-ids $INST_ID
```

---

## 🛠️ Phase 4: The NAT Proxy (Managed Outbound)

### 4.1 Apply Fix
```bash
# 1. Elastic IP for NAT
EIP_ALLOC=$(aws ec2 allocate-address --domain vpc --query 'AllocationId' --output text)
aws ec2 create-tags --resources $EIP_ALLOC --tags Key=Name,Value=$PROJECT-eip Key=Project,Value=$PROJECT

# 2. Create NAT Gateway
NAT_GW_A=$(aws ec2 create-nat-gateway --subnet-id $PUB_SUB_A --allocation-id $EIP_ALLOC --query 'NatGateway.NatGatewayId' --output text)
aws ec2 create-tags --resources $NAT_GW_A --tags Key=Name,Value=$PROJECT-nat-gw Key=Project,Value=$PROJECT

# 3. Private Routing
aws ec2 wait nat-gateway-available --nat-gateway-ids $NAT_GW_A
RT_PRIV=$(aws ec2 create-route-table --vpc-id $VPC_ID --query 'RouteTable.RouteTableId' --output text)
aws ec2 create-tags --resources $RT_PRIV --tags Key=Name,Value=$PROJECT-rt-priv Key=Project,Value=$PROJECT

aws ec2 create-route --route-table-id $RT_PRIV --destination-cidr-block 0.0.0.0/0 --nat-gateway-id $NAT_GW_A
aws ec2 associate-route-table --subnet-id $APP_SUB_A --route-table-id $RT_PRIV
```

### 4.2 Verify Final Success
```bash
INST_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --count 1 \
    --instance-type t3.micro \
    --key-name anju \
    --security-group-ids $SG_ID \
    --subnet-id $APP_SUB_A \
    --user-data file://microservices/ec2-user-data.sh \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$PROJECT-app-final},{Key=Project,Value=$PROJECT}]" \
    --query 'Instances[0].InstanceId' --output text)
```

---

## 🗑️ EXHAUSTIVE CLEANUP

```bash
PROJECT="microservice-playground"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=$PROJECT" --query 'Vpcs[0].VpcId' --output text)

if [ "$VPC_ID" != "None" ] && [ "$VPC_ID" != "" ]; then
  # 1. Instances
  INST_IDS=$(aws ec2 describe-instances --filters "Name=vpc-id,Values=$VPC_ID" --query 'Reservations[].Instances[].InstanceId' --output text)
  [ -n "$INST_IDS" ] && aws ec2 terminate-instances --instance-ids $INST_IDS && aws ec2 wait instance-terminated --instance-ids $INST_IDS

  # 2. NAT Gateway
  NAT_GW_IDS=$(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" --query 'NatGateways[?State!=`deleted`].NatGatewayId' --output text)
  for gw in $NAT_GW_IDS; do aws ec2 delete-nat-gateway --nat-gateway-id $gw; done
  [ -n "$NAT_GW_IDS" ] && aws ec2 wait nat-gateway-deleted --nat-gateway-ids $NAT_GW_IDS

  # 3. EIPs
  EIP_ALLOCS=$(aws ec2 describe-addresses --filters "Name=tag:Project,Values=$PROJECT" --query 'Addresses[].AllocationId' --output text)
  for eip in $EIP_ALLOCS; do aws ec2 release-address --allocation-id $eip; done

  # 4. Subnets
  SUB_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[].SubnetId' --output text)
  for sub in $SUB_IDS; do aws ec2 delete-subnet --subnet-id $sub; done

  # 5. IGW
  IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[0].InternetGatewayId' --output text)
  if [ "$IGW_ID" != "None" ]; then
    aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID
    aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID
  fi

  # 6. Route Tables
  RT_IDS=$(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[?Associations[0].Main!=`true`].RouteTableId' --output text)
  for rt in $RT_IDS; do aws ec2 delete-route-table --route-table-id $rt; done

  # 7. Security Groups
  SG_IDS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[?GroupName!=`default`].GroupId' --output text)
  for sg in $SG_IDS; do aws ec2 delete-security-group --group-id $sg; done

  # 8. VPC
  aws ec2 delete-vpc --vpc-id $VPC_ID
  echo "Cleanup successful."
fi
```
