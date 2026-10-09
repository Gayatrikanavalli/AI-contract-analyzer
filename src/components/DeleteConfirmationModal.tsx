import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Contract } from '../types';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  contract: Contract | null;
  onClose: () => void;
  onConfirm: (contractId: string) => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  contract,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !contract) return null;

  const handleConfirm = async () => {
    await onConfirm(contract.id);
  };

  return (
    <div
      id="delete-confirmation-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Delete Contract</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete this contract from the repository? This action will permanently remove the contract and all extracted clauses and risk scores.
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
            <div className="font-bold text-slate-900 truncate">
              {contract.contract_title || contract.filename}
            </div>
            <div className="text-[11px] font-mono text-slate-500 truncate">
              {contract.filename} · {(contract.file_size / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5">
          <button
            id="cancel-delete-btn"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-2xs"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-btn"
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="inline-flex items-center px-4 py-1.5 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 transition-colors disabled:opacity-50 shadow-xs"
          >
            <Trash2 className={`w-3.5 h-3.5 mr-1.5 ${isDeleting ? 'animate-pulse' : ''}`} />
            {isDeleting ? 'Deleting...' : 'Delete Contract'}
          </button>
        </div>
      </div>
    </div>
  );
};
