import { Routes } from '@angular/router';
import { hrAdminGuard, employeeGuard, managerGuard, rootRedirectGuard } from './guards/auth.guard';

// ── Composants Espace Employé ──
import { EmployeeDashboardComponent } from './components/employee/employee-dashboard/employee-dashboard.component';
import { EmployeeDirectoryComponent } from './components/employee/employee-directory/employee-directory.component';
import { MyApplicationsComponent } from './components/employee/my-applications/my-applications.component';
import { MyProfileComponent } from './components/employee/my-profile/my-profile.component';

// ── Composants Espace RH Admin ──
import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { EmployeeManagementComponent } from './components/admin/employee-management/employee-management.component';
import { ContractManagementComponent } from './components/admin/contract-management/contract-management.component';
import { RecruitmentManagementComponent } from './components/admin/recruitment-management/recruitment-management.component';
import { DepartmentManagementComponent } from './components/admin/department-management/department-management.component';
import { OrganigrammeComponent } from './components/employee/organigramme/organigramme.component';
import { SkillsManagementComponent } from './components/admin/skills-management/skills-management.component';
import { ExternalCandidatesComponent } from './components/admin/external-candidates/external-candidates.component';
import { TrainingProvidersComponent } from './components/admin/training-providers/training-providers.component';

// ── Composants Espace Manager ──
import { ManagerInterviewsComponent } from './components/manager/manager-interviews/manager-interviews.component';
import { ManagerDashboardComponent } from './components/manager/manager-dashboard/manager-dashboard.component';
import { ManagerProfileComponent } from './components/manager/manager-profile/manager-profile.component';
import { ManagerFormationComponent } from './components/manager/manager-formation/manager-formation.component';

// ── Composants Formation Employé ──
import { EmployeeFormationComponent } from './components/employee/employee-formation/employee-formation.component';

// ── Composants Auth (public) ──
import { ForgotPasswordComponent } from './components/auth/forgot-password/forgot-password.component';

/**
 * Routes de l'application SIRH.
 * Protégées par des guards basés sur les rôles Keycloak.
 */
export const routes: Routes = [
  // Redirection par défaut — aiguillage selon le rôle (admin / manager / employé)
  { path: '', pathMatch: 'full', canActivate: [rootRedirectGuard], children: [] },

  // ── Route publique : Mot de passe oublié (pas de guard, pas de login requis) ──
  { path: 'forgot-password', component: ForgotPasswordComponent },

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
    path: 'employee/profile',
    component: MyProfileComponent,
    canActivate: [employeeGuard]
  },
  {
    path: 'employee/formation',
    component: EmployeeFormationComponent,
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
  {
    path: 'admin/organigramme',
    component: OrganigrammeComponent,
    canActivate: [hrAdminGuard]
  },
  {
    path: 'admin/skills',
    component: SkillsManagementComponent,
    canActivate: [hrAdminGuard]
  },
  {
    path: 'admin/external-candidates',
    component: ExternalCandidatesComponent,
    canActivate: [hrAdminGuard]
  },
  {
    path: 'admin/training-providers',
    component: TrainingProvidersComponent,
    canActivate: [hrAdminGuard]
  },

  // ── Espace Manager ──
  {
    path: 'manager/dashboard',
    component: ManagerDashboardComponent,
    canActivate: [managerGuard]
  },
  {
    path: 'manager/profile',
    component: ManagerProfileComponent,
    canActivate: [managerGuard]
  },
  {
    path: 'manager/interviews',
    component: ManagerInterviewsComponent,
    canActivate: [managerGuard]
  },
  {
    path: 'manager/formation',
    component: ManagerFormationComponent,
    canActivate: [managerGuard]
  },
  {
    path: 'manager/organigramme',
    component: OrganigrammeComponent,
    canActivate: [managerGuard]
  },

  // Route wildcard — repasse par l'aiguillage rôle pour ne pas envoyer un manager
  // vers /employee/dashboard (bloqué par employeeGuard).
  { path: '**', canActivate: [rootRedirectGuard], children: [] }
];
