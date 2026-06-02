import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Service pour les appels API vers Employee-Service (via API Gateway).
 */
@Injectable({
  providedIn: 'root'
})
export class EmployeeApiService {

  private baseUrl = 'http://localhost:8888/api';

  constructor(private http: HttpClient) {}

  // ── Profil & Annuaire (Employé) ──

  /** Récupère le profil de l'employé connecté */
  getMyProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/me`);
  }

  /**
   * Historique de carrière de l'employé connecté (timeline "Mon parcours").
   * Le poste actuel (endDate=null) est en tête de la liste.
   */
  getMyPositionHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees/me/position-history`);
  }

  /**
   * Contexte "Mon équipe" du manager connecté.
   * Renvoie { manager, departments[], team[], teamSize }.
   * Chaque membre de team porte un flag `recentPromotion` si promotion < 30 jours.
   */
  getMyTeam(): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/manager/my-team`);
  }

  /** Annuaire : liste tous les employés */
  getDirectory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees/directory`);
  }

  /** Recherche dans l'annuaire */
  searchDirectory(keyword: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees/directory/search?keyword=${keyword}`);
  }

  // ── CRUD Employés (HR Admin) ──

  getAllEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees`);
  }

  getEmployeeById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/${id}`);
  }

  createEmployee(employee: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees`, employee);
  }

  updateEmployee(id: number, employee: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/${id}`, employee);
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/employees/${id}`);
  }

  /** Liste les utilisateurs ayant le rôle Keycloak MANAGER (pour la planification d'entretiens). */
  getManagers(): Observable<{ username: string; firstName: string; lastName: string; email: string }[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees/managers`);
  }

  // ── Organigramme ──

  getOrganigramme(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees/organigramme`);
  }

  // ── Départements ──

  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/departments`);
  }

  createDepartment(department: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/departments`, department);
  }

  updateDepartment(id: number, department: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/departments/${id}`, department);
  }

  deleteDepartment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/departments/${id}`);
  }

  /** Assigne un employé existant comme manager d'un département. */
  assignDepartmentManager(deptId: number, employeeId: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/departments/${deptId}/manager/${employeeId}`, {});
  }

  /** Retire le manager actuel d'un département. */
  removeDepartmentManager(deptId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/departments/${deptId}/manager`);
  }

  // ── Services ──

  getServices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/services`);
  }

  getServicesByDepartment(departmentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/services/department/${departmentId}`);
  }

  createService(service: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/services`, service);
  }

  updateService(id: number, service: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/services/${id}`, service);
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/services/${id}`);
  }

  // ── Statistiques (HR Admin) ──

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/stats`);
  }

  // ── Documents ──

  uploadDocument(employeeId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/documents/employee/${employeeId}`, formData);
  }

  getDocumentsByEmployee(employeeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/documents/employee/${employeeId}`);
  }

  getMyDocuments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/documents/my`);
  }

  downloadDocument(documentId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/documents/${documentId}/download`, { responseType: 'blob' });
  }

  deleteDocument(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documents/${documentId}`);
  }

  // ── Extraction CV (HR Admin) ──

  /**
   * Envoie un CV (PDF/DOCX/TXT) au backend qui extrait les compétences détectées
   * et propose un niveau estimé (1-5) pour chacune. Le RH valide ensuite la sélection.
   */
  extractCvSkills(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/cv/extract`, formData);
  }

  // ── Compétences employé (HR Admin) ──

  /** Liste les compétences d'un employé avec leur niveau (1-5) */
  getEmployeeSkills(matricule: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees/matricule/${matricule}/skills`);
  }

  /** Ajoute (upsert) une compétence avec niveau pour un employé */
  addEmployeeSkill(matricule: string, payload: { skillId: number; skillName: string; category?: string; level: number }): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees/matricule/${matricule}/skills`, payload);
  }

  /** Modifie le niveau d'une compétence existante */
  updateEmployeeSkillLevel(matricule: string, skillId: number, level: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/matricule/${matricule}/skills/${skillId}`, { level });
  }

  /** Retire une compétence d'un employé */
  removeEmployeeSkill(matricule: string, skillId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/employees/matricule/${matricule}/skills/${skillId}`);
  }
}
