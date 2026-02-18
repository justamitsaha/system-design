package com.saha.amit.soapserver.endpoint;

import com.saha.amit.account.GetCustomerRequest;
import com.saha.amit.account.GetCustomerResponse;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

@Endpoint
public class CustomerEndpoint {
    private static final String NAMESPACE = "http://com.saha.amit/customer";

    @PayloadRoot(namespace = NAMESPACE, localPart = "GetCustomerRequest")
    @ResponsePayload
    public GetCustomerResponse getCustomer(@RequestPayload GetCustomerRequest request) {
        GetCustomerResponse response = new GetCustomerResponse();
        response.setFirstName("Amit");
        response.setEmail("amit@example.com");
        response.setPhone("+91-1234567890");
        return response;
    }
}