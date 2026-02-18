package com.saha.amit.soapclient.client;


import com.saha.amit.account.GetCustomerRequest;
import com.saha.amit.account.GetCustomerResponse;
import org.springframework.ws.client.core.support.WebServiceGatewaySupport;

public class CustomerClient extends WebServiceGatewaySupport {

    public GetCustomerResponse getCustomer(String customerId) {
        GetCustomerRequest request = new GetCustomerRequest();
        request.setCustomerId(customerId);

        return (GetCustomerResponse) getWebServiceTemplate()
                .marshalSendAndReceive(request);
    }
}