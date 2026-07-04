# How to expose your API?

If you have a set of Spring Boot APIs, there are several deployment and exposure patterns depending on where your consumers are, your infrastructure, and your scalability requirements.

A useful way to think about it is:

-   Where is the application hosted?
-   How does traffic reach it?
-   How are security and routing handled?

* * *

## 1. Direct VM Deployment (Traditional)

```
Internet
    │
Firewall
    │
Spring Boot Application (Tomcat Embedded)
    │
Database
```

Deploy the Spring Boot JAR directly on:

-   Physical server
-   VM
-   EC2
-   VMware
-   Hyper-V

Example

```
java -jar order-service.jar
```

Expose

```
https://company.com:8080/orders
```

### Pros

-   Simple
-   Easy to debug
-   No containers

### Cons

-   Manual deployment
-   Hard to scale
-   Version management is difficult

Suitable for

-   Small applications
-   Internal enterprise APIs

* * *

## 2. Reverse Proxy Pattern

```
Internet
      │
   Nginx
      │
Spring Boot
```

Instead of exposing Spring Boot directly, expose Nginx.

Example

```
Internet
    │
443
    │
Nginx
 ├── /orders
 ├── /customers
 └── /payments
```

Routes

```
/orders -> localhost:8081

/customers -> localhost:8082

/payments -> localhost:8083
```

Benefits

-   SSL termination
-   Compression
-   Static content
-   Load balancing

Very common on-prem deployment.

* * *

## 3. Hardware Load Balancer

```
Internet
      │
 F5 / Citrix ADC
      │
Multiple Spring Boot Servers
```

```
             Load Balancer
          /       |       \
      Server1  Server2  Server3
```

Benefits

-   High Availability
-   Health Checks
-   Session persistence

Very common in banks.

* * *

## 4. Cloud Load Balancer

Example AWS

```
Internet
      │
ALB
      │
EC2
```

or

```
Internet
      │
ALB
      │
ECS
```

or

```
Internet
      │
ALB
      │
EKS
```

Features

-   SSL
-   Auto Scaling
-   WAF integration
-   Health checks

* * *

## 5. API Gateway Pattern

```
Clients
    │
API Gateway
    │
-----------------------
| Order Service
| User Service
| Payment Service
-----------------------
```

Gateway responsibilities

-   Authentication
-   Authorization
-   Rate limiting
-   Routing
-   Logging
-   Request transformation

Examples

-   Spring Cloud Gateway
-   Kong
-   Apigee
-   WSO2 API Manager
-   Amazon API Gateway

Most microservice architectures use this.

* * *

## 6. Kubernetes Ingress

```
Internet
     │
Ingress
     │
-----------------------
Pods
Pods
Pods
```

Example

```
orders.company.com

customers.company.com
```

Ingress routes traffic to the correct service.

Common controllers

-   NGINX Ingress Controller
-   Traefik
-   HAProxy Ingress

* * *

## 7. Service Mesh

```
Internet
      │
Gateway
      │
Service Mesh
      │
Microservices
```

The service mesh manages

-   mTLS
-   Retries
-   Circuit Breaking
-   Traffic Splitting
-   Observability

Examples

-   Istio
-   Linkerd

Large enterprises use this.

* * *

## 8. Private APIs

No Internet.

```
Internal Users
      │
VPN
      │
Spring Boot
```

or

```
Corporate Network
      │
Internal Load Balancer
      │
Spring Boot
```

Very common in banks.

* * *

## 9. Public + Private APIs

```
               Internet
                  │
          Public Load Balancer
                  │
          Public APIs

---------------- Firewall ----------------

          Internal Load Balancer
                  │
          Internal APIs
```

Example

```
Public

/api/customer/login

Internal

/api/customer/sync

/api/customer/reconciliation
```

* * *

## 10. Hybrid Cloud

```
           Internet
                │
          Cloud Gateway
           /         \
AWS         On-Prem
```

Some APIs stay on-prem.

Some APIs move to cloud.

Very common during migration.

* * *

## 11. CDN + API

For global users.

```
Clients
    │
CloudFront
    │
API Gateway
    │
Spring Boot
```

The CDN caches responses and reduces latency for cacheable content.

* * *

## 12. Multi-Region

```
             DNS
          /       \
Region A      Region B
```

Each region has

-   Load Balancer
-   Spring Boot
-   Database

Provides Disaster Recovery.

* * *

## 13. Kubernetes + API Gateway

One of the most common modern cloud architectures.

```
                 Internet
                      │
                 API Gateway
                      │
                  Load Balancer
                      │
                  Ingress
                      │
────────────────────────────────
Order Service

Payment Service

Inventory Service

Customer Service
────────────────────────────────
                      │
                 PostgreSQL
```

* * *

## 14. On-Prem Enterprise Pattern (Typical Bank)

```
Internet
    │
Firewall
    │
DMZ
    │
F5 Load Balancer
    │
API Gateway
    │
Firewall
    │
Application Servers
    │
Spring Boot
    │
Oracle Database
```

Characteristics

-   Multiple firewalls
-   DMZ isolation
-   Hardware load balancers
-   Strict network segmentation
-   Internal-only databases

This is common in financial institutions.

* * *

# Comparison

| Pattern | On-Prem | Cloud | Scale | Typical Use |
| --- | --- | --- | --- | --- |
| Direct VM | ✓   | ✓   | Low | Small apps |
| Reverse Proxy | ✓   | ✓   | Medium | Enterprise web apps |
| Hardware Load Balancer | ✓   | No  | High | Large on-prem deployments |
| Cloud Load Balancer | No  | ✓   | High | Cloud-native apps |
| API Gateway | ✓   | ✓   | Very High | Microservices |
| Kubernetes Ingress | ✓   | ✓   | Very High | Container platforms |
| Service Mesh | ✓   | ✓   | Very High | Large microservice ecosystems |
| Private APIs | ✓   | ✓   | Medium | Internal enterprise services |
| Hybrid Cloud | ✓   | ✓   | High | Cloud migration |
| Multi-Region | Mostly Cloud | ✓   | Very High | Global, highly available services |