import React, { useState, useRef } from 'react';
import { UploadCloud, FileUp, Sparkles, AlertCircle, FileCheck2, X } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File) => Promise<boolean>;
  onSelectSample: (contractId: string) => Promise<void>;
  isUploading: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadFile,
  onSelectSample,
  isUploading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setErrorMessage(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 30 * 1024 * 1024) {
        setErrorMessage('File too large. Maximum supported size is 30MB.');
        return;
      }
      if (await onUploadFile(file)) onClose();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 30 * 1024 * 1024) {
        setErrorMessage('File too large. Maximum supported size is 30MB.');
        return;
      }
      const uploaded = await onUploadFile(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (uploaded) onClose();
    }
  };

  const handleSampleClick = async (sampleId: string) => {
    await onSelectSample(sampleId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-bold text-slate-900">Upload Contract PDF</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a legal contract for AI clause extraction & risk scoring
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Dropzone */}
          <div
            id="modal-dropzone-area"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
              isDragOver
                ? 'border-[#6D5FE8] bg-indigo-50/80 shadow-inner'
                : 'border-indigo-200/90 bg-indigo-50/30 hover:bg-indigo-50/60 hover:border-[#6D5FE8]'
            } ${isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />

            <div className="w-12 h-12 bg-indigo-100/90 text-[#6D5FE8] rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
              {isUploading ? (
                <FileUp className="w-6 h-6 animate-bounce text-[#6D5FE8]" />
              ) : (
                <UploadCloud className="w-6 h-6 text-[#6D5FE8]" />
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-900">
              {isUploading ? 'Uploading & Analyzing Contract...' : 'Choose a PDF file or drag it here'}
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-sm">
              Standard legal agreements, NDAs, MSAs, vendor contracts, or terms of service (Max 30MB).
            </p>

            <button
              type="button"
              disabled={isUploading}
              className="interactive-button mt-4 px-4 py-2 bg-[#6D5FE8] hover:bg-[#5B4DE0] text-white text-xs font-semibold rounded-xl shadow-md disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              Browse PDF File
            </button>
          </div>

          {errorMessage && (
            <div className="flex items-center space-x-2 text-xs font-medium text-rose-800 bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Preloaded Samples */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-[#6D5FE8]" />
                Or Try A Preloaded Sample Contract
              </span>
              <span className="text-[11px] font-mono text-slate-400">Instant test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleSampleClick('sample_msa_2026')}
                disabled={isUploading}
                className="interactive-card text-left p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/50 hover:bg-rose-50 hover:border-rose-300 group shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <FileCheck2 className="w-4 h-4 text-rose-600" />
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded-full border border-rose-200">
                    High Risk
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#6D5FE8] truncate">
                  Master Services
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">8 Clauses · 2 pgs</div>
              </button>

              <button
                type="button"
                onClick={() => handleSampleClick('sample_nda_2026')}
                disabled={isUploading}
                className="interactive-card text-left p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 group shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
                    Standard
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#6D5FE8] truncate">
                  Mutual NDA
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">5 Clauses · 1 pg</div>
              </button>

              <button
                type="button"
                onClick={() => handleSampleClick('sample_saas_2026')}
                disabled={isUploading}
                className="interactive-card text-left p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 group shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    Medium
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-[#6D5FE8] truncate">
                  Enterprise SaaS
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">5 Clauses · 2 pgs</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
