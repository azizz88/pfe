import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';
import { IconComponent } from '../../../shared/icon/icon.component';

/**
 * Gestion des contrats pour le RH Admin.
 * Affiche les employés avec leurs informations contractuelles + modification.
 */
@Component({
  selector: 'app-contract-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="management">
      <div class="page-header">
        <div class="page-header__title">
          <h1>Gestion des Contrats</h1>
          <span class="page-header__sub">Consultez et mettez à jour les contrats des employés</span>
        </div>
        <div class="page-header__actions">
          <div class="filters" role="group" aria-label="Filtrer par type de contrat">
            <button [class.active]="filter === 'ALL'" (click)="filterBy('ALL')">Tous</button>
            <button [class.active]="filter === 'CDI'" (click)="filterBy('CDI')">CDI</button>
            <button [class.active]="filter === 'CDD'" (click)="filterBy('CDD')">CDD</button>
            <button [class.active]="filter === 'STAGE'" (click)="filterBy('STAGE')">Stage</button>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Matricule</th>
              <th>Type</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Salaire</th>
              <th class="cell-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of filteredEmployees">
              <td class="cell-strong">{{ emp.firstName }} {{ emp.lastName }}</td>
              <td class="u-mono">{{ emp.matricule }}</td>
              <td>
                <span *ngIf="emp.contract" class="badge"
                      [class.badge--success]="emp.contract.type === 'CDI'"
                      [class.badge--warning]="emp.contract.type === 'CDD'"
                      [class.badge--info]="emp.contract.type === 'STAGE'">
                  {{ emp.contract.type }}
                </span>
                <span *ngIf="!emp.contract" class="badge badge--neutral">&mdash;</span>
              </td>
              <td>{{ emp.contract?.startDate || '&mdash;' }}</td>
              <td>{{ emp.contract?.endDate || 'Indéterminé' }}</td>
              <td class="u-mono">{{ emp.contract?.salary ? (emp.contract.salary | number:'1.2-2') + ' DT' : '&mdash;' }}</td>
              <td class="cell-actions">
                <button class="btn btn--secondary btn--sm" (click)="editContract(emp)">
                  <app-icon name="edit" [size]="15" /> Modifier
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty-state" *ngIf="filteredEmployees.length === 0">
          <span class="empty-state__icon"><app-icon name="contract" [size]="26" /></span>
          <p class="empty-state__title">Aucun contrat à afficher</p>
          <span class="empty-state__text">Aucun employé ne correspond au filtre sélectionné.</span>
        </div>
      </div>

      <!-- Modal modification contrat -->
      <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
        <div class="modal" role="dialog" aria-modal="true" aria-label="Modifier le contrat" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h3 class="modal__title"><app-icon name="contract" [size]="20" /> Contrat de {{ editEmp?.firstName }} {{ editEmp?.lastName }}</h3>
            <button class="icon-btn" (click)="showModal = false" aria-label="Fermer"><app-icon name="close" [size]="18" /></button>
          </div>
          <div class="modal__body">
            <div class="form-grid">
              <div class="field">
                <label class="label" for="ct-type">Type de contrat</label>
                <select id="ct-type" class="select" [(ngModel)]="contractForm.type">
                  <option value="">-- Type --</option>
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="STAGE">Stage</option>
                </select>
              </div>
              <div class="field">
                <label class="label" for="ct-salary">Salaire mensuel (DT)</label>
                <input id="ct-salary" class="input" [(ngModel)]="contractForm.salary" type="number" placeholder="Salaire" />
              </div>
              <div class="field">
                <label class="label" for="ct-start">Date de début</label>
                <input id="ct-start" class="input" [(ngModel)]="contractForm.startDate" type="date" />
              </div>
              <div class="field">
                <label class="label" for="ct-end">Date de fin</label>
                <input id="ct-end" class="input" [(ngModel)]="contractForm.endDate" type="date" />
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" (click)="showModal = false">Annuler</button>
            <button class="btn btn--primary" (click)="saveContract()">
              <app-icon name="save" [size]="16" /> Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management { animation: fade-in .22s ease both; }
    /* opacité seule : un transform sur ce conteneur racine détacherait les overlays fixes des modales */
    @keyframes fade-in { from { opacity:0; } to { opacity:1; } }

    /* Filtres — contrôle segmenté */
    .filters { display:inline-flex; gap:4px; background: var(--c-surface-3); border:1px solid var(--c-border); border-radius: var(--r-sm); padding:3px; }
    .filters button {
      appearance:none; border:1px solid transparent; background:transparent;
      font-family:inherit; font-size: var(--fs-13); font-weight:600; color: var(--c-muted);
      padding:6px 14px; border-radius: var(--r-xs); cursor:pointer;
      transition: background var(--transition), color var(--transition), box-shadow var(--transition);
    }
    .filters button:hover { color: var(--c-ink-soft); }
    .filters button.active { background: var(--c-surface); color: var(--c-brand-ink); box-shadow: var(--sh-xs); border-color: var(--c-border); }
    .filters button:focus-visible { outline:none; box-shadow: var(--ring); }

    /* Formulaire modal */
    .form-grid { display:grid; grid-template-columns: 1fr 1fr; gap: var(--sp-4); }
    @media (max-width: 520px) { .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class ContractManagementComponent implements OnInit {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  filter = 'ALL';

  showModal = false;
  editEmp: any = null;
  contractForm: any = {};

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeApi.getAllEmployees().subscribe({
      next: (data) => {
        this.employees = data;
        this.applyFilter();
      }
    });
  }

  filterBy(type: string): void {
    this.filter = type;
    this.applyFilter();
  }

  applyFilter(): void {
    this.filteredEmployees = this.filter === 'ALL'
      ? this.employees
      : this.employees.filter(e => e.contract?.type === this.filter);
  }

  editContract(emp: any): void {
    this.editEmp = emp;
    this.contractForm = {
      type: emp.contract?.type || '',
      startDate: emp.contract?.startDate || '',
      endDate: emp.contract?.endDate || '',
      salary: emp.contract?.salary || ''
    };
    this.showModal = true;
  }

  saveContract(): void {
    if (!this.editEmp || !this.contractForm.type) return;

    const payload = {
      ...this.editEmp,
      department: this.editEmp.department ? { id: this.editEmp.department.id } : null,
      contract: {
        ...(this.editEmp.contract?.id ? { id: this.editEmp.contract.id } : {}),
        type: this.contractForm.type,
        startDate: this.contractForm.startDate || null,
        endDate: this.contractForm.endDate || null,
        salary: this.contractForm.salary || null
      }
    };

    this.employeeApi.updateEmployee(this.editEmp.id, payload).subscribe({
      next: () => {
        this.showModal = false;
        this.loadEmployees();
      },
      error: (err: any) => console.error('Erreur mise à jour contrat:', err)
    });
  }
}
