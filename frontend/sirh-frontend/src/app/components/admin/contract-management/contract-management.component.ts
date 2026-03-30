import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Gestion des contrats pour le RH Admin.
 * Affiche les employés avec leurs informations contractuelles.
 */
@Component({
  selector: 'app-contract-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="management">
      <div class="header">
        <h1>📄 Gestion des Contrats</h1>
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
              <th>Employé</th>
              <th>Matricule</th>
              <th>Type</th>
              <th>Début</th>
              <th>Fin</th>
              <th>Salaire</th>
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
                <span *ngIf="!emp.contract" class="badge none">—</span>
              </td>
              <td>{{ emp.contract?.startDate || '—' }}</td>
              <td>{{ emp.contract?.endDate || 'Indéterminé' }}</td>
              <td>{{ emp.contract?.salary ? (emp.contract.salary | number:'1.2-2') + ' DT' : '—' }}</td>
            </tr>
          </tbody>
        </table>
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
  `]
})
export class ContractManagementComponent implements OnInit {
  employees: any[] = [];
  filteredEmployees: any[] = [];
  filter = 'ALL';

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.employeeApi.getAllEmployees().subscribe({
      next: (data) => { this.employees = data; this.filteredEmployees = data; }
    });
  }

  filterBy(type: string): void {
    this.filter = type;
    this.filteredEmployees = type === 'ALL'
      ? this.employees
      : this.employees.filter(e => e.contract?.type === type);
  }
}
