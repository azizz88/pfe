import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Gestion des contrats pour le RH Admin.
 * Affiche les employés avec leurs informations contractuelles + modification.
 */
@Component({
  selector: 'app-contract-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management">
      <div class="header">
        <h1>Gestion des Contrats</h1>
        <div class="filters">
          <button [class.active]="filter === 'ALL'" (click)="filterBy('ALL')">Tous</button>
          <button [class.active]="filter === 'CDI'" (click)="filterBy('CDI')">CDI</button>
          <button [class.active]="filter === 'CDD'" (click)="filterBy('CDD')">CDD</button>
          <button [class.active]="filter === 'STAGE'" (click)="filterBy('STAGE')">Stage</button>
        </div>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Employ&eacute;</th>
              <th>Matricule</th>
              <th>Type</th>
              <th>D&eacute;but</th>
              <th>Fin</th>
              <th>Salaire</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of filteredEmployees">
              <td>{{ emp.firstName }} {{ emp.lastName }}</td>
              <td><strong>{{ emp.matricule }}</strong></td>
              <td>
                <span *ngIf="emp.contract" class="badge" [class]="emp.contract.type">
                  {{ emp.contract.type }}
                </span>
                <span *ngIf="!emp.contract" class="badge none">&mdash;</span>
              </td>
              <td>{{ emp.contract?.startDate || '&mdash;' }}</td>
              <td>{{ emp.contract?.endDate || 'Ind&eacute;termin&eacute;' }}</td>
              <td>{{ emp.contract?.salary ? (emp.contract.salary | number:'1.2-2') + ' DT' : '&mdash;' }}</td>
              <td>
                <button class="edit-btn" (click)="editContract(emp)">Modifier</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal modification contrat -->
      <div class="modal-overlay" *ngIf="showModal" (click)="showModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Contrat de {{ editEmp?.firstName }} {{ editEmp?.lastName }}</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Type de contrat</label>
              <select [(ngModel)]="contractForm.type">
                <option value="">-- Type --</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="STAGE">Stage</option>
              </select>
            </div>
            <div class="form-group">
              <label>Salaire mensuel (DT)</label>
              <input [(ngModel)]="contractForm.salary" type="number" placeholder="Salaire" />
            </div>
            <div class="form-group">
              <label>Date de d&eacute;but</label>
              <input [(ngModel)]="contractForm.startDate" type="date" />
            </div>
            <div class="form-group">
              <label>Date de fin</label>
              <input [(ngModel)]="contractForm.endDate" type="date" />
            </div>
          </div>
          <div class="modal-actions">
            <button class="cancel-btn" (click)="showModal = false">Annuler</button>
            <button class="submit-btn" (click)="saveContract()">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .header h1 { color: #1e3a5f; margin: 0; }
    .filters { display: flex; gap: 8px; }
    .filters button {
      padding: 8px 16px; border: 2px solid #e2e8f0; background: white;
      border-radius: 8px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
    }
    .filters button.active { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }
    .table-container {
      background: white; border-radius: 12px; overflow: hidden;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f8fafc; padding: 12px 16px; text-align: left; color: #475569; font-size: 0.85rem; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; }
    tr:hover { background: #f8fafc; }
    .badge { padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .CDI { background: #dcfce7; color: #166534; }
    .CDD { background: #fef9c3; color: #854d0e; }
    .STAGE { background: #dbeafe; color: #1e40af; }
    .none { background: #f1f5f9; color: #94a3b8; }
    .edit-btn {
      padding: 5px 14px; background: #3b82f6; color: white; border: none;
      border-radius: 6px; cursor: pointer; font-size: 0.8rem; transition: background 0.2s;
    }
    .edit-btn:hover { background: #2563eb; }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal { background: white; border-radius: 16px; padding: 24px; width: 90%; max-width: 500px; }
    .modal h3 { margin: 0 0 20px 0; color: #1e293b; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-size: 0.8rem; color: #64748b; font-weight: 600; }
    .form-group input, .form-group select {
      padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px;
      font-size: 0.9rem; outline: none;
    }
    .form-group input:focus, .form-group select:focus { border-color: #3b82f6; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
    .cancel-btn { padding: 8px 16px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; }
    .submit-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .submit-btn:hover { background: #2563eb; }
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
