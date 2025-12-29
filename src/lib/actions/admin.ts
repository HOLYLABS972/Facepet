'use server';

import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit as firestoreLimit, serverTimestamp, deleteField, Timestamp, setDoc } from 'firebase/firestore';
import { adminAuth, adminDb, initializationError } from '@/lib/firebase/admin';
import { CreateCouponData, UpdateCouponData } from '@/types/coupon';
import { CreateAudienceData, CreateBusinessData, CreatePromoData, UpdateAudienceData, UpdateBusinessData, UpdatePromoData, CreateFilterData, UpdateFilterData } from '@/types/promo';
import { addPointsToUserByUid, getUserPointsByUid } from '@/lib/firebase/points-server';

// DASHBOARD STATISTICS FUNCTIONS

/**
 * Get overall statistics for the admin dashboard
 */
export async function getDashboardStats() {
  try {
    // Get total users count from Firebase
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const usersCount = usersSnapshot.size;

    // Get user roles breakdown
    const userRoles: Record<string, number> = {};
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      const role = data.role || 'user';
      userRoles[role] = (userRoles[role] || 0) + 1;
    });

    // Get new users in the last 30 days (filter in memory to avoid index issues)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersCount = usersSnapshot.docs.filter(doc => {
      const createdAt = doc.data().createdAt?.toDate();
      return createdAt && createdAt >= thirtyDaysAgo;
    }).length;

    // Get total pets count
    const petsSnapshot = await getDocs(collection(db, 'pets'));
    const petsCount = petsSnapshot.size;

    // Get total advertisements count from Firebase
    const adsSnapshot = await getDocs(collection(db, 'advertisements'));
    const adsCount = adsSnapshot.size;

    // Get total contact submissions count
    const contactSubmissionsSnapshot = await getDocs(collection(db, 'contactSubmissions'));
    const contactSubmissionsCount = contactSubmissionsSnapshot.size;

    // Get total comments count
    const commentsSnapshot = await getDocs(collection(db, 'comments'));
    const commentsCount = commentsSnapshot.size;

    // Calculate average rating from comments
    let totalRating = 0;
    let ratingCount = 0;
    commentsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rating && data.rating > 0) {
        totalRating += data.rating;
        ratingCount++;
      }
    });
    const averageRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : '0.0';
    
    // Get ads by status
    const adsByStatus: Record<string, number> = {};
    adsSnapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status || 'draft';
      adsByStatus[status] = (adsByStatus[status] || 0) + 1;
    });

    // Get ads by type
    const adsByType: Record<string, number> = {};
    adsSnapshot.forEach((doc) => {
      const data = doc.data();
      const type = data.type || 'banner';
      adsByType[type] = (adsByType[type] || 0) + 1;
    });

    return {
      users: {
        total: usersCount,
        new: newUsersCount,
        byRole: userRoles
      },
      ads: {
        total: adsCount,
        byStatus: adsByStatus,
        byType: adsByType
      },
      pets: {
        total: petsCount,
        new: 0 // New pets tracking not implemented yet
      },
      contactSubmissions: {
        total: contactSubmissionsCount
      },
      comments: {
        total: commentsCount
      },
      rating: {
        average: averageRating
      }
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      users: {
        total: 0,
        new: 0,
        byRole: {}
      },
      ads: {
        total: 0,
        byStatus: {},
        byType: {}
      },
      pets: {
        total: 0,
        new: 0
      },
      contactSubmissions: {
        total: 0
      },
      comments: {
        total: 0
      },
      rating: {
        average: '0.0'
      }
    };
  }
}

/**
 * Get recent activity for the admin dashboard
 */
export async function getRecentActivity(limit = 5) {
  try {
    // Get recent new users from Firebase (without orderBy to avoid index issues)
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      fullName: doc.data().displayName || doc.data().fullName || '',
      email: doc.data().email || '',
      role: doc.data().role || 'user',
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
    
    // Sort by createdAt and limit
    const recentUsers = allUsers
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    // Get recent pets (without orderBy to avoid index issues)
    const petsSnapshot = await getDocs(collection(db, 'pets'));
    const allPets = petsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || '',
      imageUrl: doc.data().imageUrl || doc.data().image || '',
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
    
    // Sort by createdAt and limit
    const recentPets = allPets
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    // Get recent ads from Firebase (without orderBy to avoid index issues)
    const adsSnapshot = await getDocs(collection(db, 'advertisements'));
    const allAds = adsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || '',
      type: doc.data().type || 'banner',
      status: doc.data().status || 'draft',
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
    
    // Sort by createdAt and limit
    const recentAds = allAds
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return {
      users: recentUsers,
      pets: recentPets,
      ads: recentAds
    };
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return {
      users: [],
      pets: [],
      ads: []
    };
  }
}

// USER MANAGEMENT FUNCTIONS

/**
 * Get all users with pagination
 */
