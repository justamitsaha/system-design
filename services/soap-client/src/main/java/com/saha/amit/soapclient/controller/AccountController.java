package com.saha.amit.soapclient.controller;

import com.saha.amit.account.*;
import com.saha.amit.soapclient.client.AccountClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.ws.soap.client.SoapFaultClientException;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountClient accountClient;

    public AccountController(AccountClient accountClient) {
        this.accountClient = accountClient;
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAccount(@PathVariable String id) {
        try {
            return ResponseEntity.ok(accountClient.getAccount(id));
        } catch (SoapFaultClientException e) {
            return ResponseEntity.status(404).body(e.getFaultStringOrReason());
        }
    }

    @PostMapping
    public AddAccountResponse create(@RequestBody AddAccountRequest req) {
        return accountClient.addAccount(req.getHolderName(), req.getBalance(), req.getAccountType());
    }

    @PutMapping("/{id}")
    public UpdateAccountResponse update(@PathVariable String id, @RequestBody UpdateAccountRequest req) {
        return accountClient.updateAccount(id, req.getNewBalance());
    }
}