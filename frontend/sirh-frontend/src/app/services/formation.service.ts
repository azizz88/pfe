import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Représentation d'une compétence ciblée par une formation (niveau actuel vs requis).
 */
export interface TrainingSkillView {
  skillId: number;
  skillName: string;
  requiredLevel: number;
  currentLevel: number | null;
  acquired: boolean;
}

/**
 * Vue consolidée d'un programme de formation, alimentée par
 * {@code GET /api/interviews/manager/training-recommendations} et
 * {@code GET /api/interviews/employee/my-training}.
 */
export interface TrainingProgramView {
  interviewId: number;
  applicationId: number;
  candidateName: string;
  candidateMatricule: string;
  candidateEmail: string;
  jobOfferId: number;
  jobOfferTitle: string;
  managerUsername: string;
  managerName: string;
  managerEmail: string;
  trainingPlan: string;
  trainingDuration: string;
  trainingNotes: string;
  trainingRecommendedAt: string;
  baselineScore: number | null;
  skills: TrainingSkillView[];
  skillsAcquired: number;
  skillsTotal: number;
  readyForInterview: boolean;
  interviewStatus: string;
  interviewResult: string | null;
}

/**
 * Service Angular pour la page Formation (manager + employé).
 * S'appuie sur les Interviews existants ayant trainingRecommendedAt != null —
 * version simple sans nouvelle entité côté backend.
 */
@Injectable({ providedIn: 'root' })
export class FormationService {

  private interviewsUrl = 'http://localhost:8888/api/interviews';
  private employeesUrl = 'http://localhost:8888/api/employees';

  constructor(private http: HttpClient) {}

  /** Programmes de formation pilotés par le manager connecté. */
  getManagerTrainings(): Observable<TrainingProgramView[]> {
    return this.http.get<TrainingProgramView[]>(`${this.interviewsUrl}/manager/training-recommendations`);
  }

  /** Programmes visibles par l'employé connecté (read-only). */
  getMyTrainings(): Observable<TrainingProgramView[]> {
    return this.http.get<TrainingProgramView[]>(`${this.interviewsUrl}/employee/my-training`);
  }

  /** Met à jour le plan/durée/notes d'une formation en cours (manager). */
  updateTrainingPlan(interviewId: number, payload: {
    trainingPlan?: string;
    trainingDuration?: string;
    trainingNotes?: string;
  }): Observable<any> {
    return this.http.put(`${this.interviewsUrl}/${interviewId}/training-plan`, payload);
  }

  /**
   * Met à jour le niveau d'une compétence existante de l'employé en formation.
   * Utilise l'endpoint employee-service ouvert aux MANAGER.
   */
  updateEmployeeSkillLevel(matricule: string, skillId: number, level: number): Observable<any> {
    return this.http.put(`${this.employeesUrl}/matricule/${matricule}/skills/${skillId}`,
                         { level });
  }

  /**
   * Ajoute une nouvelle compétence à l'employé (cas où la compétence cible
   * n'existe pas encore dans son profil — niveau initial souvent 1).
   */
  addEmployeeSkill(matricule: string, payload: {
    skillId: number; skillName: string; category?: string; level: number;
  }): Observable<any> {
    return this.http.post(`${this.employeesUrl}/matricule/${matricule}/skills`, payload);
  }
}
