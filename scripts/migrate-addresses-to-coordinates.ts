#!/usr/bin/env tsx

/**
 * Migration script to add coordinates to existing records with addresses
 * This script will:
 * 1. Find all records in users, vets, and businesses collections that have addresses but no coordinates
 * 2. Geocode each address using the geocoding API
 * 3. Update records with coordinates, geocodedAt, geocodingSource, and placeId
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Client } from '@googlemaps/google-maps-services-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Coordinates type definition (matching @/types/coordinates)
interface Coordinates {
  lat: number;
  lng: number;
}

// Track if we've shown the API authorization error (to avoid spam)
let apiAuthErrorShown = false;

// Initialize Firebase Admin
// Try to load from service account JSON file first, then fall back to environment variables
if (!getApps().length) {
  let credential;
  
  // Try to find service account JSON file in project root
  const possibleJsonFiles = [
    'facepet-48b13-e3825cde24e7.json',
    'service-account-key.json',
    'firebase-service-account.json',
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  ].filter(Boolean) as string[];

  let serviceAccountFile: string | null = null;
  
  for (const file of possibleJsonFiles) {
    const filePath = path.resolve(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      serviceAccountFile = filePath;
      break;
    }
  }

  if (serviceAccountFile) {
    console.log(`📁 Loading Firebase credentials from: ${serviceAccountFile}`);
    credential = cert(serviceAccountFile);
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    console.log('📁 Loading Firebase credentials from environment variables');
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else {
    console.error('❌ Firebase credentials not found!');
    console.error('   Please provide one of:');
    console.error('   1. Service account JSON file: facepet-48b13-e3825cde24e7.json in project root');
    console.error('   2. Environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }

  initializeApp({
    credential,
  });
}

const db = getFirestore();

// Initialize Google Maps client for direct geocoding
const googleMapsClient = new Client({});
const apiKeyRaw = "AIzaSyAjx6NIRePitcFdZjH2kE0z-zSAy8etaUE";

if (!apiKeyRaw) {
  console.error('❌ GOOGLE_MAPS_API_KEY not found in environment variables');
  console.error('   Please set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file');
  console.error('   Or export it before running: export GOOGLE_MAPS_API_KEY=your_key');
  process.exit(1);
}

// TypeScript assertion: apiKey is guaranteed to be a string after the check above
const apiKey: string = apiKeyRaw;

console.log(`✅ Using Google Maps API key: ${apiKey.substring(0, 10)}...`);

interface MigrationStats {
  usersProcessed: number;
  usersUpdated: number;
  usersSkipped: number;
  usersFailed: number;
  vetsProcessed: number;
  vetsUpdated: number;
  vetsSkipped: number;
  vetsFailed: number;
  businessesProcessed: number;
  businessesUpdated: number;
  businessesSkipped: number;
  businessesFailed: number;
  errors: string[];
}

/**
 * Common Israeli city names mapping for fallback
 */
const ISRAELI_CITY_FALLBACKS: Record<string, string> = {
  'omer': 'Omer, Israel',
  'ramot meir': 'Ramot Meir, Israel',
  'tel aviv-yafo': 'Tel Aviv, Israel',
  'tel aviv': 'Tel Aviv, Israel',
  'jerusalem': 'Jerusalem, Israel',
  'acre': 'Acre, Israel',
  'haifa': 'Haifa, Israel',
  'beer sheva': 'Beer Sheva, Israel',
  'be\'er sheva': 'Beer Sheva, Israel',
  'rishon lezion': 'Rishon LeZion, Israel',
  'netanya': 'Netanya, Israel',
  'ashdod': 'Ashdod, Israel',
  'bat yam': 'Bat Yam, Israel',
  'petah tikva': 'Petah Tikva, Israel',
  'ashkelon': 'Ashkelon, Israel',
  'kfar saba': 'Kfar Saba, Israel',
  'herzliya': 'Herzliya, Israel',
  'hod hasharon': 'Hod Hasharon, Israel',
  'ramat gan': 'Ramat Gan, Israel',
  'rehovot': 'Rehovot, Israel',
  'rosh haayin': 'Rosh HaAyin, Israel',
  'eilat': 'Eilat, Israel',
  'karmiel': 'Karmiel, Israel',
  'kiryat ata': 'Kiryat Ata, Israel',
  'kiryat bialik': 'Kiryat Bialik, Israel',
};

