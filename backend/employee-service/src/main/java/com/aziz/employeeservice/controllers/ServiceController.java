package com.aziz.employeeservice.controllers;

import com.aziz.employeeservice.entities.ServiceEntity;
import com.aziz.employeeservice.services.ServiceEntityService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST pour la gestion des services au sein des départements.
 */
@RestController
@RequestMapping("/api/services")
public class ServiceController {

    private final ServiceEntityService serviceEntityService;

    public ServiceController(ServiceEntityService serviceEntityService) {
        this.serviceEntityService = serviceEntityService;
    }

    /** Liste tous les services */
    @GetMapping
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<ServiceEntity>> getAllServices() {
        return ResponseEntity.ok(serviceEntityService.getAllServices());
    }

    /** Liste les services d'un département */
    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<ServiceEntity>> getServicesByDepartment(@PathVariable Long departmentId) {
        return ResponseEntity.ok(serviceEntityService.getServicesByDepartment(departmentId));
    }

    /** Récupère un service par son ID */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('HR_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<ServiceEntity> getServiceById(@PathVariable Long id) {
        return serviceEntityService.getServiceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Crée un nouveau service */
    @PostMapping
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<ServiceEntity> createService(@RequestBody ServiceEntity serviceEntity) {
        return ResponseEntity.ok(serviceEntityService.createService(serviceEntity));
    }

    /** Met à jour un service */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<ServiceEntity> updateService(@PathVariable Long id, @RequestBody ServiceEntity serviceEntity) {
        return ResponseEntity.ok(serviceEntityService.updateService(id, serviceEntity));
    }

    /** Supprime un service */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR_ADMIN')")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        serviceEntityService.deleteService(id);
        return ResponseEntity.noContent().build();
    }
}
