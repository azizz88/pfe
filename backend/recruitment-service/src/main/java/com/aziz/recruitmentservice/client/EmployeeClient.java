package com.aziz.recruitmentservice.client;

import com.aziz.recruitmentservice.dto.CandidateProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;

/**
 * Client REST pour appeler employee-service depuis recruitment-service.
 * Relaye le JWT de la requête courante pour respecter la sécurité Keycloak.
 */
@Component
public class EmployeeClient {

    private static final Logger log = LoggerFactory.getLogger(EmployeeClient.class);

    private final RestTemplate restTemplate;
    private final String employeeServiceUrl;

    public EmployeeClient(
            RestTemplate restTemplate,
            @Value("${services.employee-service.url:http://localhost:8081}") String employeeServiceUrl) {
        this.restTemplate = restTemplate;
        this.employeeServiceUrl = employeeServiceUrl;
    }

    /**
     * Récupère le profil complet (employé + compétences) pour un matricule donné.
     * Retourne null si l'employé n'existe pas.
     */
    @SuppressWarnings("unchecked")
    public CandidateProfile getCandidateProfile(String matricule, String bearerToken) {
        try {
            HttpHeaders headers = authHeaders(bearerToken);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            // /lookup/{key} essaie matricule ET keycloakUsername côté employee-service
            // (les anciennes candidatures stockent parfois le username au lieu du matricule)
            ResponseEntity<Map> empResp = restTemplate.exchange(
                    employeeServiceUrl + "/api/employees/lookup/" + matricule,
                    HttpMethod.GET, entity, Map.class);

            if (!empResp.getStatusCode().is2xxSuccessful() || empResp.getBody() == null) return null;
            Map<String, Object> emp = empResp.getBody();

            ResponseEntity<List> skillsResp = restTemplate.exchange(
                    employeeServiceUrl + "/api/employees/lookup/" + matricule + "/skills",
                    HttpMethod.GET, entity, List.class);

            List<Map<String, Object>> skillsRaw = skillsResp.getBody() != null
                    ? skillsResp.getBody()
                    : Collections.emptyList();

            List<CandidateProfile.CandidateSkill> skills = new ArrayList<>();
            for (Map<String, Object> s : skillsRaw) {
                Long skillId = toLong(s.get("skillId"));
                String name = (String) s.get("skillName");
                Integer level = toInt(s.get("level"));
                skills.add(new CandidateProfile.CandidateSkill(skillId, name, level));
            }

            String firstName = (String) emp.get("firstName");
            String lastName = (String) emp.get("lastName");
            LocalDate hireDate = emp.get("hireDate") != null
                    ? LocalDate.parse(emp.get("hireDate").toString())
                    : null;

            // On renvoie le VRAI matricule de l'employé (pas la clé de lookup) pour la cohérence aval
            String realMatricule = emp.get("matricule") != null ? emp.get("matricule").toString() : matricule;
            return new CandidateProfile(realMatricule, (firstName + " " + lastName).trim(), hireDate, skills);
        } catch (Exception e) {
            // Employé introuvable ou erreur réseau → on l'écarte du matching mais on log
            log.warn("Échec chargement profil matricule={} url={} → {}: {}",
                    matricule, employeeServiceUrl, e.getClass().getSimpleName(), e.getMessage());
            return null;
        }
    }

    private HttpHeaders authHeaders(String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        if (bearerToken != null && !bearerToken.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken);
        }
        return headers;
    }

    private Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).longValue();
        return Long.parseLong(o.toString());
    }

    private Integer toInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number) return ((Number) o).intValue();
        return Integer.parseInt(o.toString());
    }
}
