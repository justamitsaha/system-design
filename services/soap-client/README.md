# SOAP Client (Contract-first)

## What this does
- Generates JAXB classes from `employee.xsd`.
- Calls the SOAP server running at `soap.server.url` (default `http://localhost:8080/ws`).

## Run
Start the server first (see ../soap-server).

Then:
```bash
mvn clean package
mvn spring-boot:run
```

Expected output:
```
SOAP Response => name=Amit Saha, department=BFSI
```

## Change server URL
Edit `src/main/resources/application.properties`:
```
soap.server.url=http://localhost:8080/ws
```
