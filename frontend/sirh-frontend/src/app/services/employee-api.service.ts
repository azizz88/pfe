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

  // ── Organigramme ──

  getOrganigramme(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/employees/organigramme`);
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
}
