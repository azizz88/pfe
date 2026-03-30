package com.aziz.recruitmentservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée du microservice Recruitment-Service.
 * Gère les offres d'emploi, candidatures et entretiens.
 */
@SpringBootApplication
public class RecruitmentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(RecruitmentServiceApplication.class, args);
    }
}
