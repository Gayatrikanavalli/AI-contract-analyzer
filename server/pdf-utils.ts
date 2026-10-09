/**
 * Utility functions for PDF text extraction and sample PDF creation
 */
import { PDFParse } from 'pdf-parse';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export interface ExtractedPdfContent {
  text: string;
  pageCount: number;
}

export class PdfProcessingError extends Error {
  constructor(public readonly code: 'invalid' | 'password' | 'corrupt', message: string) {
    super(message);
    this.name = 'PdfProcessingError';
  }
}

export const PDF_READ_ERROR = "This file couldn't be read. Please upload a valid PDF.";
export const PDF_PASSWORD_ERROR = "This PDF is password-protected and can't be processed. Please upload an unlocked version.";

/**
 * Extract text and page count from a PDF buffer or plain document
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<ExtractedPdfContent> {
  if (!buffer || buffer.length === 0) {
    throw new PdfProcessingError('invalid', PDF_READ_ERROR);
  }

  // The PDF header may be preceded by a short binary/comment prefix.
  if (!buffer.subarray(0, 1024).toString('ascii').includes('%PDF-')) {
    throw new PdfProcessingError('invalid', PDF_READ_ERROR);
  }

  {
    let parsedPageCount: number | null = null;

    // Attempt 1: pdfjs-dist (Standard compliant PDF parser)
    try {
      const uint8 = new Uint8Array(buffer);
      const loadingTask = pdfjsLib.getDocument({
        data: uint8,
        useSystemFonts: true,
      });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages || 1;
      parsedPageCount = numPages;
      const pageTexts: string[] = [];

      for (let p = 1; p <= numPages; p++) {
        try {
          const page = await pdfDoc.getPage(p);
          const content = await page.getTextContent();
          const pStr = content.items.map((it: any) => it.str || '').join(' ');
          if (pStr.trim()) pageTexts.push(pStr.trim());
        } catch {
          // ignore single page failure
        }
      }

      const combined = pageTexts.join('\n\n');
      if (combined.trim().length > 10) {
        return {
          text: combined.trim(),
          pageCount: numPages,
        };
      }
    } catch (error: any) {
      if (String(error?.name || '').toLowerCase().includes('password')) {
        throw new PdfProcessingError('password', PDF_PASSWORD_ERROR);
      }
    }

    // Attempt 2: pdf-parse
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      const text = result?.text ? result.text.trim() : '';
      const pageCount = result?.total || 1;

      if (text.length > 10) {
        return {
          text,
          pageCount,
        };
      }
    } catch (error: any) {
      if (String(error?.name || '').toLowerCase().includes('password') || String(error?.message || '').toLowerCase().includes('password')) {
        throw new PdfProcessingError('password', PDF_PASSWORD_ERROR);
      }
    }

    if (parsedPageCount !== null) {
      return { text: '', pageCount: parsedPageCount };
    }

    throw new PdfProcessingError('corrupt', PDF_READ_ERROR);
  }
}

/**
 * Generates a valid standard PDF 1.4 binary buffer with readable contract text
 */
export function generateValidContractPdf(title: string, contentLines: string[]): Buffer {
  const pages: string[][] = [];
  const linesPerPage = 38;

  for (let i = 0; i < contentLines.length; i += linesPerPage) {
    pages.push(contentLines.slice(i, i + linesPerPage));
  }
  if (pages.length === 0) {
    pages.push([title]);
  }

  // We construct standard PDF objects
  const objects: string[] = [];

  // 1 0 obj: Catalog
  objects.push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  // Page object IDs will start at 4
  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];

  let currentObjId = 4;
  for (let i = 0; i < pages.length; i++) {
    pageObjIds.push(currentObjId++);
    contentObjIds.push(currentObjId++);
  }

  // 2 0 obj: Pages
  const kidsStr = pageObjIds.map(id => `${id} 0 R`).join(' ');
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [ ${kidsStr} ] /Count ${pages.length} >>\nendobj\n`);

  // 3 0 obj: Font
  objects.push(`3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);

  // Add Page objects and Content Streams
  for (let i = 0; i < pages.length; i++) {
    const pObjId = pageObjIds[i];
    const cObjId = contentObjIds[i];
    const lines = pages[i];

    // Build text stream
    let streamBody = 'BT\n/F1 11 Tf\n50 750 Td\n14 TL\n';
    if (i === 0) {
      streamBody = `BT\n/F1 16 Tf\n50 750 Td\n18 TL\n(${escapePdfText(title)}) Tj T*\n/F1 10 Tf\n(Page ${i + 1} of ${pages.length}) Tj T* T*\n/F1 11 Tf\n14 TL\n`;
    } else {
      streamBody = `BT\n/F1 10 Tf\n50 760 Td\n(${escapePdfText(title)} - Page ${i + 1}) Tj T* T*\n/F1 11 Tf\n14 TL\n`;
    }

    for (const line of lines) {
      const sanitized = escapePdfText(line);
      streamBody += `(${sanitized}) Tj T*\n`;
    }
    streamBody += 'ET\n';

    const streamLength = Buffer.byteLength(streamBody, 'utf-8');

    // Page Object
    objects.push(`${pObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${cObjId} 0 R >>\nendobj\n`);

    // Stream Object
    objects.push(`${cObjId} 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamBody}endstream\nendobj\n`);
  }

  // Assemble PDF file
  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const xrefOffsets: number[] = [0];

  for (const obj of objects) {
    xrefOffsets.push(Buffer.byteLength(pdf, 'utf-8'));
    pdf += obj;
  }

  const startxref = Buffer.byteLength(pdf, 'utf-8');
  pdf += `xref\n0 ${xrefOffsets.length}\n0000000000 65535 f \n`;

  for (let i = 1; i < xrefOffsets.length; i++) {
    const offsetStr = String(xrefOffsets[i]).padStart(10, '0');
    pdf += `${offsetStr} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${xrefOffsets.length} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf-8');
}

function escapePdfText(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ');
}
