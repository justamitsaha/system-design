# Kafka on EKS: Deployment and Local Connectivity

This guide outlines how to deploy a production-ready Kafka cluster on Amazon EKS using the **Strimzi Kafka Operator** and how to configure it for local connectivity, including a **Schema Registry**.

---

## 1. Prerequisites
- A running EKS cluster.
- `kubectl` and `helm` installed locally.
- AWS CLI configured with appropriate permissions.
- **AWS EBS CSI Driver:** Required for persistent storage.
  ```bash
  # 1. Attach policy to Node Role
  aws iam attach-role-policy --role-name <NODE_ROLE_NAME> --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy
  
  # 2. Increase IMDS hop limit (required for CSI driver pods to reach metadata)
  aws ec2 modify-instance-metadata-options --instance-id <INSTANCE_ID> --http-put-response-hop-limit 2
  
  # 3. Install Addon
  aws eks create-addon --cluster-name <CLUSTER_NAME> --addon-name aws-ebs-csi-driver
  ```

---

## 2. Installing Strimzi Kafka Operator
The Strimzi Operator is the industry standard for managing Kafka on Kubernetes. It handles cluster provisioning, scaling, and configuration via Custom Resources (CRDs).

```bash
# Add Strimzi Helm repository
helm repo add strimzi https://strimzi.io/charts/
helm repo update

# Install the operator in a dedicated namespace
kubectl create namespace kafka
helm install strimzi-operator strimzi/strimzi-kafka-operator --namespace kafka
```

---

## 3. Deploying Kafka & Schema Registry
We use **Apicurio Registry** as the Schema Registry. It is lightweight, open-source, and compatible with Confluent Schema Registry APIs.

### Configuration (`kafka-cluster.yaml`)
Apply the configuration which includes the Kafka cluster, Zookeeper, and the Apicurio Schema Registry.

```bash
kubectl apply -f kafka-cluster.yaml
```

---

## 4. Connecting from Local Machine (Port Forwarding)
To connect your local applications, you must forward traffic for the bootstrap service, individual brokers, and the schema registry.

### Step 1: Start Port Forwarding
Run these commands in separate terminal windows:

```bash
# Forward Kafka Bootstrap & Brokers
kubectl port-forward svc/my-cluster-kafka-external-bootstrap 9094:9094 -n kafka &
kubectl port-forward pod/my-cluster-dual-role-0 9094:9094 -n kafka &
kubectl port-forward pod/my-cluster-dual-role-1 9095:9094 -n kafka &
kubectl port-forward pod/my-cluster-dual-role-2 9096:9094 -n kafka &

# Forward Schema Registry
kubectl port-forward svc/schema-registry 8080:8080 -n kafka &
```

### Step 2: Local Client Configuration (Java/Spring)
Update your `application.yml` to point to the local forwarded ports.

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9094
    properties:
      # Schema Registry Configuration (Apicurio / Confluent compatible)
      schema.registry.url: http://localhost:8080/apis/registry/v2
```

### Step 3: Verification
```bash
# Produce
echo "test message" | kafka-console-producer.sh --bootstrap-server localhost:9094 --topic test-topic

# Check Schema Registry Health
curl http://localhost:8080/health
```

---

## 💡 Why this works
Kafka clients perform a "Metadata Request" upon connection. The server responds with a list of brokers and their **Advertised Listeners**.
- Without specific configuration, Kafka would return internal K8s DNS names (e.g., `my-cluster-kafka-0.my-cluster-kafka-brokers.kafka.svc`), which your local machine cannot resolve.
- By setting `advertisedHost: localhost` and mapping unique ports, we trick the client into finding the brokers through the established `kubectl port-forward` tunnels.

