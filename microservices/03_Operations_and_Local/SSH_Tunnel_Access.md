# Secure Access: SSH Tunnels to Private Infrastructure

For security reasons, your databases (Postgres, Redis) and message broker (Kafka) are located in **Private Subnets** within the EKS cluster. They cannot be accessed directly from the public internet.

To connect your local development tools (like pgAdmin, DBeaver, or Redis Desktop Manager) to these private services, you will use an **SSH Tunnel** through your public Bastion host.

---

## 🏗️ How it Works

1.  **The Bastion:** Your Bastion host sits in a Public Subnet and is accessible via SSH (Port 22).
2.  **The Tunnel:** You create an SSH connection to the Bastion host and tell it: *"Listen on my local port `X`, and securely forward any traffic you receive there to the private IP/DNS of the database on port `Y`."*
3.  **Local Connection:** Your local tool connects to `localhost:X` as if the database was running directly on your laptop.

---

## 📋 Prerequisites

Before creating the tunnels, you need two pieces of information:
1.  **Bastion Public IP:** The IP address of your EC2 Bastion host.
2.  **Internal Kubernetes Service IP/DNS:** The private address of the service inside EKS.

### Step 1: Get the Bastion IP
```bash
aws ec2 describe-instances \
    --filters "Name=tag:Name,Values=microservice-playground-bastion" "Name=instance-state-name,Values=running" \
    --query 'Reservations[].Instances[].PublicIpAddress' --output text
```

### Step 2: Get the routable Pod IPs
**Crucial Architectural Note:** You *cannot* use the Kubernetes `ClusterIP` (e.g., 172.20.x.x). `ClusterIPs` are virtual and only exist inside the worker nodes. Your Bastion host will drop the packets, causing a timeout!

Because EKS uses the AWS VPC CNI, the actual Pods get real, routable IPs from your private subnets (`10.0.11.x` or `10.0.12.x`). Your Bastion can reach these!

Run this command to find the internal **Pod IPs**:
```bash
kubectl get pods -n infra -o wide
```
*Note the `IP` column for the `postgres`, `redis`, and `schema-registry` pods.*

---

## 🚇 Creating the Tunnels

Run these commands in your local terminal. Leave the terminal window open; closing it will kill the tunnel.

### 1. PostgreSQL Tunnel
**Goal:** Connect local `localhost:5432` to the EKS Postgres pod.

```bash
# Replace BASTION_IP and POSTGRES_POD_IP with your actual values
ssh -i anju.pem -N -L 5432:<POSTGRES_POD_IP>:5432 ec2-user@<BASTION_IP>
```
*   **To connect in DBeaver:** Use `localhost`, port `5432`, user `dbadmin`, password `dbpassword`, db `customerdb`.

### 2. Redis Tunnel
**Goal:** Connect local `localhost:6379` to the EKS Redis pod.

```bash
# Replace BASTION_IP and REDIS_POD_IP with your actual values (e.g., 10.0.11.120)
ssh -i anju.pem -N -L 6379:<REDIS_POD_IP>:6379 ec2-user@<BASTION_IP>
```
*   **To connect locally (Redis CLI/Desktop Manager):** Use `localhost`, port `6379`. No password is set by default in this lab.

### 3. Kafka & Schema Registry Tunnels (The "Metadata" Challenge)
**The Problem:** Kafka is unique. When you connect to port 9092, the cluster responds with the *internal hostnames* of its brokers (e.g., `my-cluster-dual-role-0...`). Your local machine cannot resolve these `.svc` addresses, leading to an `UnknownHostException`.

**The Solution:** You must map these internal names to your local machine and tunnel each broker individually.

#### Step A: Get all Broker Pod IPs
```bash
kubectl get pods -n infra -o wide
```
*Note the IPs for `my-cluster-dual-role-0`, `my-cluster-dual-role-1`, and `my-cluster-dual-role-2`.*

#### Step B: Create a Multi-Port Tunnel
You must map each broker to a unique local port (e.g., 9092, 9093, 9094).
```bash
# Example for Broker 0
ssh -i anju.pem -N -L 9092:<BROKER_0_POD_IP>:9092 ec2-user@<BASTION_IP>
# Example for Broker 1
ssh -i anju.pem -N -L 9093:<BROKER_1_POD_IP>:9092 ec2-user@<BASTION_IP>
```

#### Step C: The "Hosts File Hack" (Windows)
1. Open **Notepad** as Administrator.
2. Open `C:\Windows\System32\drivers\etc\hosts`.
3. Add these lines (matching the names in your error logs):
```text
127.0.0.1 my-cluster-dual-role-0.my-cluster-kafka-brokers.infra.svc
127.0.0.1 my-cluster-dual-role-1.my-cluster-kafka-brokers.infra.svc
127.0.0.1 my-cluster-dual-role-2.my-cluster-kafka-brokers.infra.svc
```

#### Step D: Schema Registry Tunnel
```bash
# Tunnel for Schema Registry (Standard 8080)
ssh -i anju.pem -N -L 8080:<SCHEMA_REGISTRY_POD_IP>:8080 ec2-user@<BASTION_IP>
```

---

## 🛠️ Pro-Tip: The Local SSH Config File

If you do this frequently, typing the long commands gets tedious. You can automate it using the provided `ssh-config-template` file in this repository.

1.  Open `03_Operations_and_Local/ssh-config-template` and replace the `<PLACEHOLDERS>` with your Bastion IP and the **Pod IPs**.
2.  Make sure the `IdentityFile` path points to your `anju.pem` key. (Note: On Windows, ensure your .pem file has strict permissions, or SSH will reject it).
3.  Now, from the `microservices` directory, simply run:
    ```bash
    ssh -F 03_Operations_and_Local/ssh-config-template -N ms-bastion
    ```
