import React, { useState, useMemo } from 'react';
import { Clause, RiskLevel } from '../types';
import {
  AlertTriangle,
  Search,
  Filter,
  Bookmark,
  BookOpen,
  Lightbulb,
  FileText,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  ShieldCheck,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';

interface ClausesExplorerProps {
  clauses: Clause[];
  contractId: string;
}

export const ClausesExplorer: React.FC<ClausesExplorerProps> = ({ clauses }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedClauseIds, setExpandedClauseIds] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState<boolean>(true);

  // Initialize all clauses expanded on mount or clause change
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

  // Filter clauses
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
        const inTitle = clause.clause_title.toLowerCase().includes(query);
        const inType = clause.clause_type.toLowerCase().includes(query);
        const inText = clause.clause_text.toLowerCase().includes(query);
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

  return (
    <div className="space-y-4">
      {/* Summary Cards Row */}
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

      {/* Filter & Search Bar with Expand/Collapse All */}
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

      {/* Clauses Cards List */}
      {filteredClauses.length === 0 ? (
        <div className="bg-white border border-indigo-300 rounded-lg p-10 text-center text-slate-500">
          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <h3 className="text-xs font-bold text-slate-800">No Clauses Matching Filter</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Adjust search query or filter selection to view parsed clauses.
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

                    <div className="text-slate-400 hover:text-slate-600 pl-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
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
      <div className="pt-2 text-center">
        <p className="text-[11px] font-medium text-slate-400">
          Disclaimer: AI-assisted analysis is for informational and workflow efficiency purposes only and does not constitute formal legal advice.
        </p>
      </div>
    </div>
  );
};
