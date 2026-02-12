# 🏗️ Platform Architecture

Complete technical architecture documentation for the AI-Driven Data Policy Enforcement Platform.

---

## 🎯 System Overview

The platform follows a **microservices architecture** with event-driven processing and real-time monitoring.

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React      │  │   Grafana    │  │  Prometheus  │          │
│  │  Dashboard   │  │  Monitoring  │  │   Metrics    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FastAPI REST API (Port 8080)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESSING SERVICES                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Document    │  │     Rule      │  │   Violation   │       │
│  │   Processor   │→ │   Extractor   │→ │    Scanner    │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
└──────────┼──────────────────┼──────────────────┼────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │PostgreSQL│  │  Ollama  │  │ ChromaDB │  │  Redis   │        │
│  │   +      │  │  LLM     │  │  Vector  │  │  Queue   │        │
│  │ pgvector │  │  Server  │  │   Store  │  │          │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. Document Ingestion Flow

```
PDF Upload → Document Processor → Text Extraction → Chunking → PostgreSQL
                                         ↓
                                    OCR (if needed)
                                         ↓
                                   ChromaDB (embeddings)
```

**Steps:**
1. User uploads PDF via API or drops file in `data/documents/`
2. Document Processor service:
   - Parses PDF with PyMuPDF
   - Falls back to Tesseract OCR for scanned pages
   - Extracts metadata (author, date, page count)
   - Chunks text intelligently (sentence boundaries)
3. Stores in PostgreSQL:
   - Document metadata in `documents` table
   - Text chunks in `document_chunks` table
4. Generates embeddings and stores in ChromaDB for RAG

### 2. Rule Extraction Flow

```
Document Chunks → spaCy NER → Entity Extraction → LLM Prompting → Structured Rules
                                                         ↓
                                                  Confidence Scoring
                                                         ↓
                                                  Human Review (if needed)
                                                         ↓
                                                  PostgreSQL (compliance_rules)
```

**Steps:**
1. Retrieve document chunks from database
2. spaCy extracts entities:
   - Obligations ("must", "shall", "required")
   - Conditions ("if", "when", "unless")
   - Thresholds (numbers, dates, percentages)
   - Data categories (PII, financial, health)
3. LLM (Llama 3.1) structures rules:
   - Converts natural language to JSON schema
   - Maps to database tables/columns
   - Assigns rule type (threshold, date_difference, etc.)
4. Confidence scoring (0.0-1.0)
5. Low-confidence rules flagged for human review
6. Approved rules stored in `compliance_rules` table

### 3. Violation Detection Flow

```
Active Rules → Query Generation → Database Scan → Violation Detection → Logging
                                                         ↓
                                                  Explanation Generation
                                                         ↓
                                                  Alert/Notification
```

**Steps:**
1. Scanner retrieves active rules from database
2. Generates SQL queries from rule templates
3. Executes queries against target database
4. Detects violations (records not meeting criteria)
5. Generates human-readable explanations:
   - What was violated
   - Evidence (actual data values)
   - Policy citation (source document, page number)
   - Recommended remediation
6. Stores in `violations` table
7. Sends alerts (email, Slack, etc.)

---

## 🧩 Component Architecture

### 1. Document Processor Service

**Technology:** Python + FastAPI + PyMuPDF + Tesseract

**Responsibilities:**
- PDF parsing and text extraction
- OCR for scanned documents
- Intelligent text chunking
- Metadata extraction
- Document storage management

**Key Files:**
- `processor.py` - Core PDF processing logic
- `main.py` - FastAPI endpoints
- `database.py` - PostgreSQL operations

**API Endpoints:**
- `POST /process` - Upload and process PDF
- `GET /documents` - List all documents
- `GET /documents/{id}` - Get document details
- `POST /scan` - Scan directory for new PDFs

### 2. Rule Extractor Service

**Technology:** Python + spaCy + Ollama (Llama 3.1) + LangChain

**Responsibilities:**
- NLP entity extraction
- LLM-based rule structuring
- Confidence scoring
- Rule validation
- Human review interface

