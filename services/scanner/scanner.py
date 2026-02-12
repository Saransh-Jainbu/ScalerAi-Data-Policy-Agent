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
                WHERE status IN ('active', 'pending')
            """)
            rules = cur.fetchall()

            for rule in rules:
                try:
                    rule_id, name, logic_type, desc, params_json = rule
                    
                    # Parse JSON params
                    if isinstance(params_json, str):
                        params = json.loads(params_json)
                    else:
                        params = params_json if isinstance(params_json, dict) else {}
                    
                    logger.info(f"Rule: {name}, Params: {params}")
                    
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
                    target_cur = conn.cursor() 
                    try:
                        target_cur.execute(query)
                        failed_rows = target_cur.fetchall()
                    except Exception as sqle:
                        logger.error(f"SQL Error for rule {name}: {sqle}")
                        conn.rollback() # Fix broken transaction
                        continue
                    finally:
                        target_cur.close()

                    # 4. Log Violations
                    if failed_rows:
                        logger.info(f"Found {len(failed_rows)} violations for {name}")
                        table_name = params.get('table', 'unknown')
                        for row in failed_rows:
                            # Extract record ID (first column, usually primary key)
                            record_id = str(row[0]) if row else 'unknown'
                            evidence = {"raw_data": str(row)}
                            cur.execute("""
                                INSERT INTO violations (rule_id, record_id, table_name, severity, status, evidence, explanation)
                                VALUES (%s, %s, %s, 'high', 'open', %s, %s)
                                RETURNING violation_id
                            """, (rule_id, record_id, table_name, json.dumps(evidence), f"Violation of rule: {name}"))
                            vid = cur.fetchone()[0]
                            violations_found.append({"id": vid, "rule": name})
                except Exception as rule_err:
                    logger.error(f"Error processing rule {name}: {rule_err}")
                    continue
                    
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
