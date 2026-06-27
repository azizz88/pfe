import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';
import { IconComponent } from '../../../shared/icon/icon.component';

interface Skill {
  id?: number;
  name: string;
  category?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-skills-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="skills-mgmt">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Gestion des compétences</h1>
          <span class="page-header__sub">
            Catalogue des compétences utilisées dans les offres d'emploi.
          </span>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" (click)="openCreateForm()">
            <app-icon name="add" [size]="16" />
            Nouvelle compétence
          </button>
        </div>
      </div>

      <!-- Recherche + filtres -->
      <div class="toolbar">
        <div class="input-icon search-field">
          <app-icon name="search" [size]="16" />
          <input
            type="text"
            class="input"
            placeholder="Rechercher une compétence (nom ou catégorie)…"
            [(ngModel)]="searchTerm"
          />
        </div>
        <span class="badge badge--neutral u-mono">{{ filteredSkills.length }} / {{ skills.length }}</span>
      </div>

      <!-- Loading -->
      <div class="loading-row" *ngIf="loading">
        <span class="spinner"></span> Chargement…
      </div>

      <!-- Liste vide -->
      <div class="card card--flat" *ngIf="skills.length === 0 && !loading">
        <div class="empty-state">
          <div class="empty-state__icon"><app-icon name="skills" [size]="26" /></div>
          <div class="empty-state__title">Aucune compétence enregistrée</div>
          <p class="empty-state__text">Commencez par ajouter les compétences les plus demandées dans votre organisation.</p>
          <button class="btn btn--primary" (click)="openCreateForm()">
            <app-icon name="add" [size]="16" />
            Ajouter la première
          </button>
        </div>
      </div>

      <!-- Tableau des compétences -->
      <div class="table-wrap" *ngIf="!loading && skills.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Description</th>
              <th>Ajoutée le</th>
              <th class="cell-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of filteredSkills">
              <td><span class="chip">{{ s.name }}</span></td>
              <td>
                <span *ngIf="s.category" class="badge badge--neutral">{{ s.category }}</span>
                <span *ngIf="!s.category" class="u-faint">—</span>
              </td>
              <td class="desc-cell">
                <span *ngIf="s.description">{{ s.description }}</span>
                <span *ngIf="!s.description" class="u-faint">—</span>
              </td>
              <td class="u-muted">{{ formatDate(s.createdAt) }}</td>
              <td class="cell-actions">
                <button class="icon-btn" (click)="openEditForm(s)" aria-label="Modifier la compétence">
                  <app-icon name="edit" [size]="16" />
                </button>
                <button class="icon-btn icon-btn--danger" (click)="deleteSkill(s)" aria-label="Supprimer la compétence">
                  <app-icon name="delete" [size]="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="filteredSkills.length === 0" class="empty-filter">
          Aucune compétence ne correspond à votre recherche.
        </p>
      </div>

      <!-- Modal création / édition -->
      <div class="modal-overlay" *ngIf="showForm" (click)="showForm = false">
        <div class="modal modal--sm" role="dialog" aria-modal="true"
             [attr.aria-label]="(editingId ? 'Modifier' : 'Ajouter') + ' une compétence'"
             (click)="$event.stopPropagation()">
          <div class="modal__header">
            <div class="modal__title">{{ editingId ? 'Modifier' : 'Ajouter' }} une compétence</div>
            <button class="icon-btn" (click)="showForm = false" aria-label="Fermer la fenêtre">
              <app-icon name="close" [size]="18" />
            </button>
          </div>

          <div class="modal__body">
            <div class="field">
              <label class="label" for="skill-name">Nom <span class="req">*</span></label>
              <input
                id="skill-name"
                type="text"
                class="input"
                [(ngModel)]="form.name"
                placeholder="Ex : Java, Management, Anglais…"
                maxlength="120"
                [class.input--invalid]="errorMessage && !form.name"
              />
            </div>

            <div class="field">
              <label class="label" for="skill-category">Catégorie <span class="optional">(optionnel)</span></label>
              <input
                id="skill-category"
                type="text"
                class="input"
                [(ngModel)]="form.category"
                placeholder="Ex : Technique, Soft skill, Langue…"
                maxlength="80"
                list="categories"
              />
              <datalist id="categories">
                <option *ngFor="let c of existingCategories" [value]="c"></option>
              </datalist>
            </div>

            <div class="field">
              <label class="label" for="skill-description">Description <span class="optional">(optionnel)</span></label>
              <textarea
                id="skill-description"
                class="textarea"
                [(ngModel)]="form.description"
                placeholder="Précisez le niveau attendu, les outils…"
                rows="3"
              ></textarea>
            </div>

            <div class="field-error" *ngIf="errorMessage">
              <app-icon name="alert" [size]="14" /> {{ errorMessage }}
            </div>
          </div>

          <div class="modal__footer">
            <button class="btn btn--secondary" (click)="showForm = false">Annuler</button>
            <button class="btn btn--primary"
                    [disabled]="!form.name?.trim() || submitting"
                    (click)="saveSkill()">
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

    .optional { font-weight: 400; color: var(--c-faint); font-size: var(--fs-12); }

    .desc-cell { max-width: 320px; line-height: 1.4; }

    .empty-filter {
      text-align: center;
      padding: var(--sp-7);
      color: var(--c-muted);
      font-style: italic;
      margin: 0;
      border-top: 1px solid var(--c-border);
    }
  `]
})
export class SkillsManagementComponent implements OnInit {
  skills: Skill[] = [];
  loading = false;
  searchTerm = '';

  showForm = false;
  submitting = false;
  editingId: number | null = null;
  form: Skill = { name: '', category: '', description: '' };
  errorMessage = '';

  constructor(private recruitmentApi: RecruitmentApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.recruitmentApi.getAllSkills().subscribe({
      next: (data) => { this.skills = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get filteredSkills(): Skill[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) return this.skills;
    return this.skills.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q)
    );
  }

  get existingCategories(): string[] {
    const cats = this.skills
      .map(s => s.category)
      .filter((c): c is string => !!c && c.trim().length > 0);
    return Array.from(new Set(cats)).sort();
  }

  openCreateForm(): void {
    this.editingId = null;
    this.form = { name: '', category: '', description: '' };
    this.errorMessage = '';
    this.showForm = true;
  }

  openEditForm(s: Skill): void {
    this.editingId = s.id!;
    this.form = { name: s.name, category: s.category || '', description: s.description || '' };
    this.errorMessage = '';
    this.showForm = true;
  }

  saveSkill(): void {
    if (!this.form.name?.trim()) return;
    this.submitting = true;
    this.errorMessage = '';

    const payload = {
      name: this.form.name.trim(),
      category: this.form.category?.trim() || undefined,
      description: this.form.description?.trim() || undefined
    };

    const obs = this.editingId
      ? this.recruitmentApi.updateSkill(this.editingId, payload)
      : this.recruitmentApi.createSkill(payload);

    obs.subscribe({
      next: () => {
        this.submitting = false;
        this.showForm = false;
        this.load();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        this.errorMessage = err.error?.error || 'Une erreur est survenue. Réessayez.';
      }
    });
  }

  deleteSkill(s: Skill): void {
    if (!s.id) return;
    if (!confirm(`Supprimer la compétence "${s.name}" ?\nElle sera aussi retirée des offres qui l'utilisent.`)) return;
    this.recruitmentApi.deleteSkill(s.id).subscribe({
      next: () => this.load(),
      error: () => alert('Impossible de supprimer cette compétence.')
    });
  }

  formatDate(iso?: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
