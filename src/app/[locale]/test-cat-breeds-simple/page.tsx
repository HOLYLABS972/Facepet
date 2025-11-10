'use client';

import { useState } from 'react';
import { BreedSelect } from '@/src/components/ui/breed-select';
import { getLocalizedBreedsForType } from '@/src/lib/data/breeds';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';

export default function TestCatBreedsSimplePage() {
  const [selectedBreed, setSelectedBreed] = useState<string>('');
  
  // Get cat breeds directly
  const catBreedsEn = getLocalizedBreedsForType('cat', 'en');
  const catBreedsHe = getLocalizedBreedsForType('cat', 'he');
  
  // Check for "other" option
  const otherBreedEn = catBreedsEn.find(breed => breed.name.toLowerCase() === 'other');
  const otherBreedHe = catBreedsHe.find(breed => breed.name === 'אחר');
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          Test Cat Breeds - Simple Check
        </h1>
        <p className="text-gray-600">
          Testing if "other" option appears in cat breed selection
        </p>
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Cat Breeds Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>English breeds:</strong> {catBreedsEn.length}</p>
              <p><strong>"Other" found:</strong> {otherBreedEn ? '✅ Yes' : '❌ No'}</p>
              {otherBreedEn && <p><strong>Other ID:</strong> {otherBreedEn.id}</p>}
            </div>
            <div>
              <p><strong>Hebrew breeds:</strong> {catBreedsHe.length}</p>
              <p><strong>"אחר" found:</strong> {otherBreedHe ? '✅ Yes' : '❌ No'}</p>
              {otherBreedHe && <p><strong>אחר ID:</strong> {otherBreedHe.id}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actual Breed Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Test Breed Selector (English)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <BreedSelect
              petType="cat"
              value={selectedBreed}
              onValueChange={setSelectedBreed}
              placeholder="Select cat breed"
              label="Cat Breed"
            />
            {selectedBreed && (
              <div className="p-3 bg-green-50 rounded-md">
                <p><strong>Selected:</strong> {selectedBreed}</p>
                <p><strong>Breed name:</strong> {catBreedsEn.find(b => b.id === selectedBreed)?.name}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Last few breeds for debugging */}
      <Card>
        <CardHeader>
          <CardTitle>Last 5 Cat Breeds (English)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {catBreedsEn.slice(-5).map(breed => (
              <div 
                key={breed.id} 
                className={`p-2 border rounded ${breed.name.toLowerCase() === 'other' ? 'bg-yellow-100 border-yellow-500' : 'bg-gray-50'}`}
              >
                <strong>ID:</strong> {breed.id} - <strong>Name:</strong> {breed.name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw JSON for debugging */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data (Last 3 breeds)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(catBreedsEn.slice(-3), null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