**Rule Types Supported:**
1. **Threshold Rules** - Numeric comparisons
   ```json
   {"type": "threshold", "column": "age", "operator": ">=", "value": 18}
   ```

2. **Date Difference Rules** - Time-based constraints
   ```json
   {"type": "date_difference", "column1": "training_date", 
    "column2": "joining_date", "max_days": 30}
   ```

3. **Not Null Rules** - Required fields
   ```json
   {"type": "not_null", "columns": ["email", "phone"]}
   ```

4. **Pattern Rules** - Regex matching
   ```json
   {"type": "pattern", "column": "ssn", "pattern": "^\\d{3}-\\d{2}-\\d{4}$"}
   ```

5. **Role-Based Rules** - Access control
   ```json
   {"type": "role_based", "table": "sensitive_data", 
    "allowed_roles": ["admin", "compliance_officer"]}
   ```

6. **Cross-Table Rules** - Referential integrity
   ```json
   {"type": "cross_table", "table1": "employees", "table2": "departments",
    "join_column": "dept_id"}
   ```

### 3. Violation Scanner Service

**Technology:** Python + SQLAlchemy + Trino (optional)

**Responsibilities:**
- Query generation from rules
- Database scanning (batch and real-time)
- Violation detection
- Explanation generation
- Alert management

**Scanning Modes:**
- **Batch Mode:** Scheduled scans (daily, weekly)
- **Incremental Mode:** Only new/modified records
- **Real-time Mode:** Streaming with Apache Flink (future)

### 4. API Service

**Technology:** Python + FastAPI

**Responsibilities:**
- Unified REST API for all services
- Authentication/authorization
- Rate limiting
- Request validation
- Response formatting

**API Documentation:** Auto-generated at `/docs` (Swagger UI)

---

## 💾 Database Schema

### Core Tables

#### `compliance_rules`
Stores extracted compliance rules

| Column | Type | Description |
|--------|------|-------------|
| rule_id | UUID | Primary key |
| rule_name | VARCHAR(255) | Human-readable name |
| rule_type | VARCHAR(50) | Type (threshold, date_difference, etc.) |
| parameters | JSONB | Rule-specific parameters |
| source_document | VARCHAR(500) | Source PDF filename |
| source_page | INTEGER | Page number in source |
| confidence_score | DECIMAL(3,2) | AI confidence (0.0-1.0) |
| status | VARCHAR(20) | pending, active, archived |
| created_at | TIMESTAMP | Creation timestamp |

#### `violations`
Stores detected violations

| Column | Type | Description |
|--------|------|-------------|
| violation_id | UUID | Primary key |
| rule_id | UUID | Foreign key to compliance_rules |
| record_id | VARCHAR(255) | ID of violating record |
| table_name | VARCHAR(100) | Source table |
| severity | VARCHAR(20) | critical, high, medium, low |
| status | VARCHAR(20) | open, acknowledged, resolved |
| explanation | TEXT | Human-readable explanation |
| evidence | JSONB | Actual data values |
| detected_at | TIMESTAMP | Detection timestamp |

#### `documents`
Stores uploaded policy documents

| Column | Type | Description |
|--------|------|-------------|
| document_id | UUID | Primary key |
| filename | VARCHAR(500) | Original filename |
| file_size | BIGINT | Size in bytes |
| status | VARCHAR(20) | pending, processing, completed |
| metadata | JSONB | Document metadata |
| uploaded_at | TIMESTAMP | Upload timestamp |

#### `document_chunks`
Stores text chunks for RAG

| Column | Type | Description |
|--------|------|-------------|
| chunk_id | UUID | Primary key |
| document_id | UUID | Foreign key to documents |
| chunk_index | INTEGER | Chunk sequence number |
| content | TEXT | Chunk text content |
| embedding | VECTOR(384) | Vector embedding |

---

## 🔐 Security Architecture

### Authentication & Authorization
- **API Keys:** For service-to-service communication
- **JWT Tokens:** For user authentication (future)
- **RBAC:** Role-based access control (future)

