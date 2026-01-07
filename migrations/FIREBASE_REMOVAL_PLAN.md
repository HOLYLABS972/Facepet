# 🔥 Firebase to Supabase Complete Migration Plan

## 📊 Current Status
- ✅ Data migrated: Users (22/24), Breeds (24/24), Vets (6/6), Pets (24/24)
- ❌ Remaining: Points, Coupons, Comments, Advertisements, etc.
- 🔧 Firebase dependencies: `firebase` + `firebase-admin` packages
- 📁 Firebase files found: 50+ files in `/src`

## 🎯 Migration Strategy

### Phase 1: Complete Data Migration ✅ DONE
- Core tables migrated successfully
- Need to run remaining collections script

### Phase 2: Remove Firebase Dependencies
1. **Remove npm packages**
   - `firebase` (v12.2.1)
   - `firebase-admin` (v13.5.0)

2. **Delete Firebase configuration files**
   - `/src/lib/firebase/config.ts`
   - `/src/lib/firebase/admin.ts`
   - `/src/lib/firebase/storage-init.ts`
   - `/src/lib/firebase/remoteConfig.ts`

3. **Delete Firebase utility files** (50+ files)
   - `/src/lib/firebase/*.ts` (all Firebase helpers)
   - `/src/components/notifications/FirebaseNotification.tsx`

### Phase 3: Create Supabase Replacements
1. **Create Supabase client** (`/src/lib/supabase/client.ts`)
2. **Create Supabase server** (`/src/lib/supabase/server.ts`)
3. **Create Supabase storage** (`/src/lib/supabase/storage.ts`)
4. **Create database helpers** for each collection

### Phase 4: Update Application Code
1. Replace Firebase Auth with Supabase Auth
2. Replace Firestore queries with Supabase queries
3. Replace Firebase Storage with Supabase Storage
4. Update all components using Firebase

## 📝 Files to Replace

### Firebase Files to Delete (in `/src/lib/firebase/`)
- `config.ts` - Firebase initialization
- `admin.ts` - Firebase Admin SDK
- `storage.ts` - Firebase Storage
- `storage-init.ts` - Storage initialization
- `users.ts` - User operations
- `pets.ts` - Pet operations
- `simple-pets.ts` - Simple pet operations
- `points.ts` - Points system
- `points-debug.ts` - Points debugging
- `points-server.ts` - Server-side points
- `user-coupons.ts` - User coupons
- `user-promos.ts` - User promos
- `favorites.ts` - Favorites system
- `notifications.ts` - Notifications
- `notification-helpers.ts` - Notification helpers
- `contact.ts` - Contact forms
- `vets.ts` - Vet queries
- `audience-assignment.ts` - Audience management
- `remoteConfig.ts` - Remote config
- `admin-client.ts` - Admin client
- `simple-upload.ts` - Simple file upload
- `test-storage-upload.ts` - Storage testing
- `collections/breeds.ts` - Breeds collection
- `collections/types.ts` - Pet types collection
- `queries/users.ts` - User queries
- `queries/coupons.ts` - Coupon queries
- `queries/promo.ts` - Promo queries

### Components to Update
- `/src/components/PetDetailsBottomSheet.tsx`
- `/src/components/MyPetClient.tsx`
- `/src/components/user/UserCouponsPage.tsx`
- `/src/components/admin/AddBreedModal.tsx`
- `/src/components/admin/AddTypeModal.tsx`
- `/src/components/admin/MediaUpload.tsx`
- `/src/components/notifications/FirebaseNotification.tsx`

### Server Actions to Update
- `/src/lib/actions/admin.ts`
- `/src/app/api/admin/users/create/route.ts`

## 🔧 Supabase Structure

### New Files to Create
```
/src/lib/supabase/
├── client.ts          # Browser Supabase client
├── server.ts          # Server Supabase client
├── storage.ts         # Storage operations
├── auth.ts            # Authentication helpers
└── database/
    ├── users.ts       # User operations
    ├── pets.ts        # Pet operations
    ├── breeds.ts      # Breed operations
    ├── points.ts      # Points system
    ├── coupons.ts     # Coupon operations
    ├── comments.ts    # Comments/reviews
    └── ...
```

## ⚠️ Breaking Changes

### Authentication
- Firebase Auth → Supabase Auth
- `User` type changes
- Session management changes
- Email verification flow changes

### Storage
- Firebase Storage → Supabase Storage
- URL structure changes
- Upload API changes
- Public/private bucket structure

### Database
- Firestore → PostgreSQL
- Real-time listeners → Supabase subscriptions
- Query syntax changes
- Transaction handling changes

## 🚀 Next Steps

1. **Run remaining data migration**
   ```bash
   npx tsx scripts/migrate-remaining-collections.ts
   ```

2. **Create Supabase client files**
3. **Update authentication system**
4. **Replace database queries**
5. **Update storage operations**
6. **Remove Firebase packages**
7. **Test thoroughly**

## 📋 Checklist

- [ ] Complete data migration (all collections)
- [ ] Create Supabase client infrastructure
- [ ] Migrate authentication
- [ ] Migrate database queries
- [ ] Migrate storage operations
- [ ] Update all components
- [ ] Remove Firebase packages
- [ ] Remove Firebase files
- [ ] Update environment variables
- [ ] Test all features
- [ ] Deploy to production

---

**Estimated Time**: 4-6 hours for complete migration
**Risk Level**: High (affects core functionality)
**Recommendation**: Do this in a separate branch and test thoroughly
