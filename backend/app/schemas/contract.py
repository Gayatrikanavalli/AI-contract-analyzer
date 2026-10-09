from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# ==========================================
# GEMINI STRUCTURED OUTPUT PYDANTIC SCHEMAS
# ==========================================

class GeminiClauseSchema(BaseModel):
    clause_title: str = Field(..., description="Concise descriptive title of the legal clause")
    clause_type: str = Field(
        ...,
        description="Category: Termination, Payment, Liability, Indemnification, Confidentiality, Intellectual Property, Data Protection, Non-Compete, Dispute Resolution, Governing Law, Renewal, Warranty, Insurance, Force Majeure, or Other"
    )
    clause_text: str = Field(..., description="Exact or verbatim text snippet of the clause extracted from document")
    risk_level: str = Field(
        ...,
        description="Assessed risk level: 'critical', 'high', 'medium', or 'standard'"
    )
    risk_score: Optional[int] = Field(
        default=None,
        description="Risk score integer between 0 (harmless/standard) and 100 (critical liability/severe risk)"
    )
    risk_reason: Optional[str] = Field(
        default=None,
        description="Clear legal rationale explaining why this clause is risky or standard"
    )
    page_number: Optional[int] = Field(
        default=None,
        description="1-based document page number where clause appears"
    )
    recommendation: Optional[str] = Field(
        default=None,
        description="Actionable redline revision or negotiation advice"
    )


class GeminiContractAnalysisResult(BaseModel):
    contract_title: str = Field(..., description="Formal title of the legal agreement")
    contract_type: str = Field(..., description="Type of agreement (e.g. Master Services Agreement, NDA, SaaS, Employment, License)")
    effective_date: Optional[str] = Field(default=None, description="Effective date or term start date")
    parties: List[str] = Field(default_factory=list, description="Names of identified executing parties")
    executive_summary: str = Field(..., description="Executive risk assessment and brief overview of contract terms")
    overall_risk_score: int = Field(..., description="Overall agreement risk score from 0 to 100")
    overall_risk_level: str = Field(..., description="'critical', 'high', 'medium', or 'standard'")
    clauses: List[GeminiClauseSchema] = Field(default_factory=list, description="List of parsed and analyzed legal clauses")


# ==========================================
# REST API RESPONSE SCHEMAS
# ==========================================

class ClauseResponse(BaseModel):
    id: str
    contract_id: str
    clause_type: str
    title: str
    text: str
    page_number: Optional[int] = None
    risk_level: str
    risk_score: Optional[int] = None
    risk_reason: Optional[str] = None
    recommendation: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ContractSummaryResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    page_count: int
    contract_title: Optional[str] = None
    contract_type: Optional[str] = None
    effective_date: Optional[str] = None
    parties: List[str] = []
    status: str
    risk_score: Optional[int] = None
    overall_risk_level: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContractDetailResponse(ContractSummaryResponse):
    executive_summary: Optional[str] = None
    error_message: Optional[str] = None
    clauses: List[ClauseResponse] = []


class UploadResponse(BaseModel):
    contract_id: str
    filename: str
    page_count: int
    status: str
    message: str
