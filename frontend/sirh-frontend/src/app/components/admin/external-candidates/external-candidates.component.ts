import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Gestion du pool de candidats externes (LinkedIn / cooptation / manuel).
 * Permet aussi de lancer le matching IA sur ce pool contre une offre,
 * en utilisant exactement le même modèle que le matching interne.
 */
@Component({
  selector: 'app-external-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './external-candidates.component.html',
  styleUrls: ['./external-candidates.component.css']
})
export class ExternalCandidatesComponent implements OnInit {
  activeTab: 'pool' | 'matching' = 'pool';

  // Pool
  candidates: any[] = [];
  loadError: string | null = null;

  // Skills catalog
  allSkills: { id: number; name: string; category?: string }[] = [];

  // Form
  showForm = false;
  isEditing = false;
  editId: number | null = null;
  form: any = this.emptyForm();

  // CV upload + extraction
  cvFile: File | null = null;
  cvExtracting = false;
  cvExtractResult: any = null;
  cvError: string | null = null;

  // Matching tab
  offers: any[] = [];
  selectedOfferId: number | null = null;
  matchingLoading = false;
  matchingResults: any[] = [];
  matchingDiagnostic: any = null;
  matchingError: string | null = null;

  // Schedule interview from external matching
  managers: { username: string; firstName: string; lastName: string; email: string }[] = [];
  showScheduleModal = false;
  scheduleCandidate: any = null;
  scheduleForm: any = {};
  scheduleSaving = false;

  constructor(
    private recruitmentApi: RecruitmentApiService,
    private employeeApi: EmployeeApiService
  ) {}

  ngOnInit(): void {
    this.loadCandidates();
    this.loadSkills();
    this.loadOffers();
  }

