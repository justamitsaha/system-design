# Two-Project SOAP Learning Setup (Maven)

This bundle contains **two independent Maven projects**:
- `soap-server`: Contract-first SOAP server exposing a WSDL.
- `soap-client`: Contract-first SOAP client calling the server.

## Quick Start

### 1) Start Server
```bash
cd soap-server
mvn clean package
mvn spring-boot:run
```
WSDL: http://localhost:8080/ws/employee.wsdl

### 2) Run Client
Open a new terminal:
```bash
cd soap-client
mvn clean package
mvn spring-boot:run
```

## IntelliJ Tips
- Import each folder (`soap-server`, `soap-client`) as a separate Maven project.
- Run Maven goal `generate-sources` if IntelliJ doesn't pick up generated JAXB classes.
- Mark `target/generated-sources/jaxb` as **Generated Sources Root** if needed.
