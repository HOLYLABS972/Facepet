-- ============================================
-- QUICK REFERENCE: Essential SQL Commands
-- ============================================

-- 1. VERIFY MIGRATION SUCCESS
-- ============================================

-- Check all table counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'pets', COUNT(*) FROM pets
UNION ALL
SELECT 'owners', COUNT(*) FROM owners
UNION ALL
SELECT 'vets', COUNT(*) FROM vets
UNION ALL
SELECT 'advertisements', COUNT(*) FROM advertisements
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons
UNION ALL
SELECT 'user_coupons', COUNT(*) FROM user_coupons
UNION ALL
SELECT 'points_transactions', COUNT(*) FROM points_transactions
UNION ALL
SELECT 'contact_submissions', COUNT(*) FROM contact_submissions
UNION ALL
SELECT 'promos', COUNT(*) FROM promos
UNION ALL
SELECT 'audiences', COUNT(*) FROM audiences
UNION ALL
SELECT 'businesses', COUNT(*) FROM businesses
UNION ALL
SELECT 'breeds', COUNT(*) FROM breeds
UNION ALL
SELECT 'pet_types', COUNT(*) FROM pet_types
ORDER BY table_name;

-- 2. SAMPLE DATA CHECKS
-- ============================================

-- Check recent users
SELECT id, email, full_name, role, created_at 
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- Check pets with relationships
SELECT 
  p.id, 
  p.name, 
  p.user_email,
  o.full_name as owner_name,
  b.en as breed,
  g.en as gender,
  v.name as vet_name
FROM pets p
LEFT JOIN owners o ON p.owner_id = o.id
LEFT JOIN breeds b ON p.breed_id = b.id
LEFT JOIN genders g ON p.gender_id = g.id
LEFT JOIN vets v ON p.vet_id = v.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Check user points
SELECT 
  u.email,
  u.full_name,
  ups.total_points,
  ups.registration_points,
  ups.pet_points,
  ups.share_points
FROM user_points_summary ups
JOIN users u ON ups.user_id = u.id
ORDER BY ups.total_points DESC
LIMIT 10;

-- Check active advertisements
SELECT 
  id,
  title,
  type,
  status,
  average_rating,
  total_reviews,
  created_at
FROM advertisements
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- 3. DATA INTEGRITY CHECKS
-- ============================================

-- Find pets without owners
SELECT p.id, p.name, p.user_email
FROM pets p
LEFT JOIN owners o ON p.owner_id = o.id
WHERE o.id IS NULL;

-- Find orphaned user coupons
SELECT uc.id, uc.user_id, uc.coupon_id
FROM user_coupons uc
LEFT JOIN users u ON uc.user_id = u.id
LEFT JOIN coupons c ON uc.coupon_id = c.id
WHERE u.id IS NULL OR c.id IS NULL;

-- Find points transactions without users
SELECT pt.id, pt.user_id, pt.points
FROM points_transactions pt
LEFT JOIN users u ON pt.user_id = u.id
WHERE u.id IS NULL;

-- 4. PERFORMANCE CHECKS
-- ============================================

-- View table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View all indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. USER STATISTICS
-- ============================================

-- User role distribution
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- User registration timeline (last 30 days)
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_users
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Email verification status
SELECT 
  email_verified,
  COUNT(*) as count
FROM users
GROUP BY email_verified;

-- 6. PET STATISTICS
-- ============================================

-- Pets by breed (top 10)
SELECT 
  b.en as breed,
  COUNT(*) as count
FROM pets p
JOIN breeds b ON p.breed_id = b.id
GROUP BY b.en
ORDER BY count DESC
LIMIT 10;

-- Pets by gender
SELECT 
  g.en as gender,
  COUNT(*) as count
FROM pets p
JOIN genders g ON p.gender_id = g.id
GROUP BY g.en
ORDER BY count DESC;

-- 7. ADVERTISEMENT STATISTICS
-- ============================================

-- Ads by status
SELECT status, COUNT(*) as count
FROM advertisements
GROUP BY status
ORDER BY count DESC;

-- Ads by type
SELECT type, COUNT(*) as count
FROM advertisements
GROUP BY type
ORDER BY count DESC;

-- Top rated services
SELECT 
  id,
  title,
  average_rating,
  total_reviews
FROM advertisements
WHERE total_reviews > 0
ORDER BY average_rating DESC, total_reviews DESC
LIMIT 10;

-- 8. POINTS SYSTEM STATISTICS
-- ============================================

-- Points distribution
SELECT 
  type,
  COUNT(*) as transaction_count,
  SUM(points) as total_points
FROM points_transactions
GROUP BY type
ORDER BY total_points DESC;

-- Top users by points
SELECT 
  u.email,
  u.full_name,
  ups.total_points
FROM user_points_summary ups
JOIN users u ON ups.user_id = u.id
ORDER BY ups.total_points DESC
LIMIT 20;

-- 9. COUPON STATISTICS
-- ============================================

-- Active coupons
SELECT 
  title,
  code,
  points_cost,
  max_uses,
  current_uses,
  status
FROM coupons
WHERE status = 'active'
ORDER BY points_cost ASC;

-- User coupon status distribution
SELECT 
  status,
  COUNT(*) as count
FROM user_coupons
GROUP BY status
ORDER BY count DESC;

-- Most claimed coupons
SELECT 
  c.title,
  c.code,
  COUNT(uc.id) as times_claimed
FROM coupons c
LEFT JOIN user_coupons uc ON c.id = uc.coupon_id
GROUP BY c.id, c.title, c.code
ORDER BY times_claimed DESC
LIMIT 10;

-- 10. CLEANUP COMMANDS (USE WITH CAUTION!)
-- ============================================

-- Delete test users (example - modify as needed)
-- DELETE FROM users WHERE email LIKE '%test%';

-- Clear all user coupons
-- TRUNCATE TABLE user_coupons CASCADE;

-- Reset points for all users
-- UPDATE user_points_summary SET total_points = 0, registration_points = 0, phone_points = 0, pet_points = 0, share_points = 0;

-- 11. MAINTENANCE COMMANDS
-- ============================================

-- Vacuum and analyze all tables
VACUUM ANALYZE;

-- Reindex all tables
REINDEX DATABASE postgres;

-- Update statistics
ANALYZE;

-- 12. BACKUP COMMANDS
-- ============================================

-- Create a backup of specific table
-- COPY users TO '/tmp/users_backup.csv' WITH CSV HEADER;

-- Restore from backup
-- COPY users FROM '/tmp/users_backup.csv' WITH CSV HEADER;

-- 13. USEFUL QUERIES FOR DEBUGGING
-- ============================================

-- Find duplicate emails
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Find users without points summary
SELECT u.id, u.email
FROM users u
LEFT JOIN user_points_summary ups ON u.id = ups.user_id
WHERE ups.id IS NULL;

-- Find pets with invalid breed/gender IDs
SELECT p.id, p.name, p.breed_id, p.gender_id
FROM pets p
WHERE NOT EXISTS (SELECT 1 FROM breeds WHERE id = p.breed_id)
   OR NOT EXISTS (SELECT 1 FROM genders WHERE id = p.gender_id);

-- 14. ROW LEVEL SECURITY CHECKS
-- ============================================

-- View all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 15. FOREIGN KEY CHECKS
-- ============================================

-- View all foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
