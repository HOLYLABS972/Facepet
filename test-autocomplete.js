// Simple test to verify breed autocomplete functionality
const { getSuggestions, fuzzySearch } = require('./src/lib/utils/autocomplete.ts');

// Mock breed data
const mockBreeds = [
  { id: 'dog-1', name: 'Golden Retriever' },
  { id: 'dog-2', name: 'German Shepherd' },
  { id: 'dog-3', name: 'Labrador Retriever' },
  { id: 'dog-4', name: 'Bulldog' },
  { id: 'dog-5', name: 'Poodle' },
  { id: 'cat-1', name: 'Persian' },
  { id: 'cat-2', name: 'Siamese' },
  { id: 'cat-3', name: 'Maine Coon' }
];

console.log('Testing breed autocomplete...');

// Test 1: Empty search should return all breeds
console.log('\n1. Empty search:');
const emptyResults = getSuggestions('', mockBreeds, [], { limit: 5 });
console.log(`Found ${emptyResults.length} results`);
emptyResults.forEach(r => console.log(`  - ${r.item.name} (score: ${r.score})`));

// Test 2: Partial search
console.log('\n2. Search for "ret":');
const partialResults = getSuggestions('ret', mockBreeds, [], { limit: 5 });
console.log(`Found ${partialResults.length} results`);
partialResults.forEach(r => console.log(`  - ${r.item.name} (score: ${r.score})`));

// Test 3: Multi-word search
console.log('\n3. Search for "golden ret":');
const multiWordResults = getSuggestions('golden ret', mockBreeds, [], { limit: 5 });
console.log(`Found ${multiWordResults.length} results`);
multiWordResults.forEach(r => console.log(`  - ${r.item.name} (score: ${r.score})`));

// Test 4: Fuzzy search
console.log('\n4. Fuzzy search for "germa":');
const fuzzyResults = fuzzySearch('germa', mockBreeds, { limit: 5, minScore: 1 });
console.log(`Found ${fuzzyResults.length} results`);
fuzzyResults.forEach(r => console.log(`  - ${r.item.name} (score: ${r.score})`));

console.log('\nTest completed!');