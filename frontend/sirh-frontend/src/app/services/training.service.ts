import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// ──────────────────────────────────────────────────────────
//  Types alignés sur les DTOs backend (recruitment-service)
// ──────────────────────────────────────────────────────────

export type ConventionStatus = 'CONVENTIONNE' | 'REFERENCE' | 'NOUVEAU';
export type DeliveryMode = 'PRESENTIEL' | 'DISTANCIEL' | 'HYBRIDE';
export type ProposalStatus =
  | 'PROPOSED'
  | 'ACCEPTED_BY_EMPLOYEE'
  | 'REFUSED_BY_EMPLOYEE'
  | 'ENROLLED'
  | 'COMPLETED'
  | 'ABANDONED';

export interface Skill {
  id: number;
  name: string;
  category?: string;
}

export interface TrainingProvider {
  id?: number;
  name: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  skillsCovered?: Skill[];
  qualiopiCertified: boolean;
  conventionStatus: ConventionStatus;
  avgPriceEur?: number | null;
  avgDurationDays?: number | null;
  deliveryMode?: DeliveryMode;
  pastSuccessRate?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingProviderRequest {
  name: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  skillIds: number[];
  qualiopiCertified: boolean;
  conventionStatus: ConventionStatus;
  avgPriceEur?: number | null;
  avgDurationDays?: number | null;
  deliveryMode?: DeliveryMode;
  pastSuccessRate?: number | null;
}

export interface TrainingSuggestion {
  providerId: number;
  score: number;
  justification: string;
  provider: TrainingProvider;
  source: 'AI' | 'FALLBACK';
}

export interface TrainingSuggestionRequest {
  missingSkillIds: number[];
  budgetMaxEur?: number | null;
  preferredMode?: DeliveryMode;
  sourceApplicationId?: number | null;
  employeeMatricule?: string;
}

export interface TrainingProposal {
  id?: number;
  employeeMatricule: string;
  employeeName?: string;
  employeeEmail?: string;
  managerUsername?: string;
  managerName?: string;
  provider: TrainingProvider;
  sourceApplicationId?: number | null;
  missingSkillIds: number[];
  aiScore?: number;
  aiJustification?: string;
  aiSource?: 'AI' | 'FALLBACK';
  status: ProposalStatus;
  certificateUrl?: string;
  managerNotes?: string;
  createdAt?: string;
  decisionDate?: string;
  enrollmentDate?: string;
  completionDate?: string;
}

export interface ProposalCreateRequest {
  employeeMatricule: string;
  employeeName?: string;
  employeeEmail?: string;
  providerId: number;
  sourceApplicationId?: number | null;
  missingSkillIds: number[];
  aiScore?: number;
  aiJustification?: string;
  aiSource?: 'AI' | 'FALLBACK';
  managerNotes?: string;
}

/**
 * Service Angular pour la feature Formation v2 :
 * - Catalogue d'organismes (admin CRUD + lecture manager)
 * - Suggestion IA (Gemini) du top 3 d'organismes
 * - Workflow propositions (manager propose, employé accepte/refuse, etc.)
 */
@Injectable({ providedIn: 'root' })
export class TrainingService {

  private base = 'http://localhost:8888/api';

  constructor(private http: HttpClient) {}

  // ──────────────────────────────────────────────────────────
  //  Organismes (training-providers)
  // ──────────────────────────────────────────────────────────

  listProviders(filters?: { convention?: ConventionStatus; mode?: DeliveryMode; skillIds?: number[] }): Observable<TrainingProvider[]> {
    const params: any = {};
    if (filters?.convention) params.convention = filters.convention;
    if (filters?.mode) params.mode = filters.mode;
    if (filters?.skillIds?.length) params.skillIds = filters.skillIds.join(',');
    return this.http.get<TrainingProvider[]>(`${this.base}/training-providers`, { params });
  }

  getProvider(id: number): Observable<TrainingProvider> {
    return this.http.get<TrainingProvider>(`${this.base}/training-providers/${id}`);
  }

  createProvider(req: TrainingProviderRequest): Observable<TrainingProvider> {
    return this.http.post<TrainingProvider>(`${this.base}/training-providers`, req);
  }

  updateProvider(id: number, req: TrainingProviderRequest): Observable<TrainingProvider> {
    return this.http.put<TrainingProvider>(`${this.base}/training-providers/${id}`, req);
  }

  deleteProvider(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/training-providers/${id}`);
  }

  // ──────────────────────────────────────────────────────────
  //  Suggestion IA
  // ──────────────────────────────────────────────────────────

  suggest(req: TrainingSuggestionRequest): Observable<TrainingSuggestion[]> {
    return this.http.post<TrainingSuggestion[]>(`${this.base}/training/suggest`, req);
  }

  // ──────────────────────────────────────────────────────────
  //  Propositions
  // ──────────────────────────────────────────────────────────

  listManagerProposals(): Observable<TrainingProposal[]> {
    return this.http.get<TrainingProposal[]>(`${this.base}/training/proposals/manager`);
  }

  getManagerStats(): Observable<Record<ProposalStatus, number>> {
    return this.http.get<Record<ProposalStatus, number>>(`${this.base}/training/proposals/manager/stats`);
  }

  listEmployeeProposals(): Observable<TrainingProposal[]> {
    return this.http.get<TrainingProposal[]>(`${this.base}/training/proposals/employee`);
  }

  createProposal(req: ProposalCreateRequest): Observable<TrainingProposal> {
    return this.http.post<TrainingProposal>(`${this.base}/training/proposals`, req);
  }

  acceptProposal(id: number): Observable<TrainingProposal> {
    return this.http.post<TrainingProposal>(`${this.base}/training/proposals/${id}/accept`, {});
  }

  refuseProposal(id: number): Observable<TrainingProposal> {
    return this.http.post<TrainingProposal>(`${this.base}/training/proposals/${id}/refuse`, {});
  }

  enrollProposal(id: number): Observable<TrainingProposal> {
    return this.http.post<TrainingProposal>(`${this.base}/training/proposals/${id}/enroll`, {});
  }

  completeProposal(id: number, certificateUrl?: string): Observable<TrainingProposal> {
    return this.http.post<TrainingProposal>(`${this.base}/training/proposals/${id}/complete`,
                                            { certificateUrl: certificateUrl || '' });
  }

  abandonProposal(id: number, reason?: string): Observable<TrainingProposal> {
    return this.http.post<TrainingProposal>(`${this.base}/training/proposals/${id}/abandon`,
                                            { reason: reason || '' });
  }
}
