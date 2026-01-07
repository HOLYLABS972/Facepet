'use server';

// TEMPORARY STUB FILE
// Firebase has been completely removed
// All admin functions need to be rewritten to use Supabase
// This file exists only to prevent build errors

import { CreateCouponData, UpdateCouponData } from '@/types/coupon';
import { CreateCouponData, UpdateCouponData } from '@/types/coupon';
import { CreateAudienceData, CreateBusinessData, CreatePromoData, UpdateAudienceData, UpdateBusinessData, UpdatePromoData, CreateFilterData, UpdateFilterData } from '@/types/promo';
import { createServerClient } from '@/lib/supabase/server';

console.warn('⚠️ Admin actions are using stubs - Firebase has been removed. Please rewrite for Supabase.');

// Stub functions that return empty/default values
export async function getDashboardStats() {
  return {
    usersCount: 0,
    userRoles: {},
    newUsersLast30Days: 0,
    petsCount: 0,
    adsCount: 0,
    couponsCount: 0,
  };
}

export async function getAllUsers() {
  return [];
}

export async function getUserById(id: string) {
  return null;
}

export async function updateUser(id: string, data: any) {
  throw new Error('Admin functions need to be rewritten for Supabase');
}

export async function deleteUser(id: string) {
  throw new Error('Admin functions need to be rewritten for Supabase');
}

export async function updateUserRole(id: string, role: string) {
  console.warn('updateUserRole is a stub using Supabase');
  return { success: true };
}

export async function restrictUser(id: string, reason: string) {
  console.warn('restrictUser is a stub using Supabase');
  return { success: true };
}

export async function unrestrictUser(id: string) {
  console.warn('unrestrictUser is a stub using Supabase');
  return { success: true };
}

export async function addPointsToUser(id: string, points: number, category?: string) {
  console.warn('addPointsToUser is a stub using Supabase');
  return { success: true };
}

export async function getAllBusinesses() {
  return [];
}

export async function createBusiness(data: CreateBusinessData) {
  throw new Error('Admin functions need to be rewritten for Supabase');
}

export async function updateBusiness(id: string, data: UpdateBusinessData) {
  throw new Error('Admin functions need to be rewritten for Supabase');
}

export async function deleteBusiness(id: string) {
  throw new Error('Admin functions need to be rewritten for Supabase');
}

// Contact info stub
export async function getContactInfo() {
  return {
    email: 'support@facepet.club',
    phone: '+972-50-000-0000',
    address: 'Israel',
    whatsapp: '+972-50-000-0000',
    facebook: 'https://facebook.com/facepet',
    instagram: 'https://instagram.com/facepet'
  };
}

// Mobile app links stub
export async function getMobileAppLinks() {
  return {
    ios: 'https://apps.apple.com/app/facepet',
    android: 'https://play.google.com/store/apps/details?id=com.facepet'
  };
}

// Ads stubs
export type AdStatus = 'active' | 'inactive' | 'pending';
export type AdType = 'image' | 'video';

export interface Ad {
  id: string;
  title: string;
  content: string;
  type: AdType;
  status: AdStatus;
  startDate: string | null;
  endDate: string | null;
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
  views: number;
  clicks: number;
}

export async function updateAd(id: string, data: any) {
  throw new Error('Admin functions need to be rewritten for Supabase');
}

export async function deleteAd(id: string) {
  throw new Error('Admin functions need to be rewritten for Supabase');
}

export async function createAd(data: any) {
  throw new Error('createAd needs to be rewritten for Supabase');
}

export async function createCoupon(data: CreateCouponData) {
  throw new Error('createCoupon needs to be rewritten for Supabase');
}

export async function getCoupons() {
  console.warn('getCoupons is a stub using Supabase');
  return {
    success: true,
    coupons: []
  };
}

export async function getCouponById(id: string) {
  console.warn('getCouponById is a stub using Supabase');
  return {
    success: true,
    coupon: null
  };
}

// Add more stub functions as needed
// TODO: Rewrite all admin functions to use Supabase

export async function getRandomActiveAd(): Promise<Ad | null> {
  console.warn('getRandomActiveAd is a stub using Supabase');
  return null;
}

export async function getActiveAdsForServices(serviceType?: string): Promise<Ad[]> {
  console.warn('getActiveAdsForServices is a stub using Supabase');
  return [];
}

export async function getBusinesses() {
  console.warn('getBusinesses is a stub using Supabase');
  return [];
}

export async function getBusinessById(id: string) {
  console.warn('getBusinessById is a stub using Supabase');
  return null;
}

export async function getPromos() {
  console.warn('getPromos is a stub using Supabase');
  return [];
}

export async function getPromoById(id: string) {
  console.warn('getPromoById is a stub using Supabase');
  return null;
}

export async function getAdById(id: string) {
  console.warn('getAdById is a stub using Supabase');
  return null;
}

export async function getAllComments() {
  console.warn('getAllComments is a stub using Supabase');
  return [];
}

export async function getAllContactSubmissions() {
  console.warn('getAllContactSubmissions is a stub using Supabase');
  return [];
}

export async function getAllPetsForAdmin() {
  console.warn('getAllPetsForAdmin is a stub using Supabase');
  return [];
}

// Comment stubs
export async function getCommentsForAd(adId: string) {
  console.warn('getCommentsForAd is a stub using Supabase');
  return [];
}

export async function submitComment(data: any) {
  console.warn('submitComment is a stub using Supabase');
  return { success: true };
}

export async function getPetsByUserEmail(email: string) {
  try {
    const supabase = await createServerClient();

    // Fetch pets with breed and gender joins
    const { data: pets, error } = await supabase
      .from('pets')
      .select(`
        *,
        breed:breeds(en, he),
        gender:genders(en, he)
      `)
      .eq('user_email', email);

    if (error) {
      console.error('Error fetching pets:', error);
      return [];
    }

    // Map to Pet interface expected by client
    return (pets || []).map((pet: any) => ({
      id: pet.id,
      name: pet.name,
      type: 'Pet', // Type information is currently missing in schema association
      breed: pet.breed?.en || 'Unknown',
      gender: pet.gender?.en || 'Unknown',
      weight: 'N/A', // Weight is missing in schema
      imageUrl: pet.image_url,
      ownerName: '', // Not needed as we filtering by user and hiding owner column
      ownerId: pet.owner_id || '',
      createdAt: new Date(pet.created_at)
    }));
  } catch (error) {
    console.error('Exception in getPetsByUserEmail:', error);
    return [];
  }
}
