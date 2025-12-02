-- Initialize database
CREATE DATABASE IF NOT EXISTS mydb3;

-- Connect to the database
\c mydb3;

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO messages (content) VALUES 
    ('Welcome to our Docker PostgreSQL app!'),
ON CONFLICT DO NOTHING;