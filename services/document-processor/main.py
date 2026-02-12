"""
Document Processor Service - Main Entry Point
FastAPI service for document processing
"""

import os
import logging
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from processor import DocumentProcessor
from database import Database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Document Processor Service",
    description="PDF processing and text extraction for compliance platform",
    version="1.0.0"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
processor = DocumentProcessor(documents_dir="/app/documents")
db = Database(os.getenv("DATABASE_URL", "postgresql://admin:admin123@postgres:5432/compliance"))


@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    logger.info("Starting Document Processor Service...")
    db.connect()
    logger.info("✅ Service ready!")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    logger.info("Shutting down Document Processor Service...")
    db.disconnect()


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "document-processor"}


@app.post("/process")
async def process_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    chunk_size: int = 500
):
    """
    Upload and process a PDF document
    
    Args:
        file: PDF file to process
        chunk_size: Size of text chunks (default: 500 characters)
        
    Returns:
        Processing result with document ID
    """
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        # Save uploaded file
        file_path = Path(f"/app/documents/{file.filename}")
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"Saved uploaded file: {file.filename}")
        
        # Create document record in database
        document_id = db.create_document(
            filename=file.filename,
            file_path=str(file_path),
            file_size=len(content)
        )
        
        # Process document in background
        background_tasks.add_task(
            process_document_task,
            document_id=document_id,
            file_path=file_path,
            chunk_size=chunk_size
        )
        
        return {
            "document_id": str(document_id),
            "filename": file.filename,
            "status": "processing",
            "message": "Document uploaded successfully. Processing in background."
        }
        
    except Exception as e:
        logger.error(f"Error processing upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def process_document_task(document_id: str, file_path: Path, chunk_size: int):
    """
    Background task to process document
    
    Args:
        document_id: Database document ID
        file_path: Path to PDF file
        chunk_size: Chunk size for text splitting
    """
    try:
        logger.info(f"Processing document {document_id}...")
        
        # Update status to processing
        db.update_document_status(document_id, "processing")
        
        # Process and chunk document
        result = processor.process_and_chunk(file_path, chunk_size=chunk_size)
        
        if result["status"] == "success":
            # Store chunks in database
            for chunk in result["chunks"]:
                db.create_chunk(
                    document_id=document_id,
                    chunk_index=chunk["chunk_index"],
                    content=chunk["content"]
                )
            
            # Update document status
            db.update_document_status(
                document_id,
                "completed",
                metadata=result["metadata"]
            )
            
            logger.info(f"✅ Document {document_id} processed successfully!")
            logger.info(f"   Created {result['total_chunks']} chunks")
            
        else:
            # Update with error
            db.update_document_status(
                document_id,
                "failed",
                error_message=result.get("error", "Unknown error")
            )
            logger.error(f"❌ Document {document_id} processing failed")
            
    except Exception as e:
        logger.error(f"Error in background task: {str(e)}")
        db.update_document_status(
            document_id,
            "failed",
            error_message=str(e)
        )


@app.get("/documents")
async def list_documents(status: Optional[str] = None):
    """
    List all documents
    
    Args:
        status: Filter by status (pending, processing, completed, failed)
        
    Returns:
        List of documents
    """
    documents = db.get_documents(status=status)
    return {"documents": documents, "count": len(documents)}


@app.get("/documents/{document_id}")
async def get_document(document_id: str):
    """
    Get document details including chunks
    
    Args:
        document_id: Document UUID
        
    Returns:
        Document details with chunks
    """
    document = db.get_document(document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    chunks = db.get_chunks(document_id)
    
    return {
        "document": document,
        "chunks": chunks,
        "chunk_count": len(chunks)
    }


@app.post("/scan")
async def scan_directory(background_tasks: BackgroundTasks):
    """
    Scan documents directory and process any new PDFs
    
    Returns:
        Number of files found and queued for processing
    """
    pdf_files = processor.watch_directory()
    
    queued = 0
    for pdf_file in pdf_files:
        # Check if already processed
        existing = db.get_document_by_filename(pdf_file.name)
        if not existing:
            # Create document record
            document_id = db.create_document(
                filename=pdf_file.name,
                file_path=str(pdf_file),
                file_size=pdf_file.stat().st_size
            )
            
            # Queue for processing
            background_tasks.add_task(
                process_document_task,
                document_id=document_id,
                file_path=pdf_file,
                chunk_size=500
            )
            queued += 1
    
    return {
        "files_found": len(pdf_files),
        "queued_for_processing": queued,
        "message": f"Queued {queued} new documents for processing"
    }


if __name__ == "__main__":
    # Run the service
    port = int(os.getenv("PORT", "8081"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
