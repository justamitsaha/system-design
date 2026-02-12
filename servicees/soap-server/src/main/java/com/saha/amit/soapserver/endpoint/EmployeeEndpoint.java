package com.saha.amit.soapserver.endpoint;

import com.saha.amit.employee.GetEmployeeRequest;
import com.saha.amit.employee.GetEmployeeResponse;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

@Endpoint
public class EmployeeEndpoint {

  private static final String NAMESPACE_URI = "http://example.com/employee";

  @PayloadRoot(namespace = NAMESPACE_URI, localPart = "GetEmployeeRequest")
  @ResponsePayload
  public GetEmployeeResponse getEmployee(@RequestPayload GetEmployeeRequest request) {
    GetEmployeeResponse response = new GetEmployeeResponse();

    int id = request.getEmployeeId();
    if (id == 1001) {
      response.setName("Amit Saha");
      response.setDepartment("BFSI");
    } else if (id == 1002) {
      response.setName("John Doe");
      response.setDepartment("Retail Banking");
    } else {
      response.setName("Unknown");
      response.setDepartment("N/A");
    }

    return response;
  }
}
