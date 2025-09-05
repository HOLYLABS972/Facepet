'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Search, MapPin, Phone, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { searchVetClinics, VetClinic } from '@/src/lib/firebase/vets';
import { Loader2 } from 'lucide-react';

interface VetSearchComponentProps {
  onVetSelected: (vet: VetClinic) => void;
  onClearSelection: () => void;
  selectedVet?: VetClinic | null;
  className?: string;
}

export default function VetSearchComponent({
  onVetSelected,
  onClearSelection,
  selectedVet,
  className = ''
}: VetSearchComponentProps) {
  const t = useTranslations('pages.VetDetailsPage');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<VetClinic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (term: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (term.trim().length >= 2) {
            await performSearch(term);
          } else {
            setSearchResults([]);
            setShowResults(false);
          }
        }, 300);
      };
    })(),
    []
  );

  const performSearch = async (term: string) => {
    setIsSearching(true);
    setError(null);
    
    try {
      const result = await searchVetClinics(term, 10);
      if (result.success && result.vets) {
        setSearchResults(result.vets);
        setShowResults(true);
      } else {
        setError(result.error || 'Search failed');
        setSearchResults([]);
      }
    } catch (err) {
      setError('An error occurred while searching');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      debouncedSearch(searchTerm);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchTerm, debouncedSearch]);

  const handleVetSelect = (vet: VetClinic) => {
    onVetSelected(vet);
    setSearchTerm(vet.name);
    setShowResults(false);
  };

  const handleClearSelection = () => {
    onClearSelection();
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // If user is typing and we have a selected vet, clear the selection
    if (selectedVet && value !== selectedVet.name) {
      onClearSelection();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder={t('searchPlaceholder', { default: 'Search for veterinary clinic...' })}
          value={searchTerm}
          onChange={handleInputChange}
          className="pl-10 pr-10"
          disabled={!!selectedVet}
        />
        {selectedVet && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearSelection}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto">
          <CardContent className="p-2">
            {searchResults.map((vet) => (
              <div
                key={vet.id}
                className="p-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors"
                onClick={() => handleVetSelect(vet)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm text-gray-900">{vet.name}</h4>
                    <div className="mt-1 space-y-1">
                      {vet.address && (
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{vet.address}</span>
                        </div>
                      )}
                      {vet.phoneNumber && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{vet.phoneNumber}</span>
                        </div>
                      )}
                      {vet.email && (
                        <div className="flex items-center text-xs text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          <span className="truncate">{vet.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {t('existing', { default: 'Existing' })}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {showResults && searchResults.length === 0 && !isSearching && searchTerm.trim().length >= 2 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">
              {t('noResults', { default: 'No veterinary clinics found. You can add a new one below.' })}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Selected Vet Display */}
      {selectedVet && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-sm text-green-900">{selectedVet.name}</h4>
              <div className="mt-1 space-y-1">
                {selectedVet.address && (
                  <div className="flex items-center text-xs text-green-700">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{selectedVet.address}</span>
                  </div>
                )}
                {selectedVet.phoneNumber && (
                  <div className="flex items-center text-xs text-green-700">
                    <Phone className="h-3 w-3 mr-1" />
                    <span>{selectedVet.phoneNumber}</span>
                  </div>
                )}
                {selectedVet.email && (
                  <div className="flex items-center text-xs text-green-700">
                    <Mail className="h-3 w-3 mr-1" />
                    <span className="truncate">{selectedVet.email}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge variant="default" className="text-xs bg-green-600">
              {t('selected', { default: 'Selected' })}
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
