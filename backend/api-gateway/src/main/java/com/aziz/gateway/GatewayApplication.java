package com.aziz.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée de l'API Gateway.
 * Redirige les requêtes vers Employee-Service et Recruitment-Service.
 * Valide les jetons JWT du realm Keycloak.
 */
@SpringBootApplication
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
