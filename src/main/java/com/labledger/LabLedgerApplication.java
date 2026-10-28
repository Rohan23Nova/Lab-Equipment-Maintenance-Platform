package com.labledger;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LabLedgerApplication {

    public static void main(String[] args) {
        SpringApplication.run(LabLedgerApplication.class, args);
    }
}
