-- Fix infinite recursion in users table RLS policies
-- Run this migration in your Supabase database

-- Drop problematic policies
DROP POLICY IF EXISTS users_select_admin ON users;

-- Create new service role policy that doesn't cause recursion
CREATE POLICY users_service_role ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Alternative: Disable RLS temporarily while you refactor auth
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
