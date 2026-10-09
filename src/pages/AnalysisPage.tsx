import React, { useState, useMemo } from 'react';
import { Contract, Clause, RiskLevel, ExtractionStatus } from '../types';
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  RotateCw,
  Search,
  Filter,
  Users,
  Calendar,
  Layers,
  AlertTriangle,
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  Bookmark,
  BookOpen,
  Lightbulb,
  Maximize2,
  Minimize2,
  Clock,
  Trash2,
} from 'lucide-react';

interface AnalysisPageProps {
  contractId: string;
  contract: Contract | null;
  clauses: Clause[];
  isLoading: boolean;
  isAnalyzing: boolean;
  onNavigate: (path: string) => void;
  onViewPdf: () => void;
  onDownloadPdf: () => void;
  onReanalyze: () => void;
  onDeleteContract?: (contract: Contract) => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  contract,
  clauses,
  isLoading,
  isAnalyzing,
  onNavigate,
  onViewPdf,
  onDownloadPdf,
  onReanalyze,
  onDeleteContract,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedClauseIds, setExpandedClauseIds] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState<boolean>(true);

  // Initialize all clauses expanded on load
  React.useEffect(() => {
    const ids = new Set<string>();
    clauses.forEach((c, idx) => ids.add(c.id || `clause_${idx}`));
    setExpandedClauseIds(ids);
    setAllExpanded(true);
  }, [clauses]);

  // Extract unique clause types
  const clauseTypes = useMemo(() => {
    const set = new Set<string>();
    clauses.forEach((c) => {
      if (c.clause_type) set.add(c.clause_type);
    });
    return Array.from(set).sort();
  }, [clauses]);

  // Filter clauses based on search and filters
  const filteredClauses = useMemo(() => {
    return clauses.filter((clause) => {
      if (selectedRisk !== 'all' && clause.risk_level !== selectedRisk) {
        return false;
      }
      if (selectedType !== 'all' && clause.clause_type !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = (clause.clause_title || '').toLowerCase().includes(query);
        const inType = (clause.clause_type || '').toLowerCase().includes(query);
        const inText = (clause.clause_text || '').toLowerCase().includes(query);
        const inReason = (clause.risk_reason || '').toLowerCase().includes(query);
        const inRec = (clause.recommendation || '').toLowerCase().includes(query);
        if (!inTitle && !inType && !inText && !inReason && !inRec) {
          return false;
        }
      }
      return true;
    });
  }, [clauses, selectedRisk, selectedType, searchQuery]);

  // Risk counts
  const riskCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, none: 0 };
    clauses.forEach((c) => {
      const lvl = (c.risk_level || 'low') as RiskLevel;
      if (lvl in counts) counts[lvl]++;
    });
    return counts;
  }, [clauses]);

  const toggleClauseExpand = (id: string) => {
    setExpandedClauseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (allExpanded) {
      setExpandedClauseIds(new Set());
      setAllExpanded(false);
    } else {
      const ids = new Set<string>();
      clauses.forEach((c, idx) => ids.add(c.id || `clause_${idx}`));
      setExpandedClauseIds(ids);
      setAllExpanded(true);
    }
  };

  const getRiskBadge = (level: RiskLevel, score?: number | null) => {
    switch (level) {
      case 'critical':
        return (
          <div className="flex items-center space-x-1.5">
            <span className="px-2.5 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold uppercase tracking-wider rounded border border-red-200 flex items-center">
              <AlertOctagon className="w-3 h-3 mr-1 text-red-600" />
              Critical
            </span>
            {score !== undefined && score !== null && (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-mono font-bold rounded border border-red-200">
                Score {score}
              </span>
            )}
          </div>
        );
      case 'high':
        return (
          <div className="flex items-center space-x-1.5">
            <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded border border-red-200 flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />
              High Risk
            </span>
            {score !== undefined && score !== null && (
              <span className="px-2 py-0.5 bg-red-50 text-red-700 text-xs font-mono font-bold rounded border border-red-200">
                Score {score}
              </span>
            )}
          </div>
        );
      case 'medium':
        return (
          <div className="flex items-center space-x-1.5">
            <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-200 flex items-center">
              <ShieldAlert className="w-3 h-3 mr-1 text-amber-600" />
              Medium Risk
            </span>
            {score !== undefined && score !== null && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-xs font-mono font-bold rounded border border-amber-200">
                Score {score}
              </span>
            )}
          </div>
        );
      case 'low':
      case 'none':
      default:
        return (
          <div className="flex items-center space-x-1.5">
            <span className="px-2.5 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold uppercase tracking-wider rounded border border-green-200 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-1 text-green-600" />
              Standard
            </span>
            {score !== undefined && score !== null && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-mono font-bold rounded border border-green-200">
                Score {score}
              </span>
            )}
          </div>
        );
    }
  };

  const getStatusBadge = (status?: ExtractionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
            Analyzed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3 mr-1 animate-spin" />
            Analyzing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
            Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            Queued
          </span>
        );
    }
  };

  if (isLoading && !contract) {
    return (
      <div className="bg-white border border-indigo-200 rounded-lg p-16 text-center text-slate-400">
        <Clock className="w-8 h-8 mx-auto animate-spin text-indigo-600 mb-3" />
        <p className="text-xs font-medium text-slate-600">Loading contract analysis...</p>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="bg-white border border-indigo-200 rounded-lg p-12 text-center text-slate-500">
        <FileText className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <h3 className="text-sm font-bold text-slate-800">Contract Not Found</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          The requested contract could not be found or may have been deleted.
        </p>
        <button
          onClick={() => onNavigate('/contracts')}
          className="mt-4 inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Contracts
        </button>
      </div>
    );
  }

  const overallScore = contract.overall_risk_score ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('/contracts')}
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          Back to Contracts
        </button>

        {/* Action Buttons: Inspect, Download, Re-run */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onViewPdf}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Inspect PDF
          </button>

          <button
            onClick={onDownloadPdf}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded shadow-2xs hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Download PDF
          </button>

          <button
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded shadow-2xs hover:bg-indigo-100 hover:border-indigo-300 transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isAnalyzing ? 'animate-spin text-indigo-600' : 'text-indigo-500'}`} />
            {isAnalyzing ? 'Analyzing...' : 'Re-run Analysis'}
          </button>

          {onDeleteContract && (
            <button
              onClick={() => onDeleteContract(contract)}
              title="Delete this contract"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded shadow-2xs hover:bg-red-100 hover:border-red-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 text-red-500" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Contract Metadata & Overview Card */}
      <div className="bg-white border border-indigo-300 rounded-lg p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          {/* Main Title & Type */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-200">
                {contract.contract_type || 'Commercial Agreement'}
              </span>
              {getStatusBadge(contract.extraction_status)}
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              {contract.contract_title || contract.filename}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-500">
              <span className="truncate max-w-sm">File: {contract.filename}</span>
              <span>·</span>
              <span>{contract.page_count} Pages</span>
              <span>·</span>
              <span>{(contract.file_size / 1024).toFixed(1)} KB</span>
              {contract.effective_date && (
                <>
                  <span>·</span>
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                    Term: {contract.effective_date}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Overall Risk Score Meter */}
          <div className="flex items-center space-x-4 bg-white border border-indigo-300 rounded-lg p-3.5 sm:px-5 shrink-0">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Overall Risk Score
              </div>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className={`text-2xl font-black font-sans ${
                  overallScore >= 70 ? 'text-red-700' : overallScore >= 40 ? 'text-amber-700' : 'text-emerald-700'
                }`}>
                  {contract.overall_risk_score !== null ? contract.overall_risk_score : '—'}
                </span>
                <span className="text-xs font-mono text-slate-400">/ 100</span>
              </div>
            </div>

            <div className="pl-3 border-l border-slate-200">
              {contract.overall_risk_level === 'critical' || contract.overall_risk_level === 'high' ? (
                <span className="px-2.5 py-1 bg-red-100 text-red-800 text-[11px] font-bold uppercase tracking-wider rounded border border-red-200 block text-center">
                  High Risk
                </span>
              ) : contract.overall_risk_level === 'medium' ? (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold uppercase tracking-wider rounded border border-amber-200 block text-center">
                  Medium Risk
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-green-100 text-green-800 text-[11px] font-bold uppercase tracking-wider rounded border border-green-200 block text-center">
                  Standard
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Identified Contracting Parties */}
        {contract.parties && contract.parties.length > 0 && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Contracting Parties
            </span>
            <div className="flex flex-wrap gap-2">
              {contract.parties.map((party, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-slate-100 text-slate-800 rounded text-xs font-medium border border-slate-200"
                >
                  {party}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Executive Summary */}
        {contract.executive_summary && (
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Executive Risk Briefing
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white border border-indigo-300 rounded p-3.5 font-serif">
              {contract.executive_summary}
            </p>
          </div>
        )}
      </div>

      {/* Risk Summary Filter Pills / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedRisk('all')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedRisk === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">All Clauses</div>
          <div className="text-xl font-black mt-0.5 font-sans">{clauses.length}</div>
        </button>

        <button
          onClick={() => setSelectedRisk('critical')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedRisk === 'critical'
              ? 'bg-red-700 text-white border-red-700 shadow-xs'
              : 'bg-red-50/70 text-red-800 border-red-200 hover:bg-red-100/70'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Critical</div>
          <div className="text-xl font-black mt-0.5 font-sans">{riskCounts.critical}</div>
        </button>

        <button
          onClick={() => setSelectedRisk('high')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedRisk === 'high'
              ? 'bg-red-600 text-white border-red-600 shadow-xs'
              : 'bg-red-50/50 text-red-700 border-red-200 hover:bg-red-100/60'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">High Risk</div>
          <div className="text-xl font-black mt-0.5 font-sans">{riskCounts.high}</div>
        </button>

        <button
          onClick={() => setSelectedRisk('medium')}
          className={`p-3 rounded-lg border text-left transition-all ${
            selectedRisk === 'medium'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100/70'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Medium Risk</div>
          <div className="text-xl font-black mt-0.5 font-sans">{riskCounts.medium}</div>
        </button>

        <button
          onClick={() => setSelectedRisk('low')}
          className={`p-3 rounded-lg border text-left transition-all col-span-2 sm:col-span-1 ${
            selectedRisk === 'low'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-green-50/60 text-green-800 border-green-200 hover:bg-green-100/70'
          }`}
        >
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Standard</div>
          <div className="text-xl font-black mt-0.5 font-sans">{riskCounts.low + riskCounts.none}</div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-indigo-300 rounded-lg p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search clause text, risk reason, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Clause Type Dropdown & Expand Toggle */}
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 font-medium"
            >
              <option value="all">All Clause Types ({clauses.length})</option>
              {clauseTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleToggleAll}
            className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded hover:bg-slate-100 transition-colors shrink-0"
            title={allExpanded ? 'Collapse all clauses' : 'Expand all clauses'}
          >
            {allExpanded ? (
              <>
                <Minimize2 className="w-3 h-3 mr-1 text-slate-500" />
                Collapse All
              </>
            ) : (
              <>
                <Maximize2 className="w-3 h-3 mr-1 text-slate-500" />
                Expand All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Processing or Queued Live Status Banner */}
      {(contract.extraction_status === 'processing' || contract.extraction_status === 'pending') && (
        <div className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-5 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 mb-1">
            <RotateCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-indigo-950">AI Contract Clause & Risk Analysis In Progress</h3>
            <p className="text-xs text-indigo-700 mt-1 max-w-lg mx-auto">
              Gemini AI is currently extracting clauses (termination, liability caps, payment terms, confidentiality, auto-renewal), scoring risk levels, and generating redline guidance. Results will update automatically in real-time.
            </p>
          </div>
          <div className="w-48 mx-auto bg-indigo-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full animate-pulse w-3/4"></div>
          </div>
        </div>
      )}

      {/* Failed Status Banner */}
      {contract.extraction_status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 mb-1">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-950">Analysis Failed</h3>
            <p className="text-xs text-red-700 mt-1 max-w-lg mx-auto">
              {contract.error_message || 'The AI extraction worker encountered an issue analyzing this document.'}
            </p>
          </div>
          <button
            onClick={onReanalyze}
            disabled={isAnalyzing}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 transition-colors shadow-2xs"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Retrying Analysis...' : 'Retry Contract Analysis'}
          </button>
        </div>
      )}

      {/* Analyzed Clauses Explorer */}
      {filteredClauses.length === 0 ? (
        <div className="bg-white border border-indigo-300 rounded-lg p-10 text-center text-slate-500">
          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <h3 className="text-xs font-bold text-slate-800">
            {contract.extraction_status === 'completed' ? 'No Clauses Matching Filter' : 'No Clauses Available Yet'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {contract.extraction_status === 'completed'
              ? 'Adjust search query or filter selection to view parsed clauses.'
              : 'Clauses will appear once the analysis worker completes parsing.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClauses.map((clause, idx) => {
            const clauseId = clause.id || `clause_${idx}`;
            const isExpanded = expandedClauseIds.has(clauseId);
            const hasRiskReason = clause.risk_reason && clause.risk_reason.trim().length > 0;
            const hasRecommendation = clause.recommendation && clause.recommendation.trim().length > 0;

            return (
              <div
                key={clauseId}
                id={`clause-card-${clauseId}`}
                className="border border-indigo-300 rounded-lg bg-white shadow-xs overflow-hidden transition-all duration-150"
              >
                {/* Expandable Clause Header */}
                <div
                  onClick={() => toggleClauseExpand(clauseId)}
                  className="p-3.5 sm:p-4 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 transition-colors"
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <span className="text-xs font-mono font-bold text-slate-400 shrink-0">
                      #{idx + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {clause.clause_title}
                        </h3>

                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200/80 text-slate-700">
                          <Bookmark className="w-3 h-3 mr-1 text-slate-500" />
                          {clause.clause_type}
                        </span>

                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono text-slate-500 bg-white border border-slate-200">
                          <BookOpen className="w-3 h-3 mr-1 text-slate-400" />
                          {clause.page_number !== null ? `Page ${clause.page_number}` : 'Doc Excerpt'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    {getRiskBadge(clause.risk_level, clause.risk_score)}
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-3 bg-white">
                    {/* Clause Excerpt Box */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Extracted Clause Text
                      </span>
                      <div className="bg-white border border-indigo-300 rounded p-3 text-xs text-slate-800 font-serif leading-relaxed">
                        "{clause.clause_text}"
                      </div>
                    </div>

                    {/* Risk Reason */}
                    {hasRiskReason && (
                      <div className="p-3 rounded bg-white border border-indigo-300 text-xs flex items-start space-x-2 text-red-900">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block mb-0.5 text-red-900">Risk Reason:</strong>
                          <span className="leading-relaxed text-slate-700">{clause.risk_reason}</span>
                        </div>
                      </div>
                    )}

                    {/* Actionable Recommendation */}
                    {hasRecommendation && (
                      <div className="p-3 rounded bg-white border border-indigo-300 text-xs flex items-start space-x-2 text-indigo-950">
                        <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block mb-0.5 text-indigo-900">Recommendation:</strong>
                          <span className="leading-relaxed text-slate-700">{clause.recommendation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Assisted Analysis Disclaimer */}
      <div className="pt-4 text-center">
        <p className="text-[11px] font-medium text-slate-400">
          Disclaimer: AI-assisted analysis is for informational and triage purposes only and does not constitute formal legal advice.
        </p>
      </div>
    </div>
  );
};
