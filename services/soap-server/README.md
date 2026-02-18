# SOAP Server (Contract-first)

## What this does
- Exposes a SOAP endpoint at: `http://localhost:8080/ws` sample below
- Exposes WSDL at: `http://localhost:8080/ws/accounts.wsdl` or customer xsd at `http://localhost:8080/ws/customers.wsdl`

## Build + Run
```bash
mvn clean package
mvn spring-boot:run
```

## Test with curl
```bash
curl -i -X POST http://localhost:8080/ws   -H "Content-Type: text/xml; charset=utf-8"   -d @request.xml
```
We have to send request like this to server via request.xml file which would have below content
Example `request.xml`:
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:acc="http://com.saha.amit/account">
    <soapenv:Header/>
    <soapenv:Body>
        <acc:AddAccountRequest>
            <acc:holderName>Direct SOAP User</acc:holderName>
            <acc:balance>999.00</acc:balance>
            <acc:accountType>Savings</acc:accountType>
        </acc:AddAccountRequest>
    </soapenv:Body>
</soapenv:Envelope>
```

Proxied REST Call (The "Modern" Way)
When you call port 8081, you are talking to your Spring Boot Client, which acts as a translator.

```bash
curl -X GET "http://localhost:8081/api/accounts/1" \
     -H "Accept: application/json"
     
curl -X POST "http://localhost:8081/api/accounts" \
     -H "Content-Type: application/json" \
     -d '{
           "holderName": "Amit Saha",
           "balance": 5000,
           "accountType": "SAVINGS"
         }'
         
curl -X PUT "http://localhost:8081/api/accounts/1" \
     -H "Content-Type: application/json" \
     -d '{
           "accountNumber": "1",
           "newBalance": 8000
         }'      
         
curl http://localhost:8081/api/customers/123                 
```
# Other SOAP features

## 1. ACID Transactions (WS-AtomicTransaction)

This is the "Killer Feature" for Banking.

-   **REST:** If you need to withdraw money from a Java service and deposit it into a Python service, and the Python service fails, you have to write manual "compensating logic" to put the money back.

-   **SOAP:** It supports **Distributed Transactions**. You can wrap multiple calls to different servers in a single transaction. If one fails, the entire chain rolls back automatically at the protocol level.



### - How it works (The Two-Phase Commit)

Unlike REST, where each call is independent, WS-AtomicTransaction uses a **Coordinator** to manage the lifecycle of a transaction across different services. It follows the **Two-Phase Commit (2PC)** pattern:

-   **Phase 1 (Prepare):** The Coordinator asks all participating services (e.g., your Account Service and a separate Tax Service), "Can you commit this change?" The services reserve the resources but don't finalize the save yet.

-   **Phase 2 (Commit/Rollback):** If _all_ services say "Yes," the Coordinator tells them to commit. If even _one_ fails or says "No," the Coordinator tells everyone to roll back.


----------

### - Implementing it Locally

To implement this on your machine, you need more than just Spring Boot; you need a **Transaction Manager** that supports the WS-T (Web Services Transactions) specifications.

### - The Tools

-   **Arjuna / Narayana:** This is the most popular open-source transaction manager for Java (used in WildFly/JBoss) that supports WS-AtomicTransaction.

-   **Spring WS + JTA:** You would integrate Narayana into your Spring Boot apps using **JTA (Java Transaction API)**.


### -The Code Logic

Instead of a simple method, your client would start a "User Transaction" that wraps multiple SOAP calls:

Java

```
// Conceptual logic using a JTA UserTransaction
userTransaction.begin(); 
try {
    accountClient.withdraw("1", 500.00); // Call SOAP Server A
    taxClient.recordTax("1", 50.00);     // Call SOAP Server B
    userTransaction.commit();            // Both finalize at once
} catch (Exception e) {
    userTransaction.rollback();          // Both undo if any part fails
}

```

----------

### - Why this is hard in the "Modern" World

This is a great talking point for a System Design interview. **WS-AtomicTransaction** is powerful, but it has a major weakness: **It is slow.**

-   **Blocking:** Because services have to "lock" data during Phase 1, other users might be blocked from accessing those accounts until the transaction finishes.

-   **Scaling:** In massive systems (like Amazon or Netflix), 2PC is often avoided because it creates a "bottleneck" where the whole system moves only as fast as its slowest service.

## 2. Formal Service Discovery (The WSDL)

-   **REST:** You usually need external documentation (Swagger/OpenAPI). If the documentation is out of date, the client breaks.

-   **SOAP:** The WSDL is a **machine-readable contract**. Tools like SoapUI or your JAXB plugin can read a WSDL and generate a 100% accurate client automatically. It provides "Type Safety" across different programming languages.


## 3. Advanced Security (WS-Security)

While REST relies mostly on HTTPS (security during transport), SOAP has security built into the **message itself**.

-   **Element-Level Encryption:** You can encrypt _only_ the credit card field in the XML while leaving the rest of the message readable for routing.

-   **Digital Signatures:** You can sign the XML body so the receiver can prove that the data wasn't tampered with, even after it passes through five different proxy servers.


## 4. Statefulness and Reliability (WS-ReliableMessaging)

-   **REST:** If the network blips while sending a request, the request is lost unless you write "retry" code.

-   **SOAP:** It has built-in acknowledgement and retry logic. It ensures that messages are delivered **exactly once** and in the **correct order**, regardless of network instability.


----------

## 5. Protocol Independence

REST is strictly tied to **HTTP/HTTPS**. SOAP is not.

-   You can send a SOAP message over **SMTP (Email)**, **JMS (Message Queues)**, or even **TCP**.

-   In legacy systems, it's common to see a Java app drop a SOAP XML file into a MQ Series queue for a Mainframe to pick up later. REST can't do that.