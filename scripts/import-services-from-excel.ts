import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDM3nU5ifIk5wF3kcdToWpjDD6U5VP5Jk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "facepet-48b13.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "facepet-48b13",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "facepet-48b13.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1055059508691",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1055059508691:web:f530c111ec812d4e9f4326",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ML6XD5X9C2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Placeholder image URL - using the upload_figure.svg from public folder
const PLACEHOLDER_IMAGE = '/upload_figure.svg';

interface ExcelRow {
  [key: string]: any;
}

interface BusinessData {
  name: string;
  description: string;
  imageUrl: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  tags: string[];
  rating?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Map Excel row to Business data structure
 * Based on actual Excel file structure: title, phone, categoryName, city, website, url, etc.
 */
function mapRowToBusiness(row: ExcelRow, createdBy: string = 'system'): BusinessData | null {
  // Map based on actual Excel column names
  const name = row['title'] || row['Title'] || row['Name'] || row['name'] || row['Business Name'] || row['BusinessName'] || '';
  const phone = row['phone'] || row['Phone'] || row['Tel'] || row['tel'] || row['Contact'] || '';
  const website = row['website'] || row['Website'] || row['URL'] || '';
  const city = row['city'] || row['City'] || '';
  const countryCode = row['countryCode'] || row['CountryCode'] || 'IL';
  const categoryName = row['categoryName'] || row['CategoryName'] || row['Category'] || row['category'] || '';
  const url = row['url'] || row['Url'] || row['URL'] || '';
  const totalScore = row['totalScore'] || row['TotalScore'] || row['rating'] || row['Rating'] || null;
  const reviewsCount = row['reviewsCount'] || row['ReviewsCount'] || 0;
  
  // Build description from available data
  let description = '';
  if (categoryName) {
    description = `${categoryName}`;
    if (city) {
      description += ` in ${city}`;
    }
    if (totalScore) {
      description += ` (Rating: ${totalScore}/5`;
      if (reviewsCount) {
        description += `, ${reviewsCount} reviews)`;
      } else {
        description += ')';
      }
    }
  } else {
    description = name || 'Pet services';
  }
  
  // Build address from city and country
  let address = '';
  if (city) {
    address = city;
    if (countryCode && countryCode !== 'IL') {
      address += `, ${countryCode}`;
    }
  }
  
  // Tags from categoryName
  let tags: string[] = [];
  if (categoryName) {
    tags = [String(categoryName).trim()];
  }
  
  // Email from website or use placeholder
  let email = 'no-email@example.com';
  if (website) {
    try {
      const websiteUrl = new URL(website);
      email = `contact@${websiteUrl.hostname.replace('www.', '')}`;
    } catch {
      email = 'no-email@example.com';
    }
  }
  
  // Image URL - use placeholder if not provided
  const imageUrl = row['Image'] || row['image'] || row['Image URL'] || row['imageUrl'] || row['ImageUrl'] || PLACEHOLDER_IMAGE;

  // Validate required fields
  if (!name) {
    console.warn('Skipping row - missing title/name:', row);
    return null;
  }

  const businessData: any = {
    name: String(name).trim(),
    description: String(description).trim() || `${name} - Pet services`,
    imageUrl: String(imageUrl).trim(),
    contactInfo: {
      email: email,
      phone: String(phone).trim() || '',
      address: address || ''
    },
    tags: tags.length > 0 ? tags : ['general'],
    isActive: true,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  // Only include rating if it has a valid value (Firebase doesn't allow undefined)
  if (totalScore !== null && totalScore !== undefined && !isNaN(Number(totalScore))) {
    businessData.rating = Number(totalScore);
  }

  return businessData;
}

async function importServicesFromExcel() {
  try {
    const excelPath = path.join(process.cwd(), 'public', 'dataset.xlsx');
    
    // Check if file exists
    if (!fs.existsSync(excelPath)) {
      console.error(`❌ Excel file not found at: ${excelPath}`);
      console.log('Please ensure dataset.xlsx is in the public folder');
      process.exit(1);
    }

    console.log(`📖 Reading Excel file: ${excelPath}`);
    
    // Read Excel file
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // Use first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📊 Found ${rows.length} rows in Excel file`);
    console.log('📋 Column names:', Object.keys(rows[0] || {}));
    
    if (rows.length === 0) {
      console.error('❌ No data found in Excel file');
      process.exit(1);
    }

    // Get businesses collection
    const businessesRef = collection(db, 'businesses');
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    console.log('\n🚀 Starting import...\n');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const businessData = mapRowToBusiness(row, 'excel-import');

      if (!businessData) {
        skippedCount++;
        console.log(`⏭️  Row ${i + 1}: Skipped (missing required fields)`);
        continue;
      }

      try {
        await addDoc(businessesRef, businessData);
        successCount++;
        console.log(`✅ Row ${i + 1}: Imported "${businessData.name}"`);
      } catch (error: any) {
        errorCount++;
        console.error(`❌ Row ${i + 1}: Error importing "${businessData.name}" -`, error.message);
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📦 Total: ${rows.length}`);
    
    if (successCount > 0) {
      console.log('\n🎉 Import completed successfully!');
    } else {
      console.log('\n⚠️  No businesses were imported. Please check your Excel file format.');
    }

  } catch (error: any) {
    console.error('❌ Error importing services:', error);
    process.exit(1);
  }
}

// Run the import
importServicesFromExcel()
  .then(() => {
    console.log('\n✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

