'use client';

import { useState } from 'react';
import { HebrewBreedFilter, InlineHebrewBreedFilter } from '@/src/components/ui/hebrew-breed-filter';
import { BreedSelect } from '@/src/components/ui/breed-select';
import { AutocompleteBreedInput } from '@/src/components/ui/autocomplete-breed-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';

export default function TestHebrewFilterPage() {
  const [selectedBreed, setSelectedBreed] = useState<string>('');
  const [autocompleteBreed, setAutocompleteBreed] = useState<string>('');
  const [customBreed, setCustomBreed] = useState<string>('');
  const [filteredBreeds, setFilteredBreeds] = useState<Array<{ id: string; name: string }>>([]);

  return (
    <div className="container mx-auto p-6 space-y-8" dir="rtl">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">
          בדיקת סינון גזעים בעברית + השלמה אוטומטית
        </h1>
        <p className="text-gray-600">
          דף בדיקה לפונקציונליות סינון גזעים לפי אלפבית עברי והשלמה אוטומטית מתקדמת
        </p>
      </div>

      {/* Enhanced Breed Selection Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>בחירת גזע עם סינון עברי</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <BreedSelect
                petType="cat"
                value={selectedBreed}
                onValueChange={setSelectedBreed}
                placeholder="בחר גזע חתול"
                label="גזע החתול"
              />
              {selectedBreed && (
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-sm">
                    <strong>גזע נבחר:</strong> {selectedBreed}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>השלמה אוטומטית מתקדמת</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AutocompleteBreedInput
                petType="cat"
                value={autocompleteBreed}
                onValueChange={setAutocompleteBreed}
                placeholder="התחל להקליד שם גזע..."
                label="חיפוש גזע חתול"
                maxSuggestions={6}
              />
              {autocompleteBreed && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm">
                    <strong>גזע נבחר:</strong> {autocompleteBreed}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Input Example */}
      <Card>
        <CardHeader>
          <CardTitle>השלמה אוטומטית עם אפשרות הקלדה חופשית</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AutocompleteBreedInput
              petType="dog"
              value={customBreed}
              onValueChange={setCustomBreed}
              placeholder="הקלד או בחר גזע כלב..."
              label="גזע הכלב (כולל גזעים מותאמים אישית)"
              allowCustomInput={true}
              maxSuggestions={8}
            />
            {customBreed && (
              <div className="p-3 bg-purple-50 rounded-md">
                <p className="text-sm">
                  <strong>גזע נבחר/הוקלד:</strong> {customBreed}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Standalone Hebrew Filter for Cats */}
      <HebrewBreedFilter
        petType="cat"
        onBreedsFiltered={setFilteredBreeds}
        showResults={true}
      />

      {/* Standalone Hebrew Filter for Dogs */}
      <HebrewBreedFilter
        petType="dog"
        onBreedsFiltered={(breeds) => {
          console.log('Filtered dog breeds:', breeds);
        }}
        showResults={true}
      />

      {/* Inline Filter Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>סינון אלפביתי בלבד</CardTitle>
          </CardHeader>
          <CardContent>
            <InlineHebrewBreedFilter
              petType="cat"
              filterType="alphabet"
              onBreedsFiltered={(breeds) => {
                console.log('Alphabet filtered:', breeds);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>סינון טווח בלבד</CardTitle>
          </CardHeader>
          <CardContent>
            <InlineHebrewBreedFilter
              petType="cat"
              filterType="range"
              onBreedsFiltered={(breeds) => {
                console.log('Range filtered:', breeds);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Results Display */}
      {filteredBreeds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              תוצאות סינון
              <Badge variant="secondary">{filteredBreeds.length} גזעים</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredBreeds.map((breed) => (
                <div
                  key={breed.id}
                  className="p-2 text-sm bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
                >
                  {breed.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle>הוראות שימוש</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-2">בחירת גזע עם סינון עברי:</h4>
              <ul className="space-y-1 mr-4">
                <li>• לחץ על השדה ולחץ על כפתור הסינון (🔍) לפתיחת סינון עברי</li>
                <li>• לחץ על אותיות עבריות לסינון גזעים המתחילים באותיות אלו</li>
                <li>• בחר אות התחלה ואות סיום ליצירת טווח</li>
                <li>• גזעים שנבחרו לאחרונה יופיעו עם כוכב ⭐</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">השלמה אוטומטית מתקדמת:</h4>
              <ul className="space-y-1 mr-4">
                <li>• התחל להקליד - הרשימה תסתנן אוטומטית</li>
                <li>• השתמש בחיצים ↑↓ לניווט ברשימה</li>
                <li>• לחץ Enter או Tab לבחירה</li>
                <li>• לחץ Escape לסגירת הרשימה</li>
                <li>• גזעים אחרונים יופיעו בראש הרשימה</li>
                <li>• התאמות מדויקות יסומנו עם תג "מדויק"</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">הקלדה חופשית:</h4>
              <ul className="space-y-1 mr-4">
                <li>• ניתן להקליד גזעים מותאמים אישית</li>
                <li>• הרשימה תציע גזעים קיימים תוך כדי הקלדה</li>
                <li>• אם לא נמצא גזע מתאים, הטקסט שהוקלד יישמר</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
