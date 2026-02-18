package com.saha.amit.soapserver.dao;

import org.springframework.ws.soap.server.endpoint.annotation.SoapFault;
import org.springframework.ws.soap.server.endpoint.annotation.FaultCode;

@SoapFault(faultCode = FaultCode.CUSTOM, customFaultCode = "{http://com.saha.amit/account}001_ACCOUNT_NOT_FOUND")
public class AccountNotFoundException extends RuntimeException {
    public AccountNotFoundException(String message) {
        super(message);
    }
}
