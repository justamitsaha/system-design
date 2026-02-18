package com.saha.amit.soapclient.controller;

import com.saha.amit.account.GetCustomerResponse;
import com.saha.amit.soapclient.client.CustomerClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/customers")
public class CustomerController {

    private final CustomerClient customerClient;

    public CustomerController(CustomerClient customerClient) {
        this.customerClient = customerClient;
    }

    @GetMapping("/{id}")
    public GetCustomerResponse getCustomer(@PathVariable String id) {
        return customerClient.getCustomer(id);
    }
}