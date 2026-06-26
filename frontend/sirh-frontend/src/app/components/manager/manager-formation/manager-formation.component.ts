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
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-manager-formation',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="page formation-page">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Formations en pilotage</h1>
          <span class="page-header__sub">Propositions de formation envoyées à vos collaborateurs, avec suggestion IA d'organismes.</span>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" (click)="openSuggestModal()">
            <app-icon name="ai" [size]="16" />
            Proposer une formation
          </button>
        </div>
      </div>

      <div class="grid grid--kpi kpis" *ngIf="!loading">
        <div class="stat">
          <div class="stat__icon is-warn"><app-icon name="pending" [size]="20" /></div>
          <div class="stat__body"><div class="stat__value">{{ statsCount('PROPOSED') }}</div><div class="stat__label">En attente</div></div>
        </div>
        <div class="stat">
          <div class="stat__icon is-info"><app-icon name="check" [size]="20" /></div>
          <div class="stat__body"><div class="stat__value">{{ statsCount('ACCEPTED_BY_EMPLOYEE') }}</div><div class="stat__label">À inscrire</div></div>
        </div>
        <div class="stat">
          <div class="stat__icon is-brand"><app-icon name="formation" [size]="20" /></div>
          <div class="stat__body"><div class="stat__value">{{ statsCount('ENROLLED') }}</div><div class="stat__label">En cours</div></div>
        </div>
        <div class="stat">
          <div class="stat__icon is-ok"><app-icon name="approve" [size]="20" /></div>
          <div class="stat__body"><div class="stat__value">{{ statsCount('COMPLETED') }}</div><div class="stat__label">Terminées</div></div>
        </div>
        <div class="stat">
          <div class="stat__icon is-danger"><app-icon name="reject" [size]="20" /></div>
          <div class="stat__body"><div class="stat__value">{{ statsCount('REFUSED_BY_EMPLOYEE') + statsCount('ABANDONED') }}</div><div class="stat__label">Refusées / abandonnées</div></div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab" [class.is-active]="activeTab==='active'" (click)="activeTab='active'">En cours</button>
        <button class="tab" [class.is-active]="activeTab==='done'"   (click)="activeTab='done'">Terminées</button>
        <button class="tab" [class.is-active]="activeTab==='ko'"     (click)="activeTab='ko'">Refusées / Abandonnées</button>
      </div>

      <div class="loading-row" *ngIf="loading"><span class="spinner"></span> Chargement…</div>

      <div class="empty-state" *ngIf="!loading && filteredProposals.length === 0">
        <div class="empty-state__icon"><app-icon name="inbox" [size]="26" /></div>
        <div class="empty-state__title">Aucune proposition</div>
        <p class="empty-state__text">Cliquez sur « Proposer une formation » pour démarrer.</p>
      </div>

      <div class="cards-grid" *ngIf="!loading && filteredProposals.length > 0">
        <div class="card fade-in" *ngFor="let p of filteredProposals">
          <div class="card__body prop-card">
            <div class="prop-head">
              <div class="prop-id">
                <div class="prop-name">{{ p.employeeName || p.employeeMatricule }}</div>
                <div class="prop-sub"><app-icon name="arrow-right" [size]="14" /> {{ p.provider?.name }}</div>
              </div>
              <span class="badge" [ngClass]="statusClass(p.status)">{{ statusLabel(p.status) }}</span>
            </div>

            <div class="ai-block" *ngIf="p.aiJustification">
              <div class="ai-head">
                <span class="ai-badge" [class.fallback]="p.aiSource==='FALLBACK'">
                  <app-icon [name]="p.aiSource === 'AI' ? 'ai' : 'settings'" [size]="13" />
                  {{ p.aiSource === 'AI' ? 'Suggéré par IA' : 'Classement basique' }}
                </span>
                <span class="ai-score" *ngIf="p.aiScore != null">Score {{ p.aiScore }}/100</span>
              </div>
              <p class="ai-justif">{{ p.aiJustification }}</p>
            </div>

            <div class="meta-row">
              <span *ngIf="p.provider?.conventionStatus" class="badge" [ngClass]="conventionClass(p.provider.conventionStatus)">
                {{ conventionLabel(p.provider.conventionStatus) }}
              </span>
              <span *ngIf="p.provider?.avgPriceEur != null" class="meta-item"><app-icon name="salary" [size]="13" /> {{ p.provider.avgPriceEur }} €</span>
              <span *ngIf="p.provider?.avgDurationDays != null" class="meta-item"><app-icon name="clock" [size]="13" /> {{ p.provider.avgDurationDays }} j</span>
              <span *ngIf="p.createdAt" class="meta-item"><app-icon name="calendar" [size]="13" /> Proposée le {{ formatDate(p.createdAt) }}</span>
            </div>

            <div class="actions">
              <button *ngIf="p.status==='ACCEPTED_BY_EMPLOYEE'" class="btn btn--primary btn--sm" (click)="enroll(p)">
                <app-icon name="check" [size]="15" /> Confirmer l'inscription
              </button>
              <button *ngIf="p.status==='ENROLLED'" class="btn btn--success btn--sm" (click)="completeProposal(p)">
                <app-icon name="approve" [size]="15" /> Marquer terminée
              </button>
              <button *ngIf="p.status==='ENROLLED' || p.status==='ACCEPTED_BY_EMPLOYEE'" class="btn btn--secondary btn--sm" (click)="abandon(p)">Abandonner</button>
              <a *ngIf="p.certificateUrl" [href]="p.certificateUrl" target="_blank" class="btn btn--ghost btn--sm">
                <app-icon name="document" [size]="15" /> Certificat
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-overlay" *ngIf="showSuggest" (click)="closeSuggest()">
        <div class="modal modal--lg" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Proposer une formation">
          <div class="modal__header">
            <div class="modal__title"><app-icon name="ai" [size]="20" /> Proposer une formation</div>
            <button class="icon-btn" (click)="closeSuggest()" aria-label="Fermer"><app-icon name="close" [size]="18" /></button>
          </div>

          <div class="modal__body">
            <div class="form-grid">
              <div class="field">
                <label class="label" for="f-matricule">Matricule employé <span class="req">*</span></label>
                <input id="f-matricule" class="input" [(ngModel)]="suggestForm.employeeMatricule" placeholder="ex: EMP00123" />
              </div>
              <div class="field">
                <label class="label" for="f-name">Nom employé</label>
                <input id="f-name" class="input" [(ngModel)]="suggestForm.employeeName" />
              </div>
            </div>

            <div class="field">
              <label class="label" for="f-email">Email employé</label>
              <input id="f-email" class="input" [(ngModel)]="suggestForm.employeeEmail" type="email" />
            </div>

            <div class="field">
              <label class="label">Compétences à acquérir <span class="req">*</span></label>
              <div class="skills-picker">
                <span class="skill-chip"
                      *ngFor="let s of skillsCatalog"
                      role="button"
                      [attr.aria-pressed]="isSkillSelected(s.id)"
                      [class.selected]="isSkillSelected(s.id)"
                      (click)="toggleSkill(s.id)">{{ s.name }}</span>
              </div>
            </div>

            <div class="form-grid">
              <div class="field">
                <label class="label" for="f-budget">Budget max (€)</label>
                <input id="f-budget" class="input" [(ngModel)]="suggestForm.budgetMaxEur" type="number" min="0" />
              </div>
              <div class="field">
                <label class="label" for="f-mode">Mode préféré</label>
                <select id="f-mode" class="select" [(ngModel)]="suggestForm.preferredMode">
                  <option [ngValue]="undefined">Indifférent</option>
                  <option value="PRESENTIEL">Présentiel</option>
                  <option value="DISTANCIEL">Distanciel</option>
                  <option value="HYBRIDE">Hybride</option>
                </select>
              </div>
            </div>

            <div class="alert alert--danger" *ngIf="suggestError">
              <app-icon name="warning" class="alert__icon" [size]="18" />
              <span>{{ suggestError }}</span>
            </div>

            <div class="suggestions" *ngIf="suggestions.length > 0">
              <div class="section-title">
                Top {{ suggestions.length }} suggéré
                <span class="ai-badge inline" [class.fallback]="suggestions[0].source==='FALLBACK'">
                  <app-icon [name]="suggestions[0].source === 'AI' ? 'ai' : 'settings'" [size]="12" />
                  {{ suggestions[0].source === 'AI' ? 'IA Gemini' : 'Algorithme basique' }}
                </span>
              </div>
              <div class="sugg-card" *ngFor="let s of suggestions">
                <div class="sugg-head">
                  <div class="sugg-name">{{ s.provider.name }}</div>
                  <span class="badge badge--brand">{{ s.score }}/100</span>
                </div>
                <p class="sugg-justif">{{ s.justification }}</p>
                <div class="meta-row">
                  <span class="badge" [ngClass]="conventionClass(s.provider.conventionStatus)">{{ conventionLabel(s.provider.conventionStatus) }}</span>
                  <span *ngIf="s.provider.avgPriceEur != null" class="meta-item"><app-icon name="salary" [size]="13" /> {{ s.provider.avgPriceEur }} €</span>
                  <span *ngIf="s.provider.avgDurationDays != null" class="meta-item"><app-icon name="clock" [size]="13" /> {{ s.provider.avgDurationDays }} j</span>
                  <span *ngIf="s.provider.deliveryMode" class="meta-item">{{ modeLabel(s.provider.deliveryMode) }}</span>
                  <span class="badge qualiopi" *ngIf="s.provider.qualiopiCertified"><app-icon name="check" [size]="12" /> Qualiopi</span>
                </div>
                <button class="btn btn--primary btn--block pick" [disabled]="creating" (click)="pick(s)">
                  Choisir cet organisme <app-icon name="arrow-right" [size]="15" />
                </button>
              </div>
            </div>
          </div>

          <div class="modal__footer" *ngIf="suggestions.length === 0">
            <button class="btn btn--secondary" (click)="closeSuggest()">Annuler</button>
            <button class="btn btn--primary"
                    [disabled]="!canSuggest() || suggesting"
                    (click)="runSuggest()">
              <span class="spinner spinner--light" *ngIf="suggesting"></span>
              <app-icon name="ai" [size]="16" *ngIf="!suggesting" />
              {{ suggesting ? 'Analyse IA en cours…' : 'Lancer la suggestion' }}
            </button>
          </div>

          <div class="modal__footer" *ngIf="suggestions.length > 0">
            <button class="btn btn--secondary" (click)="resetSuggest()"><app-icon name="refresh" [size]="15" /> Relancer</button>
            <button class="btn btn--ghost" (click)="closeSuggest()">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .formation-page { color: var(--c-ink); }

    .kpis { margin-bottom: var(--sp-6); }
    .stat__icon.is-warn   { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .stat__icon.is-info   { background: var(--c-info-soft);    color: var(--c-info-ink); }
    .stat__icon.is-brand  { background: var(--c-brand-soft);   color: var(--c-brand-ink); }
    .stat__icon.is-ok     { background: var(--c-success-soft); color: var(--c-success-ink); }
    .stat__icon.is-danger { background: var(--c-danger-soft);  color: var(--c-danger-ink); }

    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: var(--sp-4); }
    .prop-card { display: flex; flex-direction: column; gap: var(--sp-3); }

    .prop-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sp-2); }
    .prop-name { font-weight: 650; color: var(--c-ink); font-size: var(--fs-15); }
    .prop-sub { display: flex; align-items: center; gap: 5px; color: var(--c-muted); font-size: var(--fs-13); margin-top: 2px; }

    .ai-block { background: var(--c-surface-2); border: 1px solid var(--c-border); border-left: 3px solid var(--c-accent); border-radius: var(--r-sm); padding: var(--sp-2) var(--sp-3); }
    .ai-head { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-2); margin-bottom: 4px; }
    .ai-badge { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: var(--r-pill); font-size: var(--fs-12); font-weight: 600; background: var(--c-accent-soft); color: var(--c-accent-ink); }
    .ai-badge.fallback { background: var(--c-surface-3); color: var(--c-muted); }
    .ai-badge.inline { font-size: var(--fs-11); padding: 2px 8px; }
    .ai-score { font-size: var(--fs-12); font-weight: 600; color: var(--c-muted); font-variant-numeric: tabular-nums; }
    .ai-justif { margin: 0; font-size: var(--fs-13); color: var(--c-ink-soft); line-height: 1.4; }

    .meta-row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .meta-item { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-12); color: var(--c-muted); background: var(--c-surface-3); padding: 2px 8px; border-radius: var(--r-sm); }

    /* Statut de proposition */
    .badge.proposed  { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .badge.accepted  { background: var(--c-info-soft);    color: var(--c-info-ink); }
    .badge.enrolled  { background: var(--c-brand-soft);   color: var(--c-brand-ink); }
    .badge.completed { background: var(--c-success-soft); color: var(--c-success-ink); }
    .badge.refused   { background: var(--c-danger-soft);  color: var(--c-danger-ink); }
    .badge.abandoned { background: var(--c-surface-3);    color: var(--c-ink-soft); border-color: var(--c-border); }

    /* Statut de convention organisme */
    .badge.conventionne { background: var(--c-success-soft); color: var(--c-success-ink); }
    .badge.reference    { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .badge.nouveau      { background: var(--c-info-soft);    color: var(--c-info-ink); }
    .badge.qualiopi     { background: var(--c-success-soft); color: var(--c-success-ink); border-color: #c6ead2; }

    .actions { display: flex; gap: 6px; flex-wrap: wrap; }

    /* Modal — formulaire */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-4); }
    @media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } }

    .skills-picker { display: flex; flex-wrap: wrap; gap: 6px; padding: var(--sp-3); border: 1px solid var(--c-border); border-radius: var(--r-sm); max-height: 170px; overflow-y: auto; background: var(--c-surface-2); }
    .skill-chip { padding: 4px 10px; border-radius: var(--r-pill); font-size: var(--fs-12); font-weight: 500; background: var(--c-surface); color: var(--c-ink-soft); border: 1px solid var(--c-border); cursor: pointer; user-select: none; transition: background var(--transition), color var(--transition), border-color var(--transition); }
    .skill-chip:hover { border-color: var(--c-accent); color: var(--c-accent-ink); }
    .skill-chip.selected { background: var(--c-accent); color: #fff; border-color: var(--c-accent); }

    /* Modal — suggestions */
    .suggestions { display: flex; flex-direction: column; gap: var(--sp-3); }
    .suggestions .section-title { margin-bottom: 0; }
    .sugg-card { background: var(--c-surface-2); border: 1px solid var(--c-border); border-radius: var(--r-md); padding: var(--sp-4); display: flex; flex-direction: column; gap: var(--sp-2); }
    .sugg-head { display: flex; justify-content: space-between; align-items: center; gap: var(--sp-2); }
    .sugg-name { font-weight: 650; color: var(--c-ink); font-size: var(--fs-15); }
    .sugg-justif { margin: 0; font-size: var(--fs-13); color: var(--c-ink-soft); line-height: 1.45; }
    .pick { margin-top: 2px; }
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
      COMPLETED: 'Terminée',
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
    return s === 'CONVENTIONNE' ? 'Conventionné' : s === 'REFERENCE' ? 'Référencé' : 'Nouveau';
  }
  conventionClass(s: string): string { return s.toLowerCase(); }
  modeLabel(m: DeliveryMode): string {
    return m === 'PRESENTIEL' ? 'Présentiel' : m === 'DISTANCIEL' ? 'Distanciel' : 'Hybride';
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
