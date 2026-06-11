# Local Kafka Management (via SSH Tunnel)

This document explains how to interact with your private EKS Kafka cluster from your local Windows machine using an active SSH tunnel and the "Hosts File Hack."

---

## 📋 Prerequisites

1.  **SSH Tunnel Active:** `ssh -F 03_Operations_and_Local/ssh-config-template -N ms-bastion`
2.  **Hosts File Updated:** `my-cluster-dual-role-X...` mapped to `127.0.0.X` in `C:\Windows\System32\drivers\etc\hosts`.
3.  **Bootstrap Address:** `localhost:9092` (or `127.0.0.1:9092`).

---

## 🐳 Method 1: Using Docker (Recommended)

If you have Docker Desktop, you can run Kafka commands without installing Java or Kafka locally.

### List all topics
```bash
docker run -it --rm --network="host" bitnami/kafka:latest kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### Create a new topic
```bash
docker run -it --rm --network="host" bitnami/kafka:latest kafka-topics.sh \
    --bootstrap-server localhost:9092 \
    --create \
    --topic demo-topic \
    --partitions 3 \
    --replication-factor 1
```

### Produce Messages (Console Producer)
Once running, type a message and press **Enter**. Press **Ctrl+C** to exit.
```bash
docker run -it --rm --network="host" bitnami/kafka:latest kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic demo-topic
```

### Consume Messages (Console Consumer)
```bash
docker run -it --rm --network="host" bitnami/kafka:latest kafka-console-consumer.sh \
    --bootstrap-server localhost:9092 \
    --topic demo-topic \
    --from-beginning
```

---

## 🖥️ Method 2: GUI Tools (System Design Visibility)

GUI tools are excellent for inspecting messages, schemas, and consumer group offsets.

### 1. Offset Explorer (Formerly Kafka Tool)
*   **Download:** [kafkatool.com](https://www.kafkatool.com/)
*   **Connection Settings:**
    *   **Type:** Kafka Cluster
    *   **Bootstrap Servers:** `localhost:9092`
    *   **Advanced:** Ensure "Use SSL" is **unchecked**.

### 2. Conduktor
*   **Download:** [conduktor.io](https://www.conduktor.io/)
*   **Connection Settings:** Use `localhost:9092`.

---

## ⚙️ Method 3: Native CLI (Manual Install)

Use this if you prefer running commands directly in CMD or PowerShell.

1.  Download Kafka binaries from [kafka.apache.org](https://kafka.apache.org/downloads).
2.  Extract to `C:\kafka`.
3.  Run commands from `C:\kafka\bin\windows\`:
    ```powershell
    .\kafka-topics.bat --bootstrap-server localhost:9092 --list
    ```

---

## 🔍 Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| `UnknownHostException` | Missing Hosts entry. | Add `127.0.0.1 my-cluster-dual-role-0...` to your Windows hosts file. |
| `Connection Refused` | Tunnel is down. | Restart the SSH tunnel command. |
| `Timeout` | Security Group block. | Ensure the EKS Node SG allows traffic from the Bastion on port 9092. |
