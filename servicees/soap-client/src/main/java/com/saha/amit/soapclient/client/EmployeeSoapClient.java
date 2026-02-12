package com.saha.amit.soapclient.client;

import com.saha.amit.employee.GetEmployeeRequest;
import com.saha.amit.employee.GetEmployeeResponse;
import org.springframework.stereotype.Service;
import org.springframework.ws.client.core.WebServiceTemplate;

@Service
public class EmployeeSoapClient {

  private final WebServiceTemplate webServiceTemplate;

  public EmployeeSoapClient(WebServiceTemplate webServiceTemplate) {
    this.webServiceTemplate = webServiceTemplate;
  }

  public GetEmployeeResponse getEmployee(int employeeId) {
    GetEmployeeRequest request = new GetEmployeeRequest();
    request.setEmployeeId(employeeId);

    Object response = webServiceTemplate.marshalSendAndReceive(request);
    return (GetEmployeeResponse) response;
  }
}
