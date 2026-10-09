/**
 * Browser & Node compatible PDF text and page extractor using pdfjs-dist
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

export interface ParsedPdfResult {
  text: string;
  pageCount: number;
  pageTexts: string[];
}

export type PdfParseErrorCode = 'invalid' | 'password' | 'corrupt';

export class PdfParseError extends Error {
  constructor(public readonly code: PdfParseErrorCode, message: string) {
    super(message);
    this.name = 'PdfParseError';
  }
}

export const PDF_READ_ERROR = "This file couldn't be read. Please upload a valid PDF.";
export const PDF_PASSWORD_ERROR = "This PDF is password-protected and can't be processed. Please upload an unlocked version.";
export const PDF_SCANNED_ERROR = 'This PDF appears to be a scanned image with no selectable text. OCR is not currently supported.';
export const PDF_SHORT_WARNING = 'This PDF contains very little text and may not be a complete contract. Please upload a fuller document.';

function hasPdfHeader(bytes: Uint8Array): boolean {
  const header = new TextDecoder('ascii').decode(bytes.subarray(0, 1024));
  return header.includes('%PDF-');
}

/**
 * Extract readable text and page count from a File or ArrayBuffer in the browser
 */
export async function extractTextFromPdfFile(file: File | Blob | ArrayBuffer): Promise<ParsedPdfResult> {
  try {
    let arrayBuffer: ArrayBuffer;
    if (file instanceof ArrayBuffer) {
      arrayBuffer = file;
    } else {
      arrayBuffer = await file.arrayBuffer();
    }

    const uint8Array = new Uint8Array(arrayBuffer);
    
    // The PDF header may be preceded by a short binary/comment prefix.
    if (!hasPdfHeader(uint8Array)) {
      throw new PdfParseError('invalid', PDF_READ_ERROR);
    }

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useSystemFonts: true,
    });

    let pdfDoc;
    try {
      pdfDoc = await loadingTask.promise;
    } catch (error: any) {
      const errorName = String(error?.name || '').toLowerCase();
      if (errorName.includes('password')) {
        throw new PdfParseError('password', PDF_PASSWORD_ERROR);
      }
      throw new PdfParseError('corrupt', PDF_READ_ERROR);
    }
    const numPages = pdfDoc.numPages || 1;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageStr = textContent.items
          .map((item: any) => (item?.str !== undefined ? item.str : ''))
          .join(' ');
        pageTexts.push(pageStr.trim());
      } catch (pageErr) {
        console.warn(`[PDF Parser] Error reading page ${pageNum}:`, pageErr);
        pageTexts.push('');
      }
    }

    const fullText = pageTexts.filter(Boolean).join('\n\n');

    return {
      text: fullText,
      pageCount: numPages,
      pageTexts,
    };
  } catch (err) {
    if (err instanceof PdfParseError) throw err;
    console.error('[PDF Parser] Failed to parse with pdfjs-dist:', err);
    throw new PdfParseError('corrupt', PDF_READ_ERROR);
  }
}
