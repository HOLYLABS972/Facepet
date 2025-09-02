/**
 * Simple database connection test
 */

import dotenv from 'dotenv';
import { db } from '../utils/database/drizzle';
import { users } from '../utils/database/schema';
dotenv.config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

    // Try a simple query
    const result = await db.select().from(users).limit(1);
    console.log('✅ Database connection successful!');
    console.log('Sample query result:', result.length, 'records found');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

testConnection();