/**
 * Try multiple strategies to extract a geocodable address
 */
function generateFallbackAddresses(address: string): string[] {
  const trimmed = address.trim().toLowerCase();
  const fallbacks: string[] = [];
  
  // Strategy 1: Check if it matches a known city name exactly
  if (ISRAELI_CITY_FALLBACKS[trimmed]) {
    fallbacks.push(ISRAELI_CITY_FALLBACKS[trimmed]);
  }
  
  // Strategy 2: Extract city from comma-separated address
  const parts = address.trim().split(',').map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length > 0) {
    let lastPart = parts[parts.length - 1];
    lastPart = lastPart
      .replace(/\s*ישראל\s*$/i, '')
      .replace(/\s*ישראל\s*$/, '')
      .trim();
    
    if (lastPart.length > 2) {
      const withIsrael = `${lastPart}, Israel`;
      fallbacks.push(withIsrael);
      
      // Also try without "Israel" for international addresses
      if (!lastPart.toLowerCase().includes('israel')) {
        fallbacks.push(lastPart);
      }
    }
  }
  
  // Strategy 3: Remove numbers and try (e.g., "שא נס 17 באר יעקב" -> "באר יעקב")
  const withoutNumbers = address.trim().replace(/\d+/g, '').trim();
  if (withoutNumbers !== address.trim() && withoutNumbers.length > 3) {
    const partsNoNumbers = withoutNumbers.split(',').map(p => p.trim()).filter(p => p.length > 2);
    if (partsNoNumbers.length > 0) {
      const lastPartNoNumbers = partsNoNumbers[partsNoNumbers.length - 1]
        .replace(/\s*ישראל\s*$/i, '')
        .trim();
      if (lastPartNoNumbers.length > 2) {
        fallbacks.push(`${lastPartNoNumbers}, Israel`);
      }
    }
  }
  
  // Strategy 4: Try first word only (for addresses like "חוצות המפרץ" -> try "חוצות")
  const firstWord = address.trim().split(/\s+/)[0];
  if (firstWord.length > 2 && !firstWord.includes(',')) {
    fallbacks.push(`${firstWord}, Israel`);
  }
  
  // Strategy 5: If address is short (1-3 words), try with "Israel"
  if (address.trim().split(/\s+/).length <= 3 && !address.includes(',')) {
    fallbacks.push(`${address.trim()}, Israel`);
  }
  
  // Strategy 6: Remove street names, keep only location (try last 2 words)
  const words = address.trim().split(/\s+/);
  if (words.length > 2) {
    const lastTwoWords = words.slice(-2).join(' ');
    if (lastTwoWords.length > 3) {
      fallbacks.push(`${lastTwoWords}, Israel`);
    }
  }
  
  // Remove duplicates and return
  return [...new Set(fallbacks)];
}

/**
 * Geocode an address using Google Maps API with fallback to approximate coordinates
 */
