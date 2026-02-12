# SOAP Server (Contract-first)

## What this does
- Exposes a SOAP endpoint at: `http://localhost:8080/ws`
- Exposes WSDL at: `http://localhost:8080/ws/employee.wsdl`

## Build + Run
```bash
mvn clean package
mvn spring-boot:run
```

## Test with curl
```bash
curl -i -X POST http://localhost:8080/ws   -H "Content-Type: text/xml; charset=utf-8"   -d @request.xml
```

Example `request.xml`:
```xml
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:emp="http://example.com/employee">
  <soapenv:Header/>
  <soapenv:Body>
    <emp:GetEmployeeRequest>
      <emp:employeeId>1001</emp:employeeId>
    </emp:GetEmployeeRequest>
  </soapenv:Body>
</soapenv:Envelope>
```
