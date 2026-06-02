package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.dto.TrainingProviderRequest;
import com.aziz.recruitmentservice.entities.ConventionStatus;
import com.aziz.recruitmentservice.entities.DeliveryMode;
import com.aziz.recruitmentservice.entities.Skill;
import com.aziz.recruitmentservice.entities.TrainingProvider;
import com.aziz.recruitmentservice.repositories.SkillRepository;
import com.aziz.recruitmentservice.repositories.TrainingProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional
@RequiredArgsConstructor
public class TrainingProviderService {

    private final TrainingProviderRepository providerRepository;
    private final SkillRepository skillRepository;

    @Transactional(readOnly = true)
    public List<TrainingProvider> getAll() {
        return providerRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<TrainingProvider> getById(Long id) {
        return providerRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<TrainingProvider> findByConventionStatus(ConventionStatus status) {
        return providerRepository.findByConventionStatus(status);
    }

    @Transactional(readOnly = true)
    public List<TrainingProvider> findByDeliveryMode(DeliveryMode mode) {
        return providerRepository.findByDeliveryMode(mode);
    }

    @Transactional(readOnly = true)
    public List<TrainingProvider> findBySkillIds(List<Long> skillIds) {
        if (skillIds == null || skillIds.isEmpty()) return List.of();
        return providerRepository.findBySkillIds(skillIds);
    }

    public TrainingProvider create(TrainingProviderRequest req) {
        validate(req);
        if (providerRepository.existsByNameIgnoreCase(req.getName().trim())) {
            throw new IllegalArgumentException("Un organisme porte déjà ce nom : " + req.getName());
        }
        TrainingProvider provider = TrainingProvider.builder()
                .name(req.getName().trim())
                .description(req.getDescription())
                .website(req.getWebsite())
                .contactEmail(req.getContactEmail())
                .skillsCovered(resolveSkills(req.getSkillIds()))
                .qualiopiCertified(req.isQualiopiCertified())
                .conventionStatus(req.getConventionStatus())
                .avgPriceEur(req.getAvgPriceEur())
                .avgDurationDays(req.getAvgDurationDays())
                .deliveryMode(req.getDeliveryMode())
                .pastSuccessRate(req.getPastSuccessRate())
                .build();
        return providerRepository.save(provider);
    }

    public TrainingProvider update(Long id, TrainingProviderRequest req) {
        TrainingProvider existing = providerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Organisme introuvable : " + id));
        validate(req);

        String newName = req.getName().trim();
        if (!existing.getName().equalsIgnoreCase(newName)
                && providerRepository.existsByNameIgnoreCase(newName)) {
            throw new IllegalArgumentException("Un autre organisme porte déjà ce nom.");
        }

        existing.setName(newName);
        existing.setDescription(req.getDescription());
        existing.setWebsite(req.getWebsite());
        existing.setContactEmail(req.getContactEmail());
        existing.setSkillsCovered(resolveSkills(req.getSkillIds()));
        existing.setQualiopiCertified(req.isQualiopiCertified());
        existing.setConventionStatus(req.getConventionStatus());
        existing.setAvgPriceEur(req.getAvgPriceEur());
        existing.setAvgDurationDays(req.getAvgDurationDays());
        existing.setDeliveryMode(req.getDeliveryMode());
        existing.setPastSuccessRate(req.getPastSuccessRate());
        return providerRepository.save(existing);
    }

    public void delete(Long id) {
        if (!providerRepository.existsById(id)) {
            throw new IllegalArgumentException("Organisme introuvable : " + id);
        }
        providerRepository.deleteById(id);
    }

    private void validate(TrainingProviderRequest req) {
        if (req.getName() == null || req.getName().isBlank()) {
            throw new IllegalArgumentException("Le nom de l'organisme est obligatoire.");
        }
        if (req.getConventionStatus() == null) {
            throw new IllegalArgumentException("Le statut de conventionnement est obligatoire.");
        }
        if (req.getAvgPriceEur() != null && req.getAvgPriceEur() < 0) {
            throw new IllegalArgumentException("Le prix moyen ne peut pas être négatif.");
        }
        if (req.getAvgDurationDays() != null && req.getAvgDurationDays() < 0) {
            throw new IllegalArgumentException("La durée moyenne ne peut pas être négative.");
        }
        if (req.getPastSuccessRate() != null
                && (req.getPastSuccessRate() < 0 || req.getPastSuccessRate() > 100)) {
            throw new IllegalArgumentException("Le taux de succès doit être entre 0 et 100.");
        }
    }

    private Set<Skill> resolveSkills(List<Long> skillIds) {
        if (skillIds == null || skillIds.isEmpty()) return new HashSet<>();
        return new HashSet<>(skillRepository.findAllById(skillIds));
    }
}
