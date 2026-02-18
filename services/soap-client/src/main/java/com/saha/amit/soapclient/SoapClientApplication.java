package com.saha.amit.soapclient;

import com.saha.amit.account.GetAccountResponse;
import com.saha.amit.soapclient.client.AccountClient;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class SoapClientApplication {
    public static void main(String[] args) {
        SpringApplication.run(SoapClientApplication.class, args);
    }

    @Bean
    CommandLineRunner lookup(AccountClient accountClient) {
        return args -> {
            //GetAccountResponse response = accountClient.getAccount("12345");
            //System.err.println("Client received response: " + response.getHolderName());
        };
    }
}