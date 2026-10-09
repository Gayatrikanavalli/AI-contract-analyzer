import React from 'react';
import { Contract, ExtractionStatus, RiskLevel } from '../types';
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Shield,
  UploadCloud,
  Trash2,
  Layers,
} from 'lucide-react';

interface DashboardPageProps {
  contracts: Contract[];
  onNavigate: (path: string) => void;
  onOpenUpload: () => void;
  onDeleteContract?: (contract: Contract, e: React.MouseEvent) => void;
  isLoading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  contracts,
  onNavigate,
  onOpenUpload,
  onDeleteContract,
  isLoading,
}) => {
  // Calculate metrics
  const totalContracts = contracts.length;
  const analyzedContracts = contracts.filter((c) => c.extraction_status === 'completed').length;
  const pendingContracts = contracts.filter(
    (c) => c.extraction_status === 'pending' || c.extraction_status === 'processing'
  ).length;
  const highRiskContracts = contracts.filter(
    (c) => c.overall_risk_level === 'critical' || c.overall_risk_level === 'high'
  ).length;

  // Recent contracts (up to 5 most recent)
  const recentContracts = [...contracts]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 5);

  const getStatusBadge = (status: ExtractionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Analyzed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <Clock className="w-3 h-3 mr-1 text-amber-600 animate-spin" />
            Analyzing
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
            Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 mr-1 text-slate-500" />
            Queued
          </span>
        );
    }
  };

  const getRiskBadge = (level: RiskLevel | null, score: number | null) => {
    if (score === null || !level) {
      return <span className="text-xs font-mono text-slate-400">—</span>;
    }
    if (level === 'critical' || level === 'high') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
          <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
          High ({score})
        </span>
      );
    }
    if (level === 'medium') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
          Medium ({score})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
        <Shield className="w-3 h-3 mr-1 text-emerald-600" />
        Standard ({score})
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
      {/* Header section with page title & vibrant action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Contract Overview Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Summary metrics and recent contract risk assessments
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="dashboard-upload-contract-btn"
            onClick={onOpenUpload}
            className="interactive-button inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#6D5FE8] hover:bg-[#5B4DE0] rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-[#6D5FE8] focus:ring-offset-2 shrink-0 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-white" />
            <span>Upload Contract PDF</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards - Distinct Soft Pastel Background Tints */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Contracts (Soft Pastel Teal) */}
        <div className="interactive-card bg-[#E6F4F1] border border-teal-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
              Total Contracts
            </span>
            <div className="w-8 h-8 rounded-xl bg-teal-100/90 border border-teal-300/80 flex items-center justify-center text-teal-700 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-sans">
            {isLoading ? '...' : totalContracts}
          </div>
          <div className="text-[11px] text-teal-800 font-medium mt-1">Indexed in repository</div>
        </div>

        {/* Card 2: Analyzed Contracts (Soft Pastel Green) */}
        <div className="interactive-card bg-[#E8F8EE] border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Analyzed Contracts
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/90 border border-emerald-300/80 flex items-center justify-center text-emerald-700 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-sans">
            {isLoading ? '...' : analyzedContracts}
          </div>
          <div className="text-[11px] text-emerald-800 font-medium mt-1">
            {totalContracts > 0 ? `${Math.round((analyzedContracts / totalContracts) * 100)}% analyzed` : 'None indexed'}
          </div>
        </div>

        {/* Card 3: Pending Contracts (Soft Pastel Amber) */}
        <div className="interactive-card bg-[#FFF8E6] border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Pending Contracts
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100/90 border border-amber-300/80 flex items-center justify-center text-amber-700 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-sans">
            {isLoading ? '...' : pendingContracts}
          </div>
          <div className="text-[11px] text-amber-800 font-medium mt-1">Queued or analyzing</div>
        </div>

        {/* Card 4: High Risk Contracts (Soft Pastel Coral) */}
        <div className="interactive-card bg-[#FFF0ED] border border-rose-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              High Risk Contracts
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100/90 border border-rose-300/80 flex items-center justify-center text-rose-700 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-sans">
            {isLoading ? '...' : highRiskContracts}
          </div>
          <div className="text-[11px] text-rose-800 font-medium mt-1">Critical or high liability</div>
        </div>
      </div>

      {/* Recent Contracts Section Panel (Subtle Light Blue/Gray Outer Border) */}
      <div className="bg-[#F6F5FF] border border-slate-300 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-indigo-100/90 flex items-center justify-between bg-indigo-50/70">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Contracts</h2>
            <p className="text-xs text-slate-500">Most recently indexed legal agreements</p>
          </div>

          <button
            onClick={() => onNavigate('/contracts')}
            className="interactive-link inline-flex items-center text-xs font-semibold text-[#6D5FE8] hover:text-[#5B4DE0]"
          >
            View All Contracts
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        {recentContracts.length === 0 ? (
          <div className="p-12 text-center bg-indigo-50/30 m-4 rounded-xl border border-dashed border-indigo-200">
            <div className="w-12 h-12 bg-indigo-100 text-[#6D5FE8] rounded-full mx-auto flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No contracts uploaded yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Upload your first contract PDF or pick a sample agreement to begin clause & risk analysis.
            </p>
            <button
              onClick={onOpenUpload}
              className="interactive-button mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#6D5FE8] hover:bg-[#5B4DE0] rounded-lg shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Upload PDF
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-indigo-100/80 bg-indigo-50/40 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Contract Name</th>
                  <th className="py-3.5 px-4">Uploaded</th>
                  <th className="py-3.5 px-4">Pages</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {recentContracts.map((contract, index) => (
                  <tr
                    key={contract.id}
                    onClick={() => onNavigate(`/contracts/${contract.id}`)}
                    className={`interactive-row ${
                      index % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                    } hover:bg-indigo-50/40 cursor-pointer`}
                  >
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-bold text-slate-900 hover:text-[#6D5FE8] transition-colors">
                        {contract.contract_title || contract.filename}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-md">
                        {contract.filename}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(contract.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {contract.page_count} pg{contract.page_count > 1 ? 's' : ''}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getStatusBadge(contract.extraction_status)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getRiskBadge(contract.overall_risk_level, contract.overall_risk_score)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        {onDeleteContract && (
                          <button
                            onClick={(e) => onDeleteContract(contract, e)}
                            title="Delete contract"
                            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate(`/contracts/${contract.id}`)}
                          className="interactive-link inline-flex items-center text-xs font-semibold text-[#6D5FE8] hover:text-[#5B4DE0] group/btn"
                        >
                          <span>View Analysis</span>
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[#6D5FE8] group-hover/btn:bg-indigo-100 ml-1 transition-colors">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
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
