'use client';

import { getLocalizedBreedsForType } from '@/src/lib/data/breeds';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';

export default function DebugCatBreedsPage() {
  // Get cat breeds in both English and Hebrew
  const catBreedsEn = getLocalizedBreedsForType('cat', 'en');
  const catBreedsHe = getLocalizedBreedsForType('cat', 'he');
  
  // Find "other" option
  const otherBreedEn = catBreedsEn.find(breed => breed.name.toLowerCase() === 'other');
  const otherBreedHe = catBreedsHe.find(breed => breed.name === 'אחר');
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          Debug: Cat Breeds with "Other" Option
        </h1>
        <p className="text-gray-600">
          Checking if "other" option is available for cats
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>English Cat Breeds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Total breeds:</strong> {catBreedsEn.length}</p>
              <p><strong>"Other" option found:</strong> 
                {otherBreedEn ? (
                  <Badge variant="default" className="ml-2">
                    ✅ Yes (ID: {otherBreedEn.id})
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="ml-2">
                    ❌ No
                  </Badge>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hebrew Cat Breeds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Total breeds:</strong> {catBreedsHe.length}</p>
              <p><strong>"Other" option found:</strong> 
                {otherBreedHe ? (
                  <Badge variant="default" className="ml-2">
                    ✅ Yes (ID: {otherBreedHe.id})
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="ml-2">
                    ❌ No
                  </Badge>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All English Cat Breeds */}
      <Card>
        <CardHeader>
          <CardTitle>All English Cat Breeds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
            {catBreedsEn.map((breed, index) => (
              <div
                key={breed.id}
                className={`p-2 text-sm rounded border ${
                  breed.name.toLowerCase() === 'other' 
                    ? 'bg-green-100 border-green-500 font-bold' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="font-medium">{breed.name}</div>
                <div className="text-xs text-gray-500">ID: {breed.id}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Hebrew Cat Breeds */}
      <Card>
        <CardHeader>
          <CardTitle>All Hebrew Cat Breeds</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto">
            {catBreedsHe.map((breed, index) => (
              <div
                key={breed.id}
                className={`p-2 text-sm rounded border ${
                  breed.name === 'אחר' 
                    ? 'bg-green-100 border-green-500 font-bold' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="font-medium">{breed.name}</div>
                <div className="text-xs text-gray-500">ID: {breed.id}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw Data Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Last 5 English Cat Breeds:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(catBreedsEn.slice(-5), null, 2)}
              </pre>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Last 5 Hebrew Cat Breeds:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify(catBreedsHe.slice(-5), null, 2)}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
