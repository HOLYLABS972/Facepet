# User Role Assignment Implementation

## Overview
User registration system with manual role assignment. All users are assigned the default 'user' role during registration. Admin roles must be assigned manually through the admin panel.

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

**Manual Role Assignment:**
```typescript
// Function to determine user role - all users get 'user' role by default
// Admin roles must be assigned manually through the admin panel
const getUserRole = (email: string): 'user' | 'admin' | 'super_admin' => {
  // All users get 'user' role by default
  // Admin roles are assigned manually through the admin interface
  console.log('🔍 Role assignment: All users get default "user" role');
  return 'user';
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
2. **Default Role Assignment**: All users are assigned the default `'user'` role
3. **Manual Admin Assignment**: Admin roles (`admin` or `super_admin`) must be assigned manually through the admin panel
4. **Firestore Storage**: User data is stored in Firestore with the assigned role

## Manual Admin Assignment

To assign admin roles to users:

1. **Access Admin Panel**: Log in as a super_admin user
2. **User Management**: Go to the user management section
3. **Edit User Role**: Select a user and change their role to `admin` or `super_admin`
4. **Save Changes**: The role will be updated in Firestore

## Testing

### Test Registration
1. Register with any email → Should get `user` role
2. Check Firestore `users` collection to verify role assignment
3. Manually assign admin role through admin panel
4. Verify admin access is granted

## Benefits

✅ **Manual Control**: Full control over who gets admin access
✅ **Default Safety**: All users default to `'user'` role
✅ **Secure**: Admin roles are assigned manually through admin panel
✅ **Flexible**: Easy to promote/demote users as needed
✅ **Consistent**: Works across all registration methods
✅ **Audit Trail**: All role changes are tracked through admin actions

## Next Steps

1. **Test Registration**: Register with any email to verify `user` role assignment
2. **Manual Admin Assignment**: Use admin panel to assign admin roles as needed
3. **Admin Panel Access**: Users with admin roles can access admin features
4. **Role-Based UI**: Implement role-based UI elements and permissions
