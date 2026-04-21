package com.aziz.employeeservice.services;

import com.aziz.employeeservice.entities.Department;
import com.aziz.employeeservice.entities.ServiceEntity;
import com.aziz.employeeservice.repositories.DepartmentRepository;
import com.aziz.employeeservice.repositories.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service métier pour la gestion des services au sein des départements.
 * Réservé aux RH Admin.
 */
@Service
@Transactional
public class ServiceEntityService {

    private final ServiceRepository serviceRepository;
    private final DepartmentRepository departmentRepository;

    public ServiceEntityService(ServiceRepository serviceRepository,
                                DepartmentRepository departmentRepository) {
        this.serviceRepository = serviceRepository;
        this.departmentRepository = departmentRepository;
    }

    /** Liste tous les services */
    @Transactional(readOnly = true)
    public List<ServiceEntity> getAllServices() {
        return serviceRepository.findAll();
    }

    /** Liste les services d'un département donné */
    @Transactional(readOnly = true)
    public List<ServiceEntity> getServicesByDepartment(Long departmentId) {
        return serviceRepository.findByDepartmentId(departmentId);
    }

    /** Récupère un service par son ID */
    @Transactional(readOnly = true)
    public Optional<ServiceEntity> getServiceById(Long id) {
        return serviceRepository.findById(id);
    }

    /** Crée un nouveau service dans un département */
    public ServiceEntity createService(ServiceEntity serviceEntity) {
        // Vérifier que le département existe
        if (serviceEntity.getDepartment() != null && serviceEntity.getDepartment().getId() != null) {
            Department dept = departmentRepository.findById(serviceEntity.getDepartment().getId())
                    .orElseThrow(() -> new RuntimeException("Département non trouvé avec l'ID: " + serviceEntity.getDepartment().getId()));
            serviceEntity.setDepartment(dept);
        }
        return serviceRepository.save(serviceEntity);
    }

    /** Met à jour un service existant */
    public ServiceEntity updateService(Long id, ServiceEntity serviceDetails) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service non trouvé avec l'ID: " + id));

        service.setName(serviceDetails.getName());
        service.setDescription(serviceDetails.getDescription());

        if (serviceDetails.getDepartment() != null && serviceDetails.getDepartment().getId() != null) {
            Department dept = departmentRepository.findById(serviceDetails.getDepartment().getId())
                    .orElseThrow(() -> new RuntimeException("Département non trouvé avec l'ID: " + serviceDetails.getDepartment().getId()));
            service.setDepartment(dept);
        }

        return serviceRepository.save(service);
    }

    /** Supprime un service */
    public void deleteService(Long id) {
        serviceRepository.deleteById(id);
    }
}
