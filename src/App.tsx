import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { Contract, Clause } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ContractsPage } from './pages/ContractsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { SearchPage } from './pages/SearchPage';
import { UploadModal } from './components/UploadModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './pages/LandingPage';
import {
  getCurrentUser,
  getStoredClauses,
  logoutUser,
  saveStoredClauses,
  saveStoredContracts,
  safeFetchJson,
  SessionUser,
  uploadContractPdf,
} from './lib/api';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [authUser, setAuthUser] = useState<SessionUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const navigate = useCallback((path: string) => {
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((result) => {
        if (mounted && result.success && result.data?.user) setAuthUser(result.data.user);
      })
      .finally(() => {
        if (mounted) setIsAuthChecking(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchContracts = useCallback(async () => {
    if (!authUser) {
      setContracts([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const result = await safeFetchJson<{ contracts: Contract[] }>('/api/contracts');
      if (result.success && result.data?.contracts) {
        setContracts(result.data.contracts);
        saveStoredContracts(authUser.id, result.data.contracts);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser) void fetchContracts();
  }, [authUser, fetchContracts]);

  const routeInfo = (() => {
    if (currentPath === '/' || currentPath === '') return { page: authUser ? 'dashboard' as const : 'landing' as const, id: null };
    if (currentPath === '/login' || currentPath === '/login/' || currentPath === '/signin' || currentPath === '/signin/') return { page: 'login' as const, id: null };
    if (currentPath === '/signup' || currentPath === '/signup/') return { page: 'signup' as const, id: null };
    if (currentPath === '/contracts' || currentPath === '/contracts/') return { page: 'contracts' as const, id: null };
    if (currentPath === '/search' || currentPath === '/search/') return { page: 'search' as const, id: null };
    const match = currentPath.match(/^\/contracts\/([^/?#]+)/);
    if (match) return { page: 'analysis' as const, id: match[1] };
    return { page: 'dashboard' as const, id: null };
  })();

  useEffect(() => {
    if (isAuthChecking) return;
    if (!authUser && !['landing', 'login', 'signup'].includes(routeInfo.page)) {
      navigate('/login');
    } else if (authUser && ['landing', 'login', 'signup'].includes(routeInfo.page)) {
      navigate('/');
    }
  }, [authUser, isAuthChecking, navigate, routeInfo.page]);

  const fetchContractDetails = useCallback(async (id: string) => {
    if (!authUser) return;
    try {
      setIsContractLoading(true);
      const cachedClauses = getStoredClauses(authUser.id, id);
      if (cachedClauses.length) setClauses(cachedClauses);
      const [contractResult, clauseResult] = await Promise.all([
        safeFetchJson<{ contract: Contract }>(`/api/contracts/${id}`),
        safeFetchJson<{ clauses: Clause[] }>(`/api/contracts/${id}/clauses`),
      ]);
      setSelectedContract(contractResult.success ? contractResult.data?.contract || null : null);
      if (clauseResult.success && clauseResult.data?.clauses) {
        setClauses(clauseResult.data.clauses);
        saveStoredClauses(authUser.id, id, clauseResult.data.clauses);
      } else if (!cachedClauses.length) {
        setClauses([]);
      }
    } catch (error) {
      console.error('Error fetching contract details:', error);
    } finally {
      setIsContractLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authUser && routeInfo.page === 'analysis' && routeInfo.id) {
      void fetchContractDetails(routeInfo.id);
    } else {
      setSelectedContract(null);
      setClauses([]);
    }
  }, [authUser, routeInfo.page, routeInfo.id, fetchContractDetails]);

  useEffect(() => {
    const hasPending = contracts.some((contract) => contract.extraction_status === 'pending' || contract.extraction_status === 'processing');
    const selectedPending = selectedContract?.extraction_status === 'pending' || selectedContract?.extraction_status === 'processing';
    if (!hasPending && !selectedPending) return;
    const interval = window.setInterval(() => {
      void fetchContracts();
      if (routeInfo.id) void fetchContractDetails(routeInfo.id);
    }, 2500);
    return () => window.clearInterval(interval);
  }, [contracts, selectedContract?.extraction_status, routeInfo.id, fetchContracts, fetchContractDetails]);

  const handleAuthenticated = (user: SessionUser) => {
    setContracts([]);
    setSelectedContract(null);
    setClauses([]);
    setAuthUser(user);
  };

  const handleLogout = async () => {
    await logoutUser();
    setAuthUser(null);
    setContracts([]);
    setSelectedContract(null);
    setClauses([]);
    setContractToDelete(null);
    setIsUploadModalOpen(false);
    setIsPdfModalOpen(false);
    navigate('/');
  };

  const handleUploadFile = async (file: File): Promise<boolean> => {
    setIsUploading(true);
    setNotification(null);
    try {
      const result = await uploadContractPdf(file);
      if (!result.success || !result.data?.contract) throw new Error(result.error || 'Failed to upload contract.');
      setNotification({ type: 'success', message: `Contract "${file.name}" uploaded. Analysis is in progress.` });
      await fetchContracts();
      navigate(`/contracts/${result.data.contract.id}`);
      return true;
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to upload contract PDF.' });
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectSample = async (sampleId: string) => {
    setIsUploading(true);
    try {
      const result = await safeFetchJson<{ contract: Contract }>(`/api/contracts/${sampleId}/clone-sample`, { method: 'POST' });
      if (!result.success || !result.data?.contract) throw new Error(result.error || 'Could not import sample contract.');
      await fetchContracts();
      navigate(`/contracts/${result.data.contract.id}`);
      await fetchContractDetails(result.data.contract.id);
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Could not import sample contract.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReanalyzeContract = async (id?: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    const targetId = id || (routeInfo.page === 'analysis' ? routeInfo.id : null);
    if (!targetId) return;
    setIsAnalyzing(true);
    setNotification(null);
    try {
      const result = await safeFetchJson(`/api/contracts/${targetId}/analyze`, { method: 'POST' });
      if (!result.success) throw new Error(result.error || 'AI analysis failed.');
      setNotification({ type: 'success', message: 'Contract analysis completed.' });
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to analyze contract.' });
    } finally {
      await fetchContracts();
      await fetchContractDetails(targetId);
      setIsAnalyzing(false);
    }
  };

  const handleDeleteContract = (contract: Contract, event?: React.MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    setContractToDelete(contract);
  };

  const handleConfirmDelete = async (contractId: string) => {
    setIsDeleting(true);
    try {
      const result = await safeFetchJson(`/api/contracts/${contractId}`, { method: 'DELETE' });
      if (!result.success) throw new Error(result.error || 'Failed to delete contract.');
      setContracts((existing) => existing.filter((contract) => contract.id !== contractId));
      if (selectedContract?.id === contractId) {
        setSelectedContract(null);
        setClauses([]);
      }
      setContractToDelete(null);
      setNotification({ type: 'success', message: 'Contract removed from your repository.' });
      if (routeInfo.page === 'analysis' && routeInfo.id === contractId) navigate('/contracts');
      await fetchContracts();
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message || 'Failed to delete contract.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!selectedContract) return;
    const link = document.createElement('a');
    link.href = `/api/contracts/${selectedContract.id}/pdf`;
    link.download = selectedContract.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isAuthChecking) {
    return <div className="min-h-screen bg-[#17143D] flex items-center justify-center text-indigo-100 text-sm">Checking your secure session…</div>;
  }
  if (!authUser) {
    if (routeInfo.page === 'landing') return <LandingPage onNavigate={navigate} />;
    if (routeInfo.page === 'login' || routeInfo.page === 'signup') {
      return (
        <AuthPage
          key={routeInfo.page}
          onAuthenticated={handleAuthenticated}
          isSignup={routeInfo.page === 'signup'}
          onModeChange={(isSignup) => navigate(isSignup ? '/signup' : '/login')}
        />
      );
    }
    return <div className="min-h-screen bg-[#17143D] flex items-center justify-center text-indigo-100 text-sm">Redirecting to sign in…</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col md:flex-row font-sans">
      <div className="hidden md:block">
        <Sidebar activePath={currentPath} onNavigate={navigate} onRefresh={fetchContracts} isLoading={isLoading} email={authUser.email} onLogout={handleLogout} />
      </div>
      <div className="block md:hidden">
        <Header onRefresh={fetchContracts} isLoading={isLoading} activePath={currentPath} onNavigate={navigate} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {notification && (
            <div className={`mb-5 p-3.5 rounded-lg border text-xs font-semibold flex items-center justify-between shadow-2xs ${notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                <span>{notification.message}</span>
              </div>
              <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-slate-800 font-bold px-1.5" aria-label="Dismiss notification">×</button>
            </div>
          )}

          {routeInfo.page === 'dashboard' && <DashboardPage contracts={contracts} onNavigate={navigate} onOpenUpload={() => setIsUploadModalOpen(true)} onDeleteContract={handleDeleteContract} isLoading={isLoading} />}
          {routeInfo.page === 'contracts' && <ContractsPage contracts={contracts} onNavigate={navigate} onOpenUpload={() => setIsUploadModalOpen(true)} onDeleteContract={handleDeleteContract} onReanalyzeContract={handleReanalyzeContract} isLoading={isLoading} />}
          {routeInfo.page === 'search' && <SearchPage contracts={contracts} onNavigate={navigate} onOpenUpload={() => setIsUploadModalOpen(true)} isLoadingContracts={isLoading} />}
          {routeInfo.page === 'analysis' && (
            <AnalysisPage contractId={routeInfo.id || ''} contract={selectedContract} clauses={clauses} isLoading={isContractLoading} isAnalyzing={isAnalyzing} onNavigate={navigate} onViewPdf={() => setIsPdfModalOpen(true)} onDownloadPdf={handleDownloadPdf} onReanalyze={() => handleReanalyzeContract()} onDeleteContract={handleDeleteContract} />
          )}
        </main>
      </div>

      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadFile={handleUploadFile} onSelectSample={handleSelectSample} isUploading={isUploading} />
      <PdfViewerModal contract={selectedContract} isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} onDownload={handleDownloadPdf} />
      <DeleteConfirmationModal isOpen={Boolean(contractToDelete)} contract={contractToDelete} onClose={() => setContractToDelete(null)} onConfirm={handleConfirmDelete} isDeleting={isDeleting} />
    </div>
  );
}
