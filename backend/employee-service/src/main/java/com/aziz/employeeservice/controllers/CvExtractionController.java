package com.aziz.employeeservice.controllers;

import com.aziz.employeeservice.dto.CvExtractionResult;
import com.aziz.employeeservice.services.CvSkillExtractionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * Endpoint d'extraction de compétences depuis un CV (PDF/DOCX/TXT).
 * Réservé au RH Admin pendant la création d'un employé.
 */
@RestController
@RequestMapping("/api/cv")
public class CvExtractionController {

    private final CvSkillExtractionService extractionService;

    public CvExtractionController(CvSkillExtractionService extractionService) {
        this.extractionService = extractionService;
    }

    /**
     * Analyse le CV uploadé et retourne les compétences détectées avec niveau estimé.
     * Multipart : champ "file" (PDF, DOCX ou TXT, max 10MB).
     */
    @PostMapping(value = "/extract", consumes = "multipart/form-data")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<CvExtractionResult> extract(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {
        try {
            String token = jwt != null ? jwt.getTokenValue() : null;
            CvExtractionResult result = extractionService.extractFromCv(file, token);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
