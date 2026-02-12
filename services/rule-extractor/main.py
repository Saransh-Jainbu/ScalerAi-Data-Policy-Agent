from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from typing import List, Optional
from extractor import RuleExtractor
import psycopg2
import os
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="AI Rule Extractor Service")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Extractor
extractor = RuleExtractor()

# Database Connection (from env)
DB_HOST = os.getenv("DB_HOST", "postgres")
DB_NAME = os.getenv("DB_NAME", "compliance")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASS", "admin123")
DB_PORT = os.getenv("DB_PORT", "5432")

def get_db_connection():
    return psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS,
        port=DB_PORT
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "rule-extractor"}

@app.post("/extract/{document_id}")
async def extract_rules_from_document(document_id: str):
    """
    Trigger rule extraction for a document.
    1. Fetch chunks from database.
    2. Process chunks with AI.
    3. Save rules to database.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Get chunks for document
        cur.execute("SELECT chunk_id, content FROM document_chunks WHERE document_id = %s", (document_id,))
        chunks = cur.fetchall()
        
        if not chunks:
            raise HTTPException(status_code=404, detail="No chunks found for document.")
            
        extracted_rules = []

        logger.info(f"Processing {len(chunks)} chunks for document {document_id}")

        for chunk_id, content in chunks:
            # AI Inference - now returns an array of rules
            rules = extractor.extract_rule(content, document_id)
            
            if rules:
                for rule in rules:
                    if not rule:
                        continue
                    # Insert into compliance_rules table
                    cur.execute("""
                        INSERT INTO compliance_rules (
                            rule_name, rule_type, description, parameters, 
                            confidence_score, source_document, status
                        ) 
                        VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                        RETURNING rule_id
                    """, (
                        rule.get("rule_name", "Unknown Rule"),
                        rule.get("rule_type", "custom"),
                        rule.get("description", ""),
                        json.dumps(rule.get("parameters", {})),
                        rule.get("confidence_score", 0.5),
                        document_id
                    ))
                    new_rule_id = cur.fetchone()[0]
                    extracted_rules.append({"id": new_rule_id, "name": rule["rule_name"]})
                
        conn.commit()
        return {"status": "success", "extracted_count": len(extracted_rules), "rules": extracted_rules}
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.get("/rules")
async def list_rules():
    """
    List all extracted rules from the database.
    """
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            SELECT rule_id, rule_name, rule_type, description, parameters, 
                   confidence_score, source_document, status 
            FROM compliance_rules
            ORDER BY created_at DESC
        """)
        rows = cur.fetchall()
        
        rules = []
        for row in rows:
            rules.append({
                "rule_id": row[0],
                "rule_name": row[1],
                "rule_type": row[2],
                "description": row[3],
                "parameters": row[4],  # JSONB is auto-converted by psycopg2
                "confidence_score": row[5],
                "source_document": row[6],
                "status": row[7]
            })
            
        return {"rules": rules, "count": len(rules)}
    except Exception as e:
        logger.error(f"Error listing rules: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8082)
