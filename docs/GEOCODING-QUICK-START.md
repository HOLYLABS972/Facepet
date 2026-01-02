# Geocoding Quick Start Guide

This guide provides a quick reference for implementing geocoding in the Facepet application.

## TL;DR - Core Principles

✅ **DO**:
- Geocode once during registration/creation
- Store coordinates in database
- Use stored coordinates for map display
- Validate coordinates server-side
- Handle geocoding errors gracefully

❌ **DON'T**:
- Geocode during map rendering
- Store coordinates client-side only
- Trust client-provided coordinates
- Expose API keys to client
- Skip validation

---

## Quick Implementation Checklist

### For New Entity Types That Need Geocoding

- [ ] Add coordinate fields to TypeScript interface
- [ ] Add geocoding on address selection
- [ ] Store coordinates in database
- [ ] Use stored coordinates for display
- [ ] Add validation and error handling

---

## Code Snippets

### 1. Add Coordinate Fields to Schema

```typescript
import type { Coordinates } from '@/types/coordinates';

interface YourEntity {
  address: string;

  // Add these fields:
  coordinates?: Coordinates;
  geocodedAt?: Date;
  placeId?: string;
}
```

### 2. Geocode on Address Selection

```typescript
import { geocodeAddress } from '@/src/lib/geocoding/client';

const handleAddressChange = async (selectedAddress: string) => {
  setAddress(selectedAddress);

  if (selectedAddress.trim()) {
    setIsGeocoding(true);
    try {
      const result = await geocodeAddress(selectedAddress, {
        validateIsraelBounds: true  // Set to false if outside Israel
      });

      setCoordinates(result.coordinates);
      setPlaceId(result.placeId);
    } catch (error) {
      console.error('Geocoding failed:', error);
      setCoordinates(null);
      setPlaceId(undefined);
    } finally {
      setIsGeocoding(false);
    }
  }
};
```

### 3. Store in Database (Firestore)

```typescript
await setDoc(doc(db, 'your-collection', id), {
  address,
  coordinates,
  geocodedAt: coordinates ? new Date() : undefined,
  placeId,
  // ... other fields
});
```

### 4. Load from Database for Map Display

```typescript
// Query entities with coordinates
const entities = await getDocs(
  query(
    collection(db, 'your-collection'),
    where('coordinates', '!=', null)
  )
);

// Use stored coordinates directly (NO geocoding!)
entities.forEach(entity => {
  const data = entity.data();
  if (data.coordinates) {
    new google.maps.Marker({
      position: {
        lat: data.coordinates.lat,
        lng: data.coordinates.lng
      },
      map: mapInstance,
      title: data.name
    });
  }
});
```

---

## Common Patterns

### Pattern 1: User Registration Form

```tsx
const [address, setAddress] = useState('');
const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
const [isGeocoding, setIsGeocoding] = useState(false);

// Address autocomplete with geocoding
<LocationAutocompleteComboSelect
  value={address}
  onChange={async (addr) => {
    setAddress(addr);
    setIsGeocoding(true);

    const result = await geocodeAddress(addr);
    setCoordinates(result.coordinates);
    setIsGeocoding(false);
  }}
/>

// Validation indicator
{isGeocoding && <p>Validating address...</p>}
{coordinates && !isGeocoding && <p>✓ Address validated</p>}

// Submit with coordinates
<Button
  disabled={isGeocoding || !coordinates}
  onClick={() => saveUser({ address, coordinates })}
>
  Save
</Button>
```

### Pattern 2: React Hook Form Integration

```tsx
import { useFormContext } from 'react-hook-form';

const MyComponent = () => {
  const { setValue } = useFormContext();
  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleAddressChange = async (address: string) => {
    setValue('address', address);

    if (address.trim()) {
      setIsGeocoding(true);
      try {
        const result = await geocodeAddress(address);
        setValue('coordinates', result.coordinates);
        setValue('placeId', result.placeId);
      } finally {
        setIsGeocoding(false);
      }
    }
  };

  return (
    <Controller
      name="address"
      render={({ field }) => (
        <LocationAutocompleteComboSelect
          value={field.value}
          onChange={handleAddressChange}
        />
      )}
    />
  );
};
```

### Pattern 3: Map Display (Read-Only)

```tsx
const MapView = ({ entities }) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(m => m.setMap(null));

    // Create markers from stored coordinates only
    const newMarkers = entities
      .filter(e => e.coordinates)  // Only entities with coordinates
      .map(entity => {
        return new google.maps.Marker({
          position: entity.coordinates,  // Use stored coords directly
          map,
          title: entity.name
        });
      });

    setMarkers(newMarkers);
  }, [map, entities]);

  return <div ref={mapRef} style={{ width: '100%', height: '400px' }} />;
};
```

---

## Validation Helpers

### Validate Coordinates

```typescript
import { validateCoordinates } from '@/lib/utils/coordinate-validation';

const result = validateCoordinates(lat, lng);
if (!result.valid) {
  console.error(result.error, result.details);
}
```

### Check Israel Bounds

```typescript
import { isWithinIsrael } from '@/lib/utils/coordinate-validation';

if (isWithinIsrael(coordinates)) {
  console.log('Coordinates in Israel');
}
```

### Calculate Distance

