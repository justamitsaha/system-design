package com.saha.amit.soapclient.config;

import com.saha.amit.soapclient.client.AccountClient;
import com.saha.amit.soapclient.client.CustomerClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;

@Configuration
public class ClientConfig {

    @Bean
    public Jaxb2Marshaller marshaller() {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        // Match the <packageName> from your pom.xml
        marshaller.setContextPath("com.saha.amit.account");
        return marshaller;
    }

    @Bean
    public AccountClient employeeClient(Jaxb2Marshaller marshaller) {
        AccountClient client = new AccountClient();
        client.setDefaultUri("http://localhost:8080/ws");
        client.setMarshaller(marshaller);
        client.setUnmarshaller(marshaller);
        return client;
    }


    @Bean
    public CustomerClient customerClient(Jaxb2Marshaller marshaller) {
        CustomerClient client = new CustomerClient();
        client.setDefaultUri("http://localhost:8080/ws"); // Same base URL
        client.setMarshaller(marshaller);
        client.setUnmarshaller(marshaller);
        return client;
    }

}