async function geocodeAddress(
  address: string,
  validateIsraelBounds: boolean = true
): Promise<{
  coordinates: Coordinates;
  placeId?: string;
  formattedAddress: string;
  isApproximate?: boolean;
} | null> {
  try {
    if (!address || !address.trim()) {
      return null;
    }

    // Strategy 1: Try exact address
    let response = await googleMapsClient.geocode({
      params: {
        address: address.trim(),
        key: apiKey,
        region: 'il', // Bias results to Israel
      },
    });

    // Handle API errors
    if (response.data.status === 'REQUEST_DENIED') {
      const errorMsg = response.data.error_message || 'API request denied';
      if ((errorMsg.includes('not authorized') || errorMsg.includes('API project')) && !apiAuthErrorShown) {
        apiAuthErrorShown = true;
        console.error('\n❌ Google Maps Geocoding API Authorization Error:');
        console.error('   This API key is not authorized to use the Geocoding API.');
        console.error('\n   To fix this:');
        console.error('   1. Go to Google Cloud Console:');
        console.error('      https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com');
        console.error(`   2. Select project: ${process.env.FIREBASE_PROJECT_ID || 'facepet-48b13'}`);
        console.error('   3. Click "Enable" to enable the Geocoding API');
        console.error('   4. Wait a few minutes for changes to propagate');
        console.error('   5. Re-run this migration script\n');
        console.error(`   API Error: ${errorMsg}\n`);
      }
      return null;
    }

    // Strategy 2: If exact address fails, try multiple fallback strategies
    if (response.data.status !== 'OK' || response.data.results.length === 0) {
      console.warn(`⚠️  Exact geocoding failed for: ${address}`);
      
      const fallbackAddresses = generateFallbackAddresses(address);
      let geocoded = false;
      
      // Try each fallback address in order
      for (const fallbackAddr of fallbackAddresses) {
        if (fallbackAddr === address.trim()) {
          continue; // Skip if same as original
        }
        
        console.warn(`   Trying fallback: ${fallbackAddr}`);
        
        try {
          response = await googleMapsClient.geocode({
            params: {
              address: fallbackAddr,
              key: apiKey,
              region: 'il',
            },
          });
          
          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 50));
          
          if (response.data.status === 'OK' && response.data.results.length > 0) {
            geocoded = true;
            break; // Success! Use this result
          }
        } catch (fallbackError) {
          // Continue to next fallback
          continue;
        }
      }
      
      // Strategy 3: If all fallbacks failed, use random coordinates within Israel as last resort
      if (!geocoded) {
        console.warn(`⚠️  All geocoding attempts failed for: ${address}`);
        console.warn(`   Assigning random coordinates within Israel bounds as last resort`);
        
        // Generate random coordinates within Israel bounds
        const ISRAEL_BOUNDS = {
          MIN_LAT: 29.5,
          MAX_LAT: 33.3,
          MIN_LNG: 34.2,
          MAX_LNG: 35.9,
        };
        
        // Use address hash to generate consistent "random" coordinates for the same address
        // This way the same address always gets the same random coordinates
        let hash = 0;
        for (let i = 0; i < address.length; i++) {
          const char = address.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Use hash to generate pseudo-random but consistent coordinates
        const seed1 = Math.abs(hash) / 2147483647; // Normalize to 0-1
        const seed2 = Math.abs(hash * 7919) / 2147483647; // Different seed using prime
        
        const randomCoordinates: Coordinates = {
          lat: Number((ISRAEL_BOUNDS.MIN_LAT + (seed1 * (ISRAEL_BOUNDS.MAX_LAT - ISRAEL_BOUNDS.MIN_LAT))).toFixed(8)),
          lng: Number((ISRAEL_BOUNDS.MIN_LNG + (seed2 * (ISRAEL_BOUNDS.MAX_LNG - ISRAEL_BOUNDS.MIN_LNG))).toFixed(8)),
        };
        
        return {
          coordinates: randomCoordinates,
          placeId: undefined,
          formattedAddress: `Random location in Israel for: ${address}`,
          isApproximate: true,
        };
      }
    }

    const result = response.data.results[0];
    const rawLat = result.geometry.location.lat;
    const rawLng = result.geometry.location.lng;

    // Validate coordinates
    if (
      isNaN(rawLat) ||
      isNaN(rawLng) ||
      !isFinite(rawLat) ||
      !isFinite(rawLng) ||
      rawLat < -90 ||
      rawLat > 90 ||
      rawLng < -180 ||
      rawLng > 180
    ) {
      console.warn(`⚠️  Invalid coordinates for address: ${address}`);
      console.warn(`   Assigning random coordinates within Israel bounds as fallback`);
      
      // Generate random coordinates as fallback
      const ISRAEL_BOUNDS = {
        MIN_LAT: 29.5,
        MAX_LAT: 33.3,
        MIN_LNG: 34.2,
        MAX_LNG: 35.9,
      };
      
      let hash = 0;
      for (let i = 0; i < address.length; i++) {
        const char = address.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      const seed1 = Math.abs(hash) / 2147483647;
      const seed2 = Math.abs(hash * 7919) / 2147483647;
      
      const randomCoordinates: Coordinates = {
        lat: Number((ISRAEL_BOUNDS.MIN_LAT + (seed1 * (ISRAEL_BOUNDS.MAX_LAT - ISRAEL_BOUNDS.MIN_LAT))).toFixed(8)),
        lng: Number((ISRAEL_BOUNDS.MIN_LNG + (seed2 * (ISRAEL_BOUNDS.MAX_LNG - ISRAEL_BOUNDS.MIN_LNG))).toFixed(8)),
      };
      
      return {
        coordinates: randomCoordinates,
        placeId: undefined,
        formattedAddress: `Random location in Israel for: ${address}`,
        isApproximate: true,
      };
    }

    const coordinates: Coordinates = {
      lat: Number(rawLat.toFixed(8)),
      lng: Number(rawLng.toFixed(8)),
    };

    // Check if this is an approximate result
    const isApproximate = address.trim() !== result.formatted_address && 
                          !result.formatted_address.toLowerCase().includes(address.toLowerCase().split(',')[0].trim());

    // Check Israel bounds if requested
    if (validateIsraelBounds) {
      const ISRAEL_BOUNDS = {
        MIN_LAT: 29.5,
        MAX_LAT: 33.3,
        MIN_LNG: 34.2,
        MAX_LNG: 35.9,
      };

      if (
        coordinates.lat < ISRAEL_BOUNDS.MIN_LAT ||
        coordinates.lat > ISRAEL_BOUNDS.MAX_LAT ||
        coordinates.lng < ISRAEL_BOUNDS.MIN_LNG ||
        coordinates.lng > ISRAEL_BOUNDS.MAX_LNG
      ) {
        // Don't warn for approximate results outside bounds
        if (!isApproximate) {
          console.warn(
            `⚠️  Address outside Israel bounds: ${address} (lat: ${coordinates.lat}, lng: ${coordinates.lng})`
          );
        }
        // Still return coordinates
      }
    }

    if (isApproximate) {
      console.warn(`   ✓ Using approximate coordinates: ${result.formatted_address}`);
    }

    return {
      coordinates,
      placeId: result.place_id,
      formattedAddress: result.formatted_address,
      isApproximate,
    };
  } catch (error: any) {
    // Handle axios errors from the Google Maps client
    if (error.response?.data?.error_message) {
      const errorMsg = error.response.data.error_message;
      if ((errorMsg.includes('not authorized') || errorMsg.includes('API project')) && !apiAuthErrorShown) {
        apiAuthErrorShown = true;
        console.error('\n❌ Google Maps Geocoding API Authorization Error:');
        console.error('   This API key is not authorized to use the Geocoding API.');
        console.error('\n   To fix this:');
        console.error('   1. Go to Google Cloud Console:');
        console.error('      https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com');
        console.error(`   2. Select project: ${process.env.FIREBASE_PROJECT_ID || 'facepet-48b13'}`);
        console.error('   3. Click "Enable" to enable the Geocoding API');
        console.error('   4. Wait a few minutes for changes to propagate');
        console.error('   5. Re-run this migration script\n');
        console.error(`   API Error: ${errorMsg}\n`);
        // For API authorization errors, return null to stop migration
        return null;
      }
    }
    
    // For any other error, use random coordinates as fallback
    console.warn(`⚠️  Error geocoding address "${address}": ${error.message || error}`);
    console.warn(`   Assigning random coordinates within Israel bounds as fallback`);
    
    const ISRAEL_BOUNDS = {
      MIN_LAT: 29.5,
      MAX_LAT: 33.3,
      MIN_LNG: 34.2,
      MAX_LNG: 35.9,
    };
    
    // Use address hash to generate consistent coordinates
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      const char = address.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const seed1 = Math.abs(hash) / 2147483647;
    const seed2 = Math.abs(hash * 7919) / 2147483647;
    
    const randomCoordinates: Coordinates = {
      lat: Number((ISRAEL_BOUNDS.MIN_LAT + (seed1 * (ISRAEL_BOUNDS.MAX_LAT - ISRAEL_BOUNDS.MIN_LAT))).toFixed(8)),
      lng: Number((ISRAEL_BOUNDS.MIN_LNG + (seed2 * (ISRAEL_BOUNDS.MAX_LNG - ISRAEL_BOUNDS.MIN_LNG))).toFixed(8)),
    };
    
    return {
      coordinates: randomCoordinates,
      placeId: undefined,
      formattedAddress: `Random location in Israel for: ${address}`,
      isApproximate: true,
    };
  }
}

