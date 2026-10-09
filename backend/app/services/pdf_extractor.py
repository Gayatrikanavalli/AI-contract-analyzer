import io
from typing import Tuple, List, Dict
import fitz  # PyMuPDF


class PDFExtractor:
    """Service to extract text, page numbers, and structural metadata from PDF files."""

    @staticmethod
    def extract_text_with_pages(pdf_bytes: bytes) -> Tuple[str, int, List[Dict[str, any]]]:
        """
        Extract full text and per-page text from PDF byte stream.
        
        Returns:
            Tuple of:
            - full_text (str)
            - page_count (int)
            - pages_data (List[Dict]) with page_number and text
        """
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page_count = len(doc)
        pages_data = []
        full_text_parts = []

        for page_idx in range(page_count):
            page = doc[page_idx]
            page_text = page.get_text("text").strip()
            page_num = page_idx + 1

            pages_data.append({
                "page_number": page_num,
                "text": page_text,
                "char_count": len(page_text)
            })

            if page_text:
                full_text_parts.append(f"--- PAGE {page_num} ---\n{page_text}")

        doc.close()
        full_text = "\n\n".join(full_text_parts)
        return full_text, page_count, pages_data
