package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.dto.ExternalCandidateRequest;
import com.aziz.recruitmentservice.entities.ExternalCandidate;
import com.aziz.recruitmentservice.entities.ExternalCandidateSkill;
import com.aziz.recruitmentservice.entities.ExternalCandidateSource;
import com.aziz.recruitmentservice.repositories.ExternalCandidateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service métier pour la gestion des candidats externes (pool LinkedIn / cooptation).
 */
@Service
@Transactional
public class ExternalCandidateService {

    private final ExternalCandidateRepository repository;

    public ExternalCandidateService(ExternalCandidateRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ExternalCandidate> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Optional<ExternalCandidate> getById(Long id) {
        return repository.findById(id);
    }

    public ExternalCandidate create(ExternalCandidateRequest req) {
        validateRequiredFields(req);
        repository.findByEmail(req.getEmail()).ifPresent(c -> {
            throw new RuntimeException("Un candidat externe avec cet email existe déjà (id=" + c.getId() + ")");
        });

        ExternalCandidate c = ExternalCandidate.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .linkedinUrl(req.getLinkedinUrl())
                .source(req.getSource() != null ? req.getSource() : ExternalCandidateSource.MANUAL)
                .yearsOfExperience(req.getYearsOfExperience())
                .currentPosition(req.getCurrentPosition())
                .notes(req.getNotes())
                .build();

        if (req.getSkills() != null) {
            for (ExternalCandidateRequest.SkillItem s : req.getSkills()) {
                if (s.getSkillId() == null || s.getLevel() == null) continue;
                int lvl = Math.max(1, Math.min(5, s.getLevel()));
                c.getSkills().add(ExternalCandidateSkill.builder()
                        .candidate(c)
                        .skillId(s.getSkillId())
                        .skillName(s.getSkillName())
                        .category(s.getCategory())
                        .level(lvl)
                        .build());
            }
        }

        return repository.save(c);
    }

    public ExternalCandidate update(Long id, ExternalCandidateRequest req) {
        ExternalCandidate c = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidat externe non trouvé : " + id));

        if (req.getFirstName() != null) c.setFirstName(req.getFirstName());
        if (req.getLastName() != null) c.setLastName(req.getLastName());
        if (req.getEmail() != null) c.setEmail(req.getEmail());
        if (req.getPhone() != null) c.setPhone(req.getPhone());
        if (req.getLinkedinUrl() != null) c.setLinkedinUrl(req.getLinkedinUrl());
        if (req.getSource() != null) c.setSource(req.getSource());
        if (req.getYearsOfExperience() != null) c.setYearsOfExperience(req.getYearsOfExperience());
        if (req.getCurrentPosition() != null) c.setCurrentPosition(req.getCurrentPosition());
        if (req.getNotes() != null) c.setNotes(req.getNotes());

        // Remplacement intégral du set de compétences si fourni
        if (req.getSkills() != null) {
            c.getSkills().clear();
            for (ExternalCandidateRequest.SkillItem s : req.getSkills()) {
                if (s.getSkillId() == null || s.getLevel() == null) continue;
                int lvl = Math.max(1, Math.min(5, s.getLevel()));
                c.getSkills().add(ExternalCandidateSkill.builder()
                        .candidate(c)
                        .skillId(s.getSkillId())
                        .skillName(s.getSkillName())
                        .category(s.getCategory())
                        .level(lvl)
                        .build());
            }
        }

        return repository.save(c);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    private void validateRequiredFields(ExternalCandidateRequest req) {
        if (req.getFirstName() == null || req.getFirstName().isBlank())
            throw new RuntimeException("Le prénom est obligatoire");
        if (req.getLastName() == null || req.getLastName().isBlank())
            throw new RuntimeException("Le nom est obligatoire");
        if (req.getEmail() == null || req.getEmail().isBlank())
            throw new RuntimeException("L'email est obligatoire");
    }
}