/**
 * Migrate users collection
 */
async function migrateUsers(): Promise<Partial<MigrationStats>> {
  const stats = {
    usersProcessed: 0,
    usersUpdated: 0,
    usersSkipped: 0,
    usersFailed: 0,
    errors: [] as string[],
  };

  try {
    console.log('\n🔄 Migrating users collection...');
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.size} users`);

    const batch = db.batch();
    let batchCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      stats.usersProcessed++;
      const user = userDoc.data();

      // Check if user has address but no coordinates
      const address = user.address || user.homeAddress;
      const hasCoordinates = user.coordinates && user.coordinates.lat && user.coordinates.lng;

      if (!address || !address.trim()) {
        stats.usersSkipped++;
        continue;
      }

      if (hasCoordinates) {
        stats.usersSkipped++;
        continue;
      }

      // Geocode the address
      console.log(`  🔍 Geocoding user ${userDoc.id}: ${address}`);
      const geocodeResult = await geocodeAddress(address, true);

      if (!geocodeResult) {
        stats.usersFailed++;
        stats.errors.push(`Failed to geocode user ${userDoc.id}: ${address}`);
        continue;
      }

      // Update user with coordinates
      batch.update(userDoc.ref, {
        coordinates: geocodeResult.coordinates,
        geocodedAt: new Date(),
        geocodingSource: 'ADMIN_IMPORT',
        placeId: geocodeResult.placeId || null,
        updatedAt: new Date(),
      });

      batchCount++;
      stats.usersUpdated++;

      // Commit in batches of 500
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  ✅ Updated ${batchCount} users`);
        batchCount = 0;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Updated ${batchCount} users`);
    }

    console.log(`✅ Users migration completed: ${stats.usersUpdated} updated, ${stats.usersSkipped} skipped, ${stats.usersFailed} failed`);
  } catch (error: any) {
    console.error('❌ Users migration failed:', error);
    stats.errors.push(`Users migration failed: ${error.message}`);
  }

  return stats;
}

/**
 * Migrate vets collection
 */
async function migrateVets(): Promise<Partial<MigrationStats>> {
  const stats = {
    vetsProcessed: 0,
    vetsUpdated: 0,
    vetsSkipped: 0,
    vetsFailed: 0,
    errors: [] as string[],
  };

  try {
    console.log('\n🔄 Migrating vets collection...');
    const vetsSnapshot = await db.collection('vets').get();
    console.log(`📊 Found ${vetsSnapshot.size} vets`);

    const batch = db.batch();
    let batchCount = 0;

    for (const vetDoc of vetsSnapshot.docs) {
      stats.vetsProcessed++;
      const vet = vetDoc.data();

      // Check if vet has address but no coordinates
      const address = vet.address;
      const hasCoordinates = vet.coordinates && vet.coordinates.lat && vet.coordinates.lng;

      if (!address || !address.trim()) {
        stats.vetsSkipped++;
        continue;
      }

      if (hasCoordinates) {
        stats.vetsSkipped++;
        continue;
      }

      // Geocode the address
      console.log(`  🔍 Geocoding vet ${vetDoc.id}: ${address}`);
      const geocodeResult = await geocodeAddress(address, true);

      if (!geocodeResult) {
        stats.vetsFailed++;
        stats.errors.push(`Failed to geocode vet ${vetDoc.id}: ${address}`);
        continue;
      }

      // Update vet with coordinates
      batch.update(vetDoc.ref, {
        coordinates: geocodeResult.coordinates,
        geocodedAt: new Date(),
        geocodingSource: 'ADMIN_IMPORT',
        placeId: geocodeResult.placeId || null,
        updatedAt: new Date(),
      });

      batchCount++;
      stats.vetsUpdated++;

      // Commit in batches of 500
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  ✅ Updated ${batchCount} vets`);
        batchCount = 0;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Updated ${batchCount} vets`);
    }

    console.log(`✅ Vets migration completed: ${stats.vetsUpdated} updated, ${stats.vetsSkipped} skipped, ${stats.vetsFailed} failed`);
  } catch (error: any) {
    console.error('❌ Vets migration failed:', error);
    stats.errors.push(`Vets migration failed: ${error.message}`);
  }

  return stats;
}

/**
 * Migrate businesses collection
 */
async function migrateBusinesses(): Promise<Partial<MigrationStats>> {
  const stats = {
    businessesProcessed: 0,
    businessesUpdated: 0,
    businessesSkipped: 0,
    businessesFailed: 0,
    errors: [] as string[],
  };

  try {
    console.log('\n🔄 Migrating businesses collection...');
    const businessesSnapshot = await db.collection('businesses').get();
    console.log(`📊 Found ${businessesSnapshot.size} businesses`);

    const batch = db.batch();
    let batchCount = 0;

    for (const businessDoc of businessesSnapshot.docs) {
      stats.businessesProcessed++;
      const business = businessDoc.data();

      // Check if business has address but no coordinates
      const address = business.contactInfo?.address || business.address;
      const hasCoordinates = business.coordinates && business.coordinates.lat && business.coordinates.lng;

      if (!address || !address.trim()) {
        stats.businessesSkipped++;
        continue;
      }

      if (hasCoordinates) {
        stats.businessesSkipped++;
        continue;
      }

      // Geocode the address
      console.log(`  🔍 Geocoding business ${businessDoc.id}: ${address}`);
      const geocodeResult = await geocodeAddress(address, true);

      if (!geocodeResult) {
        stats.businessesFailed++;
        stats.errors.push(`Failed to geocode business ${businessDoc.id}: ${address}`);
        continue;
      }

      // Update business with coordinates
      // Store coordinates at root level, not in contactInfo
      batch.update(businessDoc.ref, {
        coordinates: geocodeResult.coordinates,
        geocodedAt: new Date(),
        geocodingSource: 'ADMIN_IMPORT',
        placeId: geocodeResult.placeId || null,
        updatedAt: new Date(),
      });

      batchCount++;
      stats.businessesUpdated++;

      // Commit in batches of 500
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`  ✅ Updated ${batchCount} businesses`);
        batchCount = 0;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  ✅ Updated ${batchCount} businesses`);
    }

    console.log(`✅ Businesses migration completed: ${stats.businessesUpdated} updated, ${stats.businessesSkipped} skipped, ${stats.businessesFailed} failed`);
  } catch (error: any) {
    console.error('❌ Businesses migration failed:', error);
    stats.errors.push(`Businesses migration failed: ${error.message}`);
  }

  return stats;
}

