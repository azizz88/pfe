import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Gestion des départements pour le RH Admin.
 */
@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="management">
      <div class="header">
        <h1>🏗️ Gestion des Départements</h1>
        <button class="add-btn" (click)="showForm = true; resetForm()">+ Ajouter</button>
      </div>

      <div class="dept-grid">
        <div class="dept-card" *ngFor="let dept of departments">
          <h3>{{ dept.name }}</h3>
          <p>{{ dept.description || 'Aucune description' }}</p>
          <div class="card-actions">
            <button class="edit-btn" (click)="editDepartment(dept)">✏️ Modifier</button>
            <button class="delete-btn" (click)="deleteDepartment(dept.id)">🗑️ Supprimer</button>
          </div>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="modal-overlay" *ngIf="showForm" (click)="showForm = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ isEditing ? 'Modifier' : 'Ajouter' }} un département</h3>
          <input [(ngModel)]="form.name" placeholder="Nom du département" />
          <textarea [(ngModel)]="form.description" placeholder="Description" rows="3"></textarea>
          <div class="modal-actions">
            <button class="cancel-btn" (click)="showForm = false">Annuler</button>
            <button class="submit-btn" (click)="saveDepartment()">
              {{ isEditing ? 'Modifier' : 'Créer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .header h1 { color: #1e3a5f; margin: 0; }
    .add-btn { padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; }
    .dept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .dept-card {
      background: white; border-radius: 12px; padding: 20px;
      border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .dept-card h3 { margin: 0 0 8px 0; color: #1e293b; }
    .dept-card p { color: #64748b; font-size: 0.9rem; margin: 0 0 16px 0; }
    .card-actions { display: flex; gap: 8px; }
    .edit-btn { padding: 6px 12px; border: 1px solid #3b82f6; color: #3b82f6; background: white; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
    .delete-btn { padding: 6px 12px; border: 1px solid #ef4444; color: #ef4444; background: white; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: 16px; padding: 24px; width: 90%; max-width: 450px; }
    .modal h3 { margin: 0 0 16px 0; color: #1e293b; }
    .modal input, .modal textarea {
      width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px;
      font-size: 0.9rem; outline: none; margin-bottom: 12px; box-sizing: border-box;
    }
    .modal input:focus, .modal textarea:focus { border-color: #3b82f6; }
    .modal-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .cancel-btn { padding: 8px 16px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; }
    .submit-btn { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; }
  `]
})
export class DepartmentManagementComponent implements OnInit {
  departments: any[] = [];
  showForm = false;
  isEditing = false;
  editId: number | null = null;
  form: any = {};

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void { this.loadDepartments(); }

  loadDepartments(): void {
    this.employeeApi.getDepartments().subscribe({ next: (data) => this.departments = data });
  }

  resetForm(): void { this.form = {}; this.isEditing = false; this.editId = null; }

  editDepartment(dept: any): void {
    this.form = { ...dept }; this.isEditing = true; this.editId = dept.id; this.showForm = true;
  }

  saveDepartment(): void {
    const obs = this.isEditing
      ? this.employeeApi.updateDepartment(this.editId!, this.form)
      : this.employeeApi.createDepartment(this.form);
    obs.subscribe({ next: () => { this.showForm = false; this.loadDepartments(); } });
  }

  deleteDepartment(id: number): void {
    if (confirm('Supprimer ce département ?')) {
      this.employeeApi.deleteDepartment(id).subscribe({ next: () => this.loadDepartments() });
    }
  }
}