### Data Security
- **Encryption at Rest:** PostgreSQL encryption
- **Encryption in Transit:** TLS for all connections
- **Secrets Management:** Environment variables (Docker secrets in production)

### Audit Trail
- All rule changes logged in `audit_log` table
- Violation status changes tracked
- User actions recorded with timestamps

---

## 📊 Monitoring & Observability

### Metrics (Prometheus)

**Custom Metrics:**
```
compliance_rules_total{status="active"}
compliance_violations_detected{severity="critical"}
compliance_scan_duration_seconds
compliance_documents_processed_total
compliance_llm_api_calls_total
compliance_llm_tokens_used_total
```

### Dashboards (Grafana)

**Pre-built Dashboards:**
1. **System Health**
   - CPU, memory, disk usage
   - Container status
   - Network traffic

2. **Compliance Metrics**
   - Active rules count
   - Violations by severity
   - Compliance score trends
   - Top violated rules

3. **Performance**
   - Query execution times
   - Document processing throughput
   - LLM response times
   - API latency

### Logging (ELK Stack - Optional)

**Log Aggregation:**
- Centralized logging with Elasticsearch
- Log visualization with Kibana
- Structured JSON logs
- Log retention policies

---

## 🚀 Scalability Considerations

### Horizontal Scaling

**Stateless Services:**
- Document Processor: Scale to N instances
- Rule Extractor: Scale to N instances
- Scanner: Scale to N instances

**Stateful Services:**
- PostgreSQL: Read replicas for queries
- Redis: Cluster mode for high availability
- ChromaDB: Sharding for large vector stores

### Performance Optimization

**Database:**
- Indexes on frequently queried columns
- Partitioning for large tables (violations by date)
- Connection pooling
- Query result caching

**LLM:**
- Response caching (Redis)
- Batch processing
- Model quantization (4-bit for faster inference)
- GPU acceleration (NVIDIA CUDA)

**Document Processing:**
- Parallel processing with worker pools
- Async I/O for file operations
- Streaming for large files

---

## 🔄 Deployment Strategies

### Development (Local)
- Docker Compose
- All services on single machine
- SQLite for testing (optional)

### Staging (Cloud)
- Kubernetes (GKE, EKS, AKS)
- Managed databases (Cloud SQL, RDS)
- Managed LLM (Vertex AI, Bedrock)

### Production (Enterprise)
- Multi-region Kubernetes
- High-availability databases
- Auto-scaling
- Disaster recovery
- Blue-green deployments

---

## 📈 Future Enhancements

### Planned Features
- [ ] Real-time streaming with Apache Flink
- [ ] Multi-tenancy support
- [ ] Custom rule type extensibility
- [ ] ML-based rule suggestion
- [ ] Integration APIs (Jira, ServiceNow, Slack)
- [ ] Advanced analytics with Apache Superset
- [ ] Data lineage tracking with OpenLineage
- [ ] Policy-as-code with OPA

### Research Areas
- Fine-tuning LLMs for compliance domain
- Graph-based rule relationships (Neo4j)
- Federated learning for privacy
- Blockchain for immutable audit logs

---

## 📚 References

### Technologies Used
- **PyMuPDF:** https://pymupdf.readthedocs.io/
- **Tesseract OCR:** https://github.com/tesseract-ocr/tesseract
- **spaCy:** https://spacy.io/
- **Ollama:** https://ollama.ai/
- **ChromaDB:** https://www.trychroma.com/
- **FastAPI:** https://fastapi.tiangolo.com/
- **PostgreSQL:** https://www.postgresql.org/
- **pgvector:** https://github.com/pgvector/pgvector

### Compliance Standards
- GDPR (General Data Protection Regulation)
- HIPAA (Health Insurance Portability and Accountability Act)
- SOX (Sarbanes-Oxley Act)
- PCI DSS (Payment Card Industry Data Security Standard)

---

**Built with ❤️ for enterprise compliance**
