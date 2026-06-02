package com.aziz.recruitmentservice.config;

import com.aziz.recruitmentservice.entities.ConventionStatus;
import com.aziz.recruitmentservice.entities.DeliveryMode;
import com.aziz.recruitmentservice.entities.Skill;
import com.aziz.recruitmentservice.entities.TrainingProvider;
import com.aziz.recruitmentservice.repositories.SkillRepository;
import com.aziz.recruitmentservice.repositories.TrainingProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Insère un catalogue initial de 30 organismes de formation français au démarrage,
 * uniquement si la table training_providers est vide. Les compétences couvertes
 * sont liées aux Skill existants par nom (case-insensitive) — si un skill n'existe
 * pas encore en base, il est ignoré silencieusement.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(100)
public class TrainingProviderSeeder implements CommandLineRunner {

    private final TrainingProviderRepository providerRepository;
    private final SkillRepository skillRepository;

    @Override
    public void run(String... args) {
        if (providerRepository.count() > 0) {
            log.info("[TrainingProviderSeeder] Catalogue déjà peuplé ({} organismes) — skip", providerRepository.count());
            return;
        }
        log.info("[TrainingProviderSeeder] Catalogue vide, insertion des organismes initiaux...");

        List<TrainingProvider> providers = Arrays.asList(
            build("M2i Formation",
                "Leader français de la formation IT — Java, Spring, DevOps, Cloud, cybersécurité. 30+ centres en France.",
                "https://www.m2iformation.fr", "contact@m2iformation.fr",
                skills("Java", "Spring Boot", "Spring", "Microservices", "DevOps", "Docker", "Kubernetes"),
                true, ConventionStatus.CONVENTIONNE, 1850, 5, DeliveryMode.HYBRIDE, 87.5),

            build("Orsys Formation",
                "Catalogue généraliste IT, management et soft skills. 2400+ formations, certifié Qualiopi.",
                "https://www.orsys.fr", "info@orsys.fr",
                skills("Java", "Python", "Docker", "Kubernetes", "AWS", "Azure", "DevOps", "Agile", "Scrum"),
                true, ConventionStatus.CONVENTIONNE, 2200, 4, DeliveryMode.HYBRIDE, 85.0),

            build("ENI Service",
                "Formation et certification IT — .NET, Java, DBA, cybersécurité. Édition technique reconnue.",
                "https://www.eni-service.fr", "contact@eni-service.fr",
                skills("Java", "C#", ".NET", "SQL", "Cybersécurité"),
                true, ConventionStatus.CONVENTIONNE, 2400, 5, DeliveryMode.PRESENTIEL, 82.0),

            build("OpenClassrooms",
                "Plateforme 100% en ligne avec mentorat individuel. Bachelors et Masters reconnus par l'État.",
                "https://openclassrooms.com", "pro@openclassrooms.com",
                skills("JavaScript", "React", "Angular", "Python", "Data Science", "Machine Learning"),
                true, ConventionStatus.REFERENCE, 4500, 90, DeliveryMode.DISTANCIEL, 78.0),

            build("Simplon",
                "École inclusive du numérique — formations intensives gratuites pour publics éloignés de l'emploi.",
                "https://simplon.co", "contact@simplon.co",
                skills("JavaScript", "Python", "React", "Data Science"),
                true, ConventionStatus.REFERENCE, 0, 120, DeliveryMode.PRESENTIEL, 75.0),

            build("Cegos",
                "Leader européen de la formation pro — management, leadership, transformation digitale.",
                "https://www.cegos.fr", "info@cegos.fr",
                skills("Management", "Leadership", "Communication", "Gestion de projet", "Agile"),
                true, ConventionStatus.CONVENTIONNE, 1750, 3, DeliveryMode.HYBRIDE, 88.0),

            build("Demos",
                "Organisme historique — management, RH, IT, finance. Catalogue inter et intra-entreprise.",
                "https://www.demos.fr", "contact@demos.fr",
                skills("Management", "RH", "Gestion de projet", "Communication"),
                true, ConventionStatus.CONVENTIONNE, 1650, 3, DeliveryMode.HYBRIDE, 84.0),

            build("Dawan",
                "Formation IT pragmatique — Web, mobile, design, base de données. 15 centres en France.",
                "https://www.dawan.fr", "contact@dawan.fr",
                skills("JavaScript", "PHP", "Java", "Angular", "React", "Vue.js", "SQL"),
                true, ConventionStatus.REFERENCE, 1500, 5, DeliveryMode.PRESENTIEL, 80.0),

            build("Zenika",
                "Cabinet de conseil et formation — Agile, Java, Cloud, DevOps. Expertise tech reconnue.",
                "https://www.zenika.com", "training@zenika.com",
                skills("Java", "Spring Boot", "Docker", "Kubernetes", "Agile", "Scrum", "DevOps"),
                true, ConventionStatus.CONVENTIONNE, 2800, 3, DeliveryMode.HYBRIDE, 91.0),

            build("Octo Academy",
                "Formation par les consultants Octo Technology — architecture, craft, cloud-native.",
                "https://www.octo.academy", "academy@octo.com",
                skills("Microservices", "Docker", "Kubernetes", "AWS", "Architecture"),
                true, ConventionStatus.REFERENCE, 3200, 3, DeliveryMode.PRESENTIEL, 89.0),

            build("Capgemini Institut",
                "Formation pour cadres et dirigeants — transformation digitale, stratégie IT, IA.",
                "https://www.capgemini.com/institut", "institut.fr@capgemini.com",
                skills("Intelligence Artificielle", "Machine Learning", "Stratégie", "Leadership"),
                true, ConventionStatus.CONVENTIONNE, 3500, 5, DeliveryMode.HYBRIDE, 86.0),

            build("Global Knowledge",
                "Leader mondial des certifications IT — AWS, Azure, Cisco, Microsoft, ITIL.",
                "https://www.globalknowledge.com/fr-fr", "info.fr@globalknowledge.com",
                skills("AWS", "Azure", "ITIL", "Cybersécurité"),
                true, ConventionStatus.CONVENTIONNE, 2900, 5, DeliveryMode.HYBRIDE, 87.0),

            build("AFPA",
                "Acteur public majeur de la formation pro — tous métiers, financement OPCO/Pôle Emploi.",
                "https://www.afpa.fr", "contact@afpa.fr",
                skills("Java", "JavaScript", "Comptabilité", "RH"),
                true, ConventionStatus.REFERENCE, 800, 60, DeliveryMode.PRESENTIEL, 72.0),

            build("GRETA",
                "Réseau public de l'Éducation nationale — formations qualifiantes tous domaines.",
                "https://www.education.gouv.fr/les-greta", "info@greta.fr",
                skills("Comptabilité", "Bureautique", "Communication"),
                true, ConventionStatus.REFERENCE, 1200, 30, DeliveryMode.PRESENTIEL, 70.0),

            build("CNAM",
                "Conservatoire national des arts et métiers — formation continue diplômante.",
                "https://www.cnam.fr", "contact@cnam.fr",
                skills("Management", "Comptabilité", "Informatique"),
                true, ConventionStatus.REFERENCE, 2500, 120, DeliveryMode.HYBRIDE, 76.0),

            build("DataScientest",
                "École 100% data — Data Science, Data Engineering, Data Analyst. Certifié Mines ParisTech.",
                "https://datascientest.com", "contact@datascientest.com",
                skills("Python", "Data Science", "Machine Learning", "SQL", "Intelligence Artificielle"),
                true, ConventionStatus.CONVENTIONNE, 5500, 90, DeliveryMode.DISTANCIEL, 84.0),

            build("Le Wagon",
                "Bootcamp intensif — développement web, data science. Top mondial des coding bootcamps.",
                "https://www.lewagon.com/fr", "paris@lewagon.com",
                skills("Ruby", "JavaScript", "React", "Python", "Data Science"),
                true, ConventionStatus.REFERENCE, 7500, 60, DeliveryMode.PRESENTIEL, 88.0),

            build("Jedha Bootcamp",
                "Formation data science et cybersécurité intensive — full-stack data.",
                "https://www.jedha.co", "hello@jedha.co",
                skills("Python", "Data Science", "Machine Learning", "Cybersécurité"),
                true, ConventionStatus.NOUVEAU, 6500, 80, DeliveryMode.HYBRIDE, 81.0),

            build("Wild Code School",
                "École de la reconversion tech — Web dev, Data, Cybersécurité, Product.",
                "https://www.wildcodeschool.com/fr-FR", "contact@wildcodeschool.com",
                skills("JavaScript", "React", "PHP", "Data Science"),
                true, ConventionStatus.REFERENCE, 7000, 100, DeliveryMode.HYBRIDE, 79.0),

            build("CSP Docendi",
                "Formation management et soft skills — leadership, négociation, prise de parole.",
                "https://www.csp.fr", "contact@csp.fr",
                skills("Management", "Leadership", "Communication", "Négociation"),
                true, ConventionStatus.CONVENTIONNE, 1900, 2, DeliveryMode.PRESENTIEL, 86.0),

            build("Comundi",
                "Spécialiste RH, management, juridique. Formations courtes opérationnelles.",
                "https://www.comundi.fr", "info@comundi.fr",
                skills("RH", "Management", "Droit social"),
                true, ConventionStatus.REFERENCE, 1750, 2, DeliveryMode.HYBRIDE, 83.0),

            build("ISM",
                "Institut Supérieur du Marketing — marketing, vente, digital, communication.",
                "https://www.ism.fr", "contact@ism.fr",
                skills("Marketing", "Communication", "Vente"),
                true, ConventionStatus.REFERENCE, 2100, 3, DeliveryMode.PRESENTIEL, 81.0),

            build("EFE",
                "Formation droit, finance, fiscalité, RH. Public cadres et juristes.",
                "https://www.efe.fr", "contact@efe.fr",
                skills("Droit social", "Finance", "RH"),
                true, ConventionStatus.REFERENCE, 1850, 2, DeliveryMode.HYBRIDE, 80.0),

            build("AFCEPF",
                "École de l'innovation informatique — Java, Web, Mobile, DevOps.",
                "https://www.afcepf.com", "info@afcepf.com",
                skills("Java", "Spring Boot", "JavaScript", "Angular", "DevOps"),
                true, ConventionStatus.NOUVEAU, 2200, 5, DeliveryMode.PRESENTIEL, 78.0),

            build("Doranco",
                "École supérieure du multimédia et de l'informatique — Web, design, dev.",
                "https://www.doranco.fr", "contact@doranco.fr",
                skills("JavaScript", "PHP", "Design", "UX/UI"),
                true, ConventionStatus.NOUVEAU, 2400, 10, DeliveryMode.PRESENTIEL, 75.0),

            build("AKKodis Academy",
                "Filiale Adecco — formation ingénierie tech, IoT, automatisme, électronique.",
                "https://www.akkodis.com/fr-fr/academy", "academy.fr@akkodis.com",
                skills("Java", "C++", "IoT", "Embarqué"),
                true, ConventionStatus.REFERENCE, 2600, 5, DeliveryMode.HYBRIDE, 82.0),

            build("Pyramyd Formation",
                "Spécialiste graphisme, communication, web design. Référence créative.",
                "https://www.pyramyd-formation.com", "contact@pyramyd-formation.com",
                skills("Design", "UX/UI", "Communication"),
                true, ConventionStatus.REFERENCE, 1950, 3, DeliveryMode.PRESENTIEL, 79.0),

            build("IB by Cegos",
                "Marque Cegos dédiée IT — certifications éditeurs (Microsoft, AWS, Cisco, VMware).",
                "https://www.ib-formation.fr", "info@ib-formation.fr",
                skills("AWS", "Azure", "Cybersécurité", "ITIL"),
                true, ConventionStatus.CONVENTIONNE, 2750, 5, DeliveryMode.HYBRIDE, 85.0),

            build("Sparta Formation",
                "Bootcamp intensif cybersécurité — pentest, défensif, certifications.",
                "https://sparta.formation", "contact@sparta.formation",
                skills("Cybersécurité"),
                false, ConventionStatus.NOUVEAU, 4200, 30, DeliveryMode.DISTANCIEL, 76.0),

            build("Coursera for Business",
                "Catalogue mondial — universités Stanford, Yale, Google, IBM. Apprentissage flexible.",
                "https://www.coursera.org/business", "business@coursera.org",
                skills("Machine Learning", "Data Science", "Python", "Intelligence Artificielle", "Management"),
                true, ConventionStatus.NOUVEAU, 3500, 60, DeliveryMode.DISTANCIEL, 77.0)
        );

        providers.forEach(providerRepository::save);
        log.info("[TrainingProviderSeeder] {} organismes insérés", providers.size());
    }

    private TrainingProvider build(String name, String description, String website, String email,
                                   Set<Skill> skillsCovered, boolean qualiopi, ConventionStatus convention,
                                   int avgPrice, int avgDuration, DeliveryMode mode, double successRate) {
        return TrainingProvider.builder()
                .name(name)
                .description(description)
                .website(website)
                .contactEmail(email)
                .skillsCovered(skillsCovered)
                .qualiopiCertified(qualiopi)
                .conventionStatus(convention)
                .avgPriceEur(avgPrice)
                .avgDurationDays(avgDuration)
                .deliveryMode(mode)
                .pastSuccessRate(successRate)
                .build();
    }

    /**
     * Résout des skills par nom (case-insensitive). Les noms inconnus sont ignorés
     * silencieusement — le seed reste tolérant si le catalogue Skill évolue.
     */
    private Set<Skill> skills(String... names) {
        Set<Skill> result = new HashSet<>();
        for (String n : names) {
            skillRepository.findByNameIgnoreCase(n).ifPresent(result::add);
        }
        return result;
    }
}
