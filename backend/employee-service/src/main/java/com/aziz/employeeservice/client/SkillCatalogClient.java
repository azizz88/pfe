package com.aziz.employeeservice.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Client REST pour récupérer le catalogue des compétences depuis recruitment-service.
 * Cache simple en mémoire (5 minutes) pour éviter de re-fetcher à chaque extraction.
 */
@Component
public class SkillCatalogClient {

    private final RestTemplate restTemplate;
    private final String recruitmentUrl;

    // Cache simple (TTL 5 min)
    private List<Map<String, Object>> cachedSkills = null;
    private long cacheExpiry = 0;
    private static final long CACHE_TTL_MS = 5 * 60 * 1000L;

    public SkillCatalogClient(
            RestTemplate restTemplate,
            @Value("${services.recruitment-service.url:http://localhost:8082}") String recruitmentUrl) {
        this.restTemplate = restTemplate;
        this.recruitmentUrl = recruitmentUrl;
    }

    /**
     * Retourne la liste des compétences du catalogue.
     * Format : List<Map> avec clés id, name, category, description.
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> getAllSkills(String bearerToken) {
        long now = System.currentTimeMillis();
        if (cachedSkills != null && now < cacheExpiry) {
            return cachedSkills;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            if (bearerToken != null && !bearerToken.isBlank()) {
                headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken);
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<List> resp = restTemplate.exchange(
                    recruitmentUrl + "/api/skills",
                    HttpMethod.GET, entity, List.class);
            List<Map<String, Object>> result = resp.getBody() != null ? resp.getBody() : Collections.emptyList();
            cachedSkills = result;
            cacheExpiry = now + CACHE_TTL_MS;
            return result;
        } catch (Exception e) {
            // Si le catalogue est inaccessible, on retourne une liste vide → extraction renvoie 0 skill
            return Collections.emptyList();
        }
    }

    public void invalidateCache() {
        cachedSkills = null;
        cacheExpiry = 0;
    }
}
