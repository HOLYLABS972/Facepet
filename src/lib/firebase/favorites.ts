import { db } from './config';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  deleteDoc,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { HEBREW_SERVICE_TAGS } from '@/lib/constants/hebrew-service-tags';

export interface UserFavorite {
  id: string;
  userId: string;
  adId: string;
  adTitle: string;
  adType: string;
  createdAt: Date;
}

/**
 * Add an ad to user's favorites
 */
export async function addToFavorites(
  user: User,
  adId: string,
  adTitle: string,
  adType: string = 'service'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!user?.uid) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if already favorited
    const existingFavorites = await getUserFavorites(user);
    if (existingFavorites.some(fav => fav.adId === adId)) {
      return { success: false, error: 'Already in favorites' };
    }

    const favoriteData = {
      userId: user.uid,
      adId,
      adTitle,
      adType,
      createdAt: new Date()
    };

    await addDoc(collection(db, 'userFavorites'), favoriteData);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error adding to favorites:', error);
    return { success: false, error: 'Failed to add to favorites' };
  }
}

/**
 * Remove an ad from user's favorites
 */
export async function removeFromFavorites(
  user: User,
  adId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!user?.uid) {
      return { success: false, error: 'User not authenticated' };
    }

    // Find the favorite document
    const favoritesQuery = query(
      collection(db, 'userFavorites'),
      where('userId', '==', user.uid),
      where('adId', '==', adId)
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    
    if (favoritesSnapshot.empty) {
      return { success: false, error: 'Not in favorites' };
    }

    // Delete the favorite document
    const favoriteDoc = favoritesSnapshot.docs[0];
    await deleteDoc(doc(db, 'userFavorites', favoriteDoc.id));
    
    return { success: true };
  } catch (error: any) {
    console.error('Error removing from favorites:', error);
    return { success: false, error: 'Failed to remove from favorites' };
  }
}

/**
 * Get user's favorite ads
 */
export async function getUserFavorites(
  user: User
): Promise<UserFavorite[]> {
  try {
    if (!user?.uid) {
      return [];
    }

    const favoritesQuery = query(
      collection(db, 'userFavorites'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    
    return favoritesSnapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      adId: doc.data().adId,
      adTitle: doc.data().adTitle,
      adType: doc.data().adType,
      createdAt: doc.data().createdAt.toDate()
    }));
  } catch (error: any) {
    console.error('Error getting user favorites:', error);
    return [];
  }
}

/**
 * Check if an ad is favorited by user
 */
export async function isAdFavorited(
  user: User,
  adId: string
): Promise<boolean> {
  try {
    if (!user?.uid) {
      return false;
    }

    const favoritesQuery = query(
      collection(db, 'userFavorites'),
      where('userId', '==', user.uid),
      where('adId', '==', adId)
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    
    return !favoritesSnapshot.empty;
  } catch (error: any) {
    console.error('Error checking if ad is favorited:', error);
    return false;
  }
}

/**
 * Get all unique tags from ads
 * Combines predefined service tags with tags found in advertisements
 */
export async function getAllAdTags(): Promise<string[]> {
  try {
    // Start with predefined service tags
    const allTags = new Set<string>(HEBREW_SERVICE_TAGS);
    
    // Add tags from advertisements
    const adsSnapshot = await getDocs(collection(db, 'advertisements'));
    adsSnapshot.docs.forEach(doc => {
      const tags = doc.data().tags || [];
      tags.forEach((tag: string) => {
        if (tag && tag.trim()) {
          allTags.add(tag.trim());
        }
      });
    });
    
    return Array.from(allTags).sort();
  } catch (error: any) {
    console.error('Error getting ad tags:', error);
    // Return predefined tags as fallback
    return [...HEBREW_SERVICE_TAGS].sort();
  }
}
