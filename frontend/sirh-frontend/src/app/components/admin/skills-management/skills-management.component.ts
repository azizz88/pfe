import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RecruitmentApiService } from '../../../services/recruitment-api.service';

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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management">
      <div class="header">
        <div>
          <h1>🎓 Gestion des Compétences</h1>
          <p class="subtitle">
            Catalogue des compétences utilisées dans les offres d'emploi.
          </p>
        </div>
        <button class="add-btn" (click)="openCreateForm()">+ Nouvelle compétence</button>
      </div>

      <!-- Recherche + filtres -->
      <div class="toolbar">
        <input
          type="text"
          class="search"
          placeholder="🔍 Rechercher une compétence (nom ou catégorie)…"
          [(ngModel)]="searchTerm"
        />
        <span class="count-badge">{{ filteredSkills.length }} / {{ skills.length }}</span>
      </div>

      <!-- Liste vide -->
      <div class="empty-state" *ngIf="skills.length === 0 && !loading">
        <div class="empty-icon">🎓</div>
        <h3>Aucune compétence enregistrée</h3>
        <p>Commencez par ajouter les compétences les plus demandées dans votre organisation.</p>
        <button class="add-btn" (click)="openCreateForm()">+ Ajouter la première</button>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">Chargement…</div>

      <!-- Tableau des compétences -->
      <div class="table-card" *ngIf="!loading && skills.length > 0">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Catégorie</th>
              <th>Description</th>
              <th>Ajoutée le</th>
              <th class="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of filteredSkills">
              <td><span class="skill-chip">{{ s.name }}</span></td>
              <td>
                <span *ngIf="s.category" class="category">{{ s.category }}</span>
                <span *ngIf="!s.category" class="muted">—</span>
              </td>
              <td class="desc-cell">
                <span *ngIf="s.description">{{ s.description }}</span>
                <span *ngIf="!s.description" class="muted">—</span>
              </td>
              <td class="muted">{{ formatDate(s.createdAt) }}</td>
              <td class="actions-cell">
                <button class="icon-btn edit" (click)="openEditForm(s)" title="Modifier">✏️</button>
                <button class="icon-btn delete" (click)="deleteSkill(s)" title="Supprimer">🗑️</button>
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
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingId ? 'Modifier' : 'Ajouter' }} une compétence</h3>

          <div class="field">
            <label>Nom <span class="required">*</span></label>
            <input
              type="text"
              [(ngModel)]="form.name"
              placeholder="Ex : Java, Management, Anglais…"
              maxlength="120"
              [class.error]="errorMessage && !form.name"
            />
          </div>

          <div class="field">
            <label>Catégorie <span class="optional">(optionnel)</span></label>
            <input
              type="text"
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
            <label>Description <span class="optional">(optionnel)</span></label>
            <textarea
              [(ngModel)]="form.description"
              placeholder="Précisez le niveau attendu, les outils…"
              rows="3"
            ></textarea>
          </div>

          <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div>

          <div class="modal-actions">
            <button class="cancel-btn" (click)="showForm = false">Annuler</button>
            <button class="submit-btn"
                    [disabled]="!form.name?.trim() || submitting"
                    (click)="saveSkill()">
              {{ editingId ? 'Enregistrer' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management { color: #0f172a; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
    }
    .header h1 {
      color: #1e3a5f;
      margin: 0 0 6px 0;
      font-size: 1.6rem;
    }
    .subtitle { color: #64748b; margin: 0; font-size: 0.9rem; }
    .add-btn {
      padding: 10px 20px;
      background: #1e3a5f;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: background 0.15s;
      white-space: nowrap;
    }
    .add-btn:hover { background: #17304f; }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    .search {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      background: white;
      outline: none;
    }
    .search:focus { border-color: #1e3a5f; box-shadow: 0 0 0 3px rgba(30,58,95,0.1); }
    .count-badge {
      padding: 6px 14px;
      background: #e2e8f0;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
    }

    .empty-state {
      text-align: center;
      padding: 64px 24px;
      background: white;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
    }
    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state h3 { color: #1e293b; margin: 0 0 8px 0; }
    .empty-state p { color: #64748b; margin: 0 0 20px 0; }

    .loading {
      text-align: center;
      padding: 40px;
      color: #94a3b8;
    }

    .table-card {
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(15,23,42,0.04);
    }
    table { width: 100%; border-collapse: collapse; }
    thead {
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      text-align: left;
      padding: 12px 16px;
      font-weight: 600;
      font-size: 0.8rem;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td {
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.9rem;
      color: #334155;
      vertical-align: middle;
    }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover { background: #f8fafc; }

    .skill-chip {
      display: inline-block;
      padding: 4px 12px;
      background: #eff6ff;
      color: #1e3a5f;
      border-radius: 999px;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .category {
      padding: 3px 10px;
      background: #f1f5f9;
      border-radius: 6px;
      font-size: 0.78rem;
      color: #475569;
    }
    .muted { color: #94a3b8; font-style: italic; font-size: 0.85rem; }
    .desc-cell { max-width: 320px; line-height: 1.4; }

    .actions-col, .actions-cell { width: 110px; white-space: nowrap; }
    .actions-cell { text-align: right; }
    .icon-btn {
      background: transparent;
      border: 1px solid #e2e8f0;
      padding: 6px 10px;
      margin-left: 4px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.15s;
    }
    .icon-btn.edit:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }
    .icon-btn.delete:hover {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .empty-filter {
      text-align: center;
      padding: 32px;
      color: #94a3b8;
      font-style: italic;
      margin: 0;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }
    .modal {
      background: white;
      border-radius: 12px;
      padding: 28px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    }
    .modal h3 {
      margin: 0 0 20px 0;
      color: #0f172a;
      font-size: 1.15rem;
    }
    .field { margin-bottom: 16px; }
    .field label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 6px;
    }
    .required { color: #ef4444; }
    .optional { color: #94a3b8; font-weight: 400; font-size: 0.75rem; }
    .field input, .field textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      box-sizing: border-box;
      outline: none;
      font-family: inherit;
    }
    .field input:focus, .field textarea:focus {
      border-color: #1e3a5f;
      box-shadow: 0 0 0 3px rgba(30,58,95,0.1);
    }
    .field input.error { border-color: #ef4444; }
    .error-msg {
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
      border-radius: 8px;
      font-size: 0.85rem;
      margin-bottom: 16px;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 20px;
    }
    .cancel-btn {
      padding: 9px 16px;
      border: 1px solid #cbd5e1;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      color: #334155;
    }
    .cancel-btn:hover { background: #f1f5f9; }
    .submit-btn {
      padding: 9px 16px;
      background: #1e3a5f;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .submit-btn:hover:not(:disabled) { background: #17304f; }
    .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }
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
