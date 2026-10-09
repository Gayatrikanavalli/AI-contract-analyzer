/**
 * Express Backend Server with Vite Middleware
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { extractTextFromPdf, PdfProcessingError, PDF_READ_ERROR } from './server/pdf-utils';
import { analyzeContract } from './server/gemini-worker';
import { searchContractsWithAi } from './server/search-worker';
import {
  authenticateUser,
  clearSessionCookie,
  getAuthenticatedUser,
  registerUser,
  requireAuthentication,
  setSessionCookie,
} from './server/auth';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
});
const MAX_CONTRACTS_PER_ACCOUNT = 10;
const uploadReservations = new Map<string, number>();
const uploadUsage = new Map<string, number>();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(cors());
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // --- API Routes ---

  app.post('/api/auth/signup', (req, res) => {
    try {
      const user = registerUser(req.body?.email, req.body?.password);
      setSessionCookie(res, user);
      return res.status(201).json({ user });
    } catch (error: any) {
      return res.status(error.message?.startsWith('An account') ? 409 : 400).json({ error: error.message || 'Could not create account.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const user = authenticateUser(req.body?.email, req.body?.password);
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    setSessionCookie(res, user);
    return res.json({ user });
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    return res.json({ success: true });
  });

  app.get('/api/auth/me', requireAuthentication, (req, res) => {
    return res.json({ user: getAuthenticatedUser(req) });
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      configuredModel: 'gemini-3.6-flash',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // Every contract operation requires a valid server-issued account session.
  app.use('/api', requireAuthentication);

  // List all contracts
  app.get('/api/contracts', (req, res) => {
    const contracts = db.getAllContracts(getAuthenticatedUser(req).id);
    res.json({ contracts });
  });

  const reserveUploadSlot = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = getAuthenticatedUser(req).id;
    const reservations = uploadReservations.get(userId) || 0;
    const used = uploadUsage.get(userId) ?? db.getAllContracts(userId).length;
    if (used + reservations >= MAX_CONTRACTS_PER_ACCOUNT) {
      return res.status(429).json({ error: `Upload limit reached. Each account can store up to ${MAX_CONTRACTS_PER_ACCOUNT} contracts.` });
    }
    uploadReservations.set(userId, reservations + 1);
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const currentUsage = uploadUsage.get(userId) ?? db.getAllContracts(userId).length - 1;
        uploadUsage.set(userId, currentUsage + 1);
      }
      const remaining = (uploadReservations.get(userId) || 1) - 1;
      if (remaining > 0) uploadReservations.set(userId, remaining);
      else uploadReservations.delete(userId);
    });
    next();
  };

  // Import a built-in example as a private, account-owned copy.
  app.post('/api/contracts/:id/clone-sample', reserveUploadSlot, (req, res) => {
    const userId = getAuthenticatedUser(req).id;
    const source = db.getContractById(req.params.id);
    const sourceFile = db.getContractBuffer(req.params.id);
    if (!req.params.id.startsWith('sample_') || !source || !sourceFile || source.user_id !== null) {
      return res.status(404).json({ error: 'Sample contract not found.' });
    }

    const contract = db.createContract({
      filename: source.filename,
      file_size: source.file_size,
      file_type: source.file_type,
      file_data: sourceFile.buffer,
      raw_text: db.getContractRawText(req.params.id) || '',
      page_count: source.page_count,
      extraction_status: source.extraction_status,
      user_id: userId,
      contract_title: source.contract_title,
      contract_type: source.contract_type,
      effective_date: source.effective_date,
      parties: source.parties,
      executive_summary: source.executive_summary,
      overall_risk_score: source.overall_risk_score,
      overall_risk_level: source.overall_risk_level,
    });
    db.saveClauses(contract.id, (source.clauses || []).map(({ clause_title, clause_type, clause_text, risk_level, risk_score, risk_reason, page_number, recommendation }) => ({
      clause_title, clause_type, clause_text, risk_level, risk_score, risk_reason, page_number, recommendation,
    })));
    return res.status(201).json({ contract: db.getContractById(contract.id, userId) });
  });

  // Get single contract details
  app.get('/api/contracts/:id', (req, res) => {
    const contract = db.getContractById(req.params.id, getAuthenticatedUser(req).id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json({ contract });
  });

  // Get contract clauses
  app.get('/api/contracts/:id/clauses', (req, res) => {
    const contract = db.getContractById(req.params.id, getAuthenticatedUser(req).id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    const clauses = contract.clauses || [];
    res.json({
      contract_id: req.params.id,
      extraction_status: contract.extraction_status,
      count: clauses.length,
      clauses,
    });
  });

  // Download / View original PDF
  app.get('/api/contracts/:id/pdf', (req, res) => {
    if (!db.getContractById(req.params.id, getAuthenticatedUser(req).id)) {
      return res.status(404).json({ error: 'Contract PDF document not found' });
    }
    const file = db.getContractBuffer(req.params.id);
    if (!file) {
      return res.status(404).json({ error: 'Contract PDF document not found' });
    }

    res.setHeader('Content-Type', file.mimeType || 'application/pdf');
    res.setHeader('Content-Length', file.buffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.filename)}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(file.buffer);
  });

  // Upload contract PDF with multi-format support (multipart, base64 json, etc.)
  app.post('/api/contracts/upload', (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) {
        console.error('[Upload Middleware Error]:', err);
        return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({
          error: err.code === 'LIMIT_FILE_SIZE' ? 'File too large. Maximum supported size is 30MB.' : (err.message || 'Failed to parse file upload payload'),
        });
      }
      next();
    });
  }, reserveUploadSlot, async (req, res) => {
    try {
      let buffer: Buffer | null = null;
      let filename = 'uploaded_contract.pdf';
      let mimeType = 'application/pdf';

      // Check multipart files array
      const files = req.files as Express.Multer.File[] | undefined;
      if (files && files.length > 0) {
        const uploadedFile = files[0];
        buffer = uploadedFile.buffer;
        filename = uploadedFile.originalname || filename;
        mimeType = uploadedFile.mimetype || mimeType;
      } else if (req.file) {
        buffer = req.file.buffer;
        filename = req.file.originalname || filename;
        mimeType = req.file.mimetype || mimeType;
      } else if (req.body?.file_base64) {
        const base64Data = req.body.file_base64.replace(/^data:[^;]+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
        filename = req.body.filename || filename;
      } else if (req.body?.file && typeof req.body.file === 'string') {
        const base64Data = req.body.file.replace(/^data:[^;]+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
        filename = req.body.filename || filename;
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: PDF_READ_ERROR });
      }

      if (buffer.length > 30 * 1024 * 1024) {
        return res.status(413).json({ error: 'File too large. Maximum supported size is 30MB.' });
      }

      // Step 1: Text extraction
      let extracted;
      try {
        extracted = await extractTextFromPdf(buffer);
      } catch (error) {
        const message = error instanceof PdfProcessingError ? error.message : PDF_READ_ERROR;
        return res.status(400).json({ error: message });
      }
      let finalText = extracted.text;
      let finalPages = extracted.pageCount;

      if (req.body?.raw_text && typeof req.body.raw_text === 'string' && req.body.raw_text.trim().length > finalText.length) {
        finalText = req.body.raw_text.trim();
      }
      if (req.body?.page_count && Number(req.body.page_count) > 0) {
        finalPages = Number(req.body.page_count);
      }

      const wordCount = finalText.trim().split(/\s+/).filter(Boolean).length;
      const extractionError = wordCount === 0
        ? 'This PDF appears to be a scanned image with no selectable text. OCR is not currently supported.'
        : wordCount < 50
          ? 'This PDF contains very little text and may not be a complete contract. Please upload a fuller document.'
          : null;

      // Step 2: Database storage
      const autoAnalyze = req.body?.auto_analyze !== 'false' && req.body?.auto_analyze !== false;
      const contract = db.createContract({
        user_id: getAuthenticatedUser(req).id,
        filename,
        file_size: buffer.length,
        file_type: mimeType,
        file_data: buffer,
        raw_text: finalText,
        page_count: finalPages,
        extraction_status: extractionError ? 'failed' : autoAnalyze ? 'processing' : 'pending',
      });

      if (extractionError) {
        db.updateContract(contract.id, { error_message: extractionError });
        return res.status(201).json({ contract: db.getContractById(contract.id) });
      }

      // Step 3: Trigger worker analysis
      if (autoAnalyze) {
        console.log(`[Upload] Triggering analysis for contract ${contract.id} (${filename})...`);
        // Trigger in background and respond immediately
        analyzeContract(contract.id).catch(err => {
          console.error(`[Upload] Background analysis failed for ${contract.id}:`, err);
        });
      }

      return res.status(201).json({
        contract: db.getContractById(contract.id),
      });
    } catch (err: any) {
      console.error('Contract upload error:', err);
      return res.status(500).json({ error: err.message || 'Failed to process contract PDF' });
    }
  });

  // Trigger analysis for contract
  app.post('/api/contracts/:id/analyze', async (req, res) => {
    const userId = getAuthenticatedUser(req).id;
    const contract = db.getContractById(req.params.id, userId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    try {
      const success = await analyzeContract(req.params.id);
      const updated = db.getContractById(req.params.id, userId);
      if (!success) {
        return res.status(502).json({
          success: false,
          contract: updated,
          error: updated?.error_message || 'Analysis failed - AI service unavailable, please try again',
        });
      }
      return res.json({
        success,
        contract: updated,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Analysis failed' });
    }
  });

  // Delete contract
  app.delete('/api/contracts/:id', (req, res) => {
    if (!db.getContractById(req.params.id, getAuthenticatedUser(req).id)) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    const deleted = db.deleteContract(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    return res.json({ success: true, message: 'Contract deleted' });
  });

  // Natural Language Contract Search via Gemini AI
  app.post(['/api/contracts/search', '/api/search'], async (req, res) => {
    try {
      const query = req.body?.query || req.body?.q || req.query?.q || '';
      const result = await searchContractsWithAi(String(query), getAuthenticatedUser(req).id);
      return res.json(result);
    } catch (err: any) {
      console.error('Contract AI search route error:', err);
      return res.status(500).json({
        error: err.message || 'AI contract search failed',
        hasAnalyzedContracts: true,
        has_matches: false,
        summary: 'An error occurred while analyzing contracts for your query. Please try again.',
        matches: [],
      });
    }
  });

  // Explicit 404 handler for any unmatched /api/* routes to prevent falling through to Vite HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: `API route not found: ${req.method} ${req.originalUrl || req.url}`,
    });
  });

  // Dedicated JSON error handling middleware for API routes
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API Server Error]:', err);
    if (req.originalUrl?.startsWith('/api') || req.path?.startsWith('/api')) {
      const statusCode = err.status || err.statusCode || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
      return res.status(statusCode).json({
        error: err.message || 'Internal server error occurred',
        code: err.code || 'SERVER_ERROR',
      });
    }
    next(err);
  });

  // Vite middleware for development & static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Contract Analyzer] Server active at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
