import React from 'react';
import { Contract } from '../types';
import { Download, Eye, Play, Calendar, Users, FileType, CheckCircle, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';

interface ContractOverviewProps {
  contract: Contract;
  onViewPdf: () => void;
  onDownloadPdf: () => void;
  onReanalyze: () => void;
  isAnalyzing: boolean;
}

export const ContractOverview: React.FC<ContractOverviewProps> = ({
  contract,
  onViewPdf,
  onDownloadPdf,
  onReanalyze,
  isAnalyzing,
}) => {
  const getRiskScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-600 bg-slate-50 border-slate-200';
    if (score >= 70) return 'text-red-700 bg-red-50/80 border-red-200';
    if (score >= 40) return 'text-amber-700 bg-amber-50/80 border-amber-200';
    return 'text-emerald-700 bg-emerald-50/80 border-emerald-200';
  };

  const getRiskLabel = (score: number | null) => {
    if (score === null) return 'Pending Calculation';
    if (score >= 75) return 'Critical Risk Level';
    if (score >= 50) return 'Elevated Risk Level';
    if (score >= 25) return 'Moderate Risk Level';
    return 'Standard / Low Risk';
  };

  return (
    <div className="bg-white border border-indigo-300 rounded-lg p-5 sm:p-6 shadow-xs mb-6">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-indigo-300 pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {contract.contract_title || contract.filename}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
              <FileType className="w-3.5 h-3.5 mr-1 text-slate-500" />
              {contract.contract_type || 'Agreement'}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-500 mt-1.5">
            FILE: {contract.filename} · {(contract.file_size / 1024).toFixed(1)} KB · {contract.page_count} PAGES
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="view-pdf-btn"
            onClick={onViewPdf}
            className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded shadow-2xs hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <Eye className="w-4 h-4 mr-1.5 text-slate-500" />
            Inspect PDF
          </button>

          <button
            id="download-pdf-btn"
            onClick={onDownloadPdf}
            className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded shadow-2xs hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Export PDF
          </button>

          <button
            id="reanalyze-contract-btn"
            onClick={onReanalyze}
            disabled={isAnalyzing || contract.extraction_status === 'processing'}
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded shadow-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
          >
            {isAnalyzing || contract.extraction_status === 'processing' ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                Analyzing Clauses...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                Re-Run Analysis
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contract Metadata & Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-5 border-b border-indigo-300">
        {/* Parties Card */}
        <div className="bg-white p-4 rounded-lg border border-indigo-300">
          <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            Contract Parties
          </div>
          {contract.parties && contract.parties.length > 0 ? (
            <ul className="text-xs text-slate-800 space-y-1.5 font-medium">
              {contract.parties.map((party, idx) => (
                <li key={idx} className="truncate flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-sm shrink-0"></div>
                  <span className="truncate">{party}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-xs text-slate-400 font-mono">Discovered during review</span>
          )}
        </div>

        {/* Effective Date & Status */}
        <div className="bg-white p-4 rounded-lg border border-indigo-300">
          <div className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
            Term & Status
          </div>
          <div className="text-xs font-bold text-slate-900">
            {contract.effective_date || 'Standard Effective Term'}
          </div>
          <div className="mt-2 flex items-center space-x-1.5 text-xs text-slate-600">
            <span className="font-medium">Status:</span>
            {contract.extraction_status === 'completed' ? (
              <span className="text-emerald-700 font-semibold inline-flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Completed
              </span>
            ) : contract.extraction_status === 'processing' ? (
              <span className="text-amber-700 font-semibold inline-flex items-center">
                <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin text-amber-600" />
                Processing
              </span>
            ) : (
              <span className="text-red-700 font-semibold inline-flex items-center">
                <AlertCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
                {contract.error_message || 'Pending'}
              </span>
            )}
          </div>
        </div>

        {/* Risk Score Meter */}
        <div className={`p-4 rounded-lg border flex items-center justify-between ${getRiskScoreColor(contract.overall_risk_score)}`}>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">
              Risk Score
            </div>
            <div className="text-3xl font-black mt-0.5 font-sans">
              {contract.overall_risk_score !== null ? `${contract.overall_risk_score}/100` : '—'}
            </div>
            <div className="text-xs font-bold mt-1">
              {getRiskLabel(contract.overall_risk_score)}
            </div>
          </div>
          <div className="w-13 h-13 rounded border-2 border-current flex items-center justify-center font-bold text-sm bg-white/40">
            {contract.overall_risk_score !== null ? `${contract.overall_risk_score}%` : '—'}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {contract.executive_summary && (
        <div className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
              <ShieldAlert className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Executive Risk Summary
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Gemini 3.6 Flash</span>
          </div>
          <div className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-lg border border-indigo-300">
            {contract.executive_summary}
          </div>
        </div>
      )}
    </div>
  );
};
