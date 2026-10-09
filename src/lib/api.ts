/**
 * Safe API Client & Fetch Utilities with Local Persistence
 */
import { Contract, Clause, SearchResultResponse } from '../types';
import { extractTextFromPdfFile, PDF_SCANNED_ERROR, PDF_SHORT_WARNING } from './pdfParser';

export const MAX_UPLOAD_SIZE = 30 * 1024 * 1024;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

const STORAGE_CONTRACTS_KEY = 'contract_analyzer_contracts_v1';
const STORAGE_CLAUSES_KEY = 'contract_analyzer_clauses_v1';

export interface SessionUser {
  id: string;
  email: string;
}

/**
 * Local Storage Persistence Helpers
 */
export function getStoredContracts(userId: string): Contract[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_CONTRACTS_KEY}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load stored contracts:', e);
  }
  return [];
}

export function saveStoredContracts(userId: string, contracts: Contract[]): void {
  try {
    localStorage.setItem(`${STORAGE_CONTRACTS_KEY}_${userId}`, JSON.stringify(contracts));
  } catch (e) {
    console.warn('Failed to save stored contracts:', e);
  }
}

export function getStoredClauses(userId: string, contractId: string): Clause[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_CLAUSES_KEY}_${userId}_${contractId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load stored clauses:', e);
  }
  return [];
}

export function saveStoredClauses(userId: string, contractId: string, clauses: Clause[]): void {
  try {
    localStorage.setItem(`${STORAGE_CLAUSES_KEY}_${userId}_${contractId}`, JSON.stringify(clauses));
  } catch (e) {
    console.warn('Failed to save stored clauses:', e);
  }
}

export async function getCurrentUser(): Promise<ApiResponse<{ user: SessionUser }>> {
  return safeFetchJson('/api/auth/me');
}

export async function loginUser(email: string, password: string): Promise<ApiResponse<{ user: SessionUser }>> {
  return safeFetchJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function signupUser(email: string, password: string): Promise<ApiResponse<{ user: SessionUser }>> {
  return safeFetchJson('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export async function logoutUser(): Promise<ApiResponse<{ success: boolean }>> {
  return safeFetchJson('/api/auth/logout', { method: 'POST' });
}

/**
 * Safe fetch wrapper that handles JSON, HTML fallbacks, and connection errors
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options?.headers || {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          status: res.status,
          error: data.error || data.message || `Request failed with HTTP status ${res.status}`,
          data,
        };
      }
      return {
        success: true,
        status: res.status,
        data,
      };
    }

    // Non-JSON response handling
    const text = await res.text();
    const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html');

    let errorMessage = `Server returned HTTP ${res.status}`;
    if (isHtml) {
      if (res.status === 413) {
        errorMessage = 'File too large. Maximum supported size is 50MB.';
      } else if (res.status === 404) {
        errorMessage = 'The requested contract or API endpoint was not found.';
      } else if (res.status >= 500) {
        errorMessage = 'Internal server error while processing request. Please try again.';
      } else {
        errorMessage = `Unexpected server response (HTTP ${res.status}).`;
      }
    } else if (text.trim()) {
      errorMessage = text.trim().slice(0, 200);
    }

    return {
      success: false,
      status: res.status,
      error: errorMessage,
    };
  } catch (err: any) {
    console.error(`[API Network Error] ${url}:`, err);
    return {
      success: false,
      status: 0,
      error: err.message || 'Unable to connect to server. Please check your network connection.',
    };
  }
}

/**
 * Upload PDF File with Browser PDF Parsing and Robust Fallbacks
 */
export async function uploadContractPdf(file: File): Promise<ApiResponse<{ contract: Contract }>> {
  if (file.size > MAX_UPLOAD_SIZE) {
    return { success: false, status: 413, error: 'File too large. Maximum supported size is 30MB.' };
  }
  // Step 1: Extract text and page count directly in browser when possible.
  // The backend remains the source of truth because some valid PDFs are not
  // compatible with the browser pdfjs build.
  let extractedText = '';
  let pageCount = 1;
  try {
    const parsed = await extractTextFromPdfFile(file);
    extractedText = parsed.text;
    pageCount = parsed.pageCount;
  } catch (parseErr) {
    console.warn('[PDF Upload] Browser extraction failed; delegating to backend:', parseErr);
  }

  if (extractedText.trim()) {
    const wordCount = extractedText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount === 0) {
      return { success: false, status: 422, error: PDF_SCANNED_ERROR };
    }
    if (wordCount < 50) {
      return { success: false, status: 422, error: PDF_SHORT_WARNING };
    }
  }

  // Step 2: Attempt standard FormData upload
  try {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('auto_analyze', 'true');
    if (extractedText.trim()) {
      formData.append('raw_text', extractedText);
      formData.append('page_count', String(pageCount));
    }

    const formResult = await safeFetchJson<{ contract: Contract }>('/api/contracts/upload', {
      method: 'POST',
      body: formData,
    });

    if (formResult.success && formResult.data?.contract) {
      return formResult;
    }

    return formResult;
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      error: err?.message || 'Unable to upload the PDF. Please check your network connection and try again.',
    };
  }
}

export async function searchContracts(query: string): Promise<ApiResponse<SearchResultResponse>> {
  return safeFetchJson<SearchResultResponse>('/api/contracts/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
}
