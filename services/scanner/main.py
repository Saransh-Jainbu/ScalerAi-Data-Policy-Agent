from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from typing import List, Optional
from scanner import ComplianceScanner
import os

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="Violation Scanner Service")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Scanner
scanner = ComplianceScanner()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "violation-scanner"}

@app.get("/violations")
async def list_violations(severity: Optional[str] = None, status: Optional[str] = None):
    """
    List all detected violations.
    """
    conn = scanner.get_connection()
    cur = conn.cursor()
    try:
        query = """
            SELECT v.violation_id, v.severity, v.status, v.evidence, v.explanation, v.created_at, r.rule_name, r.rule_type
            FROM violations v
            JOIN compliance_rules r ON v.rule_id = r.rule_id
        """
        params = []
        conditions = []
        
        if severity:
            conditions.append("v.severity = %s")
            params.append(severity)
            
        if status:
            conditions.append("v.status = %s")
            params.append(status)
            
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
            
        query += " ORDER BY v.created_at DESC"
        
        cur.execute(query, tuple(params))
        rows = cur.fetchall()
        
        violations = []
        for row in rows:
            violations.append({
                "violation_id": row[0],
                "severity": row[1],
                "status": row[2],
                "evidence": row[3], # JSONB
                "explanation": row[4],
                "created_at": row[5].isoformat(),
                "rule_name": row[6],
                "rule_type": row[7]
            })
            
        return {"violations": violations, "count": len(violations)}
    except Exception as e:
        logger.error(f"Error fetching violations: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@app.post("/scan")
async def trigger_scan(scan_all: bool = True):
    """
    Manually trigger a full compliance scan.
    """
    try:
        logger.info("Starting manual scan...")
        violations = scanner.scan_all_tables()
        
        return {
            "status": "success",
            "violations_found": len(violations),
            "new_violations": violations
        }
    except Exception as e:
        logger.error(f"Error during scan: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8083)
