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
  templateUrl: './employee-directory.component.html',
  styleUrls: ['./employee-directory.component.css']
})
export class EmployeeDirectoryComponent implements OnInit {
  allEmployees: any[] = [];
  filteredEmployees: any[] = [];
  departments: any[] = [];
  allServices: any[] = [];
  filteredServices: any[] = [];
  managers: any[] = []; // managers uniques calculés depuis les départements

  searchKeyword = '';
  selectedDeptId = '';
  selectedServiceId = '';
  selectedManagerId = '';
  viewMode: 'grid' | 'list' | 'grouped' = 'grid';

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
      next: (data) => {
        this.departments = data;
        this.computeManagers();
      }
    });
  }

  /** Calcule la liste unique des managers à partir des départements. */
  computeManagers(): void {
    const seen = new Set<number>();
    this.managers = [];
    for (const dept of this.departments) {
      const mgr = dept.manager;
      if (mgr && mgr.id && !seen.has(mgr.id)) {
        seen.add(mgr.id);
        this.managers.push(mgr);
      }
    }
  }

  /** Renvoie le manager responsable d'un employé (via son département). */
  getManagerOf(emp: any): any | null {
    return emp?.department?.manager || null;
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
        (emp.lastName?.toLowerCase().includes(kw)) ||
        (emp.email?.toLowerCase().includes(kw)) ||
        (emp.position?.toLowerCase().includes(kw))
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

    // Filtre par manager
    if (this.selectedManagerId) {
      result = result.filter(emp => emp.department?.manager?.id === +this.selectedManagerId);
    }

    this.filteredEmployees = result;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchKeyword.trim() || this.selectedDeptId || this.selectedServiceId || this.selectedManagerId);
  }

  resetFilters(): void {
    this.searchKeyword = '';
    this.selectedDeptId = '';
    this.selectedServiceId = '';
    this.selectedManagerId = '';
    this.filteredServices = [];
    this.applyFilters();
  }

  /** Regroupe filteredEmployees par manager : retourne [{ manager, employees[] }, …] + un groupe "Sans manager". */
  groupedByManager(): { manager: any | null; employees: any[] }[] {
    const map = new Map<string, { manager: any | null; employees: any[] }>();
    for (const emp of this.filteredEmployees) {
      const mgr = this.getManagerOf(emp);
      const key = mgr ? `mgr-${mgr.id}` : 'none';
      if (!map.has(key)) map.set(key, { manager: mgr, employees: [] });
      map.get(key)!.employees.push(emp);
    }
    // managers en premier (triés par nom), puis le groupe "sans manager" à la fin
    const groups = Array.from(map.values()).filter(g => g.manager);
    groups.sort((a, b) => (a.manager.lastName || '').localeCompare(b.manager.lastName || ''));
    const orphans = map.get('none');
    if (orphans) groups.push(orphans);
    return groups;
  }

  getAvatarColor(emp: any): string {
    const colors = [
      'linear-gradient(135deg, #3b82f6, #2563eb)',
      'linear-gradient(135deg, #0ea5e9, #0284c7)',
      'linear-gradient(135deg, #6366f1, #4f46e5)',
      'linear-gradient(135deg, #14b8a6, #0d9488)',
      'linear-gradient(135deg, #64748b, #475569)',
      'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      'linear-gradient(135deg, #0891b2, #0e7490)',
    ];
    const hash = (emp.firstName?.charCodeAt(0) || 0) + (emp.lastName?.charCodeAt(0) || 0);
    return colors[hash % colors.length];
  }

  getDeptBadgeClass(deptName: string): string {
    if (!deptName) return '';
    const hash = deptName.charCodeAt(0) % 4;
    return ['dept-blue', 'dept-green', 'dept-purple', 'dept-amber'][hash];
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
