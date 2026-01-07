# Runtime Issues Found & Fixes

## Critical Issues

### 1. **Supabase RLS Policy Infinite Recursion** ✅ FIXED
**Error**: `infinite recursion detected in policy for relation "users"`
- **Root Cause**: `users_select_admin` policy was doing a subquery on the `users` table while evaluating a policy on the same table
- **Location**: `/migrations/supabase_migration.sql` line ~515
- **Fix Applied**: 
  - Removed the problematic `users_select_admin` policy
  - Added `users_service_role` policy to allow backend operations
  - Created migration file: `0023_fix_rls_recursion.sql`
  
**Action Required**: Run the migration in Supabase:
```sql
DROP POLICY IF EXISTS users_select_admin ON users;
CREATE POLICY users_service_role ON users
  FOR ALL
  USING (auth.role() = 'service_role');
```

### 2. **Undefined uid in Queries**
**Error**: `GET https://.../users?select=*&uid=eq.undefined 500`
- **Root Cause**: `user.uid` is null/undefined when SettingsPage loads
- **Location**: SettingsPage.tsx line 66 calling `getUserFromFirestore(user.uid)`
- **Fix Needed**: Add guard to check if `user.uid` exists before querying

### 3. **POST 405 Method Not Allowed**
**Error**: `POST https://tag.chapiz.co.il/user/settings 405`
- **Root Cause**: There's no POST endpoint for `/user/settings`, or it's returning 405
- **Investigation Needed**: Check if there's an API route for this or if it should be a different method

### 4. **Google Maps Deprecation Warning**
**Warning**: `google.maps.places.AutocompleteService` is deprecated
- **Location**: LocationAutocompleteSelector component
- **Action Required**: Migrate to new Google Places API (Places Library v2.0)
- **Migration Guide**: https://developers.google.com/maps/documentation/javascript/places-migration-overview

## Files Modified
1. `/migrations/supabase_migration.sql` - Fixed RLS policies
2. `/migrations/0023_fix_rls_recursion.sql` - New migration file (needs to be run)
3. Next: SettingsPage.tsx - Add uid validation

## Next Steps
1. Run the RLS migration in Supabase
2. Add null checks for `user.uid` in SettingsPage
3. Verify auth.uid() is properly set in AuthContext
4. Create API endpoint for settings if needed, or fix the POST call
5. Migrate from deprecated Google Places API