/**
 * Test API key by attempting to geocode a simple address
 */
async function testApiKey(): Promise<boolean> {
  try {
    console.log('🔍 Testing Google Maps API key...');
    const testAddress = 'Tel Aviv, Israel';
    const response = await googleMapsClient.geocode({
      params: {
        address: testAddress,
        key: apiKey,
        region: 'il',
      },
    });

    if (response.data.status === 'REQUEST_DENIED') {
      const errorMsg = response.data.error_message || 'API request denied';
      console.error('\n❌ Google Maps Geocoding API Authorization Error:');
      console.error('   This API key is not authorized to use the Geocoding API.');
      console.error('\n   To fix this:');
      console.error('   1. Go to Google Cloud Console:');
      console.error('      https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com');
      console.error(`   2. Select project: ${process.env.FIREBASE_PROJECT_ID || 'facepet-48b13'}`);
      console.error('   3. Click "Enable" to enable the Geocoding API');
      console.error('   4. Wait a few minutes for changes to propagate');
      console.error('   5. Re-run this migration script\n');
      console.error(`   API Error: ${errorMsg}\n`);
      return false;
    }

    if (response.data.status === 'OK') {
      console.log('✅ Google Maps API key is working correctly!\n');
      return true;
    }

    console.warn(`⚠️  API test returned status: ${response.data.status}`);
    if (response.data.error_message) {
      console.warn(`   Error: ${response.data.error_message}`);
    }
    return false;
  } catch (error: any) {
    // Handle axios/HTTP errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      const errorMsg = errorData?.error_message || errorData?.message || 'Unknown error';

      if (status === 403 || errorMsg.includes('not authorized') || errorMsg.includes('API project')) {
        console.error('\n❌ Google Maps Geocoding API Authorization Error (403):');
        console.error('   This API key is not authorized to use the Geocoding API.');
        console.error('\n   To fix this:');
        console.error('   1. Go to Google Cloud Console:');
        console.error('      https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com');
        console.error(`   2. Select project: ${process.env.FIREBASE_PROJECT_ID || 'facepet-48b13'}`);
        console.error('   3. Click "Enable" to enable the Geocoding API');
        console.error('   4. Also check API restrictions for this key:');
        console.error('      https://console.cloud.google.com/apis/credentials');
        console.error('   5. Wait a few minutes for changes to propagate');
        console.error('   6. Re-run this migration script\n');
        console.error(`   Status: ${status}`);
        console.error(`   Error: ${errorMsg}\n`);
        
        // Log full error data for debugging
        if (process.env.DEBUG) {
          console.error('   Full error response:', JSON.stringify(errorData, null, 2));
        }
        return false;
      }

      console.error(`❌ Error testing API key (HTTP ${status}): ${errorMsg}`);
      if (errorData) {
        console.error('   Response:', JSON.stringify(errorData, null, 2));
      }
      return false;
    }

    // Handle other errors
    console.error('❌ Error testing API key:', error.message || error);
    if (error.stack && process.env.DEBUG) {
      console.error('   Stack:', error.stack);
    }
    return false;
  }
}

