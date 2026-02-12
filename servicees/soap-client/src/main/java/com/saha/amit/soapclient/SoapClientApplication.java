package com.saha.amit.soapclient;

import com.saha.amit.soapclient.client.EmployeeSoapClient;
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
  CommandLineRunner run(EmployeeSoapClient client) {
    return args -> {
      var resp = client.getEmployee(1001);
      System.out.println("SOAP Response => name=" + resp.getName() + ", department=" + resp.getDepartment());
    };
  }
}
