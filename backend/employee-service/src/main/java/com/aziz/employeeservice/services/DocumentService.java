package com.aziz.employeeservice.services;

import com.aziz.employeeservice.entities.Document;
import com.aziz.employeeservice.entities.Employee;
import com.aziz.employeeservice.repositories.DocumentRepository;
import com.aziz.employeeservice.repositories.EmployeeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Service métier pour la gestion des documents des employés.
 * Gère l'upload, le téléchargement et la suppression de fichiers sur le disque.
 */
@Service
@Transactional
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;
    private final Path uploadDir;

    public DocumentService(DocumentRepository documentRepository,
                           EmployeeRepository employeeRepository,
                           @Value("${app.upload.dir:./uploads}") String uploadDir) {
        this.documentRepository = documentRepository;
        this.employeeRepository = employeeRepository;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    /** Upload un document pour un employé */
    public Document uploadDocument(Long employeeId, MultipartFile file) throws IOException {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employé non trouvé avec l'ID: " + employeeId));

        // Créer le répertoire de l'employé s'il n'existe pas
        Path employeeDir = uploadDir.resolve(String.valueOf(employeeId));
        Files.createDirectories(employeeDir);

        // Générer un nom unique pour éviter les collisions
        String uniqueFileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = employeeDir.resolve(uniqueFileName);

        // Sauvegarder le fichier sur le disque
        Files.copy(file.getInputStream(), filePath);

        // Créer l'entité Document en base
        Document document = Document.builder()
                .fileName(file.getOriginalFilename())
                .fileType(file.getContentType())
                .filePath(employeeId + "/" + uniqueFileName)
                .uploadDate(LocalDate.now())
                .employee(employee)
                .build();

        return documentRepository.save(document);
    }

    /** Liste les documents d'un employé */
    @Transactional(readOnly = true)
    public List<Document> getDocumentsByEmployee(Long employeeId) {
        return documentRepository.findByEmployee_Id(employeeId);
    }

    /** Liste les documents de l'employé connecté via son username Keycloak */
    @Transactional(readOnly = true)
    public List<Document> getMyDocuments(String keycloakUsername) {
        return employeeRepository.findByKeycloakUsername(keycloakUsername)
                .map(emp -> documentRepository.findByEmployee_Id(emp.getId()))
                .orElse(List.of());
    }

    /** Télécharge un document (retourne la ressource fichier) */
    @Transactional(readOnly = true)
    public Resource downloadDocument(Long documentId) throws IOException {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document non trouvé avec l'ID: " + documentId));

        Path filePath = uploadDir.resolve(document.getFilePath()).normalize();
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            throw new RuntimeException("Fichier non trouvé sur le disque: " + document.getFileName());
        }

        return resource;
    }

    /** Récupère un document par son ID */
    @Transactional(readOnly = true)
    public Document getDocumentById(Long documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document non trouvé avec l'ID: " + documentId));
    }

    /** Supprime un document (fichier + base de données) */
    public void deleteDocument(Long documentId) throws IOException {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document non trouvé avec l'ID: " + documentId));

        // Supprimer le fichier du disque
        Path filePath = uploadDir.resolve(document.getFilePath()).normalize();
        Files.deleteIfExists(filePath);

        // Supprimer l'entité de la base
        documentRepository.delete(document);
    }
}
