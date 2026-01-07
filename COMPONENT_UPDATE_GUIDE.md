# 🔄 Component Update Guide - Firebase to Supabase

## ✅ Supabase Infrastructure Created

### New Files
```
/src/lib/supabase/
├── client.ts                    # Browser client
├── server.ts                    # Server client
├── index.ts                     # Main exports
└── database/
    ├── users.ts                 # User operations
    ├── businesses.ts            # Business operations
    └── pets.ts                  # Pet, breed, gender operations
```

## 📝 How to Use New Architecture

### Import Pattern
```typescript
// OLD (Firebase)
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';

// NEW (Supabase)
import { supabase, getAllBusinesses, getUserByEmail } from '@/lib/supabase';
```

### Example Conversions

#### 1. Get All Businesses
```typescript
// OLD
const snapshot = await getDocs(collection(db, 'businesses'));
const businesses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// NEW
const businesses = await getAllBusinesses();
```

#### 2. Get User by Email
```typescript
// OLD
const q = query(collection(db, 'users'), where('email', '==', email));
const snapshot = await getDocs(q);
const user = snapshot.docs[0]?.data();

// NEW
const user = await getUserByEmail(email);
```

#### 3. Create Pet
```typescript
// OLD
const docRef = await addDoc(collection(db, 'pets'), petData);

// NEW
const pet = await createPet(petData);
```

#### 4. Update User
```typescript
// OLD
await updateDoc(doc(db, 'users', userId), updates);

// NEW
await updateUser(userId, updates);
```

## 🔧 Components That Need Updates

### Priority 1: Core Components (CRITICAL)
1. **Authentication Components**
   - Login/Signup flows
   - Session management
   - User context providers

2. **User Management**
   - User profile pages
   - User settings
   - Admin user management

3. **Business Components**
   - Business listings
   - Business details
   - Business search

### Priority 2: Pet Management
1. **Pet Components**
   - Pet listings (`MyPetClient.tsx`)
   - Pet details (`PetDetailsBottomSheet.tsx`)
   - Pet creation/editing

2. **Breed Management**
   - Breed selection (`AddBreedModal.tsx`)
   - Type selection (`AddTypeModal.tsx`)

### Priority 3: Admin & Other
1. **Admin Components**
   - Admin actions (`lib/actions/admin.ts`)
   - Media upload (`MediaUpload.tsx`)
   - User creation API (`app/api/admin/users/create/route.ts`)

2. **Other Features**
   - Coupons (`UserCouponsPage.tsx`)
   - Points system
   - Notifications

## 🚨 Files with Firebase Imports (Need Updates)

### Components (16 files)
- `/src/components/PetDetailsBottomSheet.tsx`
- `/src/components/MyPetClient.tsx`
- `/src/components/user/UserCouponsPage.tsx`
- `/src/components/admin/AddBreedModal.tsx`
- `/src/components/admin/AddTypeModal.tsx`
- `/src/components/admin/MediaUpload.tsx`
- `/src/components/notifications/FirebaseNotification.tsx`

### Library Files (30+ files)
- `/src/lib/firebase/*.ts` - **DELETE ALL**
- `/src/lib/actions/admin.ts` - **UPDATE**
- `/src/lib/test-storage-upload.ts` - **UPDATE or DELETE**

### API Routes
- `/src/app/api/admin/users/create/route.ts`

## 📋 Step-by-Step Migration Plan

### Step 1: Update Simple Components First
Start with components that only read data:
1. Business listings
2. Breed/type selectors
3. Pet listings

### Step 2: Update User Management
1. Replace Firebase Auth with Supabase Auth
2. Update user profile components
3. Update session management

### Step 3: Update Admin Functions
1. Update admin actions
2. Update API routes
3. Update media upload

### Step 4: Delete Firebase Files
Once everything is migrated:
```bash
rm -rf src/lib/firebase
```

## 🔑 Environment Variables

Make sure these are set in `.env.local`:
```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Firebase (CAN REMOVE AFTER MIGRATION)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
# ... etc
```

## 🎯 Quick Reference

### Common Operations

#### Authentication
```typescript
// Get current user
const user = await getCurrentUser();

// Get session
const session = await getSession();

// Sign in (Supabase Auth)
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

// Sign out
await supabase.auth.signOut();
```

#### Database Queries
```typescript
// Users
const user = await getUserByEmail(email);
const user = await getUserById(id);
const users = await getAllUsers();
await updateUser(id, { full_name: 'New Name' });

// Businesses
const businesses = await getAllBusinesses();
const business = await getBusinessById(id);
const results = await searchBusinesses('search term');

// Pets
const pets = await getPetsByUserEmail(email);
const pet = await getPetById(id);
const petWithDetails = await getPetWithDetails(id);
await createPet(petData);
await updatePet(id, updates);
await deletePet(id);

// Breeds & Types
const breeds = await getAllBreeds();
const genders = await getAllGenders();
const petTypes = await getAllPetTypes();
```

## ⚠️ Important Notes

1. **Supabase uses UUIDs** - All IDs are now UUIDs, not Firebase document IDs
2. **No more Firebase Timestamps** - Use ISO strings or JavaScript Dates
3. **Different Auth** - Supabase Auth is different from Firebase Auth
4. **RLS is enabled** - Row Level Security policies are active
5. **Real-time** - Use Supabase subscriptions instead of Firebase listeners

## 🆘 Need Help?

Check these files for examples:
- `/src/lib/supabase/database/users.ts` - User operations
- `/src/lib/supabase/database/businesses.ts` - Business operations
- `/src/lib/supabase/database/pets.ts` - Pet operations

---

**Next Step**: Start updating components one by one, testing as you go!
