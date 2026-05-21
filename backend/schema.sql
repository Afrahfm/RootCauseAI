-- Users table
CREATE TABLE IF NOT EXISTS users (
 id SERIAL PRIMARY KEY,
 email VARCHAR(255) UNIQUE NOT NULL,
 full_name VARCHAR(255) NOT NULL,
 password_hash TEXT NOT NULL,
 reset_token TEXT,
 reset_token_expiry TIMESTAMP,
 provider VARCHAR(50) DEFAULT 'email',
 profile_picture TEXT,
 user_type VARCHAR(50) DEFAULT 'pending',
 company_name VARCHAR(255),
 employee_id VARCHAR(100),
 is_verified BOOLEAN DEFAULT FALSE,
 verification_method VARCHAR(50),
 linkedin_id VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for approved companies (both enterprise and startup)
CREATE TABLE IF NOT EXISTS approved_companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    company_domain VARCHAR(255) UNIQUE NOT NULL,
    company_type ENUM('enterprise', 'startup') DEFAULT 'startup',
    employee_id_pattern VARCHAR(100) COMMENT 'Regex pattern for employee ID',
    requires_employee_id BOOLEAN DEFAULT TRUE,
    max_employees INT DEFAULT 100,
    added_by VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    linkedin_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for verification codes (email method)
CREATE TABLE IF NOT EXISTS verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for LinkedIn verification log
CREATE TABLE IF NOT EXISTS linkedin_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    linkedin_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    verified_workplace BOOLEAN DEFAULT FALSE,
    company_name VARCHAR(255),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for employee verification log (audit)
CREATE TABLE IF NOT EXISTS employee_verification_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100),
    company_domain VARCHAR(255),
    verification_method ENUM('linkedin', 'email_code', 'admin') DEFAULT 'email_code',
    verification_status ENUM('approved', 'rejected', 'pending') DEFAULT 'pending',
    rejection_reason VARCHAR(255),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analyses table (each analysis belongs to a user)
CREATE TABLE IF NOT EXISTS analyses (
 id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
 user_input TEXT NOT NULL,
 hidden_problem TEXT NOT NULL,
 wrong_solution TEXT NOT NULL,
 wrong_solution_cost VARCHAR(100),
 right_solution TEXT NOT NULL,
 right_solution_cost VARCHAR(100),
 savings VARCHAR(100),
 tech_stack JSONB,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
