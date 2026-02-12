-- Database initialization script for Compliance Platform
-- This script creates all necessary tables, indexes, and extensions

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Compliance Rules Table
CREATE TABLE IF NOT EXISTS compliance_rules (
    rule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN (
        'threshold', 'date_difference', 'role_based', 
        'not_null', 'pattern', 'cross_table', 'custom'
    )),
    description TEXT,
    parameters JSONB NOT NULL,
    source_document VARCHAR(500),
    source_section VARCHAR(255),
    source_page INTEGER,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'archived', 'rejected')),
    requires_review BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),
    version INTEGER DEFAULT 1
);

-- Rule Execution History
CREATE TABLE IF NOT EXISTS rule_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES compliance_rules(rule_id) ON DELETE CASCADE,
    execution_time TIMESTAMP DEFAULT NOW(),
    records_scanned BIGINT DEFAULT 0,
    violations_found INTEGER DEFAULT 0,
    execution_duration_ms INTEGER,
    status VARCHAR(20) CHECK (status IN ('success', 'failed', 'partial')),
    error_message TEXT
);

-- Violations Table
CREATE TABLE IF NOT EXISTS violations (
    violation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES compliance_rules(rule_id) ON DELETE CASCADE,
    record_id VARCHAR(255) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW(),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'false_positive')),
    explanation TEXT,
    evidence JSONB,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100),
    resolution_notes TEXT
);

-- Documents Table
CREATE TABLE IF NOT EXISTS documents (
    document_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000),
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    metadata JSONB,
    error_message TEXT
);

-- Document Chunks (for RAG)
CREATE TABLE IF NOT EXISTS document_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(document_id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384), -- Dimension for sentence-transformers/all-MiniLM-L6-v2
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    user_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    details JSONB,
    ip_address INET
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Rules indexes
CREATE INDEX IF NOT EXISTS idx_rules_status ON compliance_rules(status);
CREATE INDEX IF NOT EXISTS idx_rules_type ON compliance_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_rules_confidence ON compliance_rules(confidence_score);
CREATE INDEX IF NOT EXISTS idx_rules_created ON compliance_rules(created_at DESC);

-- Violations indexes
CREATE INDEX IF NOT EXISTS idx_violations_rule ON violations(rule_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_violations_severity ON violations(severity);
CREATE INDEX IF NOT EXISTS idx_violations_detected ON violations(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_violations_table ON violations(table_name);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded ON documents(uploaded_at DESC);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert a sample rule
INSERT INTO compliance_rules (
    rule_name, 
    rule_type, 
    description, 
    parameters,
    source_document,
    confidence_score,
    status
) VALUES (
    'Employee Training Deadline',
    'date_difference',
    'Employees must complete cybersecurity training within 30 days of joining',
    '{"table": "employees", "column1": "training_date", "column2": "joining_date", "max_days": 30}'::jsonb,
    'Employee Handbook v2.3',
    0.95,
    'active'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for compliance_rules
DROP TRIGGER IF EXISTS update_rules_updated_at ON compliance_rules;
CREATE TRIGGER update_rules_updated_at
    BEFORE UPDATE ON compliance_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log rule changes to audit log
CREATE OR REPLACE FUNCTION log_rule_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (event_type, entity_type, entity_id, details)
        VALUES ('rule_created', 'compliance_rule', NEW.rule_id, row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (event_type, entity_type, entity_id, details)
        VALUES ('rule_updated', 'compliance_rule', NEW.rule_id, 
                jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW)));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (event_type, entity_type, entity_id, details)
        VALUES ('rule_deleted', 'compliance_rule', OLD.rule_id, row_to_json(OLD)::jsonb);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for audit logging
DROP TRIGGER IF EXISTS audit_rule_changes ON compliance_rules;
CREATE TRIGGER audit_rule_changes
    AFTER INSERT OR UPDATE OR DELETE ON compliance_rules
    FOR EACH ROW
    EXECUTE FUNCTION log_rule_changes();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active violations summary
CREATE OR REPLACE VIEW active_violations_summary AS
SELECT 
    v.severity,
    v.table_name,
    r.rule_name,
    COUNT(*) as violation_count,
    MIN(v.detected_at) as first_detected,
    MAX(v.detected_at) as last_detected
FROM violations v
JOIN compliance_rules r ON v.rule_id = r.rule_id
WHERE v.status = 'open'
GROUP BY v.severity, v.table_name, r.rule_name
ORDER BY 
    CASE v.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
    END,
    violation_count DESC;

-- Rule performance metrics
CREATE OR REPLACE VIEW rule_performance AS
SELECT 
    r.rule_id,
    r.rule_name,
    r.rule_type,
    COUNT(re.execution_id) as total_executions,
    AVG(re.execution_duration_ms) as avg_duration_ms,
    SUM(re.records_scanned) as total_records_scanned,
    SUM(re.violations_found) as total_violations_found,
    MAX(re.execution_time) as last_execution
FROM compliance_rules r
LEFT JOIN rule_executions re ON r.rule_id = re.rule_id
WHERE r.status = 'active'
GROUP BY r.rule_id, r.rule_name, r.rule_type;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully!';
    RAISE NOTICE 'Created tables: compliance_rules, rule_executions, violations, documents, document_chunks, audit_log';
    RAISE NOTICE 'Created indexes for performance optimization';
    RAISE NOTICE 'Created views: active_violations_summary, rule_performance';
END $$;
