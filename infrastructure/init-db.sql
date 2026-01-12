-- Marketing Budget Optimizer - Database Initialization
-- This script runs automatically when PostgreSQL container starts for the first time

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialized with TimescaleDB and uuid-ossp extensions';
END $$;