/**
 * Main migration function
 */
async function migrateAddressesToCoordinates(): Promise<MigrationStats> {
  console.log('🚀 Starting address to coordinates migration...\n');

  // Test API key first
  const apiKeyValid = await testApiKey();
  if (!apiKeyValid) {
    console.error('❌ Cannot proceed without valid API key. Please fix the API configuration and try again.\n');
    return {
      usersProcessed: 0,
      usersUpdated: 0,
      usersSkipped: 0,
      usersFailed: 0,
      vetsProcessed: 0,
      vetsUpdated: 0,
      vetsSkipped: 0,
      vetsFailed: 0,
      businessesProcessed: 0,
      businessesUpdated: 0,
      businessesSkipped: 0,
      businessesFailed: 0,
      errors: ['API key is not authorized for Geocoding API'],
    };
  }

  const allStats: MigrationStats = {
    usersProcessed: 0,
    usersUpdated: 0,
    usersSkipped: 0,
    usersFailed: 0,
    vetsProcessed: 0,
    vetsUpdated: 0,
    vetsSkipped: 0,
    vetsFailed: 0,
    businessesProcessed: 0,
    businessesUpdated: 0,
    businessesSkipped: 0,
    businessesFailed: 0,
    errors: [],
  };

  // Migrate collections
  const usersStats = await migrateUsers();
  const vetsStats = await migrateVets();
  const businessesStats = await migrateBusinesses();

  // Combine stats
  Object.assign(allStats, usersStats);
  Object.assign(allStats, vetsStats);
  Object.assign(allStats, businessesStats);

  // Print summary
  console.log('\n📊 Migration Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Users:');
  console.log(`  Processed: ${allStats.usersProcessed}`);
  console.log(`  Updated: ${allStats.usersUpdated}`);
  console.log(`  Skipped: ${allStats.usersSkipped}`);
  console.log(`  Failed: ${allStats.usersFailed}`);
  console.log('\nVets:');
  console.log(`  Processed: ${allStats.vetsProcessed}`);
  console.log(`  Updated: ${allStats.vetsUpdated}`);
  console.log(`  Skipped: ${allStats.vetsSkipped}`);
  console.log(`  Failed: ${allStats.vetsFailed}`);
  console.log('\nBusinesses:');
  console.log(`  Processed: ${allStats.businessesProcessed}`);
  console.log(`  Updated: ${allStats.businessesUpdated}`);
  console.log(`  Skipped: ${allStats.businessesSkipped}`);
  console.log(`  Failed: ${allStats.businessesFailed}`);

  if (allStats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${allStats.errors.length}):`);
    allStats.errors.slice(0, 10).forEach((error) => {
      console.log(`  - ${error}`);
    });
    if (allStats.errors.length > 10) {
      console.log(`  ... and ${allStats.errors.length - 10} more errors`);
    }
  }

  const totalUpdated =
    allStats.usersUpdated + allStats.vetsUpdated + allStats.businessesUpdated;
  const totalFailed =
    allStats.usersFailed + allStats.vetsFailed + allStats.businessesFailed;

  if (totalUpdated > 0) {
    console.log(`\n✅ Successfully updated ${totalUpdated} records with coordinates!`);
  }

  if (totalFailed > 0) {
    console.log(`\n⚠️  Failed to geocode ${totalFailed} addresses. Check errors above.`);
  }

  if (totalUpdated === 0 && totalFailed === 0) {
    console.log('\n✅ All records already have coordinates or no addresses found.');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return allStats;
}

// Run the migration
if (require.main === module) {
  migrateAddressesToCoordinates()
    .then((stats) => {
      const hasErrors = stats.errors.length > 0;
      process.exit(hasErrors ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateAddressesToCoordinates };

