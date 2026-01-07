/**
 * Complete Firebase to Supabase Migration - ALL Collections
 * Run this after the simplified migration to get remaining data
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDM3nU5ifIk5wF3kcdToVWpjDD6U5VP5Jk",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "facepet-48b13.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "facepet-48b13",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "facepet-48b13.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1055059508691",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1055059508691:web:f530c111ec812d4e9f4326",
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Starting Complete Migration\n');

function convertTimestamp(timestamp: any): string | null {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate().toISOString();
    if (timestamp instanceof Date) return timestamp.toISOString();
    return null;
}

// Get user ID mapping from Supabase
const userIdMap = new Map<string, string>();
async function loadUserMapping() {
    const { data } = await supabase.from('users').select('id, uid');
    if (data) {
        data.forEach(user => {
            if (user.uid) userIdMap.set(user.uid, user.id);
        });
    }
    console.log(`✅ Loaded ${userIdMap.size} user ID mappings\n`);
}

const stats = {
    advertisements: { total: 0, success: 0, failed: 0 },
    comments: { total: 0, success: 0, failed: 0 },
    coupons: { total: 0, success: 0, failed: 0 },
    userCoupons: { total: 0, success: 0, failed: 0 },
    pointsTransactions: { total: 0, success: 0, failed: 0 },
    contactSubmissions: { total: 0, success: 0, failed: 0 },
    promos: { total: 0, success: 0, failed: 0 },
    audiences: { total: 0, success: 0, failed: 0 },
    businesses: { total: 0, success: 0, failed: 0 },
    filters: { total: 0, success: 0, failed: 0 },
    contactInfo: { total: 0, success: 0, failed: 0 },
    installBannerSettings: { total: 0, success: 0, failed: 0 },
};

// Migrate Advertisements
async function migrateAdvertisements() {
    console.log('📦 Migrating advertisements...');
    const snapshot = await getDocs(collection(firestore, 'advertisements'));
    stats.advertisements.total = snapshot.size;

    for (const doc of snapshot.docs) {
        try {
            const data = doc.data();
            const createdBy = data.createdBy ? userIdMap.get(data.createdBy) : null;

            const adData = {
                title: data.title || '',
                type: data.type || 'image',
                content: data.content || '',
                duration: data.duration || 5,
                status: data.status || 'inactive',
                start_date: convertTimestamp(data.startDate),
                end_date: convertTimestamp(data.endDate),
                created_at: convertTimestamp(data.createdAt) || new Date().toISOString(),
                updated_at: convertTimestamp(data.updatedAt) || new Date().toISOString(),
                created_by: createdBy,
                phone: data.phone || null,
                location: data.location || null,
                description: data.description || null,
                tags: data.tags || null,
                pets: data.pets || null,
                area: data.area || null,
                city: data.city || null,
                pet_type: data.petType || null,
                breed: data.breed || null,
                age_range: data.ageRange || null,
                weight: data.weight || null,
                average_rating: data.averageRating || 0,
                total_reviews: data.totalReviews || 0,
            };

            const { error } = await supabase.from('advertisements').insert(adData);
            if (!error) stats.advertisements.success++;
            else stats.advertisements.failed++;
        } catch (err) {
            stats.advertisements.failed++;
        }
    }
    console.log(`  ✅ Advertisements: ${stats.advertisements.success}/${stats.advertisements.total}\n`);
}

// Migrate Comments
async function migrateComments() {
    console.log('📦 Migrating comments...');
    const snapshot = await getDocs(collection(firestore, 'comments'));
    stats.comments.total = snapshot.size;

    for (const doc of snapshot.docs) {
        try {
            const data = doc.data();
            const userId = data.userId ? userIdMap.get(data.userId) : null;

            const commentData = {
                user_id: userId,
                user_name: data.userName || '',
                advertisement_id: null, // Will need to map if you have ad IDs
                rating: data.rating || null,
                comment: data.comment || data.text || '',
                created_at: convertTimestamp(data.createdAt) || new Date().toISOString(),
                updated_at: convertTimestamp(data.updatedAt) || new Date().toISOString(),
            };

            const { error } = await supabase.from('comments').insert(commentData);
            if (!error) stats.comments.success++;
            else stats.comments.failed++;
        } catch (err) {
            stats.comments.failed++;
        }
    }
    console.log(`  ✅ Comments: ${stats.comments.success}/${stats.comments.total}\n`);
}

// Migrate Coupons
async function migrateCoupons() {
    console.log('📦 Migrating coupons...');
    const snapshot = await getDocs(collection(firestore, 'coupons'));
    stats.coupons.total = snapshot.size;

    for (const doc of snapshot.docs) {
        try {
            const data = doc.data();
            const couponData = {
                title: data.title || '',
                description: data.description || null,
                code: data.code || null,
                discount_type: data.discountType || null,
                discount_value: data.discountValue || null,
                points_cost: data.pointsCost || 0,
                max_uses: data.maxUses || null,
                current_uses: data.currentUses || 0,
                status: data.status || 'active',
                start_date: convertTimestamp(data.startDate),
                end_date: convertTimestamp(data.endDate),
                terms_and_conditions: data.termsAndConditions || null,
                image_url: data.imageUrl || null,
                business_id: null,
                created_at: convertTimestamp(data.createdAt) || new Date().toISOString(),
                updated_at: convertTimestamp(data.updatedAt) || new Date().toISOString(),
            };

            const { error } = await supabase.from('coupons').insert(couponData);
            if (!error) stats.coupons.success++;
            else stats.coupons.failed++;
        } catch (err) {
            stats.coupons.failed++;
        }
    }
    console.log(`  ✅ Coupons: ${stats.coupons.success}/${stats.coupons.total}\n`);
}

// Migrate Points Transactions
async function migratePointsTransactions() {
    console.log('📦 Migrating points transactions...');
    const snapshot = await getDocs(collection(firestore, 'pointsTransactions'));
    stats.pointsTransactions.total = snapshot.size;

    for (const doc of snapshot.docs) {
        try {
            const data = doc.data();
            const userId = data.userId ? userIdMap.get(data.userId) : null;

            if (!userId) {
                stats.pointsTransactions.failed++;
                continue;
            }

            const transactionData = {
                user_id: userId,
                type: data.type || 'admin_adjustment',
                points: data.points || 0,
                description: data.description || null,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                created_at: convertTimestamp(data.createdAt) || new Date().toISOString(),
            };

            const { error } = await supabase.from('points_transactions').insert(transactionData);
            if (!error) stats.pointsTransactions.success++;
            else stats.pointsTransactions.failed++;
        } catch (err) {
            stats.pointsTransactions.failed++;
        }
    }
    console.log(`  ✅ Points Transactions: ${stats.pointsTransactions.success}/${stats.pointsTransactions.total}\n`);
}

// Migrate Contact Submissions
async function migrateContactSubmissions() {
    console.log('📦 Migrating contact submissions...');
    const snapshot = await getDocs(collection(firestore, 'contactSubmissions'));
    stats.contactSubmissions.total = snapshot.size;

    for (const doc of snapshot.docs) {
        try {
            const data = doc.data();
            const submissionData = {
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || null,
                subject: data.subject || '',
                message: data.message || '',
                status: data.status || 'pending',
                created_at: convertTimestamp(data.createdAt) || new Date().toISOString(),
                updated_at: convertTimestamp(data.updatedAt) || new Date().toISOString(),
            };

            const { error } = await supabase.from('contact_submissions').insert(submissionData);
            if (!error) stats.contactSubmissions.success++;
            else stats.contactSubmissions.failed++;
        } catch (err) {
            stats.contactSubmissions.failed++;
        }
    }
    console.log(`  ✅ Contact Submissions: ${stats.contactSubmissions.success}/${stats.contactSubmissions.total}\n`);
}

// Migrate Businesses
async function migrateBusinesses() {
    console.log('📦 Migrating businesses...');
    const snapshot = await getDocs(collection(firestore, 'businesses'));
    stats.businesses.total = snapshot.size;

    for (const doc of snapshot.docs) {
        try {
            const data = doc.data();
            const businessData = {
                name: data.name || '',
                description: data.description || null,
                logo_url: data.logoUrl || null,
                website: data.website || null,
                phone: data.phone || null,
                email: data.email || null,
                address: data.address || null,
                created_at: convertTimestamp(data.createdAt) || new Date().toISOString(),
                updated_at: convertTimestamp(data.updatedAt) || new Date().toISOString(),
            };

            const { error } = await supabase.from('businesses').insert(businessData);
            if (!error) stats.businesses.success++;
            else stats.businesses.failed++;
        } catch (err) {
            stats.businesses.failed++;
        }
    }
    console.log(`  ✅ Businesses: ${stats.businesses.success}/${stats.businesses.total}\n`);
}

// Run all migrations
async function runCompleteMigration() {
    const start = Date.now();

    await loadUserMapping();
    await migrateAdvertisements();
    await migrateComments();
    await migrateCoupons();
    await migratePointsTransactions();
    await migrateContactSubmissions();
    await migrateBusinesses();

    const duration = ((Date.now() - start) / 1000).toFixed(2);

    console.log('='.repeat(60));
    console.log('📊 Complete Migration Summary');
    console.log('='.repeat(60));
    console.log(`Advertisements:        ${stats.advertisements.success}/${stats.advertisements.total}`);
    console.log(`Comments:              ${stats.comments.success}/${stats.comments.total}`);
    console.log(`Coupons:               ${stats.coupons.success}/${stats.coupons.total}`);
    console.log(`Points Transactions:   ${stats.pointsTransactions.success}/${stats.pointsTransactions.total}`);
    console.log(`Contact Submissions:   ${stats.contactSubmissions.success}/${stats.contactSubmissions.total}`);
    console.log(`Businesses:            ${stats.businesses.success}/${stats.businesses.total}`);
    console.log('='.repeat(60));
    console.log(`⏱️  Time: ${duration}s`);
    console.log('✅ Complete migration finished!\n');
}

runCompleteMigration().catch(console.error);
