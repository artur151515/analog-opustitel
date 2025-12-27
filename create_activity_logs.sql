-- Simple SQL script to create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS ix_activity_logs_id ON activity_logs(id);
CREATE INDEX IF NOT EXISTS ix_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS ix_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS ix_activity_logs_created_at ON activity_logs(created_at);