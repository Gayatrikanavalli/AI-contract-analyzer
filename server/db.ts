/**
 * Database storage layer for Contracts and Clauses
 */
import { Contract, Clause, RiskLevel, ExtractionStatus } from '../src/types';
import { generateValidContractPdf } from './pdf-utils';

interface ContractRecord extends Contract {
  file_data: Buffer;
  raw_text?: string;
}

class Database {
  private contracts: Map<string, ContractRecord> = new Map();
  private clauses: Map<string, Clause[]> = new Map();

  constructor() {
    this.initSampleContracts();
  }

  public getAllContracts(userId?: string): Contract[] {
    return Array.from(this.contracts.values())
      .filter(c => userId === undefined || c.user_id === userId)
      .map(c => this.sanitizeContract(c))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getContractById(id: string, userId?: string): Contract | null {
    const contract = this.contracts.get(id);
    if (!contract || (userId !== undefined && contract.user_id !== userId)) return null;
    const sanitized = this.sanitizeContract(contract);
    sanitized.clauses = this.getClausesByContractId(id);
    return sanitized;
  }

  public getContractBuffer(id: string): { buffer: Buffer; filename: string; mimeType: string } | null {
    const contract = this.contracts.get(id);
    if (!contract || !contract.file_data) return null;
    return {
      buffer: contract.file_data,
      filename: contract.filename,
      mimeType: contract.file_type || 'application/pdf',
    };
  }

  public getContractRawText(id: string): string | null {
    const contract = this.contracts.get(id);
    return contract ? contract.raw_text || '' : null;
  }

  public createContract(data: {
    id?: string;
    filename: string;
    file_size: number;
    file_type?: string;
    file_data: Buffer;
    user_id?: string | null;
    raw_text?: string;
    page_count?: number;
    extraction_status?: ExtractionStatus;
    contract_title?: string | null;
    contract_type?: string | null;
    effective_date?: string | null;
    parties?: string[];
    executive_summary?: string | null;
    overall_risk_score?: number | null;
    overall_risk_level?: RiskLevel | null;
  }): Contract {
    const id = data.id || `contract_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const newContract: ContractRecord = {
      id,
      user_id: data.user_id || null,
      filename: data.filename,
      file_size: data.file_size,
      file_type: data.file_type || 'application/pdf',
      file_data: data.file_data,
      raw_text: data.raw_text || '',
      page_count: data.page_count || 1,
      extraction_status: data.extraction_status || 'pending',
      contract_title: data.contract_title || null,
      contract_type: data.contract_type || null,
      effective_date: data.effective_date || null,
      parties: data.parties || [],
      executive_summary: data.executive_summary || null,
      overall_risk_score: data.overall_risk_score !== undefined ? data.overall_risk_score : null,
      overall_risk_level: data.overall_risk_level || null,
      error_message: null,
      created_at: now,
      updated_at: now,
    };

    this.contracts.set(id, newContract);
    if (!this.clauses.has(id)) {
      this.clauses.set(id, []);
    }
    return this.sanitizeContract(newContract);
  }

  public updateContract(id: string, updates: Partial<ContractRecord>): Contract | null {
    const contract = this.contracts.get(id);
    if (!contract) return null;

    const updated: ContractRecord = {
      ...contract,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.contracts.set(id, updated);
    return this.sanitizeContract(updated);
  }

  public deleteContract(id: string): boolean {
    const deleted = this.contracts.delete(id);
    this.clauses.delete(id);
    return deleted;
  }

  public getClausesByContractId(contractId: string): Clause[] {
    return this.clauses.get(contractId) || [];
  }

  public saveClauses(contractId: string, clauseList: Omit<Clause, 'id' | 'contract_id' | 'extracted_at'>[]): Clause[] {
    const now = new Date().toISOString();
    const storedClauses: Clause[] = clauseList.map((item, index) => ({
      id: `clause_${contractId}_${index + 1}_${Math.random().toString(36).substring(2, 7)}`,
      contract_id: contractId,
      clause_title: item.clause_title || 'Untitled Clause',
      clause_type: item.clause_type || 'General',
      clause_text: item.clause_text || '',
      risk_level: (item.risk_level || 'low') as RiskLevel,
      risk_score: typeof item.risk_score === 'number' ? item.risk_score : (item.risk_level === 'critical' ? 90 : item.risk_level === 'high' ? 75 : item.risk_level === 'medium' ? 50 : 20),
      risk_reason: item.risk_reason ?? null,
      page_number: typeof item.page_number === 'number' ? item.page_number : null,
      recommendation: item.recommendation ?? null,
      extracted_at: now,
    }));

    this.clauses.set(contractId, storedClauses);
    return storedClauses;
  }

  private sanitizeContract(contract: ContractRecord): Contract {
    const { file_data, raw_text, ...safe } = contract;
    return safe;
  }

  private initSampleContracts() {
    // 1. Master Cloud Services Agreement
    const msaText = [
      "MASTER SERVICES & CLOUD COMPUTING AGREEMENT",
      "Effective Date: January 15, 2026",
      "Parties: Apex Enterprises Inc. (Client) and Nimbus Cloud Solutions LLC (Provider)",
      "",
      "1. SCOPE OF SERVICES",
      "Provider shall deliver managed cloud infrastructure, database hosting, and 24/7 technical support in accordance with Exhibit A.",
      "",
      "2. FEES AND PAYMENT TERMS",
      "Client shall pay Provider $45,000 billed quarterly in advance. Late payments shall accrue interest at 1.5% per month.",
      "",
      "3. TERM AND TERMINATION",
      "This Agreement shall commence on the Effective Date and continue for a fixed period of three (3) years. Client may not terminate for convenience without paying 100% of the remaining contract value.",
      "",
      "4. INDEMNIFICATION OBLIGATIONS",
      "Client agrees to defend, indemnify, and hold harmless Provider and its officers from all third-party claims, liabilities, damages, and legal fees arising out of any breach of warranty or unauthorized data access.",
      "",
      "5. UNLIMITED LIABILITY CLAUSE",
      "Provider's liability for direct damages shall be strictly capped at $5,000. Conversely, Client's liability for breach of confidentiality or IP misuse shall be completely uncapped and unlimited.",
      "",
      "6. INTELLECTUAL PROPERTY RIGHTS",
      "Provider retains all proprietary rights, title, and interest in and to the cloud platform, underlying algorithms, and any custom modifications developed during the engagement.",
      "",
      "7. DATA PRIVACY & SECURITY BREACH NOTIFICATION",
      "In the event of a security incident or confirmed data breach, Provider shall notify Client within forty-five (45) business days after internal validation.",
      "",
      "8. NON-SOLICITATION AND GOVERNING LAW",
      "Neither party shall solicit the other's employees for twenty-four (24) months post-termination. This Agreement is governed by the laws of the State of Delaware.",
    ];

    const msaBuffer = generateValidContractPdf("Master Services Agreement - Apex & Nimbus", msaText);
    const msaId = "sample_msa_2026";
    
    this.createContract({
      id: msaId,
      filename: "Master_Services_Agreement_2026.pdf",
      file_size: msaBuffer.length,
      file_data: msaBuffer,
      raw_text: msaText.join("\n"),
      page_count: 2,
      extraction_status: 'completed',
      contract_title: "Master Cloud Services & Computing Agreement",
      contract_type: "Master Services Agreement (MSA)",
      effective_date: "January 15, 2026",
      parties: ["Apex Enterprises Inc. (Client)", "Nimbus Cloud Solutions LLC (Provider)"],
      executive_summary: "Comprehensive 3-year managed cloud infrastructure agreement. Contains asymmetrical liability caps heavily favoring the Provider, strict early termination penalties, and broad indemnification requirements for the Client.",
      overall_risk_score: 85,
      overall_risk_level: 'critical',
    });

    this.saveClauses(msaId, [
      {
        clause_title: 'Asymmetrical Limitation of Liability',
        clause_type: 'Limitation of Liability',
        clause_text: "Provider's liability for direct damages shall be strictly capped at $5,000. Conversely, Client's liability for breach of confidentiality or IP misuse shall be completely uncapped and unlimited.",
        risk_level: 'critical',
        risk_score: 95,
        risk_reason: 'Extremely one-sided liability cap ($5,000 max for Provider vs. infinite exposure for Client). Creates severe uninsurable financial exposure.',
        page_number: 1,
        recommendation: 'Negotiate mutual liability cap equal to 12 months of paid fees ($180,000) and introduce standard carve-outs for gross negligence.',
      },
      {
        clause_title: 'Termination for Convenience Penalty',
        clause_type: 'Termination',
        clause_text: 'Agreement shall commence on Effective Date for fixed 3 years. Client may not terminate for convenience without paying 100% of the remaining contract value.',
        risk_level: 'high',
        risk_score: 82,
        risk_reason: 'Forces full acceleration of remaining multi-year contract value upon early termination without vendor obligation to mitigate losses.',
        page_number: 1,
        recommendation: 'Insert 60-day notice termination for convenience clause with liquidated damages capped at 3 months service fees.',
      },
      {
        clause_title: 'One-Way Client Indemnification',
        clause_type: 'Indemnification',
        clause_text: 'Client agrees to defend, indemnify, and hold harmless Provider and its officers from all third-party claims, liabilities, and legal fees arising out of breach of warranty or unauthorized data access.',
        risk_level: 'high',
        risk_score: 78,
        risk_reason: 'Broad indemnity covers data breaches without requiring vendor fault or contributory negligence verification.',
        page_number: 2,
        recommendation: 'Make indemnification strictly mutual, conditioned on prompt written notice, right to control defense, and proportionate fault.',
      },
      {
        clause_title: 'Extended Security Breach Notification Window',
        clause_type: 'Data Privacy & Security',
        clause_text: 'In the event of a security incident or confirmed data breach, Provider shall notify Client within forty-five (45) business days after internal validation.',
        risk_level: 'critical',
        risk_score: 88,
        risk_reason: '45 business days violates statutory requirements under GDPR (72h) and state breach notification rules.',
        page_number: 2,
        recommendation: 'Require notification within 48 to 72 hours of any suspected or confirmed unauthorized access to client data.',
      },
      {
        clause_title: 'Fixed Payment Terms & Late Interest',
        clause_type: 'Payment Terms',
        clause_text: 'Client shall pay Provider $45,000 billed quarterly in advance. Late payments shall accrue interest at 1.5% per month.',
        risk_level: 'low',
        risk_score: 20,
        risk_reason: '1.5% per month interest (18% annualized) is near statutory maximums, but quarterly advance billing is standard.',
        page_number: 1,
        recommendation: 'Propose Net 30 payment terms and cap late fee interest at 1.0% per month.',
      },
      {
        clause_title: 'Non-Solicitation Restrictive Covenant',
        clause_type: 'Restrictive Covenants',
        clause_text: "Neither party shall solicit the other's employees for twenty-four (24) months post-termination.",
        risk_level: 'low',
        risk_score: 15,
        risk_reason: '24-month duration is slightly long for industry standard (typically 12 months), but mutual in structure.',
        page_number: 2,
        recommendation: 'Reduce duration to 12 months and exclude general public job board advertisements.',
      },
    ]);

    // 2. Mutual Non-Disclosure Agreement
    const ndaText = [
      "MUTUAL NON-DISCLOSURE AND PROPRIETARY INFORMATION AGREEMENT",
      "Effective Date: February 1, 2026",
      "Parties: Horizon Biotech Corp. and Vertex Therapeutics Inc.",
      "",
      "1. PURPOSE AND DEFINITION OF CONFIDENTIAL INFORMATION",
      "The parties intend to disclose confidential technical, research, and financial information solely for evaluating a joint oncology drug discovery venture.",
      "",
      "2. OBLIGATIONS OF NON-DISCLOSURE",
      "The Receiving Party shall exercise a degree of care no less than reasonable care to protect the Disclosing Party's Confidential Information against unauthorized disclosure.",
      "",
      "3. DURATION OF RESTRICTIONS",
      "The confidentiality restrictions herein shall survive for a period of seven (7) years from disclosure, except for trade secrets which shall remain protected in perpetuity.",
      "",
      "4. EXCLUSIONS FROM CONFIDENTIALITY",
      "Confidential Information does not include information that is publicly known through no breach, already known to recipient without restriction, or independently developed.",
      "",
      "5. INJUNCTIVE RELIEF AND DISPUTE VENUE",
      "The parties acknowledge that money damages may be inadequate for breach, and Disclosing Party shall be entitled to seek immediate injunctive relief in the courts of New York County.",
    ];

    const ndaBuffer = generateValidContractPdf("Mutual NDA - Horizon & Vertex", ndaText);
    const ndaId = "sample_nda_2026";

    this.createContract({
      id: ndaId,
      filename: "Mutual_NDA_Horizon_Vertex.pdf",
      file_size: ndaBuffer.length,
      file_data: ndaBuffer,
      raw_text: ndaText.join("\n"),
      page_count: 1,
      extraction_status: 'completed',
      contract_title: "Mutual Non-Disclosure & Confidentiality Agreement",
      contract_type: "Non-Disclosure Agreement (NDA)",
      effective_date: "February 1, 2026",
      parties: ["Horizon Biotech Corp.", "Vertex Therapeutics Inc."],
      executive_summary: "Standard bilateral non-disclosure agreement protecting proprietary technical, research, and financial disclosures relating to collaborative oncology evaluation.",
      overall_risk_score: 24,
      overall_risk_level: 'low',
    });

    this.saveClauses(ndaId, [
      {
        clause_title: 'Scope of Confidential Information',
        clause_type: 'Confidentiality',
        clause_text: 'The parties intend to disclose confidential technical, research, and financial information solely for evaluating a joint oncology drug discovery venture.',
        risk_level: 'none',
        risk_score: 5,
        risk_reason: null,
        page_number: 1,
        recommendation: null,
      },
      {
        clause_title: 'Standard of Reasonable Care',
        clause_type: 'Standard of Care',
        clause_text: 'The Receiving Party shall exercise a degree of care no less than reasonable care to protect the Disclosing Party’s Confidential Information against unauthorized disclosure.',
        risk_level: 'low',
        risk_score: 15,
        risk_reason: 'Standard duty of care; balanced and customary.',
        page_number: 1,
        recommendation: null,
      },
      {
        clause_title: 'Extended Confidentiality Duration',
        clause_type: 'Term & Survival',
        clause_text: 'Confidentiality restrictions herein shall survive for a period of seven (7) years from disclosure, except for trade secrets which shall remain protected in perpetuity.',
        risk_level: 'medium',
        risk_score: 45,
        risk_reason: '7-year duration exceeds typical 3-5 year commercial window for biotech collaborations.',
        page_number: 1,
        recommendation: 'Propose reducing general confidentiality term to 3 or 5 years.',
      },
      {
        clause_title: 'Injunctive Relief Entitlement',
        clause_type: 'Remedies',
        clause_text: 'Disclosing Party shall be entitled to seek immediate injunctive relief in the courts of New York County without posting bond.',
        risk_level: 'low',
        risk_score: 20,
        risk_reason: 'Standard injunctive relief provision for confidentiality protection.',
        page_number: 1,
        recommendation: 'Ensure mutual applicability and right to contest merits.',
      },
    ]);

    // 3. SaaS Enterprise License Agreement
    const saasText = [
      "ENTERPRISE SOFTWARE-AS-A-SERVICE (SaaS) SUBSCRIPTION AGREEMENT",
      "Effective Date: March 10, 2026",
      "Parties: Quantum Analytics AI Inc. (Vendor) and Global Retailers Group (Customer)",
      "",
      "1. SUBSCRIPTION GRANT & USAGE LIMITS",
      "Vendor grants Customer a non-exclusive, non-transferable license to access the Predictive Inventory Platform for up to 500 authorized enterprise seats.",
      "",
      "2. SERVICE LEVEL AGREEMENT (SLA) & UPTIME COMMITMENT",
      "Vendor commits to 99.5% monthly uptime. If uptime drops below 98%, Customer's sole remedy is a 5% credit applied to next year's renewal.",
      "",
      "3. AUTOMATIC RENEWAL & PRICE ESCALATION",
      "This agreement automatically renews for consecutive 12-month periods unless Customer provides written cancellation notice at least 90 days prior. Renewal fees increase by 12% annually.",
      "",
      "4. DATA OWNERSHIP & DERIVATIVE AI TRAINING",
      "Customer retains ownership of raw input data. However, Vendor may aggregate, anonymize, and utilize Customer data to train and fine-tune global machine learning models without compensation.",
      "",
      "5. INDEMNIFICATION FOR IP INFRINGEMENT",
      "Vendor will defend Customer against patent or copyright infringement claims arising from the core platform, up to a maximum cap of $100,000.",
    ];

    const saasBuffer = generateValidContractPdf("Enterprise SaaS Agreement - Quantum AI", saasText);
    const saasId = "sample_saas_2026";

    this.createContract({
      id: saasId,
      filename: "Enterprise_SaaS_Agreement.pdf",
      file_size: saasBuffer.length,
      file_data: saasBuffer,
      raw_text: saasText.join("\n"),
      page_count: 2,
      extraction_status: 'completed',
      contract_title: "Enterprise Software-as-a-Service (SaaS) Subscription Agreement",
      contract_type: "Enterprise SaaS Agreement",
      effective_date: "March 10, 2026",
      parties: ["Quantum Analytics AI Inc. (Vendor)", "Global Retailers Group (Customer)"],
      executive_summary: "Commercial subscription agreement granting platform access. Key risks include automatic price escalations, secondary machine learning training on customer data, and capped IP infringement indemnities.",
      overall_risk_score: 68,
      overall_risk_level: 'medium',
    });

    this.saveClauses(saasId, [
      {
        clause_title: 'Secondary AI Model Training on Customer Data',
        clause_type: 'Data Ownership & AI',
        clause_text: 'Vendor may aggregate, anonymize, and utilize Customer data to train and fine-tune global machine learning models without compensation.',
        risk_level: 'high',
        risk_score: 75,
        risk_reason: 'Permits vendor to repurpose proprietary customer workflow and trade data for global algorithmic models.',
        page_number: 1,
        recommendation: 'Include explicit opt-out for AI model training or restrict to local tenant-specific learning only.',
      },
      {
        clause_title: 'Automatic Renewal with 12% Price Escalation',
        clause_type: 'Payment & Renewal',
        clause_text: 'This agreement automatically renews for consecutive 12-month periods unless Customer provides written cancellation notice at least 90 days prior. Renewal fees increase by 12% annually.',
        risk_level: 'medium',
        risk_score: 65,
        risk_reason: '12% annual compounding price hike significantly exceeds inflation and standard SaaS caps (3-5%). 90-day opt-out window is easy to miss.',
        page_number: 1,
        recommendation: 'Cap annual renewal price increase at CPI or maximum 3-5%, and reduce cancellation window to 30 days.',
      },
      {
        clause_title: 'Limited SLA Remedy Structure',
        clause_type: 'Service Level Agreement',
        clause_text: 'Vendor commits to 99.5% monthly uptime. If uptime drops below 98%, Customer’s sole remedy is a 5% credit applied to next year’s renewal.',
        risk_level: 'medium',
        risk_score: 52,
        risk_reason: '5% credit applied only to future renewal gives zero immediate recovery for severe operational outages.',
        page_number: 1,
        recommendation: 'Structure immediate cash credits on current billing cycle and right to terminate if SLA misses 2 consecutive months.',
      },
      {
        clause_title: 'IP Infringement Defense Cap',
        clause_type: 'Indemnification',
        clause_text: 'Vendor will defend Customer against patent or copyright infringement claims arising from the core platform, up to a maximum cap of $100,000.',
        risk_level: 'high',
        risk_score: 74,
        risk_reason: '$100,000 cap is inadequate for defense in federal patent or copyright litigation.',
        page_number: 2,
        recommendation: 'IP indemnity must be uncapped as standard enterprise market practice.',
      },
    ]);
  }
}

export const db = new Database();
