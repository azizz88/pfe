package com.aziz.recruitmentservice.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Payload de création d'une proposition de formation par un manager.
 * Le manager construit ce payload typiquement à partir d'une suggestion IA.
 */
@Data
@NoArgsConstructor
public class TrainingProposalCreateRequest {
    private String employeeMatricule;
    private String employeeName;
    private String employeeEmail;
    private Long providerId;
    private Long sourceApplicationId;
    private List<Long> missingSkillIds = new ArrayList<>();
    private Integer aiScore;
    private String aiJustification;
    private String aiSource;
    private String managerNotes;
}
