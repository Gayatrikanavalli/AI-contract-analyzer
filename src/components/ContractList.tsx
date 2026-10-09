import React from 'react';
import { Contract, ExtractionStatus, RiskLevel } from '../types';
import { FileText, Clock, AlertTriangle, CheckCircle2, XCircle, Trash2, ArrowRight, Shield } from 'lucide-react';

interface ContractListProps {
  contracts: Contract[];
  selectedContractId: string | null;
  onSelectContract: (id: string) => void;
  onDeleteContract: (id: string, e: React.MouseEvent) => void;
}

export const ContractList: React.FC<ContractListProps> = ({
  contracts,
  selectedContractId,
  onSelectContract,
  onDeleteContract,
}) => {
  const getStatusBadge = (status: ExtractionStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
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
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
            <Clock className="w-3 h-3 mr-1" />
            Queued
          </span>
        );
    }
  };

  const getRiskPill = (level: RiskLevel | null, score: number | null) => {
    if (score === null || !level) return null;
    if (level === 'critical' || level === 'high') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Risk {score}
        </span>
      );
    } else if (level === 'medium') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Risk {score}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border border-green-200">
          <Shield className="w-3 h-3 mr-1" />
          Safe {score}
        </span>
      );
    }
  };

  const analyzedCount = contracts.filter((c) => c.extraction_status === 'completed').length;
  const progressPercent = contracts.length > 0 ? Math.round((analyzedCount / contracts.length) * 100) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Contract Repository</h2>
          <p className="text-xs text-slate-500 font-mono">{contracts.length} documents indexed</p>
        </div>
      </div>

      {/* Contract Items */}
      {contracts.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs">No contracts in repository</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
          {contracts.map((contract) => {
            const isSelected = contract.id === selectedContractId;
            return (
              <div
                key={contract.id}
                id={`contract-item-${contract.id}`}
                onClick={() => onSelectContract(contract.id)}
                className={`interactive-row p-3.5 cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-50 border-l-4 border-indigo-600 shadow-2xs'
                    : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                }`}
              >
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center space-x-1.5 mb-1.5">
                    {getStatusBadge(contract.extraction_status)}
                    {getRiskPill(contract.overall_risk_level, contract.overall_risk_score)}
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 truncate">
                    {contract.contract_title || contract.filename}
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 mt-1">
                    <span className="truncate max-w-[130px]">{contract.filename}</span>
                    <span>·</span>
                    <span>{(contract.file_size / 1024).toFixed(1)} KB</span>
                    <span>·</span>
                    <span>{contract.page_count} pg{contract.page_count > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    id={`delete-btn-${contract.id}`}
                    onClick={(e) => onDeleteContract(contract.id, e)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-white transition-colors"
                    title="Delete contract"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="text-slate-400 pl-1">
                    <ArrowRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Geometric Usage / Status Strip */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80">
        <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
          <span>Analyzed Ratio</span>
          <span className="font-mono text-slate-800">{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
