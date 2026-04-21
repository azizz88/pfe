package com.aziz.recruitmentservice.services;

import com.aziz.recruitmentservice.entities.Skill;
import com.aziz.recruitmentservice.repositories.SkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SkillService {

    private final SkillRepository skillRepository;

    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    @Transactional(readOnly = true)
    public List<Skill> getAll() {
        return skillRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Skill> getById(Long id) {
        return skillRepository.findById(id);
    }

    public Skill create(Skill skill) {
        if (skill.getName() == null || skill.getName().isBlank()) {
            throw new IllegalArgumentException("Le nom de la competence est obligatoire.");
        }
        if (skillRepository.existsByNameIgnoreCase(skill.getName().trim())) {
            throw new IllegalArgumentException("Cette competence existe deja : " + skill.getName());
        }
        skill.setId(null);
        skill.setName(skill.getName().trim());
        return skillRepository.save(skill);
    }

    public Skill update(Long id, Skill payload) {
        Skill existing = skillRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Competence introuvable : " + id));

        String newName = payload.getName() == null ? existing.getName() : payload.getName().trim();
        if (!existing.getName().equalsIgnoreCase(newName)
                && skillRepository.existsByNameIgnoreCase(newName)) {
            throw new IllegalArgumentException("Une autre competence porte deja ce nom.");
        }
        existing.setName(newName);
        existing.setCategory(payload.getCategory());
        existing.setDescription(payload.getDescription());
        return skillRepository.save(existing);
    }

    public void delete(Long id) {
        if (!skillRepository.existsById(id)) {
            throw new IllegalArgumentException("Competence introuvable : " + id);
        }
        // Nettoyer la table de jointure avant de supprimer la competence
        skillRepository.unlinkFromAllJobOffers(id);
        skillRepository.deleteById(id);
    }
}