  emptyForm(): any {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      linkedinUrl: '',
      source: 'LINKEDIN',
      yearsOfExperience: null,
      currentPosition: '',
      notes: '',
      skillRows: [] as { skillId: number | null; skillName: string; category?: string; level: number }[]
    };
  }

  loadCandidates(): void {
    this.recruitmentApi.getExternalCandidates().subscribe({
      next: (data) => this.candidates = data || [],
      error: () => this.loadError = 'Impossible de charger les candidats externes.'
    });
  }

  loadSkills(): void {
    this.recruitmentApi.getAllSkills().subscribe({ next: (data) => this.allSkills = data });
  }

  loadOffers(): void {
    this.recruitmentApi.getAllOffers().subscribe({ next: (data) => this.offers = (data || []).filter((o: any) => o.status === 'ACTIVE') });
  }

  // ─── Form / CRUD ─────────────────────────────────────

  openCreate(): void {
    this.form = this.emptyForm();
    this.isEditing = false;
    this.editId = null;
    this.resetCv();
    this.showForm = true;
  }

  openEdit(c: any): void {
    this.form = {
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email,
      phone: c.phone || '',
      linkedinUrl: c.linkedinUrl || '',
      source: c.source || 'LINKEDIN',
      yearsOfExperience: c.yearsOfExperience,
      currentPosition: c.currentPosition || '',
      notes: c.notes || '',
      skillRows: (c.skills || []).map((s: any) => ({
        skillId: s.skillId,
        skillName: s.skillName,
        category: s.category,
        level: s.level
      }))
    };
    this.isEditing = true;
    this.editId = c.id;
    this.resetCv();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  addSkillRow(): void {
    this.form.skillRows.push({ skillId: null, skillName: '', category: '', level: 3 });
  }

  removeSkillRow(i: number): void {
    this.form.skillRows.splice(i, 1);
  }

  onSkillChange(row: any): void {
    const found = this.allSkills.find(s => s.id === +row.skillId);
    if (found) {
      row.skillName = found.name;
      row.category = found.category;
    }
  }

  availableSkillsForRow(row: any): any[] {
    const usedIds = new Set(this.form.skillRows
      .filter((r: any) => r !== row && r.skillId)
      .map((r: any) => +r.skillId));
    return this.allSkills.filter(s => !usedIds.has(s.id));
  }

  saveCandidate(): void {
    if (!this.form.firstName || !this.form.lastName || !this.form.email) {
      alert('Prénom, nom et email sont obligatoires.');
      return;
    }
    const payload = {
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      email: this.form.email,
      phone: this.form.phone || null,
      linkedinUrl: this.form.linkedinUrl || null,
      source: this.form.source,
      yearsOfExperience: this.form.yearsOfExperience,
      currentPosition: this.form.currentPosition || null,
      notes: this.form.notes || null,
      skills: this.form.skillRows
        .filter((r: any) => r.skillId && r.level)
        .map((r: any) => ({
          skillId: +r.skillId,
          skillName: r.skillName,
          category: r.category,
          level: r.level
        }))
    };
    const obs = this.isEditing
      ? this.recruitmentApi.updateExternalCandidate(this.editId!, payload)
      : this.recruitmentApi.createExternalCandidate(payload);
    obs.subscribe({
      next: () => {
        this.showForm = false;
        this.loadCandidates();
      },
      error: (err) => alert('Erreur : ' + (err.error?.message || err.message))
    });
  }

  deleteCandidate(id: number): void {
    if (!confirm('Supprimer ce candidat externe ?')) return;
    this.recruitmentApi.deleteExternalCandidate(id).subscribe({
      next: () => this.loadCandidates()
    });
  }

  // ─── CV extraction (réutilise /api/cv/extract) ─────

  resetCv(): void {
    this.cvFile = null;
    this.cvExtracting = false;
    this.cvExtractResult = null;
    this.cvError = null;
  }

  onCvSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.cvFile = file;
    this.cvExtractResult = null;
    this.cvError = null;
  }

  extractCv(): void {
    if (!this.cvFile) return;
    this.cvExtracting = true;
    this.cvError = null;
    this.employeeApi.extractCvSkills(this.cvFile).subscribe({
      next: (result) => {
        this.cvExtractResult = result;
        this.cvExtracting = false;
        // Pré-remplit l'expérience
        if (result?.estimatedYearsOfExperience && !this.form.yearsOfExperience) {
          this.form.yearsOfExperience = result.estimatedYearsOfExperience;
        }
      },
      error: (err) => {
        this.cvError = err.error?.message || err.message || 'Erreur extraction CV.';
        this.cvExtracting = false;
      }
    });
  }

  /** Importe les compétences extraites (cochées) dans le formulaire. */
  importExtractedSkills(): void {
    if (!this.cvExtractResult?.skills) return;
    const selected = this.cvExtractResult.skills.filter((s: any) => s.preselected && s.skillId);
    for (const s of selected) {
      const exists = this.form.skillRows.some((r: any) => r.skillId === s.skillId);
      if (!exists) {
        this.form.skillRows.push({
          skillId: s.skillId,
          skillName: s.skillName,
          category: s.category,
          level: s.level || 3
        });
      }
    }
  }

  selectedExtractedCount(): number {
    if (!this.cvExtractResult?.skills) return 0;
    return this.cvExtractResult.skills.filter((s: any) => s.preselected).length;
  }

  // ─── Matching tab ────────────────────────────────────

  runMatching(): void {
    if (!this.selectedOfferId) { alert('Choisis une offre.'); return; }
    this.matchingLoading = true;
    this.matchingError = null;
    this.matchingResults = [];
    this.matchingDiagnostic = null;
    this.recruitmentApi.runExternalMatching(+this.selectedOfferId).subscribe({
      next: (data: any) => {
        this.matchingResults = data?.results || [];
        this.matchingDiagnostic = data?.diagnostic || null;
        this.matchingLoading = false;
      },
      error: (err) => {
        this.matchingError = err.error?.message || err.message || 'Erreur matching externe.';
        this.matchingLoading = false;
      }
    });
  }

  getCategoryLabel(cat: string): string {
    return cat === 'IDEAL' ? 'Idéal' : cat === 'TRAINING' ? 'À former' : cat === 'EXTERNAL' ? 'Faible' : cat;
  }
  getCategoryIcon(cat: string): string {
    return cat === 'IDEAL' ? '✅' : cat === 'TRAINING' ? '🎓' : '⚠️';
  }
  getLevelLabel(level: number): string {
    const labels: { [k: number]: string } = { 1:'Débutant', 2:'Notions', 3:'Intermédiaire', 4:'Avancé', 5:'Expert' };
    return labels[level] || '—';
  }

  // ─── Planification entretien (candidat externe) ─────

  openSchedule(result: any): void {
    this.scheduleCandidate = result;
    this.scheduleForm = {
      managerUsername: '',
      candidateEmail: result.candidateEmail || '',
      rhNote: ''
    };
    this.showScheduleModal = true;
    if (this.managers.length === 0) {
      this.employeeApi.getManagers().subscribe({ next: (data) => this.managers = data || [] });
    }
  }

  closeSchedule(): void {
    this.showScheduleModal = false;
    this.scheduleCandidate = null;
  }

  submitSchedule(): void {
    if (!this.scheduleCandidate || !this.scheduleForm.managerUsername) {
      alert('Veuillez sélectionner un manager.'); return;
    }
    if (!this.scheduleForm.candidateEmail) {
      alert('Email candidat obligatoire pour la notification "pre-shortlist".'); return;
    }
    const manager = this.managers.find(m => m.username === this.scheduleForm.managerUsername);
    const managerName = manager ? `${manager.firstName || ''} ${manager.lastName || ''}`.trim() : this.scheduleForm.managerUsername;
    const offer = this.offers.find(o => o.id === +this.selectedOfferId!);
    const payload = {
      externalCandidateId: this.scheduleCandidate.externalCandidateId,
      jobOfferId: this.selectedOfferId,
      jobOfferTitle: offer?.title || null,
      candidateName: this.scheduleCandidate.applicantName,
      managerUsername: this.scheduleForm.managerUsername,
      managerName,
      candidateType: 'EXTERNAL',
      candidateEmail: this.scheduleForm.candidateEmail,
      rhNote: this.scheduleForm.rhNote || null
    };
    this.scheduleSaving = true;
    this.recruitmentApi.assignInterview(payload).subscribe({
      next: () => {
        this.scheduleSaving = false;
        alert(`✅ Entretien affecté à ${managerName}. Le manager fixera la date et le candidat recevra une notification.`);
        this.closeSchedule();
      },
      error: (err) => {
        this.scheduleSaving = false;
        alert('Erreur : ' + (err.error?.message || err.message));
      }
    });
  }
}
