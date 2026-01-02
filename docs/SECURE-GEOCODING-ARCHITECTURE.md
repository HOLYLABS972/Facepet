# Secure Geocoding Architecture

## Overview

This document describes the secure geocoding architecture implemented in the Facepet application. The system geocodes addresses **once** during registration (user or business creation) and stores immutable coordinates in the database. Map displays use only these pre-stored coordinates, with **no runtime geocoding**.

## Table of Contents

1. [Architecture Principles](#architecture-principles)
2. [Database Schema](#database-schema)
3. [Data Flow](#data-flow)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Security Features](#security-features)
7. [Usage Examples](#usage-examples)
8. [Migration Guide](#migration-guide)

---

## Architecture Principles

### Core Principles

1. **Geocode Once**: Addresses are geocoded exactly once during creation/registration
2. **Immutable Storage**: Coordinates are stored as immutable data with audit trails
3. **Server-Side Only**: All geocoding happens server-side to protect API keys
4. **Validated Coordinates**: All coordinates are validated for:
   - Valid number ranges (lat: -90 to 90, lng: -180 to 180)
   - Israel bounds validation (lat: 29.5-33.3, lng: 34.2-35.9)
   - NaN and Infinity checks
5. **No Runtime Geocoding**: Map rendering uses only stored coordinates

### Security Benefits

- **API Key Protection**: Keys never exposed to client
- **Rate Limiting**: Per-IP rate limits prevent abuse
- **Validation**: Prevents coordinate injection attacks
- **Audit Trail**: All coordinate changes are logged
- **Immutability**: Coordinates cannot be casually modified

---

## Database Schema

### User Collection (`users`)

```typescript
interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  address?: string;

  // Immutable coordinates (geocoded once during registration)
  coordinates?: Coordinates;     // { lat: number, lng: number }
  geocodedAt?: Date;             // When coordinates were geocoded
  placeId?: string;              // Google Place ID for reference

  profileImage?: string;
  acceptCookies?: boolean;
  language?: string;
  role?: 'user' | 'admin' | 'super_admin';
  createdAt: Date;
  updatedAt: Date;
}
```

### Vet Collection (`vets`)

```typescript
interface VetClinic {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  address?: string;

  // Immutable coordinates (geocoded once during registration)
  coordinates?: Coordinates;     // { lat: number, lng: number }
  geocodedAt?: Date;             // When coordinates were geocoded
  placeId?: string;              // Google Place ID for reference

  isNamePrivate: boolean;
  isPhonePrivate: boolean;
  isEmailPrivate: boolean;
  isAddressPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Coordinate Type

```typescript
interface Coordinates {
  lat: number;  // DECIMAL(10, 8) precision
  lng: number;  // DECIMAL(11, 8) precision
}
```

**Why these precisions?**
- 8 decimal places ≈ 1.1mm precision at equator
- Prevents floating-point precision attacks
- Standard for geographic applications

---

## Data Flow

### Text-Based Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION FLOW                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ User enters      │
│ address in form  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ LocationAutocompleteComboSelect        │
│ - Uses Google Places Autocomplete      │
│ - Returns address string               │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ handleAddressChange()                  │
│ - Triggered on address selection       │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ POST /api/geocoding/geocode            │
│ Request:                               │
│ {                                      │
│   address: "123 Main St, Tel Aviv",    │
│   validateIsraelBounds: true           │
│ }                                      │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ Server-Side Geocoding                                  │
│ 1. Rate limit check (10 req/15min)                    │
│ 2. Call Google Geocoding API                          │
│ 3. Validate coordinates                               │
│ 4. Sanitize to 8 decimal places                       │
│ 5. Check Israel bounds if requested                   │
└────────┬───────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Response:                              │
│ {                                      │
│   coordinates: { lat: 32.08, lng: 34.78 },│
│   formattedAddress: "...",             │
│   placeId: "ChIJ...",                  │
│   withinIsrael: true                   │
│ }                                      │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Frontend stores:                       │
│ - coordinates state                    │
│ - placeId state                        │
│ - Shows "✓ Address validated"          │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ User submits form                      │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────┐
│ updateUserInFirestore()                        │
│ {                                              │
│   address: "123 Main St, Tel Aviv",            │
│   coordinates: { lat: 32.08, lng: 34.78 },     │
│   placeId: "ChIJ...",                          │
│   geocodedAt: Date.now()                       │
│ }                                              │
└────────┬───────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Firestore Database                     │
│ - Coordinates stored permanently        │
│ - Never geocoded again                 │
└────────────────────────────────────────┘
```

### Map Display Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      MAP DISPLAY FLOW                           │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ User opens map   │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ GET /api/businesses/locations          │
│ (or query Firestore directly)          │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ Server queries database                                │
│ SELECT id, name, address,                              │
│        coordinates.lat, coordinates.lng                │
│ FROM users/vets                                        │
│ WHERE coordinates IS NOT NULL                          │
└────────┬───────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Response:                              │
│ [                                      │
│   {                                    │
│     id: "123",                         │
│     name: "Dr. Smith Vet Clinic",      │
│     coordinates: {                     │
│       lat: 32.08,                      │
│       lng: 34.78                       │
│     }                                  │
│   },                                   │
│   ...                                  │
│ ]                                      │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Frontend validates response schema     │
│ - Type checking with Zod               │
│ - Range validation                     │
│ - Freeze coordinates object            │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│ Render markers on map                  │
│ - Use coordinates directly             │
│ - NO geocoding                         │
│ - NO address-to-coords conversion      │
└────────────────────────────────────────┘
```

---

## API Endpoints

### POST /api/geocoding/geocode

**Purpose**: Server-side geocoding with validation and rate limiting

**Request**:
```typescript
{
  address: string;                // Required: Address to geocode
  placeId?: string;               // Optional: Google Place ID
  validateIsraelBounds?: boolean; // Optional: Enforce Israel bounds (default: true)
}
```

**Response**:
```typescript
{
  address: string;                // Original address
  coordinates: {                  // Validated and sanitized coordinates
    lat: number;
    lng: number;
  };
  formattedAddress: string;       // Geocoded formatted address
  placeId?: string;               // Google Place ID
  withinIsrael: boolean;          // Whether coordinates are in Israel
}
```

**Error Responses**:
- `429 Too Many Requests`: Rate limit exceeded (10 req/15min)
- `400 Bad Request`: Invalid address or coordinates outside bounds
- `503 Service Unavailable`: Geocoding service unavailable

**Rate Limits**:
- 10 requests per 15 minutes per IP
- 100 requests per day per IP (configurable)

**Security Features**:
- API key never exposed to client
- IP-based rate limiting
- Input validation with Zod
- Coordinate sanitization
- Audit logging

---

## Frontend Components

### 1. GoogleSignupBottomSheet

**File**: `src/components/GoogleSignupBottomSheet.tsx`

**Purpose**: User registration with geocoding

**Key Features**:
- Geocodes address on selection
- Shows validation status
- Stores coordinates in user profile

**Usage**:
```tsx
<GoogleSignupBottomSheet
  isOpen={showSheet}
  onClose={() => setShowSheet(false)}
  onComplete={() => handleComplete()}
/>
```

### 2. VetDetailsPage

**File**: `src/components/get-started/VetDetailsPage.tsx`

**Purpose**: Vet clinic registration with geocoding

**Key Features**:
- Geocodes vet address on selection
- Integrates with react-hook-form
- Shows geocoding progress indicator

**Form Fields**:
- `vetAddress`: Address string
- `vetCoordinates`: Geocoded coordinates (auto-populated)
- `vetPlaceId`: Google Place ID (auto-populated)

### 3. LocationAutocompleteComboSelect

**File**: `src/components/get-started/ui/LocationAutocompleteSelector.tsx`

**Purpose**: Address autocomplete using Google Places

**Key Features**:
- Client-side autocomplete for better UX
- Returns address string and place_id
- Does NOT geocode (caller must geocode)

**Usage**:
```tsx
<LocationAutocompleteComboSelect
  label="Address"
  id="address"
  value={address}
  onChange={handleAddressChange}
  placeholder="Enter address"
  required
/>
```

---

## Security Features

### 1. Input Validation

**Server-Side Validation**:
```typescript
const CoordinateSchema = z.object({
  lat: z.number()
    .min(-90).max(90)
    .refine((val) => !isNaN(val) && isFinite(val)),
  lng: z.number()
    .min(-180).max(180)
    .refine((val) => !isNaN(val) && isFinite(val))
});
```

**Israel Bounds Validation**:
```typescript
const ISRAEL_BOUNDS = {
  MIN_LAT: 29.5,
  MAX_LAT: 33.3,
  MIN_LNG: 34.2,
  MAX_LNG: 35.9
};
```

### 2. Coordinate Sanitization

Prevents precision attacks:
```typescript
function sanitizeCoordinates(coords: Coordinates): Coordinates {
  return {
    lat: parseFloat(coords.lat.toFixed(8)),
    lng: parseFloat(coords.lng.toFixed(8))
  };
}
```

### 3. Rate Limiting

```typescript
const RATE_LIMIT = {
  MAX_REQUESTS: 10,              // Max requests per window
  WINDOW_MS: 15 * 60 * 1000,     // 15 minutes
  MAX_REQUESTS_PER_DAY: 100      // Daily limit per IP
};
```

### 4. Immutability

Frontend:
```typescript
const coordinates = Object.freeze({
  lat: 32.08,
  lng: 34.78
});
```

Database:
- Coordinates are not updated after initial geocoding
- Changes require explicit admin action with audit log

### 5. Audit Trail

Every coordinate change is logged with:
- Entity ID (user, vet, etc.)
- Old coordinates
- New coordinates
- Changed by (user ID)
- Change reason
- Timestamp
- IP address
- User agent

---

## Usage Examples

### Example 1: User Registration

```typescript
// 1. User selects address from autocomplete
<LocationAutocompleteComboSelect
  value={address}
  onChange={async (selectedAddress) => {
    setAddress(selectedAddress);

    // 2. Geocode immediately
    const result = await geocodeAddress(selectedAddress, {
      validateIsraelBounds: true
    });

    // 3. Store coordinates
    setCoordinates(result.coordinates);
    setPlaceId(result.placeId);
  }}
/>

// 4. Submit form with coordinates
await updateUserInFirestore(user.uid, {
  address,
  coordinates,
  placeId
});
```

### Example 2: Vet Registration

```typescript
// In VetDetailsPage component
const handleVetAddressChange = async (selectedAddress: string) => {
  setValue('vetAddress', selectedAddress);

  if (selectedAddress.trim()) {
    setIsGeocodingVet(true);
    try {
      const result = await geocodeAddress(selectedAddress, {
        validateIsraelBounds: true
      });
      setValue('vetCoordinates', result.coordinates);
      setValue('vetPlaceId', result.placeId);
    } catch (error) {
      console.error('Geocoding failed:', error);
      setValue('vetCoordinates', undefined);
      setValue('vetPlaceId', undefined);
    } finally {
      setIsGeocodingVet(false);
    }
  }
};
```

### Example 3: Map Display

```typescript
// Load locations with coordinates
const locations = await getVetClinics();

// Render markers using stored coordinates only
locations.forEach(location => {
  if (location.coordinates) {
    new google.maps.Marker({
      position: {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng
      },
      map: mapInstance,
      title: location.name
    });
  }
});

// NO GEOCODING during map display!
```

### Example 4: Coordinate Validation

```typescript
import { validateAndSanitize } from '@/lib/utils/coordinate-validation';

// Validate and sanitize user input
try {
  const coords = validateAndSanitize(
    32.0853,
    34.7818,
    true  // Require Israel bounds
  );

  // coords is now validated and sanitized
  console.log(coords); // { lat: 32.0853, lng: 34.7818 }
} catch (error) {
  console.error('Invalid coordinates:', error.message);
}
```

---

## Migration Guide

### For Existing Data

If you have existing users/vets without coordinates:

1. **Create a migration script**:

```typescript
import { geocodeAddress } from '@/src/lib/geocoding/client';
import { updateUserInFirestore } from '@/src/lib/firebase/users';

async function migrateUserCoordinates(userId: string, address: string) {
  try {
    const result = await geocodeAddress(address, {
      validateIsraelBounds: false  // Don't enforce bounds for existing data
    });

    await updateUserInFirestore(userId, {
      coordinates: result.coordinates,
      placeId: result.placeId
    });

    console.log(`✓ Migrated user ${userId}`);
  } catch (error) {
    console.error(`✗ Failed to migrate user ${userId}:`, error);
  }
}
```

2. **Rate limit considerations**:
   - Process in batches of 10 (due to rate limits)
   - Add delays between batches (15 minutes)
   - Monitor for API quota usage

3. **Validation**:
   - Check that all migrated coordinates are valid
   - Verify they're in expected geographic region
   - Flag anomalies for manual review

### For New Features

When adding new entities that need geocoding:

1. **Add coordinate fields** to the schema:
```typescript
interface NewEntity {
  address: string;
  coordinates?: Coordinates;
  geocodedAt?: Date;
  placeId?: string;
}
```

2. **Geocode during creation**:
```typescript
const result = await geocodeAddress(formData.address);
const newEntity = {
  ...formData,
  coordinates: result.coordinates,
  placeId: result.placeId,
  geocodedAt: new Date()
};
```

3. **Use stored coordinates** for display:
```typescript
// NO geocoding in map components!
const marker = new google.maps.Marker({
  position: entity.coordinates,
  map: mapInstance
});
```

---

## Environment Variables

Required for geocoding to work:

```bash
# Server-side Google Maps API key (keep secret!)
GOOGLE_MAPS_API_KEY=your_server_side_api_key_here

# Optional: Client-side key (restricted to Maps JavaScript API only)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_client_side_api_key_here
```

**API Key Restrictions** (Google Cloud Console):

Server-side key (`GOOGLE_MAPS_API_KEY`):
- Enable: Geocoding API
- Restrict to: Your server IP addresses

Client-side key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):
- Enable: Maps JavaScript API, Places API
- Disable: Geocoding API (important!)
- Restrict to: Your domain (e.g., `yourdomain.com/*`)

---

## Troubleshooting

### Issue: "Rate limit exceeded"

**Cause**: Too many geocoding requests from the same IP

**Solution**:
- Wait 15 minutes before retrying
- Consider implementing request queuing
- Increase rate limits in `src/app/api/geocoding/geocode/route.ts`

### Issue: "Coordinates outside Israel"

**Cause**: Address geocoded to location outside Israel bounds

**Solution**:
- Verify address is in Israel
- Set `validateIsraelBounds: false` if address is legitimately outside Israel
- Check for typos in address

### Issue: "Geocoding service unavailable"

**Cause**: `GOOGLE_MAPS_API_KEY` not configured or invalid

**Solution**:
- Verify environment variable is set
- Check API key is valid and has Geocoding API enabled
- Check API quota hasn't been exceeded

### Issue: Map markers not showing

**Cause**: Coordinates not stored during registration

**Solution**:
- Verify geocoding happens during registration
- Check browser console for errors
- Ensure coordinates are saved to database
- Run migration script for existing data

---

## Performance Considerations

### Geocoding Performance

- **Average latency**: 200-500ms per request
- **Rate limit**: 10 requests / 15 minutes
- **Caching**: 24-hour cache on successful responses
- **Retry logic**: Exponential backoff (1s, 2s, 4s)

### Map Rendering Performance

- **No geocoding**: Map loads instantly with stored coordinates
- **Typical load time**: <100ms for 100 markers
- **Scalability**: Can display 1000+ markers efficiently
- **Distance calculation**: Haversine formula (< 1ms per calculation)

---

## Best Practices

1. **Always geocode during creation/registration**, never during display
2. **Validate coordinates** before storing
3. **Handle geocoding errors** gracefully (don't block user registration)
4. **Show validation status** to users ("✓ Address validated")
5. **Log all geocoding operations** for debugging and audit
6. **Monitor rate limits** and API quota usage
7. **Never expose API keys** to client-side code
8. **Freeze coordinate objects** to prevent accidental mutation
9. **Use TypeScript** for type safety with coordinate interfaces
10. **Test edge cases**: invalid coordinates, out-of-bounds, network errors

---

## Related Files

- **Types**: `src/types/coordinates.ts`
- **Validation**: `src/lib/utils/coordinate-validation.ts`
- **Geocoding Client**: `src/lib/geocoding/client.ts`
- **API Route**: `src/app/api/geocoding/geocode/route.ts`
- **User Schema**: `src/lib/firebase/users.ts`
- **Vet Schema**: `src/lib/firebase/vets.ts`
- **Pet Creation**: `src/lib/firebase/pets.ts`

---

## Support

For questions or issues:
1. Check this documentation first
2. Review code comments in related files
3. Check browser console for errors
4. Review server logs for geocoding failures
5. Create an issue in the project repository

---

**Last Updated**: 2026-01-01
**Version**: 1.0.0
**Authors**: Development Team
