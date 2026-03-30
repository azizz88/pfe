import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Service pour les appels API vers Recruitment-Service (via API Gateway).
 */
@Injectable({
  providedIn: 'root'
})
export class RecruitmentApiService {

  private baseUrl = 'http://localhost:8888/api';

  constructor(private http: HttpClient) {}

  // ── Offres d'emploi ──

  /** Liste les offres actives (Employé) */
  getActiveOffers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/job-offers/active`);
  }

  /** Liste toutes les offres (HR Admin) */
  getAllOffers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/job-offers`);
  }

  getOfferById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/job-offers/${id}`);
  }

  createOffer(offer: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/job-offers`, offer);
  }

  updateOffer(id: number, offer: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/job-offers/${id}`, offer);
  }

  closeOffer(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/job-offers/${id}/close`, {});
  }

  deleteOffer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/job-offers/${id}`);
  }

  // ── Candidatures ──

  /** Soumettre une candidature (Employé) */
  submitApplication(application: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/applications`, application);
  }

  /** Mes candidatures (Employé) */
  getMyApplications(matricule: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/applications/my/${matricule}`);
  }

  /** Toutes les candidatures (HR Admin) */
  getAllApplications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/applications`);
  }

  /** Candidatures pour une offre (HR Admin) */
  getApplicationsByJobOffer(jobOfferId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/applications/job-offer/${jobOfferId}`);
  }

  /** Changer le statut d'une candidature (HR Admin) */
  updateApplicationStatus(id: number, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/applications/${id}/status?status=${status}`, {});
  }

  /** Rapport de mobilité (HR Admin) */
  getMobilityReport(): Observable<any> {
    return this.http.get(`${this.baseUrl}/applications/stats`);
  }

  // ── Entretiens ──

  scheduleInterview(interview: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/interviews`, interview);
  }

  getInterviewsByApplication(applicationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/interviews/application/${applicationId}`);
  }

  updateInterview(id: number, interview: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/interviews/${id}`, interview);
  }
}
