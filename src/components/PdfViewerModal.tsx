import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { Contract } from '../types';

interface PdfViewerModalProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  contract,
  isOpen,
  onClose,
  onDownload,
}) => {
  if (!isOpen || !contract) return null;

  const pdfUrl = `/api/contracts/${contract.id}/pdf`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                {contract.contract_title || contract.filename}
              </h3>
              <p className="text-xs font-mono text-slate-400">
                PDF PREVIEW · {contract.page_count} PAGES · {(contract.file_size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={onDownload}
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded shadow-2xs hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Download
            </button>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Open Tab
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / PDF Viewer Frame */}
        <div className="flex-1 bg-slate-100 relative">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            title="Contract PDF Viewer"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
