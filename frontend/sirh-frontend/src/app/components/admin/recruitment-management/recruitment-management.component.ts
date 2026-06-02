import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Gestion du recrutement pour le RH Admin.
 * Permet de créer des offres, gérer les candidatures et le workflow.
 */
@Component({
  selector: 'app-recruitment-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recruitment-management.component.html',
  styleUrls: ['./recruitment-management.component.css']
})
export class RecruitmentManagementComponent implements OnInit {
  activeTab = 'offers';
  offers: any[] = [];
  applications: any[] = [];
  statuses = ['EN_ATTENTE', 'ENTRETIEN', 'RETENU', 'REFUSE'];
  /** Statuts que le RH peut positionner lui-même.
   *  RETENU / REFUSE sont réservés au manager (résultat d'entretien). */
  adminAllowedStatuses = ['EN_ATTENTE', 'ENTRETIEN'];

  showOfferForm = false;
  isEditingOffer = false;
  editOfferId: number | null = null;
  offerForm: any = {};

  // Skills picker state
  allSkills: { id: number; name: string; category?: string }[] = [];
  selectedSkillIds = new Set<number>();
  skillLevels: { [skillId: number]: number } = {};
  skillSearch = '';
  skillsOpen = false;

  // Search & filter
  searchQuery = '';
  statusFilter = '';

  // Matching IA state
  showMatchingModal = false;
  matchingOffer: any = null;
  matchingResults: any[] = [];
  matchingDiagnostic: any = null;
  matchingLoading = false;
  matchingError: string | null = null;
  // Statut sélectionné par le RH par candidat (clé = applicationId)
  // null/undefined = skip (ne pas modifier), sinon nouvelle valeur de statut
  decisions: { [appId: number]: string | null } = {};
  applyingStatuses = false;

  // Pipeline workflow (vue post-matching)
  pipelineApplications: any[] = [];
  pipelineOfferFilter = '';

  // Planification d'entretien (assignation à un manager)
  showScheduleModal = false;
  scheduleApp: any = null;
  scheduleForm: any = {};
  managers: { username: string; firstName: string; lastName: string; email: string }[] = [];
  scheduleSaving = false;

  constructor(private recruitmentApi: RecruitmentApiService,
              private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadOffers();
    this.loadSkills();
  }

  loadOffers(): void {
    this.recruitmentApi.getAllOffers().subscribe({ next: (data) => this.offers = data });
  }

  loadSkills(): void {
    this.recruitmentApi.getAllSkills().subscribe({ next: (data) => this.allSkills = data });
  }

  loadAllApplications(): void {
    this.recruitmentApi.getAllApplications().subscribe({ next: (data) => this.applications = data });
  }

  // --- Computed ---
  get activeOffers(): number {
    return this.offers.filter(o => o.status === 'ACTIVE').length;
  }
  get closedOffers(): number {
    return this.offers.filter(o => o.status === 'CLOSED').length;
  }

  get filteredOffers(): any[] {
    let result = this.offers;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(o =>
        o.title?.toLowerCase().includes(q) ||
        o.department?.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter) {
      result = result.filter(o => o.status === this.statusFilter);
    }
    return result;
  }

