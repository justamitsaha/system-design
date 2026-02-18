package com.saha.amit.soapclient.client;

import com.saha.amit.account.*;
import org.springframework.ws.client.core.support.WebServiceGatewaySupport;

public class AccountClient extends WebServiceGatewaySupport {

    public GetAccountResponse getAccount(String accountNumber) {
        GetAccountRequest request = new GetAccountRequest();
        request.setAccountNumber(accountNumber);

        // This sends the request and automatically unmarshals the XML response into a Java object
        return (GetAccountResponse) getWebServiceTemplate()
                .marshalSendAndReceive("http://localhost:8080/ws", request);
    }

    public AddAccountResponse addAccount(String name, double balance, String type) {
        AddAccountRequest request = new AddAccountRequest();
        request.setHolderName(name);
        request.setBalance(balance);
        request.setAccountType(type);
        return (AddAccountResponse) getWebServiceTemplate()
                .marshalSendAndReceive(request);
    }

    public UpdateAccountResponse updateAccount(String id, double balance) {
        UpdateAccountRequest request = new UpdateAccountRequest();
        request.setAccountNumber(id);
        request.setNewBalance(balance);
        return (UpdateAccountResponse) getWebServiceTemplate()
                .marshalSendAndReceive(request);
    }
}