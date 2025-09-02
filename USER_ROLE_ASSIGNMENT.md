# User Role Assignment Implementation

## Overview
Added automatic role assignment functionality to the user registration system. Users are now assigned roles based on their email address during registration.

## Role Types
- **`user`** - Default role for all new users
- **`admin`** - Administrative privileges
- **`super_admin`** - Full administrative access

## Implementation Details

### 1. Updated UserData Interface (`src/lib/firebase/users.ts`)
```typescript
interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  profileImage?: string;
  acceptCookies?: boolean;
  language?: string;
  role?: 'user' | 'admin' | 'super_admin'; // ✅ Added role field
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Enhanced createUserInFirestore Function
```typescript
export async function createUserInFirestore(
  user: User,
  additionalData?: {
    phone?: string;
    profileImage?: string;
    acceptCookies?: boolean;
    language?: string;
    role?: 'user' | 'admin' | 'super_admin'; // ✅ Added role parameter
  }
): Promise<{ success: boolean; error?: string }>
```

**Role Assignment Logic:**
```typescript
const userData: UserData = {
  // ... other fields
  role: additionalData?.role || 'user', // ✅ Default role is 'user'
  // ... other fields
};
```

### 3. Role Assignment Logic (`src/contexts/AuthContext.tsx`)

**Admin Email Configuration:**
```typescript
const adminEmails: Record<string, 'admin' | 'super_admin'> = {
  'admin@facepet.com': 'super_admin',
  'polskoydm@gmail.com': 'super_admin', // ✅ Your email as super admin
  // Add more admin emails as needed
};

const getUserRole = (email: string): 'user' | 'admin' | 'super_admin' => {
  const emailLower = email.toLowerCase();
  return adminEmails[emailLower] || 'user'; // ✅ Default to 'user'
};
```

### 4. Updated Registration Functions

**Email/Password Registration:**
```typescript
const userRole = getUserRole(email);
const userResult = await createUserInFirestore(userCredential.user, {
  phone: phone || '',
  acceptCookies: false,
  language: 'en',
  role: userRole // ✅ Role assigned based on email
});
```

**Google Sign-in:**
```typescript
const userRole = getUserRole(userCredential.user.email || '');
const userResult = await createUserInFirestore(userCredential.user, {
  acceptCookies: false,
  language: 'en',
  role: userRole // ✅ Role assigned based on email
});
```

**Direct Sign-up:**
```typescript
const userRole = getUserRole(email);
const userResult = await createUserInFirestore(userCredential.user, {
  acceptCookies: false,
  language: 'en',
  role: userRole // ✅ Role assigned based on email
});
```

## How It Works

1. **User Registration**: When a user registers (via email/password, Google, or direct signup)
2. **Email Check**: System checks if the user's email is in the `adminEmails` configuration
3. **Role Assignment**: 
   - If email is found in `adminEmails` → assigns the specified admin role
   - If email is not found → assigns default `'user'` role
4. **Firestore Storage**: User data is stored in Firestore with the assigned role

## Admin Email Configuration

To add new admin users, update the `adminEmails` object in `src/contexts/AuthContext.tsx`:

```typescript
const adminEmails: Record<string, 'admin' | 'super_admin'> = {
  'admin@facepet.com': 'super_admin',
  'polskoydm@gmail.com': 'super_admin',
  'newadmin@example.com': 'admin',        // ✅ Add new admin
  'superadmin@example.com': 'super_admin' // ✅ Add new super admin
};
```

## Testing

### Current Admin Users
- **`polskoydm@gmail.com`** → `super_admin` role
- **`admin@facepet.com`** → `super_admin` role

### Test Registration
1. Register with `polskoydm@gmail.com` → Should get `super_admin` role
2. Register with any other email → Should get `user` role
3. Check Firestore `users` collection to verify role assignment

## Benefits

✅ **Automatic Role Assignment**: No manual intervention needed
✅ **Email-Based**: Simple configuration using email addresses
✅ **Default Safety**: All users default to `'user'` role
✅ **Flexible**: Easy to add/remove admin users
✅ **Consistent**: Works across all registration methods
✅ **Secure**: Admin roles are assigned at registration time

## Next Steps

1. **Test Registration**: Register with your email to verify super_admin role
2. **Add More Admins**: Update `adminEmails` as needed
3. **Admin Panel Access**: Users with admin roles can now access admin features
4. **Role-Based UI**: Implement role-based UI elements and permissions
