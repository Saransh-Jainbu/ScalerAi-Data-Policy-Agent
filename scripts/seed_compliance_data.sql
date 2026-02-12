-- CLEANUP
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS customer_data CASCADE;
DROP TABLE IF EXISTS system_audit_logs CASCADE;

-- 1. Create Employees Table (Target for Age/Training rules)
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100),
    email VARCHAR(100),
    department VARCHAR(50),
    date_of_birth DATE, -- Rule: Must be > 18
    joining_date DATE,
    security_training_completed BOOLEAN -- Rule: Must be true
);

-- 2. Create Customer Data (Target for Encryption/Retention rules)
CREATE TABLE customer_data (
    customer_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100),
    email_raw VARCHAR(100), -- Rule: Should be encrypted (no @ symbol visible usually)
    phone_number VARCHAR(20),
    marketing_opt_in BOOLEAN, -- Rule: Must be true to send emails
    last_login_date DATE, -- Rule: Delete if > 3 years ago
    region VARCHAR(10)
);

-- 3. Create Audit Logs (Target for Retention rules)
CREATE TABLE system_audit_logs (
    log_id SERIAL PRIMARY KEY,
    action VARCHAR(50),
    timestamp TIMESTAMP, -- Rule: Retain for 5 years max
    user_id VARCHAR(50)
);

-- ==================================================================
-- SEED DATA (With Intentional Violations)
-- ==================================================================

-- scenario 1: Underage Employee (Violation)
INSERT INTO employees (full_name, email, department, date_of_birth, joining_date, security_training_completed)
VALUES 
('Alice Compliant', 'alice@corp.com', 'Engineering', '1990-05-15', '2020-01-01', true),
('Bob Manager', 'bob@corp.com', 'Sales', '1985-10-20', '2019-03-15', true),
('Timmy Intern', 'timmy@corp.com', 'Interns', '2009-01-01', '2024-06-01', false); -- VIOLATION: Age 15 (assuming current year is 2024+)

-- scenario 2: Unencrypted Emails (Violation)
INSERT INTO customer_data (name, email_raw, phone_number, marketing_opt_in, last_login_date, region)
VALUES
('John Doe', 'john.doe@gmail.com', '+1-555-0101', true, '2024-01-01', 'US'), -- VIOLATION: Raw email stored
('Jane Encrypted', 'enc:AES256:73827382...', '+1-555-0102', false, '2024-02-01', 'EU'), -- Compliant
('Old User', 'old.user@yahoo.com', '+1-555-9999', false, '2018-01-01', 'US'); -- VIOLATION: Old data (> 3 years)

-- scenario 3: Ancient Logs (Violation)
INSERT INTO system_audit_logs (action, timestamp, user_id)
VALUES
('LOGIN', NOW() - INTERVAL '1 day', 'user_123'),
('LOGOUT', NOW() - INTERVAL '6 years', 'user_999'); -- VIOLATION: > 5 years retention