export async function getAllUsers(
  page = 1,
  limit = 10,
  searchQuery = '',
  sortField = 'fullName',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  try {
    // For Firebase, we'll need to get all users and then filter/sort in memory
    // This is not ideal for large datasets, but works for admin panels
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let allUsers = await Promise.all(
      usersSnapshot.docs.map(async (doc) => {
        const userData = doc.data();
        // Get user points
        const pointsResult = await getUserPointsByUid(doc.id);
        const points = pointsResult.success ? (pointsResult.points || 0) : 0;
        
        return {
          id: doc.id,
          fullName: userData.displayName || userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          role: userData.role || 'user',
          isRestricted: userData.isRestricted || false,
          restrictionReason: userData.restrictionReason || '',
          restrictedAt: userData.restrictedAt?.toDate() || null,
          createdAt: userData.createdAt?.toDate() || new Date(),
          points: points
        };
      })
    );

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      allUsers = allUsers.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        user.fullName.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    allUsers.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'fullName':
          aValue = a.fullName;
          bValue = b.fullName;
          break;
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'role':
          aValue = a.role;
          bValue = b.role;
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        case 'points':
          aValue = a.points || 0;
          bValue = b.points || 0;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const totalCount = allUsers.length;
    const offset = (page - 1) * limit;
    const paginatedUsers = allUsers.slice(offset, offset + limit);

    return {
      users: paginatedUsers,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    return {
      users: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0
      }
    };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return {
      id: userDoc.id,
      fullName: userData.displayName || userData.fullName || '',
      email: userData.email || '',
      phone: userData.phone || '',
      role: userData.role || 'user',
      createdAt: userData.createdAt?.toDate() || new Date(),
      emailVerified: userData.emailVerified || false
    };
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(
  userId: string,
  role: 'user' | 'admin' | 'super_admin'
) {
  try {
    await updateDoc(doc(db, 'users', userId), { role });
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
}

/**
 * Restrict/Block a user
 */
export async function restrictUser(userId: string, reason?: string) {
  try {
    await updateDoc(doc(db, 'users', userId), { 
      isRestricted: true,
      restrictionReason: reason || 'Account restricted by administrator',
      restrictedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error restricting user:', error);
    return { success: false, error: 'Failed to restrict user' };
  }
}

/**
 * Unrestrict/Unblock a user
 */
export async function unrestrictUser(userId: string) {
  try {
    await updateDoc(doc(db, 'users', userId), { 
      isRestricted: false,
      restrictionReason: null,
      restrictedAt: null
    });
    return { success: true };
  } catch (error) {
    console.error('Error unrestricting user:', error);
    return { success: false, error: 'Failed to unrestrict user' };
  }
}

/**
 * Create a new user (for admin use)
 * Creates both Firebase Authentication user and Firestore document
 */
export async function createUserByAdmin(
  fullName: string,
  email: string,
  phone: string,
  password: string,
  role: 'user' | 'admin' | 'super_admin' = 'user'
) {
  try {
    const emailLower = email.toLowerCase().trim();

    // Validate inputs
    if (!emailLower || !password || !fullName) {
      return { success: false, error: 'All fields are required' };
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters' };
    }

    // Check if user already exists in Firebase Auth
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(emailLower);
      return { success: false, error: 'User with this email already exists' };
    } catch (error: any) {
      // User doesn't exist, which is what we want
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    // Create Firebase Authentication user
    if (!adminAuth) {
      return { 
        success: false, 
        error: initializationError || 'Firebase Admin Auth not initialized. Please check your Firebase Admin SDK configuration.',
        details: 'Make sure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set in your .env.local file'
      };
    }

    userRecord = await adminAuth.createUser({
      email: emailLower,
      password: password,
      displayName: fullName,
      emailVerified: false, // Admin-created users need to verify email
      disabled: false
    });

    // Create Firestore user document
    const userData = {
      uid: userRecord.uid,
      email: emailLower,
      displayName: fullName,
      fullName: fullName,
      phone: phone || '',
      role: role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      emailVerified: false,
      acceptCookies: false,
      language: 'en'
    };

    // Use setDoc with the UID as document ID to ensure consistency
    await setDoc(doc(db, 'users', userRecord.uid), userData);

    console.log('✅ User created successfully:', {
      uid: userRecord.uid,
      email: emailLower,
      role: role
    });

    return { success: true, userId: userRecord.uid };
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // If Firestore creation fails but Auth user was created, try to clean up
    if (error.code === 'auth/email-already-exists') {
      return { success: false, error: 'User with this email already exists' };
    }
    
    if (error.code === 'auth/invalid-email') {
      return { success: false, error: 'Invalid email address' };
    }
    
    if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Password is too weak' };
    }

    return { 
      success: false, 
      error: error.message || 'Failed to create user. Please try again.' 
    };
  }
}

/**
 * Add points to a user (admin action)
 */
export async function addPointsToUser(userId: string, points: number, description?: string) {
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }

    if (points <= 0) {
      return { success: false, error: 'Points must be greater than 0' };
    }

    // Add points to the 'share' category (you can change this if needed)
    const result = await addPointsToUserByUid(
      userId,
      'share',
      points,
      description || `Admin adjustment: ${points} points`,
      {
        source: 'admin_manual',
        addedBy: 'admin', // You can pass the admin user ID here if needed
        timestamp: new Date().toISOString()
      }
    );

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to add points' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding points to user:', error);
    return { success: false, error: 'Failed to add points to user' };
  }
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  try {
    // Get the user to check if they're a super_admin
    const userToDelete = await getUserById(userId);

    // Don't allow deletion of super_admin users
    if (userToDelete?.role === 'super_admin') {
      return {
        success: false,
        error: 'Super admin users cannot be deleted'
      };
    }

    await deleteDoc(doc(db, 'users', userId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
}

// AD MANAGEMENT FUNCTIONS

// Types for the ad system
export type AdType = 'image' | 'video';
export type AdStatus = 'active' | 'inactive' | 'scheduled';

export interface ServiceReview {
  id: string;
  userId: string;
  userName: string;
  rating: number; // 1-5 stars
  comment: string;
  createdAt: Date;
}

export interface Ad {
  id: string;
  title: string;
  type: AdType;
  content: string; // URL for image or video
  duration: number; // in seconds
  status: AdStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  pets?: string[]; // Array of pet IDs associated with this ad
  
  // Service-specific fields
  phone?: string;
  location?: string;
  description?: string;
  tags?: string[];
  reviews?: ServiceReview[];
  averageRating?: number;
  totalReviews?: number;
  
  // Pet-specific fields
  area?: string; // אזור
  city?: string[]; // עיר
  petType?: string; // סוג החייה
  breed?: string; // גזע
  ageRange?: string[]; // טווח גילאים
  weight?: string[]; // משקל
}

/**
 * Get all ads with pagination
 */
export async function getAllAds(
  page = 1,
  limit = 10,
  searchQuery = '',
  sortField = 'title',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  try {
    // Get all ads from Firebase
    const adsSnapshot = await getDocs(collection(db, 'advertisements'));
    let allAds = adsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || '',
      type: doc.data().type || 'banner',
      content: doc.data().content || '',
      duration: doc.data().duration || 0,
      status: doc.data().status || 'draft',
      startDate: doc.data().startDate?.toDate() || null,
      endDate: doc.data().endDate?.toDate() || null,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      createdBy: doc.data().createdBy || null,
      pets: doc.data().pets || [],
      
      // Service-specific fields
      phone: doc.data().phone || '',
      location: doc.data().location || '',
      description: doc.data().description || '',
      tags: doc.data().tags || [],
      reviews: doc.data().reviews || [],
      averageRating: doc.data().averageRating || 0,
      totalReviews: doc.data().totalReviews || 0
    }));

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      allAds = allAds.filter(ad => 
        ad.title.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    allAds.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const totalCount = allAds.length;
    const offset = (page - 1) * limit;
    const paginatedAds = allAds.slice(offset, offset + limit);

    return {
      ads: paginatedAds,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('Error getting all ads:', error);
    return {
      ads: [],
      pagination: {
        total: 0,
        page,
        limit,
        totalPages: 0
      }
    };
  }
}

/**
 * Get advertisement by ID
 */
export async function getAdById(adId: string) {
  try {
    const adDoc = await getDoc(doc(db, 'advertisements', adId));
    
    if (!adDoc.exists()) {
      return null;
    }

    const adData = adDoc.data();
    return {
      id: adDoc.id,
      title: adData.title || '',
      type: adData.type || 'banner',
      content: adData.content || '',
      duration: adData.duration || 0,
      status: adData.status || 'draft',
      startDate: adData.startDate?.toDate() || null,
      endDate: adData.endDate?.toDate() || null,
      createdAt: adData.createdAt?.toDate() || new Date(),
      updatedAt: adData.updatedAt?.toDate() || new Date(),
      createdBy: adData.createdBy || null,
      pets: adData.pets || [],
      
      // Service-specific fields
      phone: adData.phone || '',
      location: adData.location || '',
      description: adData.description || '',
      tags: adData.tags || [],
      
      // Pet-specific fields
      area: adData.area || '',
      city: adData.city || [],
      petType: adData.petType || '',
      breed: adData.breed || '',
      ageRange: adData.ageRange || [],
      weight: adData.weight || []
    };
  } catch (error) {
    console.error('Error getting ad by ID:', error);
    return null;
  }
}

/**
 * Create a new advertisement
 */
export async function createAd({
  title,
  type,
  content,
  duration,
  status,
  startDate,
  endDate,
  createdBy,
  pets,
  phone,
  location,
  description,
  tags,
  area,
  city,
  petType,
  breed,
  ageRange,
  weight
}: {
  title: string;
  type: AdType;
  content: string;
  duration: number;
  status: AdStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  createdBy?: string | null;
  pets?: string[];
  phone?: string;
  location?: string;
  description?: string;
  tags?: string[];
  area?: string;
  city?: string[];
  petType?: string;
  breed?: string;
  ageRange?: string[];
  weight?: string[];
}) {
  try {
    const currentDate = new Date();

    const docRef = await addDoc(collection(db, 'advertisements'), {
      title,
      type,
      content,
      duration,
      status,
      startDate,
      endDate,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy,
      pets: pets || [],
      phone: phone || '',
      location: location || '',
      description: description || '',
      tags: tags || [],
      area: area || '',
      city: city || [],
      petType: petType || '',
      breed: breed || '',
      ageRange: ageRange || [],
      weight: weight || [],
      reviews: [],
      averageRating: 0,
      totalReviews: 0
    });

    return { success: true, ad: { id: docRef.id } };
  } catch (error) {
    console.error('Error creating ad:', error);
    return { success: false, error: 'Failed to create advertisement' };
  }
}

/**
 * Update an advertisement
 */
export async function updateAd(
  adId: string,
  {
    title,
    type,
    content,
    duration,
    status,
    startDate,
    endDate,
    pets,
    phone,
    location,
    description,
    tags,
    area,
    city,
    petType,
    breed,
    ageRange,
    weight
  }: {
    title?: string;
    type?: AdType;
    content?: string;
    duration?: number;
    status?: AdStatus;
    startDate?: Date | null;
    endDate?: Date | null;
    pets?: string[];
    phone?: string;
    location?: string;
    description?: string;
    tags?: string[];
    area?: string;
    city?: string[];
    petType?: string;
    breed?: string;
    ageRange?: string[];
    weight?: string[];
  }
) {
  try {
    const updateValues: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateValues.title = title;
    if (type !== undefined) updateValues.type = type;
    if (content !== undefined) updateValues.content = content;
    if (duration !== undefined) updateValues.duration = duration;
    if (status !== undefined) updateValues.status = status;
    if (startDate !== undefined) updateValues.startDate = startDate;
    if (endDate !== undefined) updateValues.endDate = endDate;
    if (pets !== undefined) updateValues.pets = pets;
    if (phone !== undefined) updateValues.phone = phone;
    if (location !== undefined) updateValues.location = location;
    if (description !== undefined) updateValues.description = description;
    if (tags !== undefined) updateValues.tags = tags;
    if (area !== undefined) updateValues.area = area;
    if (city !== undefined) updateValues.city = city;
    if (petType !== undefined) updateValues.petType = petType;
    if (breed !== undefined) updateValues.breed = breed;
    if (ageRange !== undefined) updateValues.ageRange = ageRange;
    if (weight !== undefined) updateValues.weight = weight;

    await updateDoc(doc(db, 'advertisements', adId), updateValues);

    return { success: true };
  } catch (error) {
    console.error('Error updating ad:', error);
    return { success: false, error: 'Failed to update advertisement' };
  }
}

/**
 * Delete an advertisement
 */
export async function deleteAd(adId: string) {
  try {
    await deleteDoc(doc(db, 'advertisements', adId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting ad:', error);
    return { success: false, error: 'Failed to delete advertisement' };
  }
}

/**
 * Add pets to an advertisement
 */
export async function addPetsToAd(adId: string, petIds: string[]) {
  try {
    const ad = await getAdById(adId);
    if (!ad) {
      return { success: false, error: 'Advertisement not found' };
    }

    const currentPets = ad.pets || [];
    const newPets = [...new Set([...currentPets, ...petIds])]; // Remove duplicates

    await updateDoc(doc(db, 'advertisements', adId), {
      pets: newPets,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding pets to ad:', error);
    return { success: false, error: 'Failed to add pets to advertisement' };
  }
}

/**
 * Remove pets from an advertisement
 */
export async function removePetsFromAd(adId: string, petIds: string[]) {
  try {
    const ad = await getAdById(adId);
    if (!ad) {
      return { success: false, error: 'Advertisement not found' };
    }

    const currentPets = ad.pets || [];
    const newPets = currentPets.filter((petId: string) => !petIds.includes(petId));

    await updateDoc(doc(db, 'advertisements', adId), {
      pets: newPets,
      updatedAt: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing pets from ad:', error);
    return { success: false, error: 'Failed to remove pets from advertisement' };
  }
}

/**
 * Get ads by pet ID
 */
export async function getAdsByPetId(petId: string) {
  try {
    const adsSnapshot = await getDocs(collection(db, 'advertisements'));
    const ads = adsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        pets: doc.data().pets || [],
        ...doc.data()
      }))
      .filter(ad => ad.pets && ad.pets.includes(petId));

    return ads;
  } catch (error) {
    console.error('Error getting ads by pet ID:', error);
    return [];
  }
}

/**
 * Get all pets for admin selection with owner names
 */
export async function getAllPetsForAdmin() {
  try {
    const petsSnapshot = await getDocs(collection(db, 'pets'));
    
    const pets = await Promise.all(
      petsSnapshot.docs.map(async (petDoc) => {
        const petData = petDoc.data();
        let ownerName = 'Unknown Owner';
        
        // Get owner email - use userEmail directly since that's what we want to display
        if (petData.userEmail) {
          ownerName = petData.userEmail;
        } else if (petData.ownerId) {
          try {
            const ownerDocRef = doc(db, 'owners', petData.ownerId);
            const ownerDoc = await getDoc(ownerDocRef);
            if (ownerDoc.exists()) {
              const ownerData = ownerDoc.data() as any;
              ownerName = ownerData.email || ownerData.fullName || ownerData.name || 'Unknown Owner';
            }
          } catch (error) {
            console.error('Error fetching owner:', error);
          }
        }

        // Get breed name - use breedName directly since that's what's stored
        let breedName = petData.breedName || petData.breed || 'Unknown Breed';

        return {
          id: petDoc.id,
          name: petData.name || '',
          type: petData.type || 'Unknown',
          breed: breedName,
          gender: petData.gender || 'Unknown',
          weight: petData.weight || '',
          imageUrl: petData.imageUrl || petData.image || '',
          ownerName: ownerName,
          ownerId: petData.ownerId || '',
          createdAt: petData.createdAt?.toDate() || new Date()
        };
      })
    );

    return pets;
  } catch (error) {
    console.error('Error getting all pets for admin:', error);
    return [];
  }
}

/**
 * Get pets by user email for admin
 */
export async function getPetsByUserEmail(userEmail: string) {
  try {
    const petsSnapshot = await getDocs(
      query(collection(db, 'pets'), where('userEmail', '==', userEmail))
    );
    
    const pets = await Promise.all(
      petsSnapshot.docs.map(async (petDoc) => {
        const petData = petDoc.data();
        
        // Get breed name - use breedName directly since that's what's stored
        let breedName = petData.breedName || petData.breed || 'Unknown Breed';

        return {
          id: petDoc.id,
          name: petData.name || '',
          type: petData.type || 'Unknown',
          breed: breedName,
          gender: petData.gender || 'Unknown',
          weight: petData.weight || '',
          imageUrl: petData.imageUrl || petData.image || '',
          ownerName: userEmail, // Use email as owner name since we're filtering by user
          ownerId: petData.ownerId || '',
          createdAt: petData.createdAt?.toDate() || new Date()
        };
      })
    );

    return pets;
  } catch (error) {
    console.error('Error getting pets by user email:', error);
    return [];
  }
}

/**
 * Update pet type, breed, or gender
 */
export async function updatePetField(petId: string, field: 'type' | 'breed' | 'gender' | 'weight', value: string) {
  try {
    const petRef = doc(db, 'pets', petId);
    
    // Map field names to database field names
    const dbField = field === 'breed' ? 'breedName' : field;
    
    // Update the field with the string value
    await updateDoc(petRef, {
      [dbField]: value,
      updatedAt: new Date()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating pet field:', error);
    return { success: false, error: 'Failed to update pet' };
  }
}

/**
 * Delete a pet
 */
export async function deletePet(petId: string) {
  try {
    await deleteDoc(doc(db, 'pets', petId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting pet:', error);
    return { success: false, error: 'Failed to delete pet' };
  }
}

/**
 * Get active advertisements
 * Returns ads that are:
 * 1. Status is 'active' OR
 * 2. Status is 'scheduled' AND current date is between start and end dates
 */
export async function getActiveAds() {
  try {
    const now = new Date();
    
    // Get all ads and filter in memory (Firebase doesn't support complex queries easily)
    const adsSnapshot = await getDocs(collection(db, 'advertisements'));
    const allAds = adsSnapshot.docs.map(doc => ({
      id: doc.id,
      status: doc.data().status || 'draft',
      startDate: doc.data().startDate,
      endDate: doc.data().endDate,
      ...doc.data()
    }));

    const activeAds = allAds.filter(ad => {
      // Status is 'active'
      if (ad.status === 'active') {
        return true;
      }
      
      // Status is 'scheduled' and within date range
      if (ad.status === 'scheduled') {
        const startDate = ad.startDate?.toDate();
        const endDate = ad.endDate?.toDate();
        
        if (!startDate || !endDate) {
          return false;
        }
        
        return now >= startDate && now <= endDate;
      }
      
      return false;
    });

    return activeAds;
  } catch (error) {
    console.error('Error getting active ads:', error);
    return [];
  }
}

/**
 * Get a random active advertisement
 */
export async function getRandomActiveAd() {
  try {
    const now = new Date();
    
    // Get all ads and filter for active ones
    const adsSnapshot = await getDocs(collection(db, 'advertisements'));
    const allAds = adsSnapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title || '',
      type: doc.data().type || 'banner',
      content: doc.data().content || '',
      duration: doc.data().duration || 0,
      status: doc.data().status || 'draft',
      startDate: doc.data().startDate?.toDate(),
      endDate: doc.data().endDate?.toDate()
    }));

    const activeAds = allAds.filter(ad => {
      // Status is 'active'
      if (ad.status === 'active') {
        return true;
      }
      
      // Status is 'scheduled' and within date range
      if (ad.status === 'scheduled' && ad.startDate && ad.endDate) {
        return now >= ad.startDate && now <= ad.endDate;
      }
      
      return false;
    });

    // If no ads available, return null
    if (activeAds.length === 0) {
      return null;
    }

    // Pick a random ad from the available ones
    const randomIndex = Math.floor(Math.random() * activeAds.length);
    return activeAds[randomIndex];
  } catch (error) {
    console.error('Error getting random active ad:', error);
    return null;
  }
}

/**
 * Get all active advertisements for services page
 */
export async function getActiveAdsForServices() {
  try {
    // Fetch businesses instead of advertisements
    const businessesSnapshot = await getDocs(collection(db, 'businesses'));
    
    const businesses = businessesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.name || '',
        type: 'business',
        content: data.description || '',
        duration: 0,
        status: data.isActive ? 'active' : 'inactive',
        startDate: null,
        endDate: null,
        createdAt: data.createdAt?.toDate() || new Date(),
        
        // Map business fields to ad structure
        phone: data.contactInfo?.phone || '',
        location: data.contactInfo?.address || '',
        description: data.description || '',
        tags: data.tags || (data.category ? [data.category] : []),
        reviews: [],
        averageRating: 0,
        totalReviews: 0,
        imageUrl: data.imageUrl || ''
      };
    });

    // Filter only active businesses
    const activeBusinesses = businesses.filter(business => business.status === 'active');

    // Sort by creation date (newest first)
    activeBusinesses.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return activeBusinesses;
  } catch (error) {
    console.error('Error getting businesses for services:', error);
    return [];
  }
}

/**
 * Contact Info Management
 */
export interface ContactInfo {
  id?: string;
  email: string;
  phone: string;
  address: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  androidAppUrl?: string;
  iosAppUrl?: string;
  storeUrl?: string;
  isEnabled: boolean;
  updatedAt: Date;
}

/**
 * Get contact information
 */
export async function getContactInfo(): Promise<ContactInfo | null> {
  try {
    const contactSnapshot = await getDocs(collection(db, 'contactInfo'));
    
    if (contactSnapshot.empty) {
      return null;
    }
    
    const doc = contactSnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      whatsapp: data.whatsapp || '',
      androidAppUrl: data.androidAppUrl || '',
      iosAppUrl: data.iosAppUrl || '',
      storeUrl: data.storeUrl || '',
      isEnabled: data.isEnabled || false,
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting contact info:', error);
    return null;
  }
}

/**
 * Save or update contact information
 */
export async function saveContactInfo(contactInfo: Omit<ContactInfo, 'id' | 'updatedAt'>) {
  try {
    const contactSnapshot = await getDocs(collection(db, 'contactInfo'));
    
    if (contactSnapshot.empty) {
      // Create new contact info
      await addDoc(collection(db, 'contactInfo'), {
        ...contactInfo,
        updatedAt: new Date()
      });
    } else {
      // Update existing contact info
      const doc = contactSnapshot.docs[0];
      await updateDoc(doc.ref, {
        ...contactInfo,
        updatedAt: new Date()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving contact info:', error);
    return { success: false, error: 'Failed to save contact information' };
  }
}

/**
 * Get mobile app links
 */
export async function getMobileAppLinks() {
  try {
    console.log('Getting contact info for mobile app links...');
    const contactInfo = await getContactInfo();
    console.log('Contact info retrieved:', contactInfo);
    const links = {
      androidAppUrl: contactInfo?.androidAppUrl || '',
      iosAppUrl: contactInfo?.iosAppUrl || ''
    };
    console.log('Mobile app links extracted:', links);
    return links;
  } catch (error) {
    console.error('Error getting mobile app links:', error);
    return {
      androidAppUrl: '',
      iosAppUrl: ''
    };
  }
}

/**
 * Comment Management
 */
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  content: string;
  rating?: number;
  adId?: string;
  adTitle?: string;
  createdAt: Date;
  isApproved: boolean;
}

/**
 * Get all comments with pagination and filtering
 */
export async function getAllComments(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sort: string = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  approvedOnly: boolean = false
) {
  try {
    let commentsQuery = query(
      collection(db, 'comments'),
      orderBy(sort, order)
    );

    const commentsSnapshot = await getDocs(commentsQuery);
    let allComments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId || '',
      userName: doc.data().userName || '',
      userEmail: doc.data().userEmail || '',
      content: doc.data().content || '',
      rating: doc.data().rating || 0,
      adId: doc.data().adId || '',
      adTitle: doc.data().adTitle || '',
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      isApproved: doc.data().isApproved || false
    }));

    // Filter by search term
    if (search) {
      allComments = allComments.filter(comment =>
        comment.content.toLowerCase().includes(search.toLowerCase()) ||
        comment.userName.toLowerCase().includes(search.toLowerCase()) ||
        comment.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        (comment.adTitle && comment.adTitle.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter by approval status
    if (approvedOnly) {
      allComments = allComments.filter(comment => comment.isApproved);
    }

    // Calculate pagination
    const totalComments = allComments.length;
    const totalPages = Math.ceil(totalComments / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const comments = allComments.slice(startIndex, endIndex);

    return {
      comments,
      pagination: {
        page,
        limit,
        totalComments,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting comments:', error);
    return {
      comments: [],
      pagination: {
        page: 1,
        limit: 10,
        totalComments: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string) {
  try {
    await deleteDoc(doc(db, 'comments', commentId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error: 'Failed to delete comment' };
  }
}

/**
 * Approve/Disapprove a comment
 */
export async function updateCommentApproval(commentId: string, isApproved: boolean) {
  try {
    await updateDoc(doc(db, 'comments', commentId), {
      isApproved,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating comment approval:', error);
    return { success: false, error: 'Failed to update comment approval' };
  }
}

/**
 * Get comments for a specific ad/service
 */
export async function getCommentsForAd(adId: string) {
  try {
    console.log('getCommentsForAd called with adId:', adId);
    
    // First, let's check all comments to see what adIds exist
    const allCommentsQuery = query(collection(db, 'comments'));
    const allCommentsSnapshot = await getDocs(allCommentsQuery);
    console.log('All comments in database:', allCommentsSnapshot.docs.map(doc => ({
      id: doc.id,
      adId: doc.data().adId,
      adTitle: doc.data().adTitle,
      isApproved: doc.data().isApproved
    })));
    
    // Temporary: Remove orderBy until index is created
    const commentsQuery = query(
      collection(db, 'comments'),
      where('adId', '==', adId)
    );

    const commentsSnapshot = await getDocs(commentsQuery);
    console.log('Comments snapshot size for adId', adId, ':', commentsSnapshot.docs.length);
    
    const comments = commentsSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Comment data:', data);
      return {
        id: doc.id,
        userId: data.userId || '',
        userName: data.userName || '',
        userEmail: data.userEmail || '',
        adId: data.adId || '',
        adTitle: data.adTitle || '',
        content: data.content || '',
        rating: data.rating || 0,
        isApproved: data.isApproved || false,
        createdAt: data.createdAt?.toDate() || new Date()
      };
    });

    // Sort comments by createdAt descending (client-side sorting)
    comments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    console.log('Returning comments:', comments);
    return comments;
  } catch (error) {
    console.error('Error getting comments for ad:', error);
    return [];
  }
}

/**
 * Submit a comment for an ad/service
 */
export async function submitComment({
  adId,
  adTitle,
  userName,
  userEmail,
  content,
  rating
}: {
  adId: string;
  adTitle: string;
  userName: string;
  userEmail: string;
  content: string;
  rating: number;
}) {
  try {
    console.log('Submitting comment with data:', { adId, adTitle, userName, userEmail, content, rating });
    const commentData = {
      adId,
      adTitle,
      userName,
      userEmail,
      content,
      rating,
      isApproved: true, // Comments are approved immediately
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'comments'), commentData);
    console.log('Comment submitted successfully with ID:', docRef.id);
    
    return { success: true, commentId: docRef.id };
  } catch (error) {
    console.error('Error submitting comment:', error);
    return { success: false, error: 'Failed to submit comment' };
  }
}

/**
 * Contact Form Submissions Management
 */
export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  userId?: string;
}

/**
 * Get all contact form submissions with pagination and filtering
 */
export async function getAllContactSubmissions(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sort: string = 'createdAt',
  order: 'asc' | 'desc' = 'desc',
  unreadOnly: boolean = false
) {
  try {
    let submissionsQuery = query(
      collection(db, 'contactSubmissions'),
      orderBy(sort, order)
    );

    const submissionsSnapshot = await getDocs(submissionsQuery);
    let allSubmissions = submissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || '',
      email: doc.data().email || '',
      phone: doc.data().phone || '',
      message: doc.data().message || '',
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      isRead: doc.data().isRead || false,
      userId: doc.data().userId || ''
    }));

    // Filter by search term
    if (search) {
      allSubmissions = allSubmissions.filter(submission =>
        submission.name.toLowerCase().includes(search.toLowerCase()) ||
        submission.email.toLowerCase().includes(search.toLowerCase()) ||
        submission.message.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by read status
    if (unreadOnly) {
      allSubmissions = allSubmissions.filter(submission => !submission.isRead);
    }

    // Calculate pagination
    const totalSubmissions = allSubmissions.length;
    const totalPages = Math.ceil(totalSubmissions / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const submissions = allSubmissions.slice(startIndex, endIndex);

    return {
      submissions,
      pagination: {
        page,
        limit,
        totalSubmissions,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting contact submissions:', error);
    return {
      submissions: [],
      pagination: {
        page: 1,
        limit: 10,
        totalSubmissions: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    };
  }
}

/**
 * Delete a contact submission
 */
export async function deleteContactSubmission(submissionId: string) {
  try {
    await deleteDoc(doc(db, 'contactSubmissions', submissionId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting contact submission:', error);
    return { success: false, error: 'Failed to delete contact submission' };
  }
}

/**
 * Mark contact submission as read/unread
 */
export async function updateContactSubmissionReadStatus(submissionId: string, isRead: boolean) {
  try {
    await updateDoc(doc(db, 'contactSubmissions', submissionId), {
      isRead,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating contact submission read status:', error);
    return { success: false, error: 'Failed to update read status' };
  }
}

/**
 * Cookie Settings Management
 */
export interface CookieSettings {
  id?: string;
  cookiesEnabled: boolean;
  analyticsEnabled: boolean;
  marketingEnabled: boolean;
  necessaryCookiesEnabled: boolean;
  cookieBannerText: string;
  cookiePolicyUrl: string;
  updatedAt: Date;
}

/**
 * Get cookie settings
 */
export async function getCookieSettings(): Promise<CookieSettings | null> {
  try {
    const settingsSnapshot = await getDocs(collection(db, 'cookieSettings'));
    
    if (settingsSnapshot.empty) {
      return null;
    }
    
    const doc = settingsSnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      cookiesEnabled: data.cookiesEnabled || false,
      analyticsEnabled: data.analyticsEnabled || false,
      marketingEnabled: data.marketingEnabled || false,
      necessaryCookiesEnabled: data.necessaryCookiesEnabled !== false, // Default to true
      cookieBannerText: data.cookieBannerText || 'We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.',
      cookiePolicyUrl: data.cookiePolicyUrl || '/privacy',
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting cookie settings:', error);
    return null;
  }
}

/**
 * Save or update cookie settings
 */
export async function saveCookieSettings(cookieSettings: Omit<CookieSettings, 'id' | 'updatedAt'>) {
  try {
    const settingsSnapshot = await getDocs(collection(db, 'cookieSettings'));
    
    if (settingsSnapshot.empty) {
      // Create new cookie settings
      await addDoc(collection(db, 'cookieSettings'), {
        ...cookieSettings,
        updatedAt: new Date()
      });
    } else {
      // Update existing cookie settings
      const doc = settingsSnapshot.docs[0];
      await updateDoc(doc.ref, {
        ...cookieSettings,
        updatedAt: new Date()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving cookie settings:', error);
    return { success: false, error: 'Failed to save cookie settings' };
  }
}

/**
 * Install Banner Settings Management
 */
export interface InstallBannerSettings {
  id?: string;
  enabled: boolean;
  bannerText: string;
  logoUrl?: string;
  updatedAt: Date;
}

/**
 * Get install banner settings
 */
export async function getInstallBannerSettings(): Promise<InstallBannerSettings | null> {
  try {
    const settingsSnapshot = await getDocs(collection(db, 'installBannerSettings'));
    
    if (settingsSnapshot.empty) {
      return null;
    }
    
    const doc = settingsSnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      enabled: data.enabled || false,
      bannerText: data.bannerText || 'Add this website to your home screen for quick access!',
      logoUrl: data.logoUrl || '',
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting install banner settings:', error);
    return null;
  }
}

/**
 * Save or update install banner settings
 */
export async function saveInstallBannerSettings(settings: Omit<InstallBannerSettings, 'id' | 'updatedAt'>) {
  try {
    const settingsSnapshot = await getDocs(collection(db, 'installBannerSettings'));
    
    if (settingsSnapshot.empty) {
      // Create new settings
      await addDoc(collection(db, 'installBannerSettings'), {
        ...settings,
        updatedAt: new Date()
      });
    } else {
      // Update existing settings
      const doc = settingsSnapshot.docs[0];
      await updateDoc(doc.ref, {
        ...settings,
        updatedAt: new Date()
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error saving install banner settings:', error);
    return { success: false, error: 'Failed to save install banner settings' };
  }
}

// COUPON MANAGEMENT FUNCTIONS

/**
 * Create a new coupon
 */
export async function createCoupon(couponData: CreateCouponData, createdBy: string) {
  try {
    // Handle both businessId (legacy) and businessIds (new)
    const { businessId, businessIds, ...restData } = couponData;
    const dataToSave: any = {
      ...restData,
      isActive: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Prefer businessIds array over single businessId
    if (businessIds && businessIds.length > 0) {
      dataToSave.businessIds = businessIds;
    } else if (businessId) {
      // Legacy support: convert single businessId to array
      dataToSave.businessIds = [businessId];
    }
    
    const docRef = await addDoc(collection(db, 'coupons'), dataToSave);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return { success: false, error: 'Failed to create coupon' };
  }
}

/**
 * Get all coupons
 */
export async function getCoupons() {
  try {
    const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const coupons = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate() || new Date();
      const updatedAt = data.updatedAt?.toDate() || new Date();
      const validFrom = data.validFrom?.toDate() || new Date();
      const validTo = data.validTo?.toDate() || new Date();
      
      // Debug: Log business data for each coupon
      if (doc.id === 'IvmgfeBPfGRXLIQ5ce0Q') {
        console.log('🔍 getCoupons - Coupon IvmgfeBPfGRXLIQ5ce0Q raw data:', {
          hasBusinessId: !!data.businessId,
          hasBusinessIds: !!data.businessIds,
          businessId: data.businessId,
          businessIds: data.businessIds,
          allFields: Object.keys(data)
        });
      }
      
      const couponData = {
        id: doc.id,
        ...data,
        // Convert Date objects to ISO strings for serialization
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
        validFrom: validFrom.toISOString(),
        validTo: validTo.toISOString()
      };
      
      // Ensure businessIds is properly included (it should be in ...data, but let's be explicit)
      // Debug: Log specific coupon
      if (doc.id === 'IvmgfeBPfGRXLIQ5ce0Q') {
        console.log('🔍 Server Action - getCoupons returning coupon IvmgfeBPfGRXLIQ5ce0Q:', {
          hasBusinessIds: !!couponData.businessIds,
          businessIds: couponData.businessIds,
          businessIdsType: typeof couponData.businessIds,
          businessIdsIsArray: Array.isArray(couponData.businessIds),
          allKeys: Object.keys(couponData)
        });
      }
      
      return couponData;
    });
    
    return { success: true, coupons };
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return { success: false, error: 'Failed to fetch coupons' };
  }
}

/**
 * Get coupon by ID
 */
export async function getCouponById(id: string) {
  try {
    const docRef = doc(db, 'coupons', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('🔍 getCouponById - Raw Firestore data:', {
        id: docSnap.id,
        hasBusinessId: !!data.businessId,
        hasBusinessIds: !!data.businessIds,
        businessId: data.businessId,
        businessIds: data.businessIds,
        allFields: Object.keys(data)
      });
      
      const coupon = {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        validFrom: data.validFrom?.toDate() || new Date(),
        validTo: data.validTo?.toDate() || new Date()
      };
      return { success: true, coupon };
    }
    return { success: false, error: 'Coupon not found' };
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return { success: false, error: 'Failed to fetch coupon' };
  }
}

/**
 * Update a coupon
 */
export async function updateCoupon(id: string, updateData: UpdateCouponData) {
  try {
    const docRef = doc(db, 'coupons', id);
    // Handle both businessId (legacy) and businessIds (new)
    const { businessId, businessIds, ...restData } = updateData;
    
    console.log('🔍 updateCoupon - Input data:', {
      couponId: id,
      businessId,
      businessIds,
      hasBusinessIds: businessIds !== undefined,
      businessIdsLength: businessIds?.length || 0
    });
    
    const dataToUpdate: any = {
      ...restData,
      updatedAt: serverTimestamp()
    };
    
    // Handle businessIds array (new format)
    if (businessIds !== undefined) {
      if (businessIds.length === 0) {
        // Remove businessIds field if empty array
        dataToUpdate.businessIds = deleteField();
        // Also remove legacy businessId if it exists
        dataToUpdate.businessId = deleteField();
        console.log('🔍 updateCoupon - Removing businessIds (empty array)');
      } else {
        dataToUpdate.businessIds = businessIds;
        // Remove legacy businessId when using new format
        dataToUpdate.businessId = deleteField();
        console.log('🔍 updateCoupon - Setting businessIds:', businessIds);
      }
    } else if (businessId !== undefined) {
      // Legacy support: handle single businessId
      if (businessId === '') {
        dataToUpdate.businessId = deleteField();
        dataToUpdate.businessIds = deleteField();
        console.log('🔍 updateCoupon - Removing businessId (empty string)');
      } else {
        // Convert single businessId to array
        dataToUpdate.businessIds = [businessId];
        dataToUpdate.businessId = deleteField();
        console.log('🔍 updateCoupon - Converting businessId to array:', [businessId]);
      }
    } else {
      console.log('⚠️ updateCoupon - No businessIds or businessId provided, not updating business fields');
    }
    
    console.log('🔍 updateCoupon - Final dataToUpdate:', {
      ...dataToUpdate,
      updatedAt: '[serverTimestamp]'
    });
    
    await updateDoc(docRef, dataToUpdate);
    console.log('✅ updateCoupon - Successfully updated coupon:', id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating coupon:', error);
    return { success: false, error: 'Failed to update coupon' };
  }
}

/**
 * Delete a coupon
 */
export async function deleteCoupon(id: string) {
  try {
    const docRef = doc(db, 'coupons', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, error: 'Failed to delete coupon' };
  }
}

// AUDIENCE MANAGEMENT FUNCTIONS

/**
 * Create a new audience
 */
export async function createAudience(audienceData: CreateAudienceData, createdBy: string) {
  try {
    const docRef = await addDoc(collection(db, 'audiences'), {
      ...audienceData,
      isActive: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating audience:', error);
    return { success: false, error: 'Failed to create audience' };
  }
}

/**
 * Get all audiences
 */
export async function getAudiences() {
  try {
    const q = query(collection(db, 'audiences'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const audiences = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));
    
    return { success: true, audiences };
  } catch (error) {
    console.error('Error fetching audiences:', error);
    return { success: false, error: 'Failed to fetch audiences' };
  }
}

/**
 * Update an audience
 */
export async function updateAudience(id: string, updateData: UpdateAudienceData) {
  try {
    const docRef = doc(db, 'audiences', id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating audience:', error);
    return { success: false, error: 'Failed to update audience' };
  }
}

/**
 * Delete an audience
 */
export async function deleteAudience(id: string) {
  try {
    const docRef = doc(db, 'audiences', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting audience:', error);
    return { success: false, error: 'Failed to delete audience' };
  }
}

// BUSINESS MANAGEMENT FUNCTIONS

/**
 * Create a new business
 */
export async function createBusiness(businessData: CreateBusinessData, createdBy: string) {
  try {
    const docRef = await addDoc(collection(db, 'businesses'), {
      ...businessData,
      isActive: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating business:', error);
    return { success: false, error: 'Failed to create business' };
  }
}

/**
 * Get all businesses
 */
export async function getBusinesses() {
  try {
    const q = query(collection(db, 'businesses'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const businesses = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));
    
    return { success: true, businesses };
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return { success: false, error: 'Failed to fetch businesses' };
  }
}

/**
 * Get a business by ID
 */
export async function getBusinessById(id: string) {
  try {
    const businessDoc = await getDoc(doc(db, 'businesses', id));
    
    if (!businessDoc.exists()) {
      return null;
    }

    const data = businessDoc.data();
    return {
      id: businessDoc.id,
      name: data.name || '',
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      contactInfo: {
        email: data.contactInfo?.email || '',
        phone: data.contactInfo?.phone || '',
        address: data.contactInfo?.address || ''
      },
      tags: data.tags || [],
      filterIds: data.filterIds || [],
      rating: data.rating || 0,
      isActive: data.isActive || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy || ''
    };
  } catch (error) {
    console.error('Error getting business by ID:', error);
    return null;
  }
}

/**
 * Update a business
 */
export async function updateBusiness(id: string, updateData: UpdateBusinessData) {
  try {
    const docRef = doc(db, 'businesses', id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating business:', error);
    return { success: false, error: 'Failed to update business' };
  }
}

/**
 * Delete a business
 */
export async function deleteBusiness(id: string) {
  try {
    const docRef = doc(db, 'businesses', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting business:', error);
    return { success: false, error: 'Failed to delete business' };
  }
}

// FILTER MANAGEMENT FUNCTIONS

/**
 * Create a new filter
 */
export async function createFilter(filterData: CreateFilterData, createdBy: string) {
  try {
    const docRef = await addDoc(collection(db, 'filters'), {
      ...filterData,
      isActive: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating filter:', error);
    return { success: false, error: 'Failed to create filter' };
  }
}

/**
 * Get all filters
 */
export async function getFilters() {
  try {
    const q = query(collection(db, 'filters'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const filters = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      audienceIds: doc.data().audienceIds || [],
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    }));
    
    return { success: true, filters };
  } catch (error) {
    console.error('Error fetching filters:', error);
    return { success: false, error: 'Failed to fetch filters' };
  }
}

/**
 * Update a filter
 */
export async function updateFilter(id: string, updateData: UpdateFilterData) {
  try {
    const docRef = doc(db, 'filters', id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating filter:', error);
    return { success: false, error: 'Failed to update filter' };
  }
}

/**
 * Delete a filter
 */
export async function deleteFilter(id: string) {
  try {
    const docRef = doc(db, 'filters', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting filter:', error);
    return { success: false, error: 'Failed to delete filter' };
  }
}

// PROMO MANAGEMENT FUNCTIONS

/**
 * Create a new promo
 */
export async function createPromo(promoData: CreatePromoData, createdBy: string) {
  try {
    // Convert Date objects to Timestamps for Firestore
    const dataToSave: any = {
      ...promoData,
      isActive: true,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Convert startDate and endDate to Timestamps if they exist
    if (promoData.startDate && promoData.startDate instanceof Date) {
      dataToSave.startDate = Timestamp.fromDate(promoData.startDate);
    } else {
      // Remove undefined dates from dataToSave
      delete dataToSave.startDate;
    }
    
    if (promoData.endDate && promoData.endDate instanceof Date) {
      dataToSave.endDate = Timestamp.fromDate(promoData.endDate);
    } else {
      // Remove undefined dates from dataToSave
      delete dataToSave.endDate;
    }
    
    const docRef = await addDoc(collection(db, 'promos'), dataToSave);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating promo:', error);
    return { success: false, error: 'Failed to create promo' };
  }
}

/**
 * Get all promos
 */
export async function getPromos() {
  try {
    const q = query(collection(db, 'promos'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const promos = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Helper function to safely convert dates
      const convertDate = (dateValue: any): Date | undefined => {
        if (!dateValue) return undefined;
        if (dateValue instanceof Date) return dateValue;
        if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
          return dateValue.toDate();
        }
        if (typeof dateValue === 'string' || typeof dateValue === 'number') {
          return new Date(dateValue);
        }
        return undefined;
      };
      
      return {
        id: doc.id,
        ...data,
        createdAt: convertDate(data.createdAt) || new Date(),
        updatedAt: convertDate(data.updatedAt) || new Date(),
        startDate: convertDate(data.startDate),
        endDate: convertDate(data.endDate),
        // Ensure isActive defaults to true if not set
        isActive: data.isActive !== undefined ? data.isActive : true
      };
    });
    
    return { success: true, promos };
  } catch (error) {
    console.error('Error fetching promos:', error);
    return { success: false, error: 'Failed to fetch promos' };
  }
}

/**
 * Get a random active promo filtered by user audiences
 * Always shows promos if any exist - prioritizes audience matching but falls back to all
 */
export async function getRandomActivePromo(
  userAudienceIds?: string[]
) {
  try {
    const now = new Date();
    
    // Get all promos
    const promosSnapshot = await getDocs(collection(db, 'promos'));
    console.log('Total promos in database:', promosSnapshot.size);
    
    if (promosSnapshot.size === 0) {
      console.log('No promos in database');
      return null;
    }
    
    const allPromos = promosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        youtubeUrl: data.youtubeUrl || '', // Include YouTube URL
        businessId: data.businessId || '',
        audienceId: data.audienceId || '',
        isActive: data.isActive !== undefined ? data.isActive : true, // Default to true if not set
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || ''
      };
    });
    
    // Filter for promos with images OR YouTube URLs (required for display)
    let promosWithMedia = allPromos.filter(promo => !!promo.imageUrl || !!promo.youtubeUrl);
    
    if (promosWithMedia.length === 0) {
      console.log('No promos with media (image or YouTube) found');
      return null;
    }

    // Filter for active promos (be lenient - only exclude if explicitly false)
    let activePromos = promosWithMedia.filter(promo => {
      // Only exclude if explicitly set to false
      if (promo.isActive === false) {
        return false;
      }
      
      // Check date range if both dates are provided
      if (promo.startDate && promo.endDate) {
        if (now < promo.startDate || now > promo.endDate) {
          return false;
        }
      } else if (promo.startDate && !promo.endDate) {
        // If only start date, check if it has started
        if (now < promo.startDate) {
          return false;
        }
      } else if (!promo.startDate && promo.endDate) {
        // If only end date, check if it hasn't ended
        if (now > promo.endDate) {
          return false;
        }
      }
      
      return true;
    });

    // If no date-valid promos, use all promos with media (ignore dates)
    if (activePromos.length === 0) {
      console.log('No date-valid promos, using all promos with media');
      activePromos = promosWithMedia.filter(p => p.isActive !== false);
    }

    // Filter by user audiences if provided
    let finalPromos = activePromos;
    if (userAudienceIds && userAudienceIds.length > 0) {
      const audienceFilteredPromos = activePromos.filter(promo => {
        // Promo must have an audienceId that matches one of the user's audiences
        return promo.audienceId && userAudienceIds.includes(promo.audienceId);
      });
      
      // If we found matching promos, use them; otherwise show all promos
      if (audienceFilteredPromos.length > 0) {
        finalPromos = audienceFilteredPromos;
        console.log(`Found ${finalPromos.length} promos matching user audiences`);
      } else {
        console.log('No matching audience promos, showing all active promos');
      }
    } else {
      console.log('No user audiences, showing all active promos');
    }

    // If still no promos, use any promo with an image (last resort)
    if (finalPromos.length === 0) {
      console.log('No filtered promos, using any promo with image');
      finalPromos = promosWithImages;
    }

    // If no promos available at all, return null
    if (finalPromos.length === 0) {
      console.log('No promos available to display');
      return null;
    }

    console.log(`Displaying promo from ${finalPromos.length} available promos`);

    // Pick a random promo from the available ones
    const randomIndex = Math.floor(Math.random() * finalPromos.length);
    const selectedPromo = finalPromos[randomIndex];
    console.log('Selected promo:', selectedPromo.id, selectedPromo.name);
    return selectedPromo;
  } catch (error) {
    console.error('Error getting random active promo:', error);
    return null;
  }
}

/**
 * Get promo by ID
 */
export async function getPromoById(id: string) {
  try {
    const docRef = doc(db, 'promos', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const promo = {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        startDate: docSnap.data().startDate?.toDate() || undefined,
        endDate: docSnap.data().endDate?.toDate() || undefined
      };
      return { success: true, promo };
    }
    return { success: false, error: 'Promo not found' };
  } catch (error) {
    console.error('Error fetching promo:', error);
    return { success: false, error: 'Failed to fetch promo' };
  }
}

/**
 * Update a promo
 */
export async function updatePromo(id: string, updateData: UpdatePromoData) {
  try {
    const docRef = doc(db, 'promos', id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating promo:', error);
    return { success: false, error: 'Failed to update promo' };
  }
}

/**
 * Delete a promo
 */
export async function deletePromo(id: string) {
  try {
    const docRef = doc(db, 'promos', id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting promo:', error);
    return { success: false, error: 'Failed to delete promo' };
  }
}
