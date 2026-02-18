package com.saha.amit.soapserver.dao;

import com.saha.amit.account.GetAccountResponse;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AccountsDAO {

    public static List<GetAccountResponse> accountResponseList = new ArrayList<>();

    {
        GetAccountResponse response1 = new GetAccountResponse();
        response1.setHolderName("Amit Saha");
        response1.setBalance(1500.75);
        response1.setAccountType("Current");

        GetAccountResponse response2 = new GetAccountResponse();
        response2.setHolderName("John Doe");
        response2.setBalance(2500.00);
        response2.setAccountType("Savings");

        GetAccountResponse response3 = new GetAccountResponse();
        response3.setHolderName("Jane Smith");
        response3.setBalance(3000.50);
        response3.setAccountType("Current");

        accountResponseList.add(response1);
        accountResponseList.add(response2);
        accountResponseList.add(response3);
    }

    public GetAccountResponse getAccount(String accountNumber) {
        GetAccountResponse response;
        if ("1".equals(accountNumber)) {
            response= accountResponseList.getFirst();
        } else if ("2".equals(accountNumber)) {
            response= accountResponseList.get(1);
        } else if ("3".equals(accountNumber)){
            response = accountResponseList.get(2);
        } else {
            response = null;
        }
        return response;
    }

    public String addAccount(String name, double balance, String type) {
        GetAccountResponse newAcc = new GetAccountResponse();
        newAcc.setHolderName(name);
        newAcc.setBalance(balance);
        newAcc.setAccountType(type);
        accountResponseList.add(newAcc);
        return String.valueOf(accountResponseList.size()); // Return new ID
    }

    public boolean updateBalance(String accountNumber, double newBalance) {
        int index = Integer.parseInt(accountNumber) - 1;
        if (index >= 0 && index < accountResponseList.size()) {
            accountResponseList.get(index).setBalance(newBalance);
            return true;
        }
        return false;
    }
}
