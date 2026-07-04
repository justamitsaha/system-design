# Kubernetes Operations Cheat Sheet

This document lists the most common commands you'll need to manage and debug your microservice patterns playground.

---

## 🔍 1. Inspecting Resources

### Get Pods (Status Check)
See what is running, what is failing, and where they are located.
```bash
# List all pods in the infra namespace
kubectl get pods -n infra

# List pods with more detail (Node IP, Pod IP)
kubectl get pods -n infra -o wide
```

### Get Services (Networking Check)
See the internal ClusterIPs and ports.
```bash
kubectl get svc -n infra
```

---

## 🐛 2. Debugging & Logs

### View Container Logs
The most important command for finding out why an application is crashing.
```bash
# Get logs for a specific pod
kubectl logs <POD_NAME> -n infra

# Stream logs in real-time (Follow)
kubectl logs -f <POD_NAME> -n infra

# Get logs for all pods with a specific label
kubectl logs -l app=postgres -n infra
```

### Describe Resource
Use this when a pod is stuck in `Pending` or `ImagePullBackOff`. It shows the "Events" log.
```bash
kubectl describe pod <POD_NAME> -n infra
```

### Execute Command Inside Container
Open a shell inside a running pod (like Postgres) to run manual SQL or check files.
```bash
kubectl exec -it <POD_NAME> -n infra -- /bin/sh
```

---

## ⚙️ 3. Cluster Management

### Context & Config
Ensure your terminal is talking to the correct AWS cluster.
```bash
# Sync local config with AWS
aws eks update-kubeconfig --name microservice-eks-cluster --region us-east-1

# List your current contexts
kubectl config get-contexts
```

---

## 🚀 4. Applying Changes

### Force Restart a Pod
Useful if you've updated a ConfigMap or secret and need the application to reload it.
```bash
kubectl rollout restart deployment <DEPLOYMENT_NAME> -n infra
```

### Delete & Re-apply
```bash
kubectl delete -f path/to/manifest.yaml
kubectl apply -f path/to/manifest.yaml
```
