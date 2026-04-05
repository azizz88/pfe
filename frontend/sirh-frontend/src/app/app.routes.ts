import { Routes } from '@angular/router';
import { hrAdminGuard, employeeGuard } from './guards/auth.guard';

// ── Composants Espace Employé ──
import { EmployeeDashboardComponent } from './components/employee/employee-dashboard/employee-dashboard.component';
import { EmployeeDirectoryComponent } from './components/employee/employee-directory/employee-directory.component';
import { MyApplicationsComponent } from './components/employee/my-applications/my-applications.component';
import { OrganigrammeComponent } from './components/employee/organigramme/organigramme.component';

// ── Composants Espace RH Admin ──
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { EmployeeManagementComponent } from './components/admin/employee-management/employee-management.component';
import { ContractManagementComponent } from './components/admin/contract-management/contract-management.component';
import { RecruitmentManagementComponent } from './components/admin/recruitment-management/recruitment-management.component';
import { DepartmentManagementComponent } from './components/admin/department-management/department-management.component';

/**
 * Routes de l'application SIRH.
 * Protégées par des guards basés sur les rôles Keycloak.
 */
export const routes: Routes = [
  // Redirection par défaut
  { path: '', redirectTo: 'employee/dashboard', pathMatch: 'full' },

  // ── Espace Employé ──
  {
    path: 'employee/dashboard',
    component: EmployeeDashboardComponent,
    canActivate: [employeeGuard]
  },
  {
    path: 'employee/directory',
    component: EmployeeDirectoryComponent,
    canActivate: [employeeGuard]
  },
  {
    path: 'employee/applications',
    component: MyApplicationsComponent,
    canActivate: [employeeGuard]
  },
  {
    path: 'employee/organigramme',
    component: OrganigrammeComponent,
    canActivate: [employeeGuard]
  },

  // ── Espace RH Admin ──
  {
    path: 'admin/dashboard',
    component: AdminDashboardComponent,
    canActivate: [hrAdminGuard]
  },
  {
    path: 'admin/employees',
    component: EmployeeManagementComponent,
    canActivate: [hrAdminGuard]
  },
  {
    path: 'admin/contracts',
    component: ContractManagementComponent,
    canActivate: [hrAdminGuard]
  },
  {
    path: 'admin/recruitment',
    component: RecruitmentManagementComponent,
    canActivate: [hrAdminGuard]
  },
  {
    path: 'admin/departments',
    component: DepartmentManagementComponent,
    canActivate: [hrAdminGuard]
  },

  // Route wildcard
  { path: '**', redirectTo: 'employee/dashboard' }
];
