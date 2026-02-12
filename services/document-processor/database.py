"""
Database operations for Document Processor Service
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor, Json
import uuid

logger = logging.getLogger(__name__)


class Database:
    """Database connection and operations"""
    
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
        self.conn = None
    
    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(self.connection_string)
            logger.info("✅ Connected to database")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {str(e)}")
            raise
    
    def disconnect(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
            logger.info("Database connection closed")
    
    def create_document(self, filename: str, file_path: str, file_size: int) -> str:
        """
        Create a new document record
        
        Returns:
            Document UUID
        """
        try:
            with self.conn.cursor() as cur:
                document_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO documents (document_id, filename, file_path, file_size, status)
                    VALUES (%s, %s, %s, %s, 'pending')
                    RETURNING document_id
                """, (document_id, filename, file_path, file_size))
                self.conn.commit()
                logger.info(f"Created document record: {document_id}")
                return document_id
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error creating document: {str(e)}")
            raise
    
    def update_document_status(
        self,
        document_id: str,
        status: str,
        metadata: Optional[Dict] = None,
        error_message: Optional[str] = None
    ):
        """Update document status and metadata"""
        try:
            with self.conn.cursor() as cur:
                if status == "completed":
                    cur.execute("""
                        UPDATE documents
                        SET status = %s, processed_at = NOW(), metadata = %s
                        WHERE document_id = %s
                    """, (status, Json(metadata) if metadata else None, document_id))
                elif status == "failed":
                    cur.execute("""
                        UPDATE documents
                        SET status = %s, error_message = %s
                        WHERE document_id = %s
                    """, (status, error_message, document_id))
                else:
                    cur.execute("""
                        UPDATE documents
                        SET status = %s
                        WHERE document_id = %s
                    """, (status, document_id))
                
                self.conn.commit()
                logger.info(f"Updated document {document_id} status to {status}")
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error updating document status: {str(e)}")
            raise
    
    def create_chunk(self, document_id: str, chunk_index: int, content: str):
        """Create a document chunk record"""
        try:
            with self.conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO document_chunks (document_id, chunk_index, content)
                    VALUES (%s, %s, %s)
                """, (document_id, chunk_index, content))
                self.conn.commit()
        except Exception as e:
            self.conn.rollback()
            logger.error(f"Error creating chunk: {str(e)}")
            raise
    
    def get_documents(self, status: Optional[str] = None) -> List[Dict]:
        """Get all documents, optionally filtered by status"""
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                if status:
                    cur.execute("""
                        SELECT document_id, filename, file_size, uploaded_at, 
                               processed_at, status, metadata
                        FROM documents
                        WHERE status = %s
                        ORDER BY uploaded_at DESC
                    """, (status,))
                else:
                    cur.execute("""
                        SELECT document_id, filename, file_size, uploaded_at,
                               processed_at, status, metadata
                        FROM documents
                        ORDER BY uploaded_at DESC
                    """)
                
                return [dict(row) for row in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error getting documents: {str(e)}")
            return []
    
    def get_document(self, document_id: str) -> Optional[Dict]:
        """Get a single document by ID"""
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT *
                    FROM documents
                    WHERE document_id = %s
                """, (document_id,))
                
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error getting document: {str(e)}")
            return None
    
    def get_document_by_filename(self, filename: str) -> Optional[Dict]:
        """Get document by filename"""
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT *
                    FROM documents
                    WHERE filename = %s
                    ORDER BY uploaded_at DESC
                    LIMIT 1
                """, (filename,))
                
                row = cur.fetchone()
                return dict(row) if row else None
        except Exception as e:
            logger.error(f"Error getting document by filename: {str(e)}")
            return None
    
    def get_chunks(self, document_id: str) -> List[Dict]:
        """Get all chunks for a document"""
        try:
            with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT chunk_id, chunk_index, content, created_at
                    FROM document_chunks
                    WHERE document_id = %s
                    ORDER BY chunk_index
                """, (document_id,))
                
                return [dict(row) for row in cur.fetchall()]
        except Exception as e:
            logger.error(f"Error getting chunks: {str(e)}")
            return []
