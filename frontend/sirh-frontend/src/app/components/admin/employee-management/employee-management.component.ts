import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Gestion des employés (CRUD complet) pour le RH Admin.
 */
@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management">
      <div class="header">
        <h1>👥 Gestion des Employés</h1>
        <button class="add-btn" (click)="showForm = true; resetForm()">+ Ajouter</button>
      </div>

      <!-- Tableau des employés -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Nom Complet</th>
              <th>Email</th>
              <th>Poste</th>
              <th>Département</th>
              <th>Contrat</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let emp of employees">
              <td><strong>{{ emp.matricule }}</strong></td>
              <td>{{ emp.firstName }} {{ emp.lastName }}</td>
              <td>{{ emp.email }}</td>
              <td>{{ emp.position || '—' }}</td>
              <td>{{ emp.department?.name || '—' }}</td>
              <td>
                <span *ngIf="emp.contract" class="badge" [class]="emp.contract.type">
                  {{ emp.contract.type }}
                </span>
              </td>
              <td class="actions">
                <button class="edit-btn" (click)="editEmployee(emp)">✏️</button>
                <button class="delete-btn" (click)="deleteEmployee(emp.id)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Formulaire ajout/modification -->
      <div class="modal-overlay" *ngIf="showForm" (click)="showForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ isEditing ? 'Modifier' : 'Ajouter' }} un employé</h3>
          <div class="form-grid">
            <input [(ngModel)]="form.matricule" placeholder="Matricule (ex: EMP-001)" />
            <input [(ngModel)]="form.firstName" placeholder="Prénom" />
            <input [(ngModel)]="form.lastName" placeholder="Nom" />
            <input [(ngModel)]="form.email" placeholder="Email" type="email" />
            <input [(ngModel)]="form.phone" placeholder="Téléphone" />
            <input [(ngModel)]="form.position" placeholder="Poste" />
            <input [(ngModel)]="form.keycloakUsername" placeholder="Username Keycloak" />
            <select [(ngModel)]="form.departmentId">
              <option value="">-- Département --</option>
              <option *ngFor="let dept of departments" [value]="dept.id">{{ dept.name }}</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="cancel-btn" (click)="showForm = false">Annuler</button>
            <button class="submit-btn" (click)="saveEmployee()">
              {{ isEditing ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management { }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header h1 { color: #1e3a5f; margin: 0; }
    .add-btn {
      padding: 10px 20px; background: #3b82f6; color: white; border: none;
      border-radius: 8px; cursor: pointer; font-size: 0.9rem; transition: background 0.2s;
    }
    .add-btn:hover { background: #2563eb; }
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
    .actions { display: flex; gap: 8px; }
    .edit-btn, .delete-btn { border: none; background: none; cursor: pointer; font-size: 1.1rem; padding: 4px; }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal { background: white; border-radius: 16px; padding: 24px; width: 90%; max-width: 600px; }
    .modal h3 { margin: 0 0 20px 0; color: #1e293b; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-grid input, .form-grid select {
      padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px;
      font-size: 0.9rem; outline: none;
    }
    .form-grid input:focus, .form-grid select:focus { border-color: #3b82f6; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
    .cancel-btn { padding: 8px 16px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; }
    .submit-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; }
  `]
})
export class EmployeeManagementComponent implements OnInit {
  employees: any[] = [];
  departments: any[] = [];
  showForm = false;
  isEditing = false;
  editId: number | null = null;
  form: any = {};

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
  }

  loadEmployees(): void {
    this.employeeApi.getAllEmployees().subscribe({ next: (data) => this.employees = data });
  }

  loadDepartments(): void {
    this.employeeApi.getDepartments().subscribe({ next: (data) => this.departments = data });
  }

  resetForm(): void {
    this.form = {}; this.isEditing = false; this.editId = null;
  }

  editEmployee(emp: any): void {
    this.form = { ...emp, departmentId: emp.department?.id || '' };
    this.isEditing = true;
    this.editId = emp.id;
    this.showForm = true;
  }

  saveEmployee(): void {
    const payload = {
      ...this.form,
      department: this.form.departmentId ? { id: this.form.departmentId } : null
    };

    const obs = this.isEditing
      ? this.employeeApi.updateEmployee(this.editId!, payload)
      : this.employeeApi.createEmployee(payload);

    obs.subscribe({
      next: () => { this.showForm = false; this.loadEmployees(); },
      error: (err: any) => console.error('Erreur sauvegarde:', err)
    });
  }

  deleteEmployee(id: number): void {
    if (confirm('Supprimer cet employé ?')) {
      this.employeeApi.deleteEmployee(id).subscribe({
        next: () => this.loadEmployees()
      });
    }
  }
}
