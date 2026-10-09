import React, { useState, useEffect, useRef } from 'react';
import { Contract, RiskLevel, SearchResultResponse, SearchMatch } from '../types';
import { searchContracts } from '../lib/api';
import {
  Search,
  Sparkles,
  ArrowRight,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  HelpCircle,
  UploadCloud,
  X,
  Scale,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface SearchPageProps {
  contracts: Contract[];
  onNavigate: (path: string) => void;
  onOpenUpload: () => void;
  isLoadingContracts: boolean;
}

const EXAMPLE_QUESTIONS = [
  'Which contracts have auto-renewal clauses?',
  'Show me contracts with liability caps under $50,000',
  'Which contracts permit secondary AI model training on customer data?',
  'What are the confidentiality survival terms?',
  'Are there contracts with early termination penalties?',
  'Which contracts require one-way indemnification?',
];

const SEARCH_CATEGORIES = [
  {
    title: 'Liability & Risk Caps',
    description: 'Find limitation of liability provisions, monetary caps, and uncapped exposure.',
    example: 'Show me contracts with liability caps under $50,000',
    color: 'bg-amber-50 border-amber-200 text-amber-900',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    title: 'Auto-Renewal & Term',
    description: 'Identify evergreen clauses, cancellation notice windows, and price escalations.',
    example: 'Which contracts have auto-renewal clauses?',
    color: 'bg-blue-50 border-blue-200 text-blue-900',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  {
    title: 'Data Rights & AI Usage',
    description: 'Detect machine learning training terms, data ownership, and privacy covenants.',
    example: 'Which contracts permit secondary AI model training on customer data?',
    color: 'bg-purple-50 border-purple-200 text-purple-900',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  {
    title: 'Indemnity & Defense',
    description: 'Check one-sided indemnification, IP infringement defense caps, and warranty claims.',
    example: 'Which contracts require one-way indemnification?',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
];

export const SearchPage: React.FC<SearchPageProps> = ({
  contracts,
  onNavigate,
  onOpenUpload,
  isLoadingContracts,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResultResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSearchedQuery, setLastSearchedQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const completedContracts = contracts.filter((c) => c.extraction_status === 'completed');
  const hasAnalyzedContracts = completedContracts.length > 0;

  // Execute Search
  const handleExecuteSearch = async (searchPrompt?: string) => {
    const textToSearch = (searchPrompt !== undefined ? searchPrompt : query).trim();
    if (!textToSearch) {
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    if (searchPrompt !== undefined) {
      setQuery(searchPrompt);
    }

    setIsSearching(true);
    setErrorMessage(null);
    setLastSearchedQuery(textToSearch);

    try {
      const res = await searchContracts(textToSearch);
      if (res.success && res.data) {
        setSearchResult(res.data);
      } else {
        throw new Error(res.error || 'Failed to complete AI search across contracts');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setErrorMessage(err.message || 'An error occurred during search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchResult(null);
    setErrorMessage(null);
    setLastSearchedQuery('');
    if (inputRef.current) inputRef.current.focus();
  };

  const getRiskBadge = (level: RiskLevel | null | undefined) => {
    switch (level) {
      case 'critical':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-red-600" />
            Critical Risk
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-orange-600" />
            High Risk
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
            Medium Risk
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            <Shield className="w-3 h-3 mr-1 text-blue-600" />
            Low Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Standard
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Natural Language Contract Search
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 border border-indigo-200">
              <Sparkles className="w-3 h-3 mr-1 text-[#6D5FE8]" />
              AI-Powered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Query across all analyzed contracts, extract specific clauses, compare liability caps, and review terms in natural language.
          </p>
        </div>

        {hasAnalyzedContracts && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-[#F6F5FF] border border-indigo-200/80 px-3.5 py-2 rounded-xl shrink-0">
            <Scale className="w-4 h-4 text-[#6D5FE8]" />
            <span>
              Searching across <strong className="text-indigo-950 font-bold">{completedContracts.length}</strong> analyzed contract{completedContracts.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {/* Main Search Bar Card */}
      <div className="bg-[#F6F5FF] border border-indigo-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteSearch();
          }}
          className="relative flex flex-col sm:flex-row items-stretch gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#6D5FE8]" />
            <input
              ref={inputRef}
              id="ai-contract-search-input"
              type="text"
              placeholder='Ask a question (e.g. "Which contracts have auto-renewal clauses?" or "Liability caps under $50,000")...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching}
              className="w-full pl-11 pr-10 py-3 text-xs sm:text-sm bg-white border border-indigo-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#6D5FE8] focus:border-transparent transition-all text-slate-800 placeholder:text-slate-400 shadow-2xs disabled:bg-slate-50"
            />
            {query && !isSearching && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            id="ai-search-submit-btn"
            type="submit"
            disabled={isSearching || !query.trim()}
            className="interactive-button inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-semibold text-white bg-[#6D5FE8] hover:bg-[#5B4DE0] rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-[#6D5FE8] focus:ring-offset-2 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </form>

        {/* Example Prompt Chips */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-950 uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5 text-[#6D5FE8]" />
            <span>Suggested Questions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((question, index) => (
              <button
                key={index}
                id={`example-question-chip-${index}`}
                type="button"
                onClick={() => handleExecuteSearch(question)}
                disabled={isSearching}
                className="text-xs font-medium bg-white hover:bg-indigo-50 border border-indigo-200/90 text-indigo-950 hover:text-indigo-700 px-3.5 py-1.5 rounded-full transition-all duration-150 shadow-2xs hover:border-[#6D5FE8] cursor-pointer text-left disabled:opacity-50"
              >
                "{question}"
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 text-xs font-medium flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Search Error</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 font-bold text-sm px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading State */}
      {isSearching && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-8 text-center shadow-sm space-y-4">
          <div className="inline-flex p-3.5 bg-indigo-50 rounded-2xl text-[#6D5FE8] animate-pulse">
            <Sparkles className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Synthesizing Contract Terms & Clauses...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Gemini AI is reading extracted clauses across all {completedContracts.length} analyzed contracts to provide a precise, cited legal answer.
            </p>
          </div>

          {/* Skeleton Loaders */}
          <div className="max-w-xl mx-auto space-y-3 pt-3">
            <div className="h-3 bg-indigo-50 rounded-full w-full animate-pulse" />
            <div className="h-3 bg-indigo-50 rounded-full w-5/6 mx-auto animate-pulse" />
            <div className="h-3 bg-indigo-50 rounded-full w-4/6 mx-auto animate-pulse" />
          </div>
        </div>
      )}

      {/* Empty State: No Analyzed Contracts */}
      {!hasAnalyzedContracts && !isSearching && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-8 text-center shadow-sm space-y-4">
          <div className="inline-flex p-3 bg-amber-100 rounded-2xl text-amber-700">
            <FileText className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-amber-950">No Analyzed Contracts Available Yet</h3>
            <p className="text-xs text-amber-800 mt-1">
              To search across contract terms and extracted clauses, please upload a contract PDF or inspect the sample agreements in the repository.
            </p>
          </div>
          <div>
            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#6D5FE8] hover:bg-[#5B4DE0] rounded-xl shadow-md transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-white" />
              <span>Upload Contract PDF</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Result Display */}
      {!isSearching && searchResult && (
        <div className="space-y-6">
          {/* Natural Language Synthesis Summary Card */}
          <div className="bg-gradient-to-br from-[#EEF2FF] to-[#F5F3FF] border border-indigo-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#6D5FE8] rounded-lg flex items-center justify-center text-white shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-950 block">AI Synthesis & Answer</span>
                  <span className="text-[10px] text-indigo-600 font-medium block -mt-0.5">
                    Query: "{lastSearchedQuery}"
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {searchResult.has_matches ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    {searchResult.matches.length} Relevant Contract{searchResult.matches.length === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    <HelpCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    No Direct Matches
                  </span>
                )}
              </div>
            </div>

            {/* AI Summary Text */}
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal bg-white/70 rounded-xl p-4 border border-indigo-100/80 shadow-2xs whitespace-pre-line">
              {searchResult.summary}
            </div>
          </div>

          {/* Matching Contracts Section */}
          {searchResult.has_matches && searchResult.matches.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#6D5FE8]" />
                  <span>Matching Contracts & Cited Clauses ({searchResult.matches.length})</span>
                </h2>
              </div>

              <div className="space-y-4">
                {searchResult.matches.map((match, idx) => (
                  <div
                    key={match.contract_id || idx}
                    id={`search-match-contract-${idx}`}
                    className="interactive-card bg-white border border-indigo-100/90 rounded-2xl p-5 shadow-sm space-y-4"
                  >
                    {/* Contract Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            {match.contract_title}
                          </h3>
                          {match.contract_type && (
                            <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200 rounded-full text-[10px] font-semibold text-slate-700">
                              {match.contract_type}
                            </span>
                          )}
                          {getRiskBadge(match.overall_risk_level)}
                        </div>
                      </div>

                      {/* View Analysis CTA */}
                      <button
                        onClick={() => onNavigate(`/contracts/${match.contract_id}`)}
                        className="interactive-button inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#6D5FE8] hover:bg-[#5B4DE0] rounded-xl shadow-2xs shrink-0 cursor-pointer self-start sm:self-auto"
                      >
                        <span>View Full Analysis</span>
                        <ArrowRight className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>

                    {/* Relevance Reason */}
                    {match.relevance_reason && (
                      <div className="bg-[#F6F5FF] border border-indigo-100 rounded-xl p-3 text-xs text-indigo-950 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#6D5FE8] shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold text-indigo-900">Relevance: </strong>
                          <span>{match.relevance_reason}</span>
                        </div>
                      </div>
                    )}

                    {/* Cited Clauses */}
                    {match.matching_clauses && match.matching_clauses.length > 0 && (
                      <div className="space-y-3 pt-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Relevant Clauses & Verbatim Text:
                        </span>

                        <div className="space-y-2.5">
                          {match.matching_clauses.map((clause, cIdx) => (
                            <div
                              key={cIdx}
                              className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900">
                                    {clause.clause_title}
                                  </span>
                                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                                    {clause.clause_type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {clause.page_number && (
                                    <span className="text-[10px] font-medium text-slate-500">
                                      Page {clause.page_number}
                                    </span>
                                  )}
                                  {getRiskBadge(clause.risk_level)}
                                </div>
                              </div>

                              {/* Verbatim text */}
                              {clause.clause_text && (
                                <div className="text-xs text-slate-700 bg-white border border-slate-200/90 rounded-lg p-2.5 font-mono leading-relaxed">
                                  "{clause.clause_text}"
                                </div>
                              )}

                              {/* Clause explanation if available */}
                              {clause.explanation && (
                                <p className="text-[11px] text-slate-600 italic">
                                  Note: {clause.explanation}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Direct Match Guidance */}
          {!searchResult.has_matches && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-sm space-y-3">
              <div className="w-10 h-10 bg-indigo-50 text-[#6D5FE8] rounded-full flex items-center justify-center mx-auto">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                No Direct Clause Matches Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                The repository didn't find clauses directly answering "{lastSearchedQuery}". You can try broadening your search or choosing one of the prompt topics below:
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {EXAMPLE_QUESTIONS.slice(0, 3).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleExecuteSearch(q)}
                    className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                  >
                    Try: "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial Guide / Exploration Cards (When no search has been executed yet) */}
      {!searchResult && !isSearching && hasAnalyzedContracts && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <HelpCircle className="w-3.5 h-3.5 text-[#6D5FE8]" />
            <span>Search Capabilities & Common Query Categories</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SEARCH_CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => handleExecuteSearch(cat.example)}
                className="interactive-card bg-white border border-indigo-100/90 rounded-2xl p-4 shadow-sm hover:border-[#6D5FE8]/40 cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-bold text-slate-900 group-hover:text-[#6D5FE8] transition-colors">
                      {cat.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cat.badgeColor}`}>
                      Category
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-indigo-600 group-hover:text-[#5B4DE0]">
                  <span className="truncate pr-2 italic">"{cat.example}"</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
