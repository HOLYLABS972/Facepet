'use server';

import { db } from '@/lib/firebase/config';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { hash } from 'bcryptjs';

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
    let allUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      fullName: doc.data().displayName || doc.data().fullName || '',
      email: doc.data().email || '',
      phone: doc.data().phone || '',
      role: doc.data().role || 'user',
      isRestricted: doc.data().isRestricted || false,
      restrictionReason: doc.data().restrictionReason || '',
      restrictedAt: doc.data().restrictedAt?.toDate() || null,
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));

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
 */
export async function createUserByAdmin(
  fullName: string,
  email: string,
  phone: string,
  password: string,
  role: 'user' | 'admin' | 'super_admin' = 'user'
) {
  try {
    const emailLower = email.toLowerCase();
    const hashedPassword = await hash(password, 10);

    await addDoc(collection(db, 'users'), {
      fullName,
      email: emailLower,
      phone,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      emailVerified: false
    });

    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
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
      pets: adData.pets || []
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
  tags
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
    tags
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
 * Update pet type, breed, or gender
 */
export async function updatePetField(petId: string, field: 'type' | 'breed' | 'gender', value: string) {
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
      endDate: doc.data().endDate?.toDate(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      
      // Service-specific fields
      phone: doc.data().phone || '',
      location: doc.data().location || '',
      description: doc.data().description || '',
      tags: doc.data().tags || [],
      reviews: doc.data().reviews || [],
      averageRating: doc.data().averageRating || 0,
      totalReviews: doc.data().totalReviews || 0
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

    // Sort by creation date (newest first)
    activeAds.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return activeAds;
  } catch (error) {
    console.error('Error getting active ads for services:', error);
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
