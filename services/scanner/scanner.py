import logging
import psycopg2
from typing import List, Dict, Any
from query_generator import QueryGenerator
import os
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database Info
DB_HOST = os.getenv("DB_HOST", "postgres")
DB_NAME = os.getenv("DB_NAME", "compliance")
DB_USER = os.getenv("DB_USER", "admin")
DB_PASS = os.getenv("DB_PASS", "admin123")
DB_PORT = os.getenv("DB_PORT", "5432")

class ComplianceScanner:
    def __init__(self):
        self.generator = QueryGenerator()
        
    def get_connection(self):
        return psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )

    def scan_all_tables(self) -> List[Dict[str, Any]]:
        """
        Main logic: Check ALL active rules against their target tables.
        Returns list of new violations.
        """
        conn = self.get_connection()
        cur = conn.cursor()
        violations_found = []

        try:
            # 1. Fetch ACTIVATE rules
            logger.info("Fetching active rules...")
            cur.execute("""
                SELECT rule_id, rule_name, rule_type, description, parameters 
                FROM compliance_rules 
                WHERE status = 'active'
            """)
            rules = cur.fetchall()

            for rule in rules:
                rule_id, name, logic_type, desc, params_json = rule
                
                # Parse JSON params
                try:
                    params = json.loads(params_json)
                except:
                    params = params_json if isinstance(params_json, dict) else {}
                
                rule_obj = {
                    "rule_type": logic_type,
                    "parameters": params
                }
                
                # 2. Generate SQL Query
                query = self.generator.generate_violation_query(rule_obj)
                
                if not query:
                    logger.warning(f"Could not generate query for rule {rule_id}")
                    continue

                logger.info(f"Checking rule: {name} ({logic_type})")
                
                # 3. Execute Query (Find Failing Rows)
                # WARNING: In production, limit this to avoid massive result sets!
                target_cur = conn.cursor() 
                target_cur.execute(query)
                failed_rows = target_cur.fetchall()
                target_cur.close()

                # 4. Log Violations
                for row in failed_rows:
                    # Capture evidence (convert row tuple to string/json)
                    evidence = {"raw_data": str(row)}
                    
                    # Insert into violations table
                    cur.execute("""
                        INSERT INTO violations (rule_id, severity, status, evidence, explanation)
                        VALUES (%s, 'high', 'open', %s, %s)
                        RETURNING violation_id
                    """, (rule_id, json.dumps(evidence), f"Violation of rule: {desc}"))
                    
                    vid = cur.fetchone()[0]
                    violations_found.append({"id": vid, "rule": name})
                    
            conn.commit()
            return violations_found
            
        except Exception as e:
            conn.rollback()
            logger.error(f"Scan error: {str(e)}")
            return []
        finally:
            cur.close()
            conn.close()

if __name__ == "__main__":
    scanner = ComplianceScanner()
    new_violations = scanner.scan_all_tables()
    print(f"Scan complete. Found {len(new_violations)} new violations.")
