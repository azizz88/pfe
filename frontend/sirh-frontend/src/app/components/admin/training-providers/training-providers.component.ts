import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import {
  TrainingService,
  TrainingProvider,
  TrainingProviderRequest,
  ConventionStatus,
  DeliveryMode,
  Skill
} from '../../../services/training.service';

@Component({
  selector: 'app-training-providers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management">
      <div class="header">
        <div>
          <h1>🏫 Organismes de Formation</h1>
          <p class="subtitle">
            Catalogue des organismes externes proposés par l'IA pour faire monter en compétence les candidats et employés.
          </p>
        </div>
        <button class="add-btn" (click)="openCreateForm()">+ Nouvel organisme</button>
      </div>

      <!-- Toolbar : recherche + filtres -->
      <div class="toolbar">
        <input
          type="text"
          class="search"
          placeholder="🔍 Rechercher (nom, description, compétence…)"
          [(ngModel)]="searchTerm"
        />
        <select [(ngModel)]="filterConvention" class="filter">
          <option value="">Tous statuts</option>
          <option value="CONVENTIONNE">Conventionnés</option>
          <option value="REFERENCE">Référencés</option>
          <option value="NOUVEAU">Nouveaux</option>
        </select>
        <select [(ngModel)]="filterMode" class="filter">
          <option value="">Tous modes</option>
          <option value="PRESENTIEL">Présentiel</option>
          <option value="DISTANCIEL">Distanciel</option>
          <option value="HYBRIDE">Hybride</option>
        </select>
        <span class="count-badge">{{ filtered.length }} / {{ providers.length }}</span>
      </div>

      <div class="loading" *ngIf="loading">Chargement…</div>

      <div class="empty-state" *ngIf="!loading && providers.length === 0">
        <div class="empty-icon">🏫</div>
        <h3>Aucun organisme enregistré</h3>
        <p>Ajoutez les organismes de formation que votre entreprise utilise habituellement.</p>
      </div>

      <!-- Liste cartes -->
      <div class="cards-grid" *ngIf="!loading && filtered.length > 0">
        <div class="card" *ngFor="let p of filtered">
          <div class="card-head">
            <h3>{{ p.name }}</h3>
            <div class="actions">
              <button class="icon-btn edit" (click)="openEditForm(p)" title="Modifier">✏️</button>
              <button class="icon-btn delete" (click)="deleteProvider(p)" title="Supprimer">🗑️</button>
            </div>
          </div>

          <div class="badges">
            <span class="badge" [ngClass]="conventionClass(p.conventionStatus)">
              {{ conventionLabel(p.conventionStatus) }}
            </span>
            <span class="badge qualiopi" *ngIf="p.qualiopiCertified">✓ Qualiopi</span>
            <span class="badge mode" *ngIf="p.deliveryMode">{{ modeLabel(p.deliveryMode) }}</span>
          </div>

          <p class="description" *ngIf="p.description">{{ p.description }}</p>

          <div class="skills" *ngIf="p.skillsCovered?.length">
            <span class="skill-chip" *ngFor="let s of p.skillsCovered">{{ s.name }}</span>
          </div>

          <div class="meta">
            <div *ngIf="p.avgPriceEur != null"><span class="meta-label">Prix moyen</span> {{ p.avgPriceEur }} €</div>
            <div *ngIf="p.avgDurationDays != null"><span class="meta-label">Durée</span> {{ p.avgDurationDays }} j</div>
            <div *ngIf="p.pastSuccessRate != null"><span class="meta-label">Succès</span> {{ p.pastSuccessRate }}%</div>
            <a *ngIf="p.website" [href]="p.website" target="_blank" class="link">🌐 Site</a>
          </div>
        </div>
      </div>

      <p *ngIf="!loading && providers.length > 0 && filtered.length === 0" class="empty-filter">
        Aucun organisme ne correspond aux filtres.
      </p>

      <!-- Modal création/édition -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingId ? 'Modifier' : 'Ajouter' }} un organisme</h3>

          <div class="grid-2">
            <div class="field">
              <label>Nom <span class="required">*</span></label>
              <input [(ngModel)]="form.name" maxlength="150" />
            </div>
            <div class="field">
              <label>Convention <span class="required">*</span></label>
              <select [(ngModel)]="form.conventionStatus">
                <option value="CONVENTIONNE">Conventionné</option>
                <option value="REFERENCE">Référencé</option>
                <option value="NOUVEAU">Nouveau</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label>Description</label>
            <textarea [(ngModel)]="form.description" rows="3"></textarea>
          </div>

          <div class="grid-2">
            <div class="field">
              <label>Site web</label>
              <input [(ngModel)]="form.website" type="url" placeholder="https://…" />
            </div>
            <div class="field">
              <label>Email contact</label>
              <input [(ngModel)]="form.contactEmail" type="email" />
            </div>
          </div>

          <div class="field">
            <label>Compétences couvertes</label>
            <div class="skills-picker">
              <span class="skill-chip selectable"
                    *ngFor="let s of skillsCatalog"
                    [class.selected]="isSkillSelected(s.id)"
                    (click)="toggleSkill(s.id)">
                {{ s.name }}
              </span>
            </div>
          </div>

          <div class="grid-3">
            <div class="field">
              <label>Mode</label>
              <select [(ngModel)]="form.deliveryMode">
                <option [ngValue]="undefined">—</option>
                <option value="PRESENTIEL">Présentiel</option>
                <option value="DISTANCIEL">Distanciel</option>
                <option value="HYBRIDE">Hybride</option>
              </select>
            </div>
            <div class="field">
              <label>Prix moyen (€)</label>
              <input [(ngModel)]="form.avgPriceEur" type="number" min="0" />
            </div>
            <div class="field">
              <label>Durée (jours)</label>
              <input [(ngModel)]="form.avgDurationDays" type="number" min="0" />
            </div>
          </div>

          <div class="grid-2">
            <div class="field">
              <label>Taux de succès (%)</label>
              <input [(ngModel)]="form.pastSuccessRate" type="number" min="0" max="100" />
            </div>
            <div class="field checkbox">
              <label>
                <input type="checkbox" [(ngModel)]="form.qualiopiCertified" />
                <span>Certifié Qualiopi</span>
              </label>
            </div>
          </div>

          <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div>

          <div class="modal-actions">
            <button class="cancel-btn" (click)="closeForm()">Annuler</button>
            <button class="submit-btn"
                    [disabled]="!form.name?.trim() || !form.conventionStatus || submitting"
                    (click)="saveProvider()">
              {{ editingId ? 'Enregistrer' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management { color: #0f172a; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:16px; }
    .header h1 { color:#1e3a5f; margin:0 0 6px 0; font-size:1.6rem; }
    .subtitle { color:#64748b; margin:0; font-size:0.9rem; max-width:700px; }
    .add-btn { padding:10px 20px; background:#1e3a5f; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.9rem; white-space:nowrap; }
    .add-btn:hover { background:#17304f; }

    .toolbar { display:flex; gap:12px; margin-bottom:20px; align-items:center; flex-wrap:wrap; }
    .search { flex:1; min-width:240px; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.9rem; background:#fff; outline:none; }
    .search:focus { border-color:#1e3a5f; box-shadow:0 0 0 3px rgba(30,58,95,0.1); }
    .filter { padding:10px 12px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; font-size:0.85rem; }
    .count-badge { padding:6px 14px; background:#e2e8f0; border-radius:999px; font-size:0.8rem; font-weight:600; color:#334155; }

    .loading, .empty-filter { text-align:center; padding:40px; color:#94a3b8; }
    .empty-state { text-align:center; padding:64px 24px; background:#fff; border:1px dashed #cbd5e1; border-radius:12px; }
    .empty-icon { font-size:48px; margin-bottom:12px; }

    .cards-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(380px, 1fr)); gap:16px; }
    .card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:18px; box-shadow:0 1px 3px rgba(15,23,42,0.04); display:flex; flex-direction:column; gap:10px; }
    .card-head { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
    .card-head h3 { margin:0; color:#0f172a; font-size:1.05rem; }
    .actions { display:flex; gap:4px; }

    .badges { display:flex; gap:6px; flex-wrap:wrap; }
    .badge { padding:3px 10px; border-radius:999px; font-size:0.72rem; font-weight:600; }
    .badge.conventionne { background:#dcfce7; color:#15803d; }
    .badge.reference    { background:#fef9c3; color:#854d0e; }
    .badge.nouveau      { background:#dbeafe; color:#1e40af; }
    .badge.qualiopi     { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; }
    .badge.mode         { background:#f1f5f9; color:#475569; }

    .description { color:#475569; font-size:0.88rem; margin:0; line-height:1.4; }
    .skills { display:flex; gap:4px; flex-wrap:wrap; }
    .skill-chip { padding:3px 10px; background:#eff6ff; color:#1e3a5f; border-radius:999px; font-size:0.75rem; font-weight:500; }
    .skill-chip.selectable { cursor:pointer; border:1px solid transparent; user-select:none; }
    .skill-chip.selectable:hover { border-color:#1e3a5f; }
    .skill-chip.selectable.selected { background:#1e3a5f; color:#fff; }

    .meta { display:flex; gap:14px; flex-wrap:wrap; font-size:0.82rem; color:#475569; padding-top:6px; border-top:1px dashed #e2e8f0; }
    .meta-label { color:#94a3b8; margin-right:4px; }
    .link { color:#1e3a5f; text-decoration:none; font-weight:500; }
    .link:hover { text-decoration:underline; }

    .icon-btn { background:transparent; border:1px solid #e2e8f0; padding:5px 9px; border-radius:6px; cursor:pointer; font-size:0.85rem; }
    .icon-btn.edit:hover { border-color:#3b82f6; background:#eff6ff; }
    .icon-btn.delete:hover { border-color:#ef4444; background:#fef2f2; }

    /* Modal */
    .modal-overlay { position:fixed; inset:0; background:rgba(15,23,42,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; overflow-y:auto; }
    .modal { background:#fff; border-radius:12px; padding:28px; width:100%; max-width:680px; max-height:90vh; overflow-y:auto; box-shadow:0 20px 40px rgba(0,0,0,0.2); }
    .modal h3 { margin:0 0 20px 0; color:#0f172a; font-size:1.15rem; }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
    .field { margin-bottom:14px; }
    .field label { display:block; font-size:0.85rem; font-weight:600; color:#334155; margin-bottom:6px; }
    .required { color:#ef4444; }
    .field input, .field textarea, .field select { width:100%; padding:9px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.88rem; box-sizing:border-box; outline:none; font-family:inherit; }
    .field input:focus, .field textarea:focus, .field select:focus { border-color:#1e3a5f; box-shadow:0 0 0 3px rgba(30,58,95,0.1); }
    .field.checkbox label { display:flex; align-items:center; gap:8px; padding-top:24px; cursor:pointer; }
    .field.checkbox input { width:auto; }
    .skills-picker { display:flex; flex-wrap:wrap; gap:5px; padding:10px; border:1px solid #cbd5e1; border-radius:8px; max-height:160px; overflow-y:auto; background:#f8fafc; }

    .error-msg { padding:10px 14px; background:#fef2f2; border:1px solid #fecaca; color:#991b1b; border-radius:8px; font-size:0.85rem; margin-bottom:14px; }
    .modal-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:16px; }
    .cancel-btn { padding:9px 16px; border:1px solid #cbd5e1; background:#fff; border-radius:8px; cursor:pointer; font-size:0.9rem; color:#334155; }
    .cancel-btn:hover { background:#f1f5f9; }
    .submit-btn { padding:9px 16px; background:#1e3a5f; color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:0.9rem; font-weight:600; }
    .submit-btn:hover:not(:disabled) { background:#17304f; }
    .submit-btn:disabled { background:#94a3b8; cursor:not-allowed; }
  `]
})
export class TrainingProvidersComponent implements OnInit {

  providers: TrainingProvider[] = [];
  skillsCatalog: Skill[] = [];
  loading = false;

  searchTerm = '';
  filterConvention: ConventionStatus | '' = '';
  filterMode: DeliveryMode | '' = '';

  showForm = false;
  submitting = false;
  editingId: number | null = null;
  errorMessage = '';

  form: TrainingProviderRequest & { _selectedSkillIds?: number[] } = this.emptyForm();
  selectedSkillIds = new Set<number>();

  constructor(
    private trainingService: TrainingService,
    private recruitmentApi: RecruitmentApiService
  ) {}

  ngOnInit(): void {
    this.load();
    this.recruitmentApi.getAllSkills().subscribe({
      next: (data) => this.skillsCatalog = data,
      error: () => this.skillsCatalog = []
    });
  }

  load(): void {
    this.loading = true;
    this.trainingService.listProviders().subscribe({
      next: (data) => { this.providers = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get filtered(): TrainingProvider[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.providers.filter(p => {
      if (this.filterConvention && p.conventionStatus !== this.filterConvention) return false;
      if (this.filterMode && p.deliveryMode !== this.filterMode) return false;
      if (!q) return true;
      const hay = [p.name, p.description || '', (p.skillsCovered || []).map(s => s.name).join(' ')]
        .join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  openCreateForm(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.selectedSkillIds = new Set();
    this.errorMessage = '';
    this.showForm = true;
  }

  openEditForm(p: TrainingProvider): void {
    this.editingId = p.id!;
    this.form = {
      name: p.name,
      description: p.description,
      website: p.website,
      contactEmail: p.contactEmail,
      skillIds: (p.skillsCovered || []).map(s => s.id),
      qualiopiCertified: p.qualiopiCertified,
      conventionStatus: p.conventionStatus,
      avgPriceEur: p.avgPriceEur ?? null,
      avgDurationDays: p.avgDurationDays ?? null,
      deliveryMode: p.deliveryMode,
      pastSuccessRate: p.pastSuccessRate ?? null,
    };
    this.selectedSkillIds = new Set(this.form.skillIds);
    this.errorMessage = '';
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  isSkillSelected(id: number): boolean {
    return this.selectedSkillIds.has(id);
  }

  toggleSkill(id: number): void {
    if (this.selectedSkillIds.has(id)) this.selectedSkillIds.delete(id);
    else this.selectedSkillIds.add(id);
  }

  saveProvider(): void {
    if (!this.form.name?.trim()) return;
    this.submitting = true;
    this.errorMessage = '';
    const payload: TrainingProviderRequest = {
      ...this.form,
      name: this.form.name.trim(),
      skillIds: Array.from(this.selectedSkillIds),
    };
    const obs = this.editingId
      ? this.trainingService.updateProvider(this.editingId, payload)
      : this.trainingService.createProvider(payload);
    obs.subscribe({
      next: () => { this.submitting = false; this.showForm = false; this.load(); },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.errorMessage = err.error?.error || 'Erreur — vérifiez les champs.';
      }
    });
  }

  deleteProvider(p: TrainingProvider): void {
    if (!p.id) return;
    if (!confirm(`Supprimer "${p.name}" ?`)) return;
    this.trainingService.deleteProvider(p.id).subscribe({
      next: () => this.load(),
      error: () => alert('Impossible de supprimer cet organisme.')
    });
  }

  // ── Labels & classes ──
  conventionLabel(s: ConventionStatus): string {
    return s === 'CONVENTIONNE' ? '✓ Conventionné'
         : s === 'REFERENCE'     ? 'Référencé'
                                  : 'Nouveau';
  }
  conventionClass(s: ConventionStatus): string {
    return s.toLowerCase();
  }
  modeLabel(m: DeliveryMode): string {
    return m === 'PRESENTIEL' ? '📍 Présentiel'
         : m === 'DISTANCIEL' ? '💻 Distanciel'
                              : '🔀 Hybride';
  }

  private emptyForm(): TrainingProviderRequest {
    return {
      name: '',
      description: '',
      website: '',
      contactEmail: '',
      skillIds: [],
      qualiopiCertified: false,
      conventionStatus: 'NOUVEAU',
      avgPriceEur: null,
      avgDurationDays: null,
      deliveryMode: undefined,
      pastSuccessRate: null,
    };
  }
}
