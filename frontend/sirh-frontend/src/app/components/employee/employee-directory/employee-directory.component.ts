import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Annuaire de l'entreprise.
 * Filtre par département et service, et affiche les détails d'un employé au clic.
 */
@Component({
  selector: 'app-employee-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="directory">
      <h1>📖 Annuaire de l'entreprise</h1>

      <!-- Barre de filtres -->
      <div class="filters-bar">
        <div class="filter-group">
          <input type="text" [(ngModel)]="searchKeyword" (input)="applyFilters()"
                 placeholder="🔍 Rechercher par nom ou prénom..." class="search-input" />
        </div>
        <div class="filter-group">
          <select [(ngModel)]="selectedDeptId" (change)="onDeptChange()" class="filter-select">
            <option value="">Tous les départements</option>
            <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
          </select>
        </div>
        <div class="filter-group">
          <select [(ngModel)]="selectedServiceId" (change)="applyFilters()" class="filter-select"
                  [disabled]="!selectedDeptId">
            <option value="">Tous les services</option>
            <option *ngFor="let svc of filteredServices" [value]="svc.id">{{ svc.name }}</option>
          </select>
        </div>
        <button class="reset-btn" (click)="resetFilters()" *ngIf="hasActiveFilters()">✕ Réinitialiser</button>
      </div>

      <!-- Compteur résultats -->
      <div class="result-count">
        <span>{{ filteredEmployees.length }} employé(s) trouvé(s)</span>
      </div>

      <!-- Liste des employés -->
      <div class="employee-grid">
        <div class="employee-card" *ngFor="let emp of filteredEmployees" (click)="openEmployeeDetail(emp)">
          <div class="avatar">{{ emp.firstName?.charAt(0) }}{{ emp.lastName?.charAt(0) }}</div>
          <div class="employee-info">
            <h3>{{ emp.firstName }} {{ emp.lastName }}</h3>
            <p class="position">{{ emp.position || 'Non défini' }}</p>
            <p class="department" *ngIf="emp.department">🏗️ {{ emp.department.name }}</p>
            <p class="service-name" *ngIf="emp.service">📂 {{ emp.service.name }}</p>
            <p class="email">📧 {{ emp.email }}</p>
          </div>
          <div class="card-arrow">→</div>
        </div>
      </div>

      <p *ngIf="filteredEmployees.length === 0" class="empty">Aucun employé trouvé.</p>

      <!-- ══════════════ Modale Détail Employé ══════════════ -->
      <div class="modal-overlay" *ngIf="showDetail" (click)="closeDetail()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <!-- En-tête -->
          <div class="modal-header">
            <div class="modal-avatar">
              {{ selectedEmployee?.firstName?.charAt(0)?.toUpperCase() }}{{ selectedEmployee?.lastName?.charAt(0)?.toUpperCase() }}
            </div>
            <div class="modal-title-block">
              <h2>{{ selectedEmployee?.firstName }} {{ selectedEmployee?.lastName }}</h2>
              <span class="modal-subtitle">{{ selectedEmployee?.position || 'Employé' }}</span>
            </div>
            <button class="close-btn" (click)="closeDetail()">✕</button>
          </div>

          <!-- Sections -->
          <div class="modal-body">

            <!-- Informations Personnelles -->
            <div class="section">
              <div class="section-title">📋 Informations Personnelles</div>
              <div class="field-grid">
                <div class="field">
                  <label>Matricule</label>
                  <div class="field-value">{{ selectedEmployee?.matricule || '—' }}</div>
                </div>
                <div class="field">
                  <label>Prénom</label>
                  <div class="field-value">{{ selectedEmployee?.firstName || '—' }}</div>
                </div>
                <div class="field">
                  <label>Nom</label>
                  <div class="field-value">{{ selectedEmployee?.lastName || '—' }}</div>
                </div>
                <div class="field">
                  <label>Email</label>
                  <div class="field-value">{{ selectedEmployee?.email || '—' }}</div>
                </div>
                <div class="field">
                  <label>Téléphone</label>
                  <div class="field-value">{{ selectedEmployee?.phone || '—' }}</div>
                </div>
                <div class="field">
                  <label>Poste</label>
                  <div class="field-value">{{ selectedEmployee?.position || '—' }}</div>
                </div>
                <div class="field">
                  <label>Date d'embauche</label>
                  <div class="field-value">{{ selectedEmployee?.hireDate || '—' }}</div>
                </div>
              </div>
            </div>

            <!-- Département & Service -->
            <div class="section">
              <div class="section-title">🏗️ Département & Service</div>
              <div class="field-grid">
                <div class="field">
                  <label>Département</label>
                  <div class="field-value">{{ selectedEmployee?.department?.name || '—' }}</div>
                </div>
                <div class="field">
                  <label>Service</label>
                  <div class="field-value">{{ selectedEmployee?.service?.name || '—' }}</div>
                </div>
              </div>
            </div>

            <!-- Contrat -->
            <div class="section" *ngIf="selectedEmployee?.contract">
              <div class="section-title">📄 Contrat</div>
              <div class="field-grid">
                <div class="field">
                  <label>Type de contrat</label>
                  <div class="field-value">
                    <span class="badge" [class]="selectedEmployee?.contract?.type">
                      {{ selectedEmployee?.contract?.type || '—' }}
                    </span>
                  </div>
                </div>
                <div class="field">
                  <label>Date début</label>
                  <div class="field-value">{{ selectedEmployee?.contract?.startDate || '—' }}</div>
                </div>
                <div class="field">
                  <label>Date fin</label>
                  <div class="field-value">{{ selectedEmployee?.contract?.endDate || 'Indéterminé' }}</div>
                </div>
                <div class="field">
                  <label>Salaire mensuel</label>
                  <div class="field-value salary">{{ selectedEmployee?.contract?.salary | number:'1.2-2' }} DT</div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="close-modal-btn" (click)="closeDetail()">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .directory h1 { color: #1e3a5f; margin: 0 0 20px 0; }

    /* ── Filtres ── */
    .filters-bar {
      display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;
      align-items: center;
    }
    .filter-group { flex: 1; min-width: 180px; }
    .search-input {
      width: 100%; padding: 10px 14px;
      border: 2px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem;
      outline: none; transition: border-color 0.2s; box-sizing: border-box;
    }
    .search-input:focus { border-color: #3b82f6; }
    .filter-select {
      width: 100%; padding: 10px 14px;
      border: 2px solid #e2e8f0; border-radius: 10px; font-size: 0.9rem;
      outline: none; background: white; cursor: pointer; box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .filter-select:focus { border-color: #3b82f6; }
    .filter-select:disabled { opacity: 0.5; cursor: not-allowed; }
    .reset-btn {
      padding: 10px 16px; background: #f1f5f9; color: #475569;
      border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer;
      font-size: 0.85rem; white-space: nowrap; transition: all 0.2s;
    }
    .reset-btn:hover { background: #e2e8f0; }

    .result-count {
      margin-bottom: 16px; color: #64748b; font-size: 0.85rem;
    }

    /* ── Grille employés ── */
    .employee-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .employee-card {
      display: flex; gap: 16px; align-items: center;
      background: white; padding: 20px; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;
      cursor: pointer; transition: all 0.2s;
    }
    .employee-card:hover {
      transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59,130,246,0.12);
      border-color: #93c5fd;
    }
    .avatar {
      width: 50px; height: 50px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 1.1rem; flex-shrink: 0;
    }
    .employee-info { flex: 1; }
    .employee-info h3 { margin: 0 0 4px 0; color: #1e293b; font-size: 1rem; }
    .employee-info p { margin: 2px 0; font-size: 0.85rem; color: #64748b; }
    .position { font-weight: 500; color: #334155 !important; }
    .service-name { color: #059669 !important; }
    .card-arrow { color: #cbd5e1; font-size: 1.2rem; flex-shrink: 0; }
    .empty { text-align: center; color: #94a3b8; font-style: italic; margin-top: 40px; }

    /* ── Modale Détail ── */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 2000; padding: 16px;
      backdrop-filter: blur(3px);
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-box {
      background: #ffffff; border-radius: 20px; width: 100%; max-width: 650px;
      max-height: 90vh; overflow-y: auto;
      box-shadow: 0 25px 60px rgba(0,0,0,0.25);
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .modal-header {
      display: flex; align-items: center; gap: 16px;
      padding: 24px 28px; border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%);
      border-radius: 20px 20px 0 0;
    }
    .modal-avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: rgba(255,255,255,0.2); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; font-weight: 700; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,0.4);
    }
    .modal-title-block { flex: 1; }
    .modal-title-block h2 { margin: 0; color: white; font-size: 1.3rem; }
    .modal-subtitle { color: rgba(255,255,255,0.75); font-size: 0.9rem; }
    .close-btn {
      background: rgba(255,255,255,0.15); border: none; color: white;
      width: 36px; height: 36px; border-radius: 50%;
      font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .close-btn:hover { background: rgba(255,255,255,0.3); }

    .modal-body { padding: 20px 28px; display: flex; flex-direction: column; gap: 24px; }
    .section-title {
      font-weight: 700; color: #1e3a5f; font-size: 0.95rem;
      margin-bottom: 12px; padding-bottom: 8px;
      border-bottom: 2px solid #e2e8f0;
    }
    .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .field { display: flex; flex-direction: column; gap: 4px; }
    .field label {
      font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;
      letter-spacing: 0.5px; font-weight: 600;
    }
    .field-value {
      padding: 10px 14px;
      background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 8px; color: #1e293b; font-size: 0.9rem;
      min-height: 40px; display: flex; align-items: center;
    }
    .salary { color: #166534; font-weight: 700; background: #f0fdf4; border-color: #bbf7d0; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
    .CDI { background: #dcfce7; color: #166534; }
    .CDD { background: #fef9c3; color: #854d0e; }
    .STAGE { background: #dbeafe; color: #1e40af; }

    .modal-footer {
      display: flex; justify-content: flex-end;
      padding: 16px 28px 24px 28px; border-top: 1px solid #f1f5f9;
      background: #f8fafc; border-radius: 0 0 20px 20px;
    }
    .close-modal-btn {
      padding: 10px 24px; background: #1e3a5f; color: white;
      border: none; border-radius: 8px; cursor: pointer;
      font-size: 0.9rem; font-weight: 600; transition: background 0.2s;
    }
    .close-modal-btn:hover { background: #1e40af; }
  `]
})
export class EmployeeDirectoryComponent implements OnInit {
  allEmployees: any[] = [];
  filteredEmployees: any[] = [];
  departments: any[] = [];
  allServices: any[] = [];
  filteredServices: any[] = [];

  searchKeyword = '';
  selectedDeptId = '';
  selectedServiceId = '';

  // Détail employé
  showDetail = false;
  selectedEmployee: any = null;

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadDirectory();
    this.loadDepartments();
    this.loadServices();
  }

  loadDirectory(): void {
    this.employeeApi.getDirectory().subscribe({
      next: (data) => {
        this.allEmployees = data;
        this.applyFilters();
      },
      error: (err) => console.error('Erreur chargement annuaire:', err)
    });
  }

  loadDepartments(): void {
    this.employeeApi.getDepartments().subscribe({
      next: (data) => this.departments = data
    });
  }

  loadServices(): void {
    this.employeeApi.getServices().subscribe({
      next: (data) => this.allServices = data
    });
  }

  onDeptChange(): void {
    this.selectedServiceId = '';
    if (this.selectedDeptId) {
      this.filteredServices = this.allServices.filter(
        s => s.department?.id === +this.selectedDeptId
      );
    } else {
      this.filteredServices = [];
    }
    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allEmployees];

    // Filtre par recherche texte
    if (this.searchKeyword.trim()) {
      const kw = this.searchKeyword.toLowerCase();
      result = result.filter(emp =>
        (emp.firstName?.toLowerCase().includes(kw)) ||
        (emp.lastName?.toLowerCase().includes(kw))
      );
    }

    // Filtre par département
    if (this.selectedDeptId) {
      result = result.filter(emp => emp.department?.id === +this.selectedDeptId);
    }

    // Filtre par service
    if (this.selectedServiceId) {
      result = result.filter(emp => emp.service?.id === +this.selectedServiceId);
    }

    this.filteredEmployees = result;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchKeyword.trim() || this.selectedDeptId || this.selectedServiceId);
  }

  resetFilters(): void {
    this.searchKeyword = '';
    this.selectedDeptId = '';
    this.selectedServiceId = '';
    this.filteredServices = [];
    this.applyFilters();
  }

  // ── Détail employé ──

  openEmployeeDetail(emp: any): void {
    this.selectedEmployee = emp;
    this.showDetail = true;
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedEmployee = null;
  }
}
