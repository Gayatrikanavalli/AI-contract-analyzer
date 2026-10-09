export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Clause {
  id: string;
  contract_id: string;
  clause_title: string;
  clause_type: string;
  clause_text: string;
  risk_level: RiskLevel;
  risk_score?: number | null;
  risk_reason: string | null;
  page_number: number | null;
  recommendation: string | null;
  extracted_at: string;
}

export interface Contract {
  id: string;
  user_id: string | null;
  filename: string;
  file_size: number;
  file_type: string;
  page_count: number;
  extraction_status: ExtractionStatus;
  contract_title: string | null;
  contract_type: string | null;
  effective_date: string | null;
  parties: string[];
  executive_summary: string | null;
  overall_risk_score: number | null;
  overall_risk_level: RiskLevel | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  clauses?: Clause[];
}

export interface SampleContract {
  id: string;
  title: string;
  filename: string;
  type: string;
  pages: number;
  description: string;
  badge: string;
}

export interface SearchMatchClause {
  clause_title: string;
  clause_type: string;
  clause_text: string;
  risk_level: RiskLevel;
  page_number?: number | null;
  explanation?: string;
}

export interface SearchMatch {
  contract_id: string;
  contract_title: string;
  contract_type?: string | null;
  overall_risk_level?: RiskLevel | null;
  overall_risk_score?: number | null;
  relevance_reason: string;
  matching_clauses: SearchMatchClause[];
}

export interface SearchResultResponse {
  query: string;
  hasAnalyzedContracts: boolean;
  has_matches: boolean;
  summary: string;
  matches: SearchMatch[];
}
