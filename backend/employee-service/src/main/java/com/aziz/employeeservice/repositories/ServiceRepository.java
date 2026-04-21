package com.aziz.employeeservice.repositories;

import com.aziz.employeeservice.entities.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour l'accès aux données des services.
 */
@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {

    /** Liste les services d'un département donné */
    List<ServiceEntity> findByDepartmentId(Long departmentId);
}
