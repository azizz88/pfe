import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import {
  TrainingService,
  TrainingProposal,
  TrainingSuggestion,
  TrainingSuggestionRequest,
  ProposalStatus,
  DeliveryMode,
  Skill
} from '../../../services/training.service';

@Component({
  selector: 'app-manager-formation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="formation-page">
      <div class="header">
        <div>
          <h1>🎓 Formations en pilotage</h1>
          <p class="subtitle">Propositions de formation envoyées à vos collaborateurs, avec suggestion IA d'organismes.</p>
        </div>
        <button class="add-btn" (click)="openSuggestModal()">🤖 Proposer une formation</button>
      </div>

      <div class="kpis" *ngIf="!loading">
        <div class="kpi"><span class="kpi-num">{{ statsCount('PROPOSED') }}</span><span class="kpi-lbl">En attente</span></div>
        <div class="kpi accepted"><span class="kpi-num">{{ statsCount('ACCEPTED_BY_EMPLOYEE') }}</span><span class="kpi-lbl">À inscrire</span></div>
        <div class="kpi enrolled"><span class="kpi-num">{{ statsCount('ENROLLED') }}</span><span class="kpi-lbl">En cours</span></div>
        <div class="kpi completed"><span class="kpi-num">{{ statsCount('COMPLETED') }}</span><span class="kpi-lbl">Terminées</span></div>
        <div class="kpi refused"><span class="kpi-num">{{ statsCount('REFUSED_BY_EMPLOYEE') + statsCount('ABANDONED') }}</span><span class="kpi-lbl">Refusées / abandonnées</span></div>
      </div>

      <div class="tabs">
        <button class="tab" [class.active]="activeTab==='active'" (click)="activeTab='active'">En cours</button>
        <button class="tab" [class.active]="activeTab==='done'"   (click)="activeTab='done'">Terminées</button>
        <button class="tab" [class.active]="activeTab==='ko'"     (click)="activeTab='ko'">Refusées / Abandonnées</button>
      </div>

      <div class="loading" *ngIf="loading">Chargement…</div>

      <div class="empty-state" *ngIf="!loading && filteredProposals.length === 0">
        <div class="empty-icon">📭</div>
        <h3>Aucune proposition</h3>
        <p>Cliquez sur "🤖 Proposer une formation" pour démarrer.</p>
      </div>

      <div class="cards-grid" *ngIf="!loading && filteredProposals.length > 0">
        <div class="card" *ngFor="let p of filteredProposals">
          <div class="card-head">
            <div>
              <h3>{{ p.employeeName || p.employeeMatricule }}</h3>
              <p class="muted">→ {{ p.provider?.name }}</p>
            </div>
            <span class="status-badge" [ngClass]="statusClass(p.status)">{{ statusLabel(p.status) }}</span>
          </div>

          <div class="ai-block" *ngIf="p.aiJustification">
            <div class="ai-head">
              <span class="ai-badge" [class.fallback]="p.aiSource==='FALLBACK'">
                {{ p.aiSource === 'AI' ? '🤖 Suggéré par IA' : '⚙️ Classement basique' }}
              </span>
              <span class="ai-score" *ngIf="p.aiScore != null">Score {{ p.aiScore }}/100</span>
            </div>
            <p class="ai-justif">{{ p.aiJustification }}</p>
          </div>

          <div class="meta-row">
            <span *ngIf="p.provider?.conventionStatus" class="badge" [ngClass]="conventionClass(p.provider.conventionStatus)">
              {{ conventionLabel(p.provider.conventionStatus) }}
            </span>
            <span *ngIf="p.provider?.avgPriceEur != null" class="meta-item">{{ p.provider.avgPriceEur }} €</span>
            <span *ngIf="p.provider?.avgDurationDays != null" class="meta-item">{{ p.provider.avgDurationDays }} j</span>
            <span *ngIf="p.createdAt" class="meta-item">Proposée le {{ formatDate(p.createdAt) }}</span>
          </div>

          <div class="actions">
            <button *ngIf="p.status==='ACCEPTED_BY_EMPLOYEE'" class="btn-primary" (click)="enroll(p)">✓ Confirmer l'inscription</button>
            <button *ngIf="p.status==='ENROLLED'" class="btn-primary" (click)="completeProposal(p)">🎯 Marquer terminée</button>
            <button *ngIf="p.status==='ENROLLED' || p.status==='ACCEPTED_BY_EMPLOYEE'" class="btn-ghost" (click)="abandon(p)">Abandonner</button>
            <a *ngIf="p.certificateUrl" [href]="p.certificateUrl" target="_blank" class="btn-link">📄 Certificat</a>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showSuggest" (click)="closeSuggest()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>🤖 Proposer une formation</h3>

          <div class="grid-2">
            <div class="field">
              <label>Matricule employé <span class="required">*</span></label>
              <input [(ngModel)]="suggestForm.employeeMatricule" placeholder="ex: EMP00123" />
            </div>
            <div class="field">
              <label>Nom employé</label>
              <input [(ngModel)]="suggestForm.employeeName" />
            </div>
          </div>

          <div class="field">
            <label>Email employé</label>
            <input [(ngModel)]="suggestForm.employeeEmail" type="email" />
          </div>

          <div class="field">
            <label>Compétences à acquérir <span class="required">*</span></label>
            <div class="skills-picker">
              <span class="skill-chip selectable"
                    *ngFor="let s of skillsCatalog"
                    [class.selected]="isSkillSelected(s.id)"
                    (click)="toggleSkill(s.id)">{{ s.name }}</span>
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label>Budget max (€)</label>
              <input [(ngModel)]="suggestForm.budgetMaxEur" type="number" min="0" />
            </div>
            <div class="field">
              <label>Mode préféré</label>
              <select [(ngModel)]="suggestForm.preferredMode">
                <option [ngValue]="undefined">Indifférent</option>
                <option value="PRESENTIEL">Présentiel</option>
                <option value="DISTANCIEL">Distanciel</option>
                <option value="HYBRIDE">Hybride</option>
              </select>
            </div>
          </div>

          <div class="error-msg" *ngIf="suggestError">{{ suggestError }}</div>

          <div class="modal-actions" *ngIf="suggestions.length === 0">
            <button class="cancel-btn" (click)="closeSuggest()">Annuler</button>
            <button class="submit-btn"
                    [disabled]="!canSuggest() || suggesting"
                    (click)="runSuggest()">
              {{ suggesting ? 'Analyse IA en cours…' : '🚀 Lancer la suggestion' }}
            </button>
          </div>

          <div class="suggestions" *ngIf="suggestions.length > 0">
            <h4>Top {{ suggestions.length }} suggéré
              <span class="ai-badge inline" [class.fallback]="suggestions[0].source==='FALLBACK'">
                {{ suggestions[0].source === 'AI' ? '🤖 IA Gemini' : '⚙️ Algorithme basique' }}
              </span>
            </h4>
            <div class="sugg-card" *ngFor="let s of suggestions">
              <div class="sugg-head">
                <h5>{{ s.provider.name }}</h5>
                <span class="score-pill">{{ s.score }}/100</span>
              </div>
              <p class="sugg-justif">{{ s.justification }}</p>
              <div class="meta-row">
                <span class="badge" [ngClass]="conventionClass(s.provider.conventionStatus)">{{ conventionLabel(s.provider.conventionStatus) }}</span>
                <span *ngIf="s.provider.avgPriceEur != null" class="meta-item">{{ s.provider.avgPriceEur }} €</span>
                <span *ngIf="s.provider.avgDurationDays != null" class="meta-item">{{ s.provider.avgDurationDays }} j</span>
                <span *ngIf="s.provider.deliveryMode" class="meta-item">{{ modeLabel(s.provider.deliveryMode) }}</span>
                <span class="badge qualiopi" *ngIf="s.provider.qualiopiCertified">✓ Qualiopi</span>
              </div>
              <button class="btn-primary pick" [disabled]="creating" (click)="pick(s)">Choisir cet organisme →</button>
            </div>
            <div class="modal-actions">
              <button class="cancel-btn" (click)="resetSuggest()">← Relancer</button>
              <button class="cancel-btn" (click)="closeSuggest()">Fermer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .formation-page { color:#0f172a; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:16px; }
    .header h1 { color:#1e3a5f; margin:0 0 6px 0; font-size:1.6rem; }
    .subtitle { color:#64748b; margin:0; font-size:0.9rem; max-width:700px; }
    .add-btn { padding:10px 20px; background:#1e3a5f; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem; white-space:nowrap; }
    .add-btn:hover { background:#17304f; }

    .kpis { display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:12px; margin-bottom:24px; }
    .kpi { background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; text-align:center; }
    .kpi.accepted { border-color:#fde68a; background:#fffbeb; }
    .kpi.enrolled { border-color:#bfdbfe; background:#eff6ff; }
    .kpi.completed { border-color:#bbf7d0; background:#f0fdf4; }
    .kpi.refused { border-color:#fecaca; background:#fef2f2; }
    .kpi-num { display:block; font-size:1.7rem; font-weight:700; color:#1e3a5f; }
    .kpi-lbl { font-size:0.78rem; color:#64748b; text-transform:uppercase; letter-spacing:0.04em; }

    .tabs { display:flex; gap:4px; margin-bottom:20px; border-bottom:1px solid #e2e8f0; }
    .tab { padding:10px 18px; background:transparent; border:none; border-bottom:2px solid transparent; cursor:pointer; font-size:0.9rem; color:#64748b; font-weight:500; }
    .tab.active { color:#1e3a5f; border-bottom-color:#1e3a5f; font-weight:600; }

    .loading, .empty-state { text-align:center; padding:40px; color:#94a3b8; }
    .empty-state { background:#fff; border:1px dashed #cbd5e1; border-radius:12px; }
    .empty-icon { font-size:48px; margin-bottom:12px; }

    .cards-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(380px,1fr)); gap:14px; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:18px; box-shadow:0 1px 3px rgba(15,23,42,0.04); display:flex; flex-direction:column; gap:10px; }
    .card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
    .card-head h3 { margin:0; color:#0f172a; font-size:1rem; }
    .muted { margin:2px 0 0 0; color:#64748b; font-size:0.85rem; }

    .status-badge { padding:3px 10px; border-radius:999px; font-size:0.7rem; font-weight:600; white-space:nowrap; }
    .status-badge.proposed { background:#fef3c7; color:#92400e; }
    .status-badge.accepted { background:#dbeafe; color:#1e40af; }
    .status-badge.enrolled { background:#eff6ff; color:#1e3a5f; }
    .status-badge.completed { background:#dcfce7; color:#15803d; }
    .status-badge.refused, .status-badge.abandoned { background:#fee2e2; color:#991b1b; }

    .ai-block { background:#f8fafc; border-left:3px solid #1e3a5f; border-radius:6px; padding:8px 10px; }
    .ai-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
    .ai-badge { padding:2px 8px; border-radius:999px; font-size:0.7rem; font-weight:600; background:#1e3a5f; color:#fff; }
    .ai-badge.fallback { background:#94a3b8; }
    .ai-badge.inline { font-size:0.65rem; padding:2px 7px; }
    .ai-score { font-size:0.78rem; font-weight:600; color:#475569; }
    .ai-justif { margin:0; font-size:0.83rem; color:#334155; line-height:1.35; }

    .meta-row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; font-size:0.78rem; color:#64748b; padding-top:4px; border-top:1px dashed #e2e8f0; }
    .meta-item { padding:1px 6px; background:#f1f5f9; border-radius:4px; }

    .badge { padding:2px 9px; border-radius:999px; font-size:0.7rem; font-weight:600; }
    .badge.conventionne { background:#dcfce7; color:#15803d; }
    .badge.reference    { background:#fef9c3; color:#854d0e; }
    .badge.nouveau      { background:#dbeafe; color:#1e40af; }
    .badge.qualiopi     { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; }

    .actions { display:flex; gap:6px; flex-wrap:wrap; padding-top:6px; }
    .btn-primary { padding:8px 14px; background:#1e3a5f; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:0.82rem; font-weight:600; }
    .btn-primary:hover:not(:disabled) { background:#17304f; }
    .btn-primary:disabled { background:#94a3b8; cursor:not-allowed; }
    .btn-ghost { padding:8px 14px; background:transparent; border:1px solid #cbd5e1; color:#475569; border-radius:6px; cursor:pointer; font-size:0.82rem; }
    .btn-ghost:hover { background:#fef2f2; border-color:#ef4444; color:#991b1b; }
    .btn-link { padding:8px 14px; color:#1e3a5f; text-decoration:none; font-size:0.82rem; font-weight:500; border:1px solid #cbd5e1; border-radius:6px; }
    .btn-link:hover { background:#eff6ff; }

    .modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; overflow-y:auto; }
    .modal { background:#fff; border-radius:12px; padding:28px; width:100%; max-width:680px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 40px rgba(0,0,0,0.2); }
    .modal h3 { margin:0 0 18px 0; color:#0f172a; font-size:1.15rem; }
    .modal h4 { margin:18px 0 12px 0; color:#1e3a5f; font-size:1rem; display:flex; align-items:center; gap:10px; }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .field { margin-bottom:14px; }
    .field label { display:block; font-size:0.85rem; font-weight:600; color:#334155; margin-bottom:6px; }
    .required { color:#ef4444; }
    .field input, .field select { width:100%; padding:9px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.88rem; box-sizing:border-box; outline:none; font-family:inherit; }
    .field input:focus, .field select:focus { border-color:#1e3a5f; box-shadow:0 0 0 3px rgba(30,58,95,0.1); }
    .skills-picker { display:flex; flex-wrap:wrap; gap:5px; padding:10px; border:1px solid #cbd5e1; border-radius:8px; max-height:160px; overflow-y:auto; background:#f8fafc; }
    .skill-chip { padding:3px 10px; background:#eff6ff; color:#1e3a5f; border-radius:999px; font-size:0.75rem; font-weight:500; }
    .skill-chip.selectable { cursor:pointer; border:1px solid transparent; user-select:none; }
    .skill-chip.selectable:hover { border-color:#1e3a5f; }
    .skill-chip.selectable.selected { background:#1e3a5f; color:#fff; }

    .suggestions { margin-top:8px; }
    .sugg-card { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin-bottom:10px; }
    .sugg-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .sugg-head h5 { margin:0; color:#0f172a; font-size:0.95rem; }
    .score-pill { padding:3px 12px; background:#1e3a5f; color:#fff; border-radius:999px; font-size:0.82rem; font-weight:700; }
    .sugg-justif { margin:0 0 8px 0; font-size:0.85rem; color:#334155; line-height:1.4; }
    .pick { margin-top:8px; width:100%; }

    .error-msg { padding:10px 14px; background:#fef2f2; border:1px solid #fecaca; color:#991b1b; border-radius:8px; font-size:0.85rem; margin-bottom:14px; }
    .modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:14px; }
    .cancel-btn { padding:9px 16px; border:1px solid #cbd5e1; background:#fff; border-radius:8px; cursor:pointer; font-size:0.9rem; color:#334155; }
    .cancel-btn:hover { background:#f1f5f9; }
    .submit-btn { padding:9px 16px; background:#1e3a5f; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:0.9rem; font-weight:600; }
    .submit-btn:hover:not(:disabled) { background:#17304f; }
    .submit-btn:disabled { background:#94a3b8; cursor:not-allowed; }
  `]
})
export class ManagerFormationComponent implements OnInit {

  proposals: TrainingProposal[] = [];
  stats: Record<ProposalStatus, number> = {
    PROPOSED: 0, ACCEPTED_BY_EMPLOYEE: 0, REFUSED_BY_EMPLOYEE: 0,
    ENROLLED: 0, COMPLETED: 0, ABANDONED: 0
  };
  skillsCatalog: Skill[] = [];
  loading = false;
  activeTab: 'active' | 'done' | 'ko' = 'active';

  showSuggest = false;
  suggesting = false;
  creating = false;
  suggestError = '';
  suggestions: TrainingSuggestion[] = [];
  selectedSkillIds = new Set<number>();
  /** ID de candidature source — pré-rempli quand on arrive depuis /manager/interviews. */
  prefilledApplicationId: number | null = null;

  suggestForm: {
    employeeMatricule: string;
    employeeName: string;
    employeeEmail: string;
    budgetMaxEur: number | null;
    preferredMode?: DeliveryMode;
  } = this.emptySuggestForm();

  constructor(
    private trainingService: TrainingService,
    private recruitmentApi: RecruitmentApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.load();
    this.recruitmentApi.getAllSkills().subscribe({
      next: (d) => this.skillsCatalog = d,
      error: () => this.skillsCatalog = []
    });

    // Auto-ouverture du modal de suggestion quand on arrive depuis /manager/interviews
    // avec les infos du candidat dans les query params. Si missingSkillIds est présent,
    // les compétences sont pré-cochées et l'appel IA est lancé automatiquement.
    this.route.queryParams.subscribe(params => {
      if (params['autoOpen'] === '1') {
        this.openSuggestModal();
        this.suggestForm.employeeMatricule = params['employeeMatricule'] || '';
        this.suggestForm.employeeName = params['employeeName'] || '';
        this.suggestForm.employeeEmail = params['employeeEmail'] || '';
        this.prefilledApplicationId = params['applicationId'] ? +params['applicationId'] : null;

        const idsParam: string = params['missingSkillIds'] || '';
        if (idsParam) {
          const ids = idsParam.split(',').map(s => +s).filter(n => !isNaN(n));
          this.selectedSkillIds = new Set(ids);
        }

        // Auto-déclenche la suggestion IA si tout est prêt (matricule + skills).
        if (params['autoSuggest'] === '1' && this.canSuggest()) {
          // Petit setTimeout pour laisser le binding s'appliquer avant l'appel.
          setTimeout(() => this.runSuggest(), 0);
        }
      }
    });
  }

  load(): void {
    this.loading = true;
    this.trainingService.listManagerProposals().subscribe({
      next: (data) => { this.proposals = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
    this.trainingService.getManagerStats().subscribe({
      next: (s) => this.stats = s,
      error: () => {}
    });
  }

  statsCount(s: ProposalStatus): number {
    return this.stats?.[s] ?? 0;
  }

  get filteredProposals(): TrainingProposal[] {
    if (this.activeTab === 'active') {
      return this.proposals.filter(p =>
        p.status === 'PROPOSED' || p.status === 'ACCEPTED_BY_EMPLOYEE' || p.status === 'ENROLLED');
    }
    if (this.activeTab === 'done') {
      return this.proposals.filter(p => p.status === 'COMPLETED');
    }
    return this.proposals.filter(p =>
      p.status === 'REFUSED_BY_EMPLOYEE' || p.status === 'ABANDONED');
  }

  openSuggestModal(): void {
    this.suggestForm = this.emptySuggestForm();
    this.selectedSkillIds = new Set();
    this.suggestions = [];
    this.suggestError = '';
    this.prefilledApplicationId = null;
    this.showSuggest = true;
  }

  closeSuggest(): void { this.showSuggest = false; }

  resetSuggest(): void {
    this.suggestions = [];
    this.suggestError = '';
  }

  isSkillSelected(id: number): boolean { return this.selectedSkillIds.has(id); }
  toggleSkill(id: number): void {
    if (this.selectedSkillIds.has(id)) this.selectedSkillIds.delete(id);
    else this.selectedSkillIds.add(id);
  }

  canSuggest(): boolean {
    return !!this.suggestForm.employeeMatricule?.trim() && this.selectedSkillIds.size > 0;
  }

  runSuggest(): void {
    if (!this.canSuggest()) return;
    this.suggesting = true;
    this.suggestError = '';
    const req: TrainingSuggestionRequest = {
      missingSkillIds: Array.from(this.selectedSkillIds),
      budgetMaxEur: this.suggestForm.budgetMaxEur,
      preferredMode: this.suggestForm.preferredMode,
      employeeMatricule: this.suggestForm.employeeMatricule.trim(),
    };
    this.trainingService.suggest(req).subscribe({
      next: (data) => { this.suggestions = data; this.suggesting = false; },
      error: (err: HttpErrorResponse) => {
        this.suggesting = false;
        this.suggestError = err.error?.error || 'Erreur lors de la suggestion.';
      }
    });
  }

  pick(s: TrainingSuggestion): void {
    this.creating = true;
    this.trainingService.createProposal({
      employeeMatricule: this.suggestForm.employeeMatricule.trim(),
      employeeName: this.suggestForm.employeeName?.trim() || undefined,
      employeeEmail: this.suggestForm.employeeEmail?.trim() || undefined,
      providerId: s.providerId,
      sourceApplicationId: this.prefilledApplicationId,
      missingSkillIds: Array.from(this.selectedSkillIds),
      aiScore: s.score,
      aiJustification: s.justification,
      aiSource: s.source,
    }).subscribe({
      next: () => {
        this.creating = false;
        this.showSuggest = false;
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.creating = false;
        alert(err.error?.error || 'Impossible de créer la proposition.');
      }
    });
  }

  enroll(p: TrainingProposal): void {
    if (!p.id) return;
    this.trainingService.enrollProposal(p.id).subscribe({
      next: () => this.load(),
      error: (err) => alert(err.error?.error || 'Erreur')
    });
  }

  completeProposal(p: TrainingProposal): void {
    if (!p.id) return;
    const url = prompt('URL du certificat (optionnel) :', '');
    this.trainingService.completeProposal(p.id, url || undefined).subscribe({
      next: () => this.load(),
      error: (err) => alert(err.error?.error || 'Erreur')
    });
  }

  abandon(p: TrainingProposal): void {
    if (!p.id) return;
    const reason = prompt("Raison de l'abandon :", '');
    if (reason === null) return;
    this.trainingService.abandonProposal(p.id, reason).subscribe({
      next: () => this.load(),
      error: (err) => alert(err.error?.error || 'Erreur')
    });
  }

  statusLabel(s: ProposalStatus): string {
    return ({
      PROPOSED: 'En attente employé',
      ACCEPTED_BY_EMPLOYEE: 'Accepté — à inscrire',
      REFUSED_BY_EMPLOYEE: 'Refusé',
      ENROLLED: 'Formation en cours',
      COMPLETED: 'Terminée ✓',
      ABANDONED: 'Abandonnée'
    } as Record<ProposalStatus, string>)[s];
  }
  statusClass(s: ProposalStatus): string {
    return ({
      PROPOSED: 'proposed', ACCEPTED_BY_EMPLOYEE: 'accepted', REFUSED_BY_EMPLOYEE: 'refused',
      ENROLLED: 'enrolled', COMPLETED: 'completed', ABANDONED: 'abandoned'
    } as Record<ProposalStatus, string>)[s];
  }
  conventionLabel(s: string): string {
    return s === 'CONVENTIONNE' ? '✓ Conventionné' : s === 'REFERENCE' ? 'Référencé' : 'Nouveau';
  }
  conventionClass(s: string): string { return s.toLowerCase(); }
  modeLabel(m: DeliveryMode): string {
    return m === 'PRESENTIEL' ? '📍 Présentiel' : m === 'DISTANCIEL' ? '💻 Distanciel' : '🔀 Hybride';
  }
  formatDate(iso?: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
  }

  private emptySuggestForm() {
    return {
      employeeMatricule: '',
      employeeName: '',
      employeeEmail: '',
      budgetMaxEur: null as number | null,
      preferredMode: undefined as DeliveryMode | undefined,
    };
  }
}
