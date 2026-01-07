# Firebase to Supabase Migration Guide

This guide will help you migrate your Facepet application from Firebase Firestore to Supabase PostgreSQL.

## 📋 Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Add these to your `.env.local`:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Keep your existing Firebase config for migration
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   # ... other Firebase vars
   ```

## 🗄️ Step 1: Run SQL Migration Script

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `migrations/supabase_migration.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option C: Using psql (Direct Database Connection)

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration file
\i migrations/supabase_migration.sql
```

## 📦 Step 2: Install Required Dependencies

```bash
npm install @supabase/supabase-js
# or
yarn add @supabase/supabase-js
```

## 🔄 Step 3: Run Data Migration Script

Before running the migration, ensure:
- ✅ SQL schema has been created in Supabase (Step 1)
- ✅ Firebase credentials are in `.env.local`
- ✅ Supabase credentials are in `.env.local`

```bash
# Run the migration script
npx tsx scripts/migrate-firebase-to-supabase.ts
```

The script will:
- Connect to both Firebase and Supabase
- Migrate all collections in the correct order (respecting foreign keys)
- Show progress for each collection
- Display a summary report at the end

### Expected Output:
```
🚀 Starting Firebase to Supabase migration...

📦 Migrating users...
  ✅ Users: 150/150 migrated, 0 failed

📦 Migrating breeds...
  ✅ Breeds: 50/50 migrated, 0 failed

📦 Migrating pets...
  ✅ Pets: 300/300 migrated, 0 failed

... (more collections)

============================================================
📊 Migration Summary
============================================================
users                     150/150 (100.0%) - 0 failed
pets                      300/300 (100.0%) - 0 failed
advertisements            75/75 (100.0%) - 0 failed
... (more stats)
============================================================
⏱️  Total time: 45.23s
✅ Migration completed!
```

## 🔍 Step 4: Verify Migration

### Check Record Counts

Run this SQL in Supabase SQL Editor:

```sql
-- Verify all tables have data
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
```

### Sample Data Checks

```sql
-- Check users table
SELECT id, email, full_name, role, created_at 
FROM users 
LIMIT 5;

-- Check pets with owner info
SELECT 
  p.id, 
  p.name, 
  p.user_email,
  o.full_name as owner_name,
  b.en as breed
FROM pets p
LEFT JOIN owners o ON p.owner_id = o.id
LEFT JOIN breeds b ON p.breed_id = b.id
LIMIT 5;

-- Check points summary
SELECT 
  u.email,
  ups.total_points,
  ups.registration_points,
  ups.pet_points
FROM user_points_summary ups
JOIN users u ON ups.user_id = u.id
LIMIT 5;
```

## 🔐 Step 5: Configure Row Level Security (RLS)

The migration script includes basic RLS policies. Review and customize them:

```sql
-- View existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';

-- Example: Add custom policy for pets
CREATE POLICY "Users can insert their own pets" ON pets
  FOR INSERT
  WITH CHECK (
    user_email = (
      SELECT email FROM users WHERE uid = auth.uid()::text
    )
  );
```

## 📊 Migration Details

### Collections Migrated

| Firebase Collection | Supabase Table | Notes |
|-------------------|----------------|-------|
| `users` | `users` | Includes Firebase UID mapping |
| `pets` | `pets` | With owner and vet relationships |
| `owners` | `owners` | Pet owner information |
| `vets` | `vets` | Veterinarian information |
| `advertisements` | `advertisements` | Service listings |
| `comments` | `comments` | Service reviews |
| `coupons` | `coupons` | Promotional coupons |
| `userCoupons` | `user_coupons` | User-claimed coupons |
| `pointsTransactions` | `points_transactions` | Points history |
| `contactSubmissions` | `contact_submissions` | Contact form data |
| `breeds` | `breeds` | Pet breeds (bilingual) |
| `petTypes` | `pet_types` | Pet types (bilingual) |
| `genders` | `genders` | Pet genders (bilingual) |
| `promos` | `promos` | Promotional content |
| `audiences` | `audiences` | User segmentation |
| `businesses` | `businesses` | Business information |
| `filters` | `filters` | Filter configurations |

### Data Transformations

- **Timestamps**: Firebase Timestamps → PostgreSQL TIMESTAMPTZ
- **Arrays**: Firebase arrays → PostgreSQL arrays
- **Objects**: Firebase objects → PostgreSQL JSONB
- **IDs**: Firebase document IDs → PostgreSQL UUIDs
- **Enums**: String values → PostgreSQL ENUMs

## 🛠️ Troubleshooting

### Common Issues

#### 1. "relation does not exist" error
**Solution**: Make sure you ran the SQL migration script first (Step 1)

#### 2. Foreign key constraint violations
**Solution**: The script migrates in the correct order. If you see this error, check that parent records exist.

#### 3. "duplicate key value violates unique constraint"
**Solution**: The script uses `upsert` to handle duplicates. If you're re-running, this is normal.

#### 4. Supabase connection timeout
**Solution**: 
```bash
# Increase timeout in the script or migrate in batches
# Edit scripts/migrate-firebase-to-supabase.ts
# Add batch processing for large collections
```

### Re-running Migration

If you need to re-run the migration:

```sql
-- Clear all data (CAUTION: This deletes everything!)
TRUNCATE TABLE 
  user_coupons,
  points_transactions,
  user_points_summary,
  comments,
  pets,
  owners,
  vets,
  advertisements,
  coupons,
  contact_submissions,
  promos,
  audiences,
  businesses,
  filters,
  users
CASCADE;

-- Then re-run the migration script
```

## 📝 Next Steps

After successful migration:

1. **Update Application Code**: Replace Firebase SDK calls with Supabase SDK
2. **Test Authentication**: Migrate Firebase Auth to Supabase Auth
3. **Update Storage**: Migrate Firebase Storage to Supabase Storage
4. **Test Thoroughly**: Verify all features work with Supabase
5. **Monitor Performance**: Check query performance and add indexes if needed

## 🔗 Useful SQL Commands

### Add Index for Performance
```sql
-- Add index on frequently queried columns
CREATE INDEX idx_pets_name ON pets(name);
CREATE INDEX idx_users_email_verified ON users(email_verified);
```

### View Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup Before Migration
```bash
# Backup Supabase database
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" > backup.sql
```

## 📞 Support

If you encounter issues:
1. Check the migration script logs for specific errors
2. Verify your Supabase credentials
3. Ensure Firebase credentials are still valid
4. Check Supabase dashboard for any service issues

## ⚠️ Important Notes

- **Backup First**: Always backup your Firebase data before migration
- **Test Environment**: Test the migration in a development Supabase project first
- **Downtime**: Plan for application downtime during migration
- **Authentication**: Firebase Auth users need to be migrated separately
- **Storage**: Firebase Storage files need separate migration
- **Indexes**: Monitor query performance and add indexes as needed

## 🎉 Success!

Once migration is complete, you'll have:
- ✅ All Firebase data in Supabase PostgreSQL
- ✅ Proper relationships and foreign keys
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Automatic timestamp updates
- ✅ Type-safe enums

Your application is now ready to use Supabase! 🚀
