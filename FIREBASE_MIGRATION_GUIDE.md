# Firebase Migration Guide

This guide will help you migrate your FacePet application from PostgreSQL/Drizzle to Firebase Firestore.

## 🚀 Prerequisites

1. **Firebase Project Setup**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Enable Authentication (if needed)

2. **Service Account**
   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Download the JSON file

## 📋 Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Firebase Client Configuration (for frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin Configuration (for server-side)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

## 🔄 Migration Steps

### 1. Install Dependencies
```bash
npm install firebase firebase-admin
```

### 2. Run Migration Script
```bash
npx tsx scripts/migrate-to-firebase.ts
```

### 3. Update Application Code
The following files have been updated to use Firebase:

- ✅ `src/lib/firebase/config.ts` - Firebase client configuration
- ✅ `src/lib/firebase/admin.ts` - Firebase admin configuration
- ✅ `src/lib/firebase/queries/contact.ts` - Contact form queries
- ✅ `src/lib/firebase/queries/users.ts` - User management queries
- ✅ `src/lib/firebase/queries/pets.ts` - Pet management queries
- ✅ `src/app/api/contact/route.ts` - Updated to use Firebase
- ✅ `auth.ts` - Updated to use Firebase user queries

### 4. Test the Migration
1. Start your development server: `npm run dev`
2. Test the contact form at `/contact`
3. Verify data is being saved to Firestore
4. Test user authentication

## 📊 Firestore Collections Structure

The migration creates the following collections:

```
firestore/
├── users/
│   ├── {userId}/
│   │   ├── fullName: string
│   │   ├── email: string
│   │   ├── phone: string
│   │   ├── password: string (hashed)
│   │   ├── role: string
│   │   ├── emailVerified: boolean
│   │   ├── emailVerifiedAt: timestamp
│   │   ├── lastActivityDate: timestamp
│   │   └── createdAt: timestamp
├── pets/
│   ├── {petId}/
│   │   ├── name: string
│   │   ├── imageUrl: string
│   │   ├── genderId: number
│   │   ├── breedId: number
│   │   ├── birthDate: timestamp
│   │   ├── notes: string
│   │   ├── userId: string
│   │   ├── ownerId: string
│   │   ├── vetId: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
├── owners/
│   ├── {ownerId}/
│   │   ├── fullName: string
│   │   ├── phoneNumber: string
│   │   ├── email: string
│   │   ├── homeAddress: string
│   │   ├── isPhonePrivate: boolean
│   │   ├── isEmailPrivate: boolean
│   │   └── isAddressPrivate: boolean
├── vets/
│   ├── {vetId}/
│   │   ├── name: string
│   │   ├── phoneNumber: string
│   │   ├── email: string
│   │   ├── address: string
│   │   ├── isNamePrivate: boolean
│   │   ├── isPhonePrivate: boolean
│   │   ├── isEmailPrivate: boolean
│   │   └── isAddressPrivate: boolean
├── genders/
│   ├── {genderId}/
│   │   ├── en: string
│   │   └── he: string
├── breeds/
│   ├── {breedId}/
│   │   ├── en: string
│   │   └── he: string
└── contactSubmissions/
    ├── {submissionId}/
    │   ├── name: string
    │   ├── email: string
    │   ├── phone: string
    │   ├── subject: string
    │   ├── message: string
    │   ├── status: string
    │   ├── createdAt: timestamp
    │   └── updatedAt: timestamp
```

## 🔒 Security Rules

Add these Firestore security rules to your Firebase project:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Pet data is public (for NFC scanning)
    match /pets/{petId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Owner data is public (for pet recovery)
    match /owners/{ownerId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Vet data is public (for pet recovery)
    match /vets/{vetId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Static data is read-only
    match /genders/{genderId} {
      allow read: if true;
    }
    
    match /breeds/{breedId} {
      allow read: if true;
    }
    
    // Contact submissions are admin-only
    match /contactSubmissions/{submissionId} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'super_admin'];
    }
  }
}
```

## ⚠️ Important Notes

1. **Data Migration**: The migration script will copy all existing data to Firebase
2. **Backup**: Always backup your existing database before migration
3. **Testing**: Test thoroughly in a development environment first
4. **Rollback**: Keep your existing database until you're confident the migration is successful
5. **Performance**: Firestore has different performance characteristics than PostgreSQL
6. **Costs**: Monitor Firebase usage and costs

## 🧹 Cleanup (After Successful Migration)

Once you've confirmed everything works:

1. Remove Drizzle dependencies:
   ```bash
   npm uninstall drizzle-orm drizzle-kit @neondatabase/serverless
   ```

2. Remove old database files:
   - `utils/database/` directory
   - `drizzle.config.ts`
   - `migrations/` directory

3. Update `package.json` scripts:
   ```json
   {
     "scripts": {
       "db:studio": "echo 'Use Firebase Console instead'",
       "db:migrate": "echo 'No migrations needed with Firestore'"
     }
   }
   ```

## 🆘 Troubleshooting

### Common Issues:

1. **Authentication Errors**: Check your Firebase service account credentials
2. **Permission Denied**: Verify Firestore security rules
3. **Missing Data**: Check if migration script completed successfully
4. **Performance Issues**: Consider adding Firestore indexes for complex queries

### Getting Help:

- Check Firebase Console for error logs
- Review Firestore security rules
- Test individual queries in Firebase Console
- Check environment variables are correctly set

## ✅ Migration Checklist

- [ ] Firebase project created
- [ ] Environment variables configured
- [ ] Migration script run successfully
- [ ] Contact form tested
- [ ] User authentication tested
- [ ] Pet data loading tested
- [ ] Firestore security rules applied
- [ ] Old database dependencies removed
- [ ] Application deployed and tested
