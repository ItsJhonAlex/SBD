-- This script runs after the main schema creation

-- Ensure proper permissions for the sbd_user
GRANT ALL PRIVILEGES ON DATABASE sbd_inventory TO sbd_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sbd_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sbd_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO sbd_user;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO sbd_user;

-- Ensure future objects also have proper permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sbd_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO sbd_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO sbd_user;

-- Create additional indexes for better performance (optional)
CREATE INDEX IF NOT EXISTS idx_agents_pc_name ON agents(pc_name);
CREATE INDEX IF NOT EXISTS idx_agents_ip ON agents(ip_part1, ip_part2, ip_part3, ip_part4);
CREATE INDEX IF NOT EXISTS idx_inventories_agent_date ON inventories(agent_id, date);
CREATE INDEX IF NOT EXISTS idx_agent_locations_current ON agent_locations(agent_id, end_time) WHERE end_time IS NULL;

-- Enable logging for development (optional)
-- ALTER SYSTEM SET log_statement = 'all';
-- ALTER SYSTEM SET log_duration = on;
-- SELECT pg_reload_conf();

COMMIT; 