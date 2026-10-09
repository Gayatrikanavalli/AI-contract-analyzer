import React, { useState, useRef } from 'react';
import { UploadCloud, FileUp, Sparkles, AlertCircle, FileCheck2 } from 'lucide-react';

interface UploadZoneProps {
  onUploadFile: (file: File) => Promise<boolean>;
  onSelectSample: (contractId: string) => Promise<void>;
  isUploading: boolean;
}

const MAX_UPLOAD_SIZE = 30 * 1024 * 1024;

export const UploadZone: React.FC<UploadZoneProps> = ({
  onUploadFile,
  onSelectSample,
  isUploading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (file.size > MAX_UPLOAD_SIZE) {
        setErrorMessage('File too large. Maximum supported size is 30MB.');
        return;
      }
      await onUploadFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > MAX_UPLOAD_SIZE) {
        setErrorMessage('File too large. Maximum supported size is 30MB.');
        return;
      }
      await onUploadFile(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs mb-6">
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Upload Box */}
        <div
          id="dropzone-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 border-2 border-dashed rounded-lg p-6 flex flex-col sm:flex-row items-center gap-4 cursor-pointer transition-all duration-150 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/60'
              : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/50 hover:border-indigo-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="contract-pdf-input"
          />

          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 text-indigo-600 shadow-2xs">
            {isUploading ? (
              <FileUp className="w-6 h-6 animate-bounce text-indigo-600" />
            ) : (
              <UploadCloud className="w-6 h-6 text-indigo-600" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-slate-900">
              {isUploading ? 'Analyzing Contract Document...' : 'Upload Contract Document (PDF)'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Drag & drop legal agreement or <span className="text-indigo-600 font-semibold underline underline-offset-2">browse files</span> for automated clause extraction.
            </p>
            <span className="text-[11px] font-mono text-slate-400 mt-1.5 block">
              Max size 30MB · Standard PDF formatting
            </span>
          </div>

          <button
            type="button"
            className="interactive-button hidden sm:inline-flex items-center px-3.5 py-2 bg-indigo-600 text-white text-xs font-semibold rounded shadow-xs hover:bg-indigo-700 shrink-0"
          >
            Select PDF
          </button>
        </div>

        {/* Quick Test Samples */}
        <div className="lg:w-84 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                Preloaded Samples
              </span>
              <span className="text-[11px] font-mono text-slate-400">1-click test</span>
            </div>

            <div className="space-y-2">
              <button
                id="sample-msa-btn"
                onClick={() => onSelectSample('sample_msa_2026')}
                className="interactive-card w-full text-left p-2.5 rounded border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FileCheck2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                      Master Services Agreement
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">High Risk · 8 Clauses · 2 pgs</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-red-100 text-red-700 rounded shrink-0">
                  High
                </span>
              </button>

              <button
                id="sample-nda-btn"
                onClick={() => onSelectSample('sample_nda_2026')}
                className="interactive-card w-full text-left p-2.5 rounded border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FileCheck2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                      Mutual NDA Agreement
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">Low Risk · 5 Clauses · 1 pg</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-green-100 text-green-700 rounded shrink-0">
                  Standard
                </span>
              </button>

              <button
                id="sample-saas-btn"
                onClick={() => onSelectSample('sample_saas_2026')}
                className="interactive-card w-full text-left p-2.5 rounded border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <FileCheck2 className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">
                      Enterprise SaaS Agreement
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">Medium Risk · 5 Clauses · 2 pgs</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-100 text-amber-700 rounded shrink-0">
                  Medium
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 flex items-center space-x-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 p-2.5 rounded">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
