# 🚀 Quick Migration Commands

## ✅ Your Firebase Data Summary
Based on the diagnostic scan:
- **24 users** ready to migrate
- **24 pets** ready to migrate  
- **24 breeds** ready to migrate
- **114 points transactions** ready to migrate
- **96 businesses** ready to migrate
- **62 audiences** ready to migrate
- **40 user coupons** ready to migrate
- And more... **414 total documents**

## 📝 Step 1: Run This SQL in Supabase

Copy the **entire** contents of `migrations/supabase_migration.sql` and run it in your Supabase SQL Editor.

**OR** run these quick commands in Supabase SQL Editor to verify it worked:

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see 20+ tables including:
- users
- pets  
- breeds
- advertisements
- coupons
- points_transactions
- etc.

## 🔧 Step 2: Add Supabase Credentials

Add these to your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Get these from: Supabase Dashboard → Project Settings → API

## ▶️ Step 3: Run Migration

```bash
# Stop the old migration if it's still running
# Press Ctrl+C in the terminal

# Run the updated migration script
npx tsx scripts/migrate-firebase-to-supabase.ts
```

## ✅ Step 4: Verify Migration

After migration completes, run this in Supabase SQL Editor:

```sql
-- Check record counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'pets', COUNT(*) FROM pets
UNION ALL
SELECT 'breeds', COUNT(*) FROM breeds
UNION ALL
SELECT 'advertisements', COUNT(*) FROM advertisements
UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons
UNION ALL
SELECT 'user_coupons', COUNT(*) FROM user_coupons
UNION ALL
SELECT 'points_transactions', COUNT(*) FROM points_transactions
UNION ALL
SELECT 'businesses', COUNT(*) FROM businesses
UNION ALL
SELECT 'audiences', COUNT(*) FROM audiences
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'vets', COUNT(*) FROM vets
UNION ALL
SELECT 'pet_types', COUNT(*) FROM pet_types
UNION ALL
SELECT 'genders', COUNT(*) FROM genders
UNION ALL
SELECT 'promos', COUNT(*) FROM promos
UNION ALL
SELECT 'contact_submissions', COUNT(*) FROM contact_submissions
UNION ALL
SELECT 'filters', COUNT(*) FROM filters
UNION ALL
SELECT 'contact_info', COUNT(*) FROM contact_info
UNION ALL
SELECT 'install_banner_settings', COUNT(*) FROM install_banner_settings
ORDER BY table_name;
```

Expected results:
- users: 24
- pets: 24
- breeds: 24
- points_transactions: 114
- businesses: 96
- audiences: 62
- user_coupons: 40
- etc.

## 🎯 Quick Verification Queries

### Check Users
```sql
SELECT id, email, display_name, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
```

### Check Pets with Breeds
```sql
SELECT 
  p.name as pet_name,
  b.en as breed,
  g.en as gender,
  p.user_email
FROM pets p
LEFT JOIN breeds b ON p.breed_id = b.id
LEFT JOIN genders g ON p.gender_id = g.id
LIMIT 5;
```

### Check Points
```sql
SELECT 
  u.email,
  COUNT(pt.id) as transactions,
  SUM(pt.points) as total_points
FROM users u
LEFT JOIN points_transactions pt ON u.id = pt.user_id
GROUP BY u.id, u.email
ORDER BY total_points DESC
LIMIT 10;
```

## 🔍 Troubleshooting

### If migration shows 0/0 for all collections:
1. Make sure you stopped the old migration (Ctrl+C)
2. The script has been updated with correct Firebase config
3. Run it again: `npx tsx scripts/migrate-firebase-to-supabase.ts`

### If you get Supabase errors:
1. Check your Supabase credentials in `.env.local`
2. Make sure you're using the SERVICE_ROLE_KEY (not anon key)
3. Verify the SQL schema was created first

### If you get foreign key errors:
1. The script migrates in the correct order
2. Make sure the SQL schema ran successfully
3. Check that parent tables (users, breeds, genders) migrated first

## 📊 Expected Migration Output

```
🚀 Starting Firebase to Supabase migration...

📦 Migrating users...
  ✅ Users: 24/24 migrated, 0 failed

📦 Migrating breeds...
  ✅ Breeds: 24/24 migrated, 0 failed

📦 Migrating pet types...
  ✅ Pet Types: 2/2 migrated, 0 failed

📦 Migrating owners...
  ✅ Owners: 0/0 migrated, 0 failed

📦 Migrating vets...
  ✅ Vets: 6/6 migrated, 0 failed

📦 Migrating pets...
  ✅ Pets: 24/24 migrated, 0 failed

... (more collections)

============================================================
📊 Migration Summary
============================================================
users                     24/24 (100.0%) - 0 failed
pets                      24/24 (100.0%) - 0 failed
breeds                    24/24 (100.0%) - 0 failed
pointsTransactions        114/114 (100.0%) - 0 failed
businesses                96/96 (100.0%) - 0 failed
audiences                 62/62 (100.0%) - 0 failed
userCoupons               40/40 (100.0%) - 0 failed
... (more stats)
============================================================
⏱️  Total time: 45.23s
✅ Migration completed!
```

## 🎉 Success Checklist

- [ ] SQL schema created in Supabase (20+ tables)
- [ ] Supabase credentials added to `.env.local`
- [ ] Migration script completed successfully
- [ ] All collections show correct counts
- [ ] Sample queries return data
- [ ] No foreign key errors

## 📞 Next Steps After Migration

1. **Test Queries**: Run the verification queries above
2. **Update App Code**: Start replacing Firebase calls with Supabase
3. **Test Features**: Verify app functionality with Supabase
4. **Monitor Performance**: Check query speeds and add indexes if needed

---

**Need help?** Check the full guide in `migrations/MIGRATION_GUIDE.md`
