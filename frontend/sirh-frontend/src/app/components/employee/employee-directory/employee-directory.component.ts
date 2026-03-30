import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmployeeApiService } from '../../../services/employee-api.service';

/**
 * Annuaire de l'entreprise.
 * Permet de rechercher et consulter la liste des collègues.
 */
@Component({
  selector: 'app-employee-directory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="directory">
      <h1>📖 Annuaire de l'entreprise</h1>

      <!-- Barre de recherche -->
      <div class="search-bar">
        <input type="text" [(ngModel)]="searchKeyword" (input)="onSearch()"
               placeholder="🔍 Rechercher par nom ou prénom..." />
      </div>

      <!-- Liste des employés -->
      <div class="employee-grid">
        <div class="employee-card" *ngFor="let emp of employees">
          <div class="avatar">{{ emp.firstName?.charAt(0) }}{{ emp.lastName?.charAt(0) }}</div>
          <div class="employee-info">
            <h3>{{ emp.firstName }} {{ emp.lastName }}</h3>
            <p class="position">{{ emp.position || 'Non défini' }}</p>
            <p class="department" *ngIf="emp.department">🏗️ {{ emp.department.name }}</p>
            <p class="email">📧 {{ emp.email }}</p>
            <p class="phone" *ngIf="emp.phone">📞 {{ emp.phone }}</p>
          </div>
        </div>
      </div>

      <p *ngIf="employees.length === 0" class="empty">Aucun employé trouvé.</p>
    </div>
  `,
  styles: [`
    .directory h1 { color: #1e3a5f; margin: 0 0 20px 0; }
    .search-bar { margin-bottom: 24px; }
    .search-bar input {
      width: 100%; max-width: 500px; padding: 12px 16px;
      border: 2px solid #e2e8f0; border-radius: 10px; font-size: 1rem;
      outline: none; transition: border-color 0.2s;
    }
    .search-bar input:focus { border-color: #3b82f6; }
    .employee-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .employee-card {
      display: flex; gap: 16px; align-items: flex-start;
      background: white; padding: 20px; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .employee-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .avatar {
      width: 50px; height: 50px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: bold; font-size: 1.1rem; flex-shrink: 0;
    }
    .employee-info h3 { margin: 0 0 4px 0; color: #1e293b; font-size: 1rem; }
    .employee-info p { margin: 2px 0; font-size: 0.85rem; color: #64748b; }
    .position { font-weight: 500; color: #334155 !important; }
    .empty { text-align: center; color: #94a3b8; font-style: italic; margin-top: 40px; }
  `]
})
export class EmployeeDirectoryComponent implements OnInit {
  employees: any[] = [];
  searchKeyword = '';

  constructor(private employeeApi: EmployeeApiService) {}

  ngOnInit(): void {
    this.loadDirectory();
  }

  loadDirectory(): void {
    this.employeeApi.getDirectory().subscribe({
      next: (data) => this.employees = data,
      error: (err) => console.error('Erreur chargement annuaire:', err)
    });
  }

  onSearch(): void {
    if (this.searchKeyword.trim()) {
      this.employeeApi.searchDirectory(this.searchKeyword).subscribe({
        next: (data) => this.employees = data
      });
    } else {
      this.loadDirectory();
    }
  }
}
