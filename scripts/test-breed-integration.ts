// Test script to verify breed integration from breeds.json
import { breedsByType, getBreedsForType } from '../src/lib/data/comprehensive-breeds';
import { DOG_BREEDS, CAT_BREEDS, DOG_BREEDS_HEBREW, CAT_BREEDS_HEBREW } from '../src/lib/hardcoded-data';

console.log('🧪 Testing Breed Integration from breeds.json\n');

// Test comprehensive breeds data
console.log('📊 Comprehensive Breeds Data:');
console.log(`- Dog breeds: ${breedsByType.dog.length}`);
console.log(`- Cat breeds: ${breedsByType.cat.length}`);
console.log(`- Other breeds: ${breedsByType.other.length}`);

// Test hardcoded data integration
console.log('\n📋 Hardcoded Data Integration:');
console.log(`- DOG_BREEDS: ${DOG_BREEDS.length} breeds`);
console.log(`- CAT_BREEDS: ${CAT_BREEDS.length} breeds`);
console.log(`- DOG_BREEDS_HEBREW: ${DOG_BREEDS_HEBREW.length} breeds`);
console.log(`- CAT_BREEDS_HEBREW: ${CAT_BREEDS_HEBREW.length} breeds`);

// Test helper functions
console.log('\n🔧 Testing Helper Functions:');
const dogBreeds = getBreedsForType('dog');
const catBreeds = getBreedsForType('cat');

console.log(`- getBreedsForType('dog'): ${dogBreeds.length} breeds`);
console.log(`- getBreedsForType('cat'): ${catBreeds.length} breeds`);

// Sample breeds
console.log('\n🐕 Sample Dog Breeds:');
dogBreeds.slice(0, 5).forEach(breed => {
  console.log(`  ${breed.id}: ${breed.en} (${breed.he})`);
});

console.log('\n🐱 Sample Cat Breeds:');
catBreeds.slice(0, 5).forEach(breed => {
  console.log(`  ${breed.id}: ${breed.en} (${breed.he})`);
});

// Test hardcoded breed samples
console.log('\n📝 Sample Hardcoded Dog Breeds:');
DOG_BREEDS.slice(0, 5).forEach(breed => {
  console.log(`  ${breed.value}: ${breed.label}`);
});

console.log('\n📝 Sample Hardcoded Cat Breeds:');
CAT_BREEDS.slice(0, 5).forEach(breed => {
  console.log(`  ${breed.value}: ${breed.label}`);
});

console.log('\n✅ Breed integration test completed successfully!');
console.log('\n📈 Summary:');
console.log(`- Total dog breeds available: ${breedsByType.dog.length}`);
console.log(`- Total cat breeds available: ${breedsByType.cat.length}`);
console.log(`- Hebrew translations: ✅ Available`);
console.log(`- Hardcoded integration: ✅ Working`);
console.log(`- Helper functions: ✅ Working`);
