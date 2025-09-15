'use client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';

interface LocationAutocompleteComboSelectProps {
  label: string;
  id: string;
  // Selected value is the human-readable address string
  value: string;
  required?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

const LocationAutocompleteComboSelect: React.FC<
  LocationAutocompleteComboSelectProps
> = ({
  label,
  id,
  value,
  required = false,
  hasError = false,
  errorMessage,
  placeholder,
  onChange,
  onBlur
}) => {
  const t = useTranslations('components.searchbar');
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<Array<{ description: string; place_id: string }>>([]);
  // This state holds the description that will be displayed on the button.
  const [displayValue, setDisplayValue] = useState('');
  const [isReady, setIsReady] = useState(false);
  const locale = useLocale();

  // Keep AutocompleteService instance
  const autocompleteServiceRef = React.useRef<any>(null);

  // Initialize display from the provided value (address string)
  useEffect(() => {
    setDisplayValue(value || '');
  }, [value]);

  // Load Google Maps Places library in the browser
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).google?.maps?.places) {
      try {
        autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
        setIsReady(true);
      } catch (e) {
        console.error('Failed to init AutocompleteService:', e);
      }
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. Client-side address search disabled.');
      return;
    }

    const existing = document.querySelector('script[data-facepet-google]') as HTMLScriptElement | null;
    if (!existing) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=${locale}`;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-facepet-google', 'true');
      script.onload = () => {
        try {
          autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
          setIsReady(true);
        } catch (e) {
          console.error('Failed to init AutocompleteService:', e);
        }
      };
      script.onerror = () => console.error('Failed to load Google Maps script');
      document.head.appendChild(script);
    } else {
      // Wait a tick and try initializing
      const init = () => {
        if ((window as any).google?.maps?.places) {
          try {
            autocompleteServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
            setIsReady(true);
          } catch (e) {
            console.error('Failed to init AutocompleteService:', e);
          }
        }
      };
      setTimeout(init, 0);
    }
  }, [locale]);

  // Fetch predictions when the user types
  useEffect(() => {
    if (!isReady || !searchQuery) {
      setPredictions([]);
      return;
    }
    const svc = autocompleteServiceRef.current;
    if (!svc) return;

    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      svc.getPlacePredictions({ input: searchQuery, language: locale as string }, (res: any[] | null) => {
        if (cancelled) return;
        setPredictions((res || []).map((p: any) => ({ description: p.description, place_id: p.place_id })));
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [searchQuery, isReady, locale]);

  return (
    <div className="relative w-full">
      {/* Label */}
      <label
        htmlFor={id}
        className={cn(
          'absolute top-2.5 left-3 text-sm text-gray-500 transition-all duration-200 ease-in-out rtl:right-3',
          value
            ? 'text-primary -top-6 text-sm font-medium'
            : 'top-2.5 text-gray-500',
          hasError ? 'text-red-800' : ''
        )}
        onBlur={onBlur}
      >
        {label}
        {required ? '*' : ''}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            id={id}
            className={cn(
              'hover:ouline-none hover:ring-ring h-10 w-full justify-between border-gray-300 bg-white px-3 text-base hover:bg-white hover:ring-1',
              hasError ? 'border-red-800' : ''
            )}
            onClick={() => setOpen(true)}
          >
            <span className={cn(
              "overflow-x-scroll font-normal",
              !displayValue && placeholder ? "text-gray-400" : ""
            )}>
              {displayValue || placeholder || ""}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput
              placeholder={t('search')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {predictions.length > 0 ? (
                <ScrollArea className="max-h-44 overflow-y-auto">
                  <CommandGroup>
                    {predictions.map((prediction) => (
                      <CommandItem
                        key={prediction.place_id}
                        value={prediction.description}
                        onSelect={() => {
                          // When selected: update display and return address string
                          setDisplayValue(prediction.description);
                          onChange(prediction.description);
                          setSearchQuery('');
                          setOpen(false);
                        }}
                      >
                        {prediction.description}
                        <div className="grow" />
                        <Check
                          className={cn(
                            'ml-auto',
                            prediction.description === value ? 'opacity-100' : 'opacity-0'
                          )}
                          size={16}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </ScrollArea>
              ) : (
                <CommandEmpty>{isReady ? t('noResult') : 'Search unavailable'}</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default LocationAutocompleteComboSelect;
