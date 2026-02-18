package com.saha.amit.soapserver.endpoint;


import com.saha.amit.account.*;
import com.saha.amit.soapserver.dao.AccountNotFoundException;
import com.saha.amit.soapserver.dao.AccountsDAO;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

@Endpoint
public class AccountEndpoint {
    // This MUST match the targetNamespace in your XSD exactly
    private static final String NAMESPACE_URI = "http://com.saha.amit/account";
    private final AccountsDAO accountsDAO;

    public AccountEndpoint(AccountsDAO accountsDAO) {
        this.accountsDAO = accountsDAO;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "GetAccountRequest")
    @ResponsePayload
    public GetAccountResponse getAccount(@RequestPayload GetAccountRequest request) {
        GetAccountResponse response = accountsDAO.getAccount(request.getAccountNumber());

        if (response == null) {
            throw new AccountNotFoundException("Account with ID " + request.getAccountNumber() + " not found.");
        }

        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "AddAccountRequest")
    @ResponsePayload
    public AddAccountResponse addAccount(@RequestPayload AddAccountRequest request) {
        AddAccountResponse response = new AddAccountResponse();
        String newId = accountsDAO.addAccount(request.getHolderName(), request.getBalance(), request.getAccountType());
        response.setStatus("SUCCESS");
        response.setAccountNumber(newId);
        return response;
    }

    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "UpdateAccountRequest")
    @ResponsePayload
    public UpdateAccountResponse updateAccount(@RequestPayload UpdateAccountRequest request) {
        UpdateAccountResponse response = new UpdateAccountResponse();
        boolean updated = accountsDAO.updateBalance(request.getAccountNumber(), request.getNewBalance());
        response.setStatus(updated ? "SUCCESS" : "NOT_FOUND");
        return response;
    }
}