  get filteredApplications(): any[] {
    let result = this.applications;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(a =>
        a.applicantName?.toLowerCase().includes(q) ||
        a.jobOfferTitle?.toLowerCase().includes(q)
      );
    }
    if (this.statusFilter) {
      result = result.filter(a => a.status === this.statusFilter);
    }
    return result;
  }

  // --- Skills picker helpers ---
  get filteredSkillOptions() {
    const q = this.skillSearch.trim().toLowerCase();
    if (!q) return this.allSkills;
    return this.allSkills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    );
  }

  toggleSkill(id: number): void {
    if (this.selectedSkillIds.has(id)) {
      this.selectedSkillIds.delete(id);
      delete this.skillLevels[id];
    } else {
      this.selectedSkillIds.add(id);
      // Niveau requis par défaut : 3 (intermédiaire)
      if (this.skillLevels[id] == null) this.skillLevels[id] = 3;
    }
  }

  /** Modifie le niveau requis d'une compétence sélectionnée */
  setSkillLevel(id: number, level: number): void {
    if (level < 1) level = 1;
    if (level > 5) level = 5;
    this.skillLevels[id] = level;
  }

  getSkillNameById(id: number): string {
    return this.allSkills.find(s => s.id === id)?.name ?? '(inconnue)';
  }

  getLevelLabel(level: number): string {
    const labels: { [k: number]: string } = {
      1: 'Débutant', 2: 'Notions', 3: 'Intermédiaire', 4: 'Avancé', 5: 'Expert'
    };
    return labels[level] || '—';
  }

  resetOfferForm(): void {
    this.offerForm = {};
    this.isEditingOffer = false;
    this.editOfferId = null;
    this.selectedSkillIds.clear();
    this.skillLevels = {};
    this.skillSearch = '';
    this.skillsOpen = false;
  }

  editOffer(offer: any): void {
    this.offerForm = { ...offer };
    this.isEditingOffer = true;
    this.editOfferId = offer.id;
    // Hydrate la selection depuis les objets Skill renvoyes par le backend
    this.selectedSkillIds = new Set<number>((offer.skills || []).map((s: any) => s.id));
    // Hydrate les niveaux depuis le backend (map skillId -> level)
    this.skillLevels = {};
    if (offer.skillLevels) {
      Object.keys(offer.skillLevels).forEach(k => {
        this.skillLevels[+k] = offer.skillLevels[k];
      });
    }
    // Niveau par défaut pour les skills sans level renseigné
    this.selectedSkillIds.forEach(id => {
      if (this.skillLevels[id] == null) this.skillLevels[id] = 3;
    });
    this.skillSearch = '';
    this.skillsOpen = false;
    this.showOfferForm = true;
  }

  saveOffer(): void {
    const payload = {
      title: this.offerForm.title,
      description: this.offerForm.description,
      department: this.offerForm.department,
      deadline: this.offerForm.deadline,
      skillIds: Array.from(this.selectedSkillIds),
      skillLevels: { ...this.skillLevels }
    };
    const obs = this.isEditingOffer
      ? this.recruitmentApi.updateOffer(this.editOfferId!, payload)
      : this.recruitmentApi.createOffer(payload);
    obs.subscribe({ next: () => { this.showOfferForm = false; this.loadOffers(); } });
  }

  // ─── Matching IA ───────────────────────────────────────

  /** Lance le matching IA pour une offre et ouvre la modal de résultats */
  runMatching(offer: any): void {
    this.matchingOffer = offer;
    this.matchingResults = [];
    this.matchingDiagnostic = null;
    this.matchingError = null;
    this.matchingLoading = true;
    this.decisions = {};
    this.applyingStatuses = false;
    this.showMatchingModal = true;
    this.recruitmentApi.runMatching(offer.id).subscribe({
      next: (data: any) => {
        // Nouveau format : { results, diagnostic }
        this.matchingResults = data?.results || [];
        this.matchingDiagnostic = data?.diagnostic || null;
        // Pré-remplit les décisions avec la proposition IA — uniquement si le RH
        // est habilité à appliquer ce statut (ENTRETIEN). Les propositions REFUSE
        // pour les candidats EXTERNAL sont ignorées : c'est au manager d'arbitrer.
        this.matchingResults.forEach(r => {
          if (r.applicationId && r.proposedStatus && this.adminAllowedStatuses.includes(r.proposedStatus)) {
            this.decisions[r.applicationId] = r.proposedStatus;
          }
        });
        this.matchingLoading = false;
      },
      error: (err) => {
        this.matchingError = err.error?.message || err.message || 'Erreur lors du matching';
        this.matchingLoading = false;
      }
    });
  }

  closeMatching(): void {
    this.showMatchingModal = false;
    this.matchingOffer = null;
    this.matchingResults = [];
    this.matchingDiagnostic = null;
    this.decisions = {};
  }

  /** Affichage humain de la raison du diagnostic */
  getDiagnosticReason(reason: string | undefined): string {
    const map: { [k: string]: string } = {
      'NO_SKILLS_ON_OFFER': "Cette offre n'a aucune compétence requise renseignée.",
      'NO_APPLICATIONS': "Aucune candidature n'a été reçue pour cette offre.",
      'NO_CANDIDATE_PROFILES': "Aucun profil employé n'a pu être chargé (problème de matricule ?)."
    };
    return map[reason || ''] || 'Aucun résultat de matching disponible.';
  }

  /** Modifie le statut proposé pour une candidature */
  setDecision(appId: number, status: string | null): void {
    if (status === null || status === 'SKIP') {
      this.decisions[appId] = null;
    } else {
      this.decisions[appId] = status;
    }
  }

  /** Nombre de décisions actives (non skip) qui changent réellement le statut */
  pendingDecisionsCount(): number {
    return this.matchingResults.filter(r => {
      const dec = this.decisions[r.applicationId];
      return dec && dec !== r.currentStatus;
    }).length;
  }

  /** Applique les statuts validés en bulk */
  applyMatchingStatuses(): void {
    const updates = this.matchingResults
      .filter(r => {
        const dec = this.decisions[r.applicationId];
        return dec && dec !== r.currentStatus;
      })
      .map(r => ({
        applicationId: r.applicationId,
        status: this.decisions[r.applicationId]!,
        matchingCategory: r.category,
        matchingScore: r.score
      }));

    if (updates.length === 0) {
      alert('Aucun statut à appliquer (toutes les décisions sont identiques aux statuts actuels).');
      return;
    }

    if (!confirm(`Appliquer ${updates.length} mise(s) à jour de statut ?`)) return;

    this.applyingStatuses = true;
    this.recruitmentApi.applyMatchingStatuses(updates).subscribe({
      next: (res: any) => {
        this.applyingStatuses = false;
        // Met à jour les currentStatus localement pour refléter le changement
        this.matchingResults.forEach(r => {
          const dec = this.decisions[r.applicationId];
          if (dec && dec !== r.currentStatus) {
            r.currentStatus = dec;
          }
        });
        alert(`✅ ${res.updated} candidature(s) mise(s) à jour avec succès.`);
        // Recharge la liste globale des candidatures pour synchroniser le reste de l'app
        this.loadAllApplications();
      },
      error: (err) => {
        this.applyingStatuses = false;
        alert('Erreur : ' + (err.error?.message || err.message));
      }
    });
  }

  getCategoryLabel(cat: string): string {
    const map: { [k: string]: string } = {
      'IDEAL': 'Candidat Idéal',
      'TRAINING': 'À Former',
      'EXTERNAL': 'Recrutement Externe'
    };
    return map[cat] || cat;
  }

  getCategoryIcon(cat: string): string {
    const map: { [k: string]: string } = {
      'IDEAL': '✅', 'TRAINING': '🎓', 'EXTERNAL': '🌐'
    };
    return map[cat] || '❓';
  }

  /** Compte les candidats par catégorie pour les KPI du modal */
  countByCategory(cat: string): number {
    return this.matchingResults.filter(r => r.category === cat).length;
  }

  closeOffer(id: number): void {
    this.recruitmentApi.closeOffer(id).subscribe({ next: () => this.loadOffers() });
  }

  deleteOffer(id: number): void {
    if (confirm('Supprimer cette offre ?')) {
      this.recruitmentApi.deleteOffer(id).subscribe({ next: () => this.loadOffers() });
    }
  }

  viewApplications(offer: any): void {
    this.activeTab = 'applications';
    this.searchQuery = '';
    this.statusFilter = '';
    this.recruitmentApi.getApplicationsByJobOffer(offer.id).subscribe({
      next: (data) => this.applications = data
    });
  }

  changeStatus(id: number, status: string): void {
    this.recruitmentApi.updateApplicationStatus(id, status).subscribe({
      next: () => this.loadAllApplications()
    });
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'ENTRETIEN': 'Entretien',
      'RETENU': 'Retenu',
      'REFUSE': 'Refusé'
    };
    return labels[status] || status;
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'EN_ATTENTE': '⏳',
      'ENTRETIEN': '🗣️',
      'RETENU': '✅',
      'REFUSE': '❌'
    };
    return icons[status] || '📋';
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
    this.searchQuery = '';
    this.statusFilter = '';
    if (tab === 'applications') this.loadAllApplications();
    if (tab === 'pipeline') this.loadPipeline();
  }

  // ─── Vue Pipeline (post-matching) ─────────────────────

  loadPipeline(): void {
    // On charge en parallèle applications et entretiens pour enrichir chaque card
    // avec l'état du dernier entretien (manager affecté, statut, résultat).
    this.recruitmentApi.getAllApplications().subscribe({
      next: (apps) => {
        this.recruitmentApi.getAllInterviews().subscribe({
          next: (interviews) => {
            const latestByApp = new Map<number, any>();
            for (const it of (interviews || [])) {
              if (it.applicationId == null) continue;
              const existing = latestByApp.get(it.applicationId);
              if (!existing || (it.id || 0) > (existing.id || 0)) {
                latestByApp.set(it.applicationId, it);
              }
            }
            this.pipelineApplications = (apps || []).map(a => ({
              ...a,
              latestInterview: latestByApp.get(a.id) || null
            }));
          },
          error: () => this.pipelineApplications = apps || []
        });
      }
    });
  }

  /** Libellé du statut d'entretien dans le pipeline RH. */
  interviewStatusLabel(s: string): string {
    switch (s) {
      case 'PENDING_SCHEDULING': return 'À planifier';
      case 'SCHEDULED': return 'Planifié';
      case 'COMPLETED': return 'Réalisé';
      case 'CANCELLED': return 'Annulé';
      case 'REJECTED_BY_MANAGER': return 'Refusé par manager';
      default: return s || '—';
    }
  }

  /** Libellé du résultat d'entretien. */
  interviewResultLabel(r: string): string {
    if (r === 'POSITIF') return '✅ Positif';
    if (r === 'NEGATIF' || r === 'NÉGATIF') return '❌ Négatif';
    if (r === 'EN_COURS') return '⏳ En cours';
    return r;
  }

  pipelineByStatus(status: string): any[] {
    let list = this.pipelineApplications.filter(a => a.status === status);
    if (this.pipelineOfferFilter) {
      list = list.filter(a => a.jobOfferId === +this.pipelineOfferFilter);
    }
    // Tri : score DESC pour mettre les meilleurs en haut
    return list.sort((a, b) => (b.matchingScore || 0) - (a.matchingScore || 0));
  }

  pipelineStats() {
    return {
      EN_ATTENTE: this.pipelineByStatus('EN_ATTENTE').length,
      ENTRETIEN: this.pipelineByStatus('ENTRETIEN').length,
      RETENU: this.pipelineByStatus('RETENU').length,
      REFUSE: this.pipelineByStatus('REFUSE').length
    };
  }

  // ─── Affectation à un manager (phase 1 du workflow entretien) ─────

  /**
   * Ouvre la modal pour affecter un manager à un entretien.
   * Le manager planifiera ensuite la date/heure depuis son propre dashboard.
   */
  openScheduleInterview(app: any): void {
    this.scheduleApp = app;
    this.scheduleForm = {
      managerUsername: '',
      candidateType: 'INTERNAL',
      candidateEmail: '',
      rhNote: ''
    };
    this.showScheduleModal = true;
    if (this.managers.length === 0) this.loadManagers();
  }

  closeScheduleModal(): void {
    this.showScheduleModal = false;
    this.scheduleApp = null;
    this.scheduleForm = {};
  }

  loadManagers(): void {
    this.employeeApi.getManagers().subscribe({
      next: (data) => this.managers = data || [],
      error: () => this.managers = []
    });
  }

  submitInterview(): void {
    if (!this.scheduleApp) return;
    if (!this.scheduleForm.managerUsername) {
      alert('Veuillez sélectionner un manager.');
      return;
    }
    const manager = this.managers.find(m => m.username === this.scheduleForm.managerUsername);
    const managerName = manager ? `${manager.firstName || ''} ${manager.lastName || ''}`.trim() : this.scheduleForm.managerUsername;
    // EXTERNAL requiert un email candidat (interne : auto-résolu côté backend)
    if (this.scheduleForm.candidateType === 'EXTERNAL' && !this.scheduleForm.candidateEmail) {
      alert('Email du candidat externe obligatoire pour la notification "pre-shortlist".');
      return;
    }
    const payload = {
      applicationId: this.scheduleApp.id,
      managerUsername: this.scheduleForm.managerUsername,
      managerName,
      candidateType: this.scheduleForm.candidateType,
      candidateEmail: this.scheduleForm.candidateEmail || null,
      rhNote: this.scheduleForm.rhNote || null
    };
    this.scheduleSaving = true;
    this.recruitmentApi.assignInterview(payload).subscribe({
      next: () => {
        this.scheduleSaving = false;
        alert(`✅ Entretien affecté à ${managerName}. Le manager recevra un email et fixera la date.`);
        this.closeScheduleModal();
      },
      error: (err) => {
        this.scheduleSaving = false;
        alert('Erreur : ' + (err.error?.message || err.message));
      }
    });
  }
}
