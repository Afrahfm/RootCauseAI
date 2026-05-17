-- Users table
CREATE TABLE IF NOT EXISTS users (
 id SERIAL PRIMARY KEY,
 email VARCHAR(255) UNIQUE NOT NULL,
 full_name VARCHAR(255) NOT NULL,
 password_hash TEXT NOT NULL,
 reset_token TEXT,
 reset_token_expiry TIMESTAMP,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
