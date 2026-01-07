# How to Fix Runtime Issues

## 1. Fix RLS Infinite Recursion (CRITICAL)

### In Supabase Dashboard:
1. Go to SQL Editor
2. Run this migration:

```sql
-- Drop the problematic policy
DROP POLICY IF EXISTS users_select_admin ON users;

-- Create service role policy
CREATE POLICY users_service_role ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Verify the fix
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### Or via CLI:
```bash
supabase migration new fix_rls_recursion
# Then add the SQL above to the generated file
supabase migration up
```

## 2. Verify User Auth Context

The errors show `uid=eq.undefined` which means `auth.uid()` is not being set properly.

Check `/src/contexts/AuthContext.tsx`:
- Ensure `user.uid` is set after sign-in
- May need to set it from Supabase auth: `supabase.auth.getUser()`

## 3. POST 405 Error

The error `POST https://tag.chapiz.co.il/user/settings 405` indicates:
- Either there's no POST endpoint for this route
- Or the route doesn't accept POST

### Check if the route exists:
```bash
find src/app/api -name "route.ts" | grep -i settings
# OR
find src/app/api -name "route.ts" | grep -i user
```

### If no endpoint exists, create one or:
- Change the settings save to use a different method
- Use server action instead of API route

## 4. Google Maps Deprecation

**Current Issue**: Using deprecated `google.maps.places.AutocompleteService`

### To fix:
1. Update LocationAutocompleteSelector component
2. Remove old Google Places API calls
3. Implement new Places Library v2.0

Refer to: https://developers.google.com/maps/documentation/javascript/places-migration-overview

### Quick fix for now:
Suppress the warning in browser console if just testing, but migrate when you have time.

## 5. Verification Steps

After applying these fixes:

1. **Clear Supabase cache**:
   ```bash
   # In Supabase dashboard, go to SQL Editor and run:
   REFRESH MATERIALIZED VIEW IF EXISTS ...
   ```

2. **Test the settings page**:
   - Log in
   - Navigate to Settings
   - Check console for errors
   - Try to save profile

3. **Monitor errors**:
   - Open DevTools (F12)
   - Go to Console tab
   - Look for any remaining RLS or auth errors

## Key Files Modified
- `/migrations/supabase_migration.sql` - Fixed RLS policies
- `/migrations/0023_fix_rls_recursion.sql` - New migration (apply in Supabase)
- `/src/components/user/SettingsPage.tsx` - Added uid validation