```typescript
import { calculateDistance } from '@/lib/utils/coordinate-validation';

const distanceMeters = calculateDistance(coord1, coord2);
const distanceKm = distanceMeters / 1000;
```

---

## Error Handling

### Handle Geocoding Errors

```typescript
try {
  const result = await geocodeAddress(address);
  setCoordinates(result.coordinates);
} catch (error) {
  if (error instanceof GeocodingError) {
    if (error.statusCode === 429) {
      toast.error('Too many requests. Please try again in a few minutes.');
    } else if (error.statusCode === 400) {
      toast.error('Invalid address. Please check and try again.');
    } else {
      toast.error('Failed to validate address.');
    }
  }
  setCoordinates(null);
}
```

### Handle Network Errors

```typescript
import { geocodeAddressWithRetry } from '@/src/lib/geocoding/client';

// Automatically retries on network errors (not client errors)
const result = await geocodeAddressWithRetry(address, 3);
```

---

## Testing Checklist

When implementing geocoding, test these scenarios:

- [ ] Valid Israeli address geocodes successfully
- [ ] International address (if supported) geocodes correctly
- [ ] Invalid/gibberish address shows error
- [ ] Empty address clears coordinates
- [ ] Rate limit (try 15+ requests quickly)
- [ ] Network error (disconnect internet during geocode)
- [ ] Validation indicator shows/hides correctly
- [ ] Form submit disabled during geocoding
- [ ] Coordinates stored in database
- [ ] Map displays using stored coordinates
- [ ] No geocoding happens during map load

---

## Environment Setup

1. **Create `.env.local`**:
```bash
GOOGLE_MAPS_API_KEY=your_server_key_here
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_client_key_here
```

2. **Restrict API Keys** (Google Cloud Console):

**Server key** (`GOOGLE_MAPS_API_KEY`):
- ✅ Enable: Geocoding API
- ❌ Application restriction: IP addresses (add your server IPs)

**Client key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):
- ✅ Enable: Maps JavaScript API, Places API
- ❌ Disable: Geocoding API
- ❌ Application restriction: HTTP referrers (add `yourdomain.com/*`)

---

## Common Mistakes to Avoid

### ❌ Geocoding in Map Component

```typescript
// DON'T DO THIS!
const MapView = ({ businesses }) => {
  const geocoder = new google.maps.Geocoder();

  businesses.forEach(business => {
    geocoder.geocode({ address: business.address }, (results) => {
      // Creates marker after geocoding
      new google.maps.Marker({
        position: results[0].geometry.location
      });
    });
  });
};
```

### ✅ Use Stored Coordinates

```typescript
// DO THIS!
const MapView = ({ businesses }) => {
  businesses.forEach(business => {
    if (business.coordinates) {
      new google.maps.Marker({
        position: business.coordinates  // Pre-stored coordinates
      });
    }
  });
};
```

### ❌ Skipping Validation

```typescript
// DON'T DO THIS!
const coords = { lat: userInput.lat, lng: userInput.lng };
await saveToDatabase(coords);  // No validation!
```

### ✅ Always Validate

```typescript
// DO THIS!
const coords = validateAndSanitize(userInput.lat, userInput.lng, true);
await saveToDatabase(coords);
```

---

## Performance Tips

1. **Batch geocoding** if migrating existing data (10 per 15 min)
2. **Cache results** - don't re-geocode the same address
3. **Show loading states** during geocoding
4. **Debounce** autocomplete input (if custom implementation)
5. **Preload map library** before rendering map
6. **Use clustering** for 100+ markers on map
7. **Lazy load** map component (code splitting)

---

## Debugging Commands

### Check if coordinate exists

```typescript
const user = await getUserFromFirestore(userId);
console.log('Has coordinates:', !!user.user?.coordinates);
console.log('Coordinates:', user.user?.coordinates);
console.log('Geocoded at:', user.user?.geocodedAt);
```

### Validate stored coordinates

```typescript
const result = validateCoordinates(
  user.coordinates.lat,
  user.coordinates.lng
);
console.log('Valid:', result.valid);
```

### Test geocoding API directly

```bash
curl -X POST http://localhost:3000/api/geocoding/geocode \
  -H "Content-Type: application/json" \
  -d '{"address": "Tel Aviv, Israel", "validateIsraelBounds": true}'
```

---

## Getting Help

1. **Full documentation**: See [docs/SECURE-GEOCODING-ARCHITECTURE.md](./SECURE-GEOCODING-ARCHITECTURE.md)
2. **Type definitions**: See [src/types/coordinates.ts](../src/types/coordinates.ts)
3. **Validation utilities**: See [src/lib/utils/coordinate-validation.ts](../src/lib/utils/coordinate-validation.ts)
4. **Example implementation**: See [src/components/GoogleSignupBottomSheet.tsx](../src/components/GoogleSignupBottomSheet.tsx)

---

**Quick Links**:
- [Full Architecture Doc](./SECURE-GEOCODING-ARCHITECTURE.md)
- [Coordinate Types](../src/types/coordinates.ts)
- [Validation Utils](../src/lib/utils/coordinate-validation.ts)
- [Geocoding Client](../src/lib/geocoding/client.ts)
- [API Route](../src/app/api/geocoding/geocode/route.ts)
