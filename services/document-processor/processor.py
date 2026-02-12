"""
Document Processor Service
Handles PDF parsing, OCR, and text chunking for the compliance platform
"""

import os
import logging
from pathlib import Path
from typing import List, Dict, Any
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import hashlib
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Processes PDF documents and extracts text content"""
    
    def __init__(self, documents_dir: str = "/app/documents"):
        self.documents_dir = Path(documents_dir)
        self.documents_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Document processor initialized. Watching: {self.documents_dir}")
    
    def process_pdf(self, file_path: Path) -> Dict[str, Any]:
        """
        Process a PDF file and extract text content
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            Dictionary containing extracted text and metadata
        """
        logger.info(f"Processing PDF: {file_path.name}")
        
        try:
            # Open PDF
            doc = fitz.open(file_path)
            
            # Extract metadata
            metadata = {
                "filename": file_path.name,
                "file_path": str(file_path),
                "file_size": file_path.stat().st_size,
                "page_count": len(doc),
                "author": doc.metadata.get("author", ""),
                "title": doc.metadata.get("title", ""),
                "subject": doc.metadata.get("subject", ""),
                "created_date": doc.metadata.get("creationDate", ""),
                "processed_at": datetime.utcnow().isoformat()
            }
            
            # Extract text from each page
            pages = []
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Try text extraction first
                text = page.get_text()
                
                # If no text found, try OCR
                if not text.strip():
                    logger.info(f"Page {page_num + 1}: No text found, attempting OCR...")
                    text = self._ocr_page(page)
                
                pages.append({
                    "page_number": page_num + 1,
                    "text": text,
                    "char_count": len(text)
                })
            
            doc.close()
            
            # Calculate document hash
            doc_hash = self._calculate_hash(file_path)
            
            result = {
                "metadata": metadata,
                "pages": pages,
                "total_chars": sum(p["char_count"] for p in pages),
                "document_hash": doc_hash,
                "status": "success"
            }
            
            logger.info(f"Successfully processed {file_path.name}: {len(pages)} pages, {result['total_chars']} characters")
            return result
            
        except Exception as e:
            logger.error(f"Error processing {file_path.name}: {str(e)}")
            return {
                "metadata": {"filename": file_path.name, "file_path": str(file_path)},
                "pages": [],
                "status": "failed",
                "error": str(e)
            }
    
    def _ocr_page(self, page) -> str:
        """
        Perform OCR on a PDF page
        
        Args:
            page: PyMuPDF page object
            
        Returns:
            Extracted text from OCR
        """
        try:
            # Render page to image
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            # Perform OCR
            text = pytesseract.image_to_string(img)
            return text
            
        except Exception as e:
            logger.error(f"OCR failed: {str(e)}")
            return ""
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """
        Split text into overlapping chunks for better context preservation
        
        Args:
            text: Input text to chunk
            chunk_size: Target size of each chunk in characters
            overlap: Number of overlapping characters between chunks
            
        Returns:
            List of text chunks
        """
        if not text:
            return []
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            
            # Try to break at sentence boundary
            if end < text_length:
                # Look for sentence endings within the next 100 chars
                search_end = min(end + 100, text_length)
                chunk_text = text[start:search_end]
                
                # Find last sentence ending
                for delimiter in ['. ', '! ', '? ', '\n\n']:
                    last_delim = chunk_text.rfind(delimiter)
                    if last_delim != -1:
                        end = start + last_delim + len(delimiter)
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = end - overlap if end < text_length else text_length
        
        logger.info(f"Created {len(chunks)} chunks from {text_length} characters")
        return chunks
    
    def process_and_chunk(self, file_path: Path, chunk_size: int = 500) -> Dict[str, Any]:
        """
        Process PDF and create chunks
        
        Args:
            file_path: Path to PDF file
            chunk_size: Size of text chunks
            
        Returns:
            Dictionary with processed data and chunks
        """
        # Process PDF
        result = self.process_pdf(file_path)
        
        if result["status"] != "success":
            return result
        
        # Combine all page text
        full_text = "\n\n".join(page["text"] for page in result["pages"])
        
        # Create chunks
        chunks = self.chunk_text(full_text, chunk_size=chunk_size)
        
        result["chunks"] = [
            {
                "chunk_index": i,
                "content": chunk,
                "char_count": len(chunk)
            }
            for i, chunk in enumerate(chunks)
        ]
        result["total_chunks"] = len(chunks)
        
        return result
    
    def _calculate_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def watch_directory(self) -> List[Path]:
        """
        Get list of PDF files in the documents directory
        
        Returns:
            List of PDF file paths
        """
        pdf_files = list(self.documents_dir.glob("*.pdf"))
        logger.info(f"Found {len(pdf_files)} PDF files in {self.documents_dir}")
        return pdf_files


if __name__ == "__main__":
    # Test the processor
    processor = DocumentProcessor()
    
    # Process all PDFs in the directory
    pdf_files = processor.watch_directory()
    
    for pdf_file in pdf_files:
        logger.info(f"\n{'='*60}")
        logger.info(f"Processing: {pdf_file.name}")
        logger.info(f"{'='*60}")
        
        result = processor.process_and_chunk(pdf_file)
        
        if result["status"] == "success":
            logger.info(f"✅ Success!")
            logger.info(f"   Pages: {result['metadata']['page_count']}")
            logger.info(f"   Characters: {result['total_chars']:,}")
            logger.info(f"   Chunks: {result['total_chunks']}")
        else:
            logger.error(f"❌ Failed: {result.get('error', 'Unknown error')}")
