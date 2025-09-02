// Consolidated Users Collection Structure
// This replaces both users and owners collections

export interface ConsolidatedUser {
  // Basic user info (from users collection)
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  password?: string; // Only for non-Firebase auth users
  role: 'user' | 'admin' | 'super_admin' | 'vet';
  
  // Contact information (from owners collection)
  phoneNumber?: string;
  homeAddress?: string;
  postcode?: string;
  
  // Privacy settings (from owners collection)
  isPhonePrivate?: boolean;
  isEmailPrivate?: boolean;
  isAddressPrivate?: boolean;
  
  // Authentication & verification
  emailVerified?: boolean;
  emailVerifiedAt?: Date;
  
  // Timestamps
  lastActivityDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Role-based user types
export interface PetOwner extends ConsolidatedUser {
  role: 'user';
  // Pet owner specific fields
  pets?: string[]; // Array of pet IDs
}

export interface Vet extends ConsolidatedUser {
  role: 'vet';
  // Vet specific fields
  clinicName?: string;
  specialization?: string;
  licenseNumber?: string;
}

export interface Admin extends ConsolidatedUser {
  role: 'admin' | 'super_admin';
  // Admin specific fields
  permissions?: string[];
}

// Helper functions for role checking
export function isPetOwner(user: ConsolidatedUser): user is PetOwner {
  return user.role === 'user';
}

export function isVet(user: ConsolidatedUser): user is Vet {
  return user.role === 'vet';
}

export function isAdmin(user: ConsolidatedUser): user is Admin {
  return user.role === 'admin' || user.role === 'super_admin';
}

// Migration helper to convert existing data
export function migrateOwnerToUser(owner: any, user: any): ConsolidatedUser {
  return {
    id: user.id,
    fullName: user.fullName || owner.fullName,
    email: user.email,
    phone: user.phone,
    phoneNumber: owner.phoneNumber,
    homeAddress: owner.homeAddress,
    postcode: owner.postcode,
    isPhonePrivate: owner.isPhonePrivate || false,
    isEmailPrivate: owner.isEmailPrivate || false,
    isAddressPrivate: owner.isAddressPrivate || false,
    role: user.role || 'user',
    emailVerified: user.emailVerified || false,
    emailVerifiedAt: user.emailVerifiedAt,
    lastActivityDate: user.lastActivityDate,
    createdAt: user.createdAt || new Date(),
    updatedAt: new Date()
  };
}
