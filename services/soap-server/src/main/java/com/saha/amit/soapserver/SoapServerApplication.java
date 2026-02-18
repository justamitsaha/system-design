package com.saha.amit.soapserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SoapServerApplication {

    public static void main(String[] args) {
        // This starts the embedded Tomcat server on port 8080 by default
        SpringApplication.run(SoapServerApplication.class, args);
    }
}
