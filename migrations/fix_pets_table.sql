-- Fix pets table constraints
-- Run this in Supabase SQL Editor

-- 1. Make owner_id nullable (since owners collection is empty)
ALTER TABLE pets ALTER COLUMN owner_id DROP NOT NULL;

-- 2. Add default UUID generation for id column
ALTER TABLE pets ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- 3. Verify the changes
SELECT 
    column_name, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pets' 
AND column_name IN ('id', 'owner_id');

-- Expected results:
-- id: is_nullable=NO, column_default=uuid_generate_v4()
-- owner_id: is_nullable=YES, column_default=NULL
