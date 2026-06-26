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
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-training-providers',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="providers-mgmt">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Organismes de formation</h1>
          <span class="page-header__sub">
            Catalogue des organismes externes proposés par l'IA pour faire monter en compétence les candidats et employés.
          </span>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" (click)="openCreateForm()">
            <app-icon name="add" [size]="16" />
            Nouvel organisme
          </button>
        </div>
      </div>

      <!-- Toolbar : recherche + filtres -->
      <div class="toolbar">
        <div class="input-icon search-field">
          <app-icon name="search" [size]="16" />
          <input
            type="text"
            class="input"
            placeholder="Rechercher (nom, description, compétence…)"
            [(ngModel)]="searchTerm"
          />
        </div>
        <select [(ngModel)]="filterConvention" class="select filter">
          <option value="">Tous statuts</option>
          <option value="CONVENTIONNE">Conventionnés</option>
          <option value="REFERENCE">Référencés</option>
          <option value="NOUVEAU">Nouveaux</option>
        </select>
        <select [(ngModel)]="filterMode" class="select filter">
          <option value="">Tous modes</option>
          <option value="PRESENTIEL">Présentiel</option>
          <option value="DISTANCIEL">Distanciel</option>
          <option value="HYBRIDE">Hybride</option>
        </select>
        <span class="badge badge--neutral u-mono">{{ filtered.length }} / {{ providers.length }}</span>
      </div>

      <div class="loading-row" *ngIf="loading">
        <span class="spinner"></span> Chargement…
      </div>

      <div class="card card--flat" *ngIf="!loading && providers.length === 0">
        <div class="empty-state">
          <div class="empty-state__icon"><app-icon name="training-provider" [size]="26" /></div>
          <div class="empty-state__title">Aucun organisme enregistré</div>
          <p class="empty-state__text">Ajoutez les organismes de formation que votre entreprise utilise habituellement.</p>
        </div>
      </div>

      <!-- Liste cartes -->
      <div class="providers-grid" *ngIf="!loading && filtered.length > 0">
        <div class="card provider-card" *ngFor="let p of filtered">
          <div class="card__header">
            <div class="provider-name">
              <app-icon name="training-provider" [size]="18" />
              <h3 class="card__title">{{ p.name }}</h3>
            </div>
            <div class="provider-actions">
              <button class="icon-btn icon-btn--sm" (click)="openEditForm(p)" aria-label="Modifier l'organisme">
                <app-icon name="edit" [size]="15" />
              </button>
              <button class="icon-btn icon-btn--sm icon-btn--danger" (click)="deleteProvider(p)" aria-label="Supprimer l'organisme">
                <app-icon name="delete" [size]="15" />
              </button>
            </div>
          </div>

          <div class="card__body">
            <div class="badges">
              <span class="badge" [ngClass]="conventionClass(p.conventionStatus)">
                {{ conventionLabel(p.conventionStatus) }}
              </span>
              <span class="badge badge--success" *ngIf="p.qualiopiCertified">
                <app-icon name="check" [size]="12" /> Qualiopi
              </span>
              <span class="badge badge--neutral" *ngIf="p.deliveryMode">{{ modeLabel(p.deliveryMode) }}</span>
            </div>

            <p class="description" *ngIf="p.description">{{ p.description }}</p>

            <div class="skills" *ngIf="p.skillsCovered?.length">
              <span class="chip" *ngFor="let s of p.skillsCovered">{{ s.name }}</span>
            </div>

            <div class="meta">
              <div *ngIf="p.avgPriceEur != null"><span class="meta-label">Prix moyen</span> {{ p.avgPriceEur }} €</div>
              <div *ngIf="p.avgDurationDays != null"><span class="meta-label">Durée</span> {{ p.avgDurationDays }} j</div>
              <div *ngIf="p.pastSuccessRate != null"><span class="meta-label">Succès</span> {{ p.pastSuccessRate }}%</div>
              <a *ngIf="p.website" [href]="p.website" target="_blank" rel="noopener noreferrer" class="link">
                <app-icon name="external" [size]="14" /> Site
              </a>
            </div>
          </div>
        </div>
      </div>

      <p *ngIf="!loading && providers.length > 0 && filtered.length === 0" class="empty-filter">
        Aucun organisme ne correspond aux filtres.
      </p>

      <!-- Modal création/édition -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal modal--lg" role="dialog" aria-modal="true"
             [attr.aria-label]="(editingId ? 'Modifier' : 'Ajouter') + ' un organisme'"
             (click)="$event.stopPropagation()">
          <div class="modal__header">
            <div class="modal__title">{{ editingId ? 'Modifier' : 'Ajouter' }} un organisme</div>
            <button class="icon-btn" (click)="closeForm()" aria-label="Fermer la fenêtre">
              <app-icon name="close" [size]="18" />
            </button>
          </div>

          <div class="modal__body">
            <div class="grid-2">
              <div class="field">
                <label class="label" for="tp-name">Nom <span class="req">*</span></label>
                <input id="tp-name" class="input" [(ngModel)]="form.name" maxlength="150" />
              </div>
              <div class="field">
                <label class="label" for="tp-convention">Convention <span class="req">*</span></label>
                <select id="tp-convention" class="select" [(ngModel)]="form.conventionStatus">
                  <option value="CONVENTIONNE">Conventionné</option>
                  <option value="REFERENCE">Référencé</option>
                  <option value="NOUVEAU">Nouveau</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label class="label" for="tp-description">Description</label>
              <textarea id="tp-description" class="textarea" [(ngModel)]="form.description" rows="3"></textarea>
            </div>

            <div class="grid-2">
              <div class="field">
                <label class="label" for="tp-website">Site web</label>
                <input id="tp-website" class="input" [(ngModel)]="form.website" type="url" placeholder="https://…" />
              </div>
              <div class="field">
                <label class="label" for="tp-email">Email contact</label>
                <input id="tp-email" class="input" [(ngModel)]="form.contactEmail" type="email" />
              </div>
            </div>

            <div class="field">
              <label class="label">Compétences couvertes</label>
              <div class="skills-picker">
                <span class="chip chip--select"
                      *ngFor="let s of skillsCatalog"
                      [class.selected]="isSkillSelected(s.id)"
                      (click)="toggleSkill(s.id)">
                  {{ s.name }}
                </span>
              </div>
            </div>

            <div class="grid-3">
              <div class="field">
                <label class="label" for="tp-mode">Mode</label>
                <select id="tp-mode" class="select" [(ngModel)]="form.deliveryMode">
                  <option [ngValue]="undefined">—</option>
                  <option value="PRESENTIEL">Présentiel</option>
                  <option value="DISTANCIEL">Distanciel</option>
                  <option value="HYBRIDE">Hybride</option>
                </select>
              </div>
              <div class="field">
                <label class="label" for="tp-price">Prix moyen (€)</label>
                <input id="tp-price" class="input" [(ngModel)]="form.avgPriceEur" type="number" min="0" />
              </div>
              <div class="field">
                <label class="label" for="tp-duration">Durée (jours)</label>
                <input id="tp-duration" class="input" [(ngModel)]="form.avgDurationDays" type="number" min="0" />
              </div>
            </div>

            <div class="grid-2">
              <div class="field">
                <label class="label" for="tp-rate">Taux de succès (%)</label>
                <input id="tp-rate" class="input" [(ngModel)]="form.pastSuccessRate" type="number" min="0" max="100" />
              </div>
              <div class="field check-field">
                <label>
                  <input type="checkbox" [(ngModel)]="form.qualiopiCertified" />
                  <span>Certifié Qualiopi</span>
                </label>
              </div>
            </div>

            <div class="field-error" *ngIf="errorMessage">
              <app-icon name="alert" [size]="14" /> {{ errorMessage }}
            </div>
          </div>

          <div class="modal__footer">
            <button class="btn btn--secondary" (click)="closeForm()">Annuler</button>
            <button class="btn btn--primary"
                    [disabled]="!form.name?.trim() || !form.conventionStatus || submitting"
                    (click)="saveProvider()">
              <app-icon name="save" [size]="16" />
              {{ editingId ? 'Enregistrer' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .search-field { flex: 1; min-width: 240px; }
    .filter { width: auto; min-width: 150px; }

    .empty-filter {
      text-align: center;
      padding: var(--sp-7);
      color: var(--c-muted);
      font-style: italic;
      margin: 0;
    }

    /* Grille de cartes */
    .providers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: var(--sp-4);
    }
    .provider-card { display: flex; flex-direction: column; }
    .provider-card .card__header { align-items: flex-start; }
    .provider-card .card__body {
      display: flex;
      flex-direction: column;
      gap: var(--sp-3);
      flex: 1;
    }
    .provider-name {
      display: flex;
      align-items: center;
      gap: var(--sp-2);
      min-width: 0;
      color: var(--c-accent-ink);
    }
    .provider-name .card__title { font-size: var(--fs-15); }
    .provider-actions { display: flex; gap: 2px; flex: none; }

    .badges { display: flex; gap: 6px; flex-wrap: wrap; }
    /* Statuts de convention mappés sur les tokens sémantiques */
    .badge.conventionne { background: var(--c-success-soft); color: var(--c-success-ink); }
    .badge.reference    { background: var(--c-warning-soft); color: var(--c-warning-ink); }
    .badge.nouveau      { background: var(--c-info-soft);    color: var(--c-info-ink); }

    .description { color: var(--c-muted); font-size: var(--fs-13); margin: 0; line-height: 1.45; }

    .skills { display: flex; gap: 6px; flex-wrap: wrap; }

    .meta {
      display: flex;
      gap: var(--sp-4);
      flex-wrap: wrap;
      align-items: center;
      font-size: var(--fs-13);
      color: var(--c-ink-soft);
      padding-top: var(--sp-3);
      border-top: 1px solid var(--c-border);
      margin-top: auto;
    }
    .meta-label { color: var(--c-faint); margin-right: 4px; }
    .link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--c-brand);
      font-weight: 500;
    }
    .link:hover { color: var(--c-brand-strong); text-decoration: underline; }

    /* Modal — grilles de champs */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-3); }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--sp-3); }

    .skills-picker {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: var(--sp-3);
      border: 1px solid var(--c-border-strong);
      border-radius: var(--r-sm);
      max-height: 170px;
      overflow-y: auto;
      background: var(--c-surface-2);
    }
    .chip--select { cursor: pointer; user-select: none; }
    .chip--select:hover { border-color: var(--c-accent); color: var(--c-accent-ink); }
    .chip.selected {
      background: var(--c-accent);
      color: #fff;
      border-color: var(--c-accent);
    }

    .check-field { justify-content: flex-end; }
    .check-field label {
      display: flex;
      align-items: center;
      gap: var(--sp-2);
      cursor: pointer;
      font-size: var(--fs-14);
      font-weight: 500;
      color: var(--c-ink-soft);
      min-height: 38px;
    }
    .check-field input { width: auto; min-height: auto; accent-color: var(--c-brand); }

    @media (max-width: 640px) {
      .grid-2, .grid-3 { grid-template-columns: 1fr; }
    }
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
    return s === 'CONVENTIONNE' ? 'Conventionné'
         : s === 'REFERENCE'     ? 'Référencé'
                                  : 'Nouveau';
  }
  conventionClass(s: ConventionStatus): string {
    return s.toLowerCase();
  }
  modeLabel(m: DeliveryMode): string {
    return m === 'PRESENTIEL' ? 'Présentiel'
         : m === 'DISTANCIEL' ? 'Distanciel'
                              : 'Hybride';
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
