package com.aziz.employeeservice.controllers;

import com.aziz.employeeservice.entities.Document;
import com.aziz.employeeservice.services.DocumentService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Contrôleur REST pour la gestion des documents des employés.
 * Permet l'upload, le téléchargement et la suppression de fichiers (CV, certificats, etc.).
 */
@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    /** Upload un document pour un employé (RH Admin) */
    @PostMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Document> uploadDocument(
            @PathVariable Long employeeId,
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(documentService.uploadDocument(employeeId, file));
    }

    /** Liste les documents d'un employé (RH Admin) */
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<List<Document>> getDocumentsByEmployee(@PathVariable Long employeeId) {
        return ResponseEntity.ok(documentService.getDocumentsByEmployee(employeeId));
    }

    /** Liste mes propres documents (Employé connecté) */
    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<Document>> getMyDocuments(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaim("preferred_username");
        return ResponseEntity.ok(documentService.getMyDocuments(username));
    }

    /** Télécharge un document */
    @GetMapping("/{documentId}/download")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<Resource> downloadDocument(@PathVariable Long documentId) throws IOException {
        Document document = documentService.getDocumentById(documentId);
        Resource resource = documentService.downloadDocument(documentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.getFileName() + "\"")
                .body(resource);
    }

    /** Supprime un document (RH Admin) */
    @DeleteMapping("/{documentId}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long documentId) throws IOException {
        documentService.deleteDocument(documentId);
        return ResponseEntity.noContent().build();
    }
}
