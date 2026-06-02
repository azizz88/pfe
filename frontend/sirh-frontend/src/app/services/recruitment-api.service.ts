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

  // ── Entretiens (workflow 2 phases) ──

  /**
   * Phase 1 — Le RH affecte un manager à un entretien (pas de date encore).
   * Body : { applicationId | externalCandidateId, managerUsername, managerName, candidateType, rhNote? }
   */
  assignInterview(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/interviews/assign`, payload);
  }

  /**
   * Phase 2 — Le manager fixe date/heure/lieu.
   * Body : { scheduledDate, location?, interviewer? }
   */
  scheduleInterviewByManager(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/interviews/${id}/schedule`, payload);
  }

  /** Refus par le manager avec motif. */
  rejectInterviewAssignment(id: number, reason: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/interviews/${id}/reject`, { reason });
  }

  getInterviewsByApplication(applicationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/interviews/application/${applicationId}`);
  }

  updateInterview(id: number, interview: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/interviews/${id}`, interview);
  }

  /** Tous les entretiens (vue RH Admin). */
  getAllInterviews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/interviews`);
  }

  /** Entretiens assignés au manager connecté. */
  getMyInterviews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/interviews/my`);
  }

  /**
   * Statistiques d'activité du manager connecté (KPIs dashboard).
   * Retourne { pendingScheduling, scheduled, completed, positive, negative,
   * acceptanceRate, upcoming[], monthly[], ... }.
   */
  getManagerStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/interviews/manager/stats`);
  }

  /** Renvoyer la convocation (email + .ics) au candidat. (HR Admin) */
  resendInterviewConvocation(id: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/interviews/${id}/resend-email`, {});
  }

  /**
   * Le manager enregistre un plan de formation pour un candidat "À Former".
   * Body : { trainingPlan, trainingDuration?, trainingNotes? }
   */
  recommendTrainingByManager(interviewId: number, payload: {
    trainingPlan: string;
    trainingDuration?: string;
    trainingNotes?: string;
  }): Observable<any> {
    return this.http.put(`${this.baseUrl}/interviews/${interviewId}/training-recommendation`, payload);
  }

  // ── Compétences (Skills) ──

  getAllSkills(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/skills`);
  }

  createSkill(skill: { name: string; category?: string; description?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/skills`, skill);
  }

  updateSkill(id: number, skill: { name: string; category?: string; description?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/skills/${id}`, skill);
  }

  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/skills/${id}`);
  }

  // ── Matching IA (HR Admin) ──

  /**
   * Lance le matching IA pour une offre.
   * Retourne { results: MatchingResult[], diagnostic: { skillRequirementsCount, applicationsCount, ... } }.
   */
  runMatching(offerId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/matching/job-offer/${offerId}`, {});
  }

  /**
   * Applique en bulk les statuts validés par le RH après matching.
   * updates : [{ applicationId, status, matchingCategory?, matchingScore? }]
   */
  applyMatchingStatuses(updates: { applicationId: number; status: string; matchingCategory?: string; matchingScore?: number }[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/matching/apply-statuses`, { updates });
  }

  /** Recommande une formation interne pour une candidature (catégorie TRAINING) */
  recommendTraining(applicationId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/matching/recommend-training/${applicationId}`, {});
  }

  /**
   * Contexte de formation d'une candidature : infos employé + compétences manquantes.
   * Utilisé pour pré-remplir et auto-déclencher la suggestion IA d'organismes.
   * Retourne { employeeMatricule, employeeName, jobOfferId, jobOfferTitle, missingSkillIds[], missingSkillNames[] }.
   */
  getTrainingContext(applicationId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/matching/application/${applicationId}/training-context`);
  }

  // ── Candidats externes (pool LinkedIn / cooptation) ──

  getExternalCandidates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/external-candidates`);
  }

  getExternalCandidateById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/external-candidates/${id}`);
  }

  createExternalCandidate(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/external-candidates`, payload);
  }

  updateExternalCandidate(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/external-candidates/${id}`, payload);
  }

  deleteExternalCandidate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/external-candidates/${id}`);
  }

  /**
   * Lance le matching IA sur le pool de candidats externes contre une offre.
   * Utilise le même modèle d'algorithme que le matching interne.
   */
  runExternalMatching(offerId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/matching/external/job-offer/${offerId}`, {});
  }
}
