package com.aziz.recruitmentservice.dto;

import com.aziz.recruitmentservice.entities.ConventionStatus;
import com.aziz.recruitmentservice.entities.DeliveryMode;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Payload de création/modification d'un organisme de formation (admin).
 * skillIds : IDs des Skills couvertes, résolus côté serveur via SkillRepository.
 */
@Data
@NoArgsConstructor
public class TrainingProviderRequest {
    private String name;
    private String description;
    private String website;
    private String contactEmail;
    private List<Long> skillIds = new ArrayList<>();
    private boolean qualiopiCertified;
    private ConventionStatus conventionStatus;
    private Integer avgPriceEur;
    private Integer avgDurationDays;
    private DeliveryMode deliveryMode;
    private Double pastSuccessRate;
}
