import React, { useState, useMemo } from 'react';
import { Contract, ExtractionStatus, RiskLevel } from '../types';
import {
  FileText,
  Search,
  Trash2,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Shield,
  RotateCw,
  UploadCloud,
  Filter,
} from 'lucide-react';

interface ContractsPageProps {
  contracts: Contract[];
  onNavigate: (path: string) => void;
  onOpenUpload: () => void;
  onDeleteContract: (contract: Contract, e: React.MouseEvent) => void;
  onReanalyzeContract: (id: string, e: React.MouseEvent) => void;
  isLoading: boolean;
}

export const ContractsPage: React.FC<ContractsPageProps> = ({
  contracts,
  onNavigate,
  onOpenUpload,
  onDeleteContract,
  onReanalyzeContract,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (statusFilter !== 'all' && c.extraction_status !== statusFilter) {
        return false;
      }
      if (riskFilter !== 'all') {
        if (riskFilter === 'high' && c.overall_risk_level !== 'critical' && c.overall_risk_level !== 'high') {
          return false;
        }
        if (riskFilter === 'medium' && c.overall_risk_level !== 'medium') {
          return false;
        }
        if (riskFilter === 'low' && c.overall_risk_level !== 'low' && c.overall_risk_level !== 'none') {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inFilename = c.filename.toLowerCase().includes(q);
        const inTitle = (c.contract_title || '').toLowerCase().includes(q);
        const inType = (c.contract_type || '').toLowerCase().includes(q);
        const inParties = (c.parties || []).some((p) => p.toLowerCase().includes(q));
        if (!inFilename && !inTitle && !inType && !inParties) {
          return false;
        }
      }
      return true;
    });
  }, [contracts, searchQuery, statusFilter, riskFilter]);

  const getStatusBadge = (status: ExtractionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Analyzed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3 mr-1 text-amber-600 animate-spin" />
            Analyzing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 mr-1 text-slate-500" />
            Queued
          </span>
        );
    }
  };

  const getRiskBadge = (level: RiskLevel | null) => {
    if (!level) return <span className="text-xs font-mono text-slate-400">—</span>;
    if (level === 'critical' || level === 'high') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
          High Risk
        </span>
      );
    }
    if (level === 'medium') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
        <Shield className="w-3 h-3 mr-1 text-emerald-600" />
        Standard
      </span>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Contract Repository</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage legal documents, view clause extraction progress, and access detailed analysis
          </p>
        </div>

        <button
          id="upload-contract-btn"
          onClick={onOpenUpload}
          className="interactive-button inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#6D5FE8] hover:bg-[#5B4DE0] rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-[#6D5FE8] focus:ring-offset-2 shrink-0 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4 text-white" />
          <span>Upload Contract PDF</span>
        </button>
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="bg-[#F6F5FF] border border-indigo-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Bar - Rounded Pill Shape with Light Tint */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6D5FE8]" />
          <input
            id="contracts-search-input"
            type="text"
            placeholder="Search by contract name, filename, parties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-indigo-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#6D5FE8] focus:border-transparent transition-all text-slate-800 placeholder:text-slate-400 shadow-2xs"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="flex items-center text-xs font-semibold text-indigo-950 mr-1 hidden md:flex">
            <Filter className="w-3.5 h-3.5 mr-1 text-[#6D5FE8]" />
            Filter:
          </div>
          <select
            id="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-200 text-indigo-950 font-semibold rounded-full px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#6D5FE8] shadow-2xs cursor-pointer transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Analyzed</option>
            <option value="processing">Analyzing</option>
            <option value="pending">Queued</option>
            <option value="failed">Failed</option>
          </select>

          <select
            id="risk-filter-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs bg-indigo-50/80 hover:bg-indigo-100/70 border border-indigo-200 text-indigo-950 font-semibold rounded-full px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#6D5FE8] shadow-2xs cursor-pointer transition-colors"
          >
            <option value="all">All Risk Tiers</option>
            <option value="high">High Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="low">Standard</option>
          </select>
        </div>
      </div>

      {/* Contracts Table / List Panel (Soft Tinted Container) */}
      <div className="bg-[#F6F5FF] border border-indigo-200/90 rounded-2xl shadow-sm overflow-hidden">
        {filteredContracts.length === 0 ? (
          <div className="p-12 text-center bg-indigo-50/30 m-4 rounded-xl border border-dashed border-indigo-200">
            <div className="w-12 h-12 bg-indigo-100 text-[#6D5FE8] rounded-full mx-auto flex items-center justify-center mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No contracts found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || riskFilter !== 'all'
                ? 'Try adjusting your search query or status filters.'
                : 'Upload a contract PDF to get started with automated AI analysis.'}
            </p>
            {!searchQuery && statusFilter === 'all' && riskFilter === 'all' && (
              <button
                onClick={onOpenUpload}
                className="interactive-button mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6D5FE8] hover:bg-[#5B4DE0] rounded-lg shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Contract PDF
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-indigo-100/90 bg-indigo-50/50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Contract & Filename</th>
                  <th className="py-3.5 px-4">Pages</th>
                  <th className="py-3.5 px-4">Upload Date</th>
                  <th className="py-3.5 px-4">Analysis Status</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4">Risk Score</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredContracts.map((contract, index) => (
                  <tr
                    key={contract.id}
                    onClick={() => onNavigate(`/contracts/${contract.id}`)}
                    className={`interactive-row ${
                      index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                    } hover:bg-indigo-50/40 cursor-pointer group`}
                  >
                    {/* Filename & Contract Title */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-slate-900 group-hover:text-[#6D5FE8] transition-colors">
                        {contract.contract_title || contract.filename}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                        {contract.filename} · {(contract.file_size / 1024).toFixed(1)} KB
                      </div>
                    </td>

                    {/* Pages */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {contract.page_count} pg{contract.page_count > 1 ? 's' : ''}
                    </td>

                    {/* Upload Date */}
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(contract.created_at)}
                    </td>

                    {/* Analysis Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {getStatusBadge(contract.extraction_status)}
                        {contract.extraction_status === 'failed' && contract.error_message && (
                          <div className="max-w-xs whitespace-normal text-[11px] text-rose-700" title={contract.error_message}>
                            {contract.error_message}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Risk Level */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getRiskBadge(contract.overall_risk_level)}
                    </td>

                    {/* Risk Score */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                      {contract.overall_risk_score !== null ? (
                        <span className="font-bold text-slate-900">
                          {contract.overall_risk_score} / 100
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => onReanalyzeContract(contract.id, e)}
                          title="Re-run Analysis"
                          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-[#6D5FE8] hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteContract && (
                          <button
                            onClick={(e) => onDeleteContract(contract, e)}
                            title="Delete contract"
                            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate(`/contracts/${contract.id}`)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[#6D5FE8] hover:text-[#5B4DE0] hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="View detailed analysis"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
