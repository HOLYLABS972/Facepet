/**
 * Coordinate Validation Utilities
 *
 * Security-focused validation functions for geographic coordinates.
 * Prevents coordinate injection, tampering, and out-of-bounds values.
 */

import {
  Coordinates,
  CoordinateSchema,
  IsraelCoordinateSchema,
  ISRAEL_BOUNDS,
  GLOBAL_BOUNDS,
} from '@/types/coordinates';

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    field?: string;
    expected?: string;
    received?: string;
  };
}

/**
 * Validates if coordinates are valid numbers within global bounds
 *
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns Validation result
 */
export function validateCoordinates(lat: unknown, lng: unknown): ValidationResult {
  try {
    // Type checking
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return {
        valid: false,
        error: 'Coordinates must be numbers',
        details: {
          received: `lat: ${typeof lat}, lng: ${typeof lng}`,
        },
      };
    }

    // NaN and Infinity checks
    if (isNaN(lat) || !isFinite(lat)) {
      return {
        valid: false,
        error: 'Invalid latitude value',
        details: { field: 'latitude', received: String(lat) },
      };
    }

    if (isNaN(lng) || !isFinite(lng)) {
      return {
        valid: false,
        error: 'Invalid longitude value',
        details: { field: 'longitude', received: String(lng) },
      };
    }

    // Validate with Zod schema
    const result = CoordinateSchema.safeParse({ lat, lng });

    if (!result.success) {
      return {
        valid: false,
        error: result.error.errors[0]?.message || 'Invalid coordinates',
        details: {
          field: result.error.errors[0]?.path[0] as string,
        },
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Unexpected validation error',
      details: {
        received: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Validates if coordinates are within Israel's geographic boundaries
 *
 * @param coordinates - Coordinate object to validate
 * @returns Validation result
 */
export function validateIsraelBounds(coordinates: Coordinates): ValidationResult {
  const result = IsraelCoordinateSchema.safeParse(coordinates);

  if (!result.success) {
    return {
      valid: false,
      error: 'Coordinates outside Israel bounds',
      details: {
        expected: `Lat: ${ISRAEL_BOUNDS.MIN_LAT}-${ISRAEL_BOUNDS.MAX_LAT}, Lng: ${ISRAEL_BOUNDS.MIN_LNG}-${ISRAEL_BOUNDS.MAX_LNG}`,
        received: `Lat: ${coordinates.lat}, Lng: ${coordinates.lng}`,
      },
    };
  }

  return { valid: true };
}

/**
 * Checks if coordinates are within Israel (without throwing error)
 *
 * @param coordinates - Coordinate object to check
 * @returns true if within Israel bounds
 */
export function isWithinIsrael(coordinates: Coordinates): boolean {
  return (
    coordinates.lat >= ISRAEL_BOUNDS.MIN_LAT &&
    coordinates.lat <= ISRAEL_BOUNDS.MAX_LAT &&
    coordinates.lng >= ISRAEL_BOUNDS.MIN_LNG &&
    coordinates.lng <= ISRAEL_BOUNDS.MAX_LNG
  );
}

/**
 * Sanitizes coordinate values to prevent precision attacks
 * Limits to 8 decimal places for latitude, 8 for longitude
 * (Approximately 1.1mm precision at equator)
 *
 * @param coordinates - Raw coordinates
 * @returns Sanitized coordinates
 */
export function sanitizeCoordinates(coordinates: Coordinates): Coordinates {
  return {
    lat: parseFloat(coordinates.lat.toFixed(8)),
    lng: parseFloat(coordinates.lng.toFixed(8)),
  };
}

/**
 * Calculates distance between two coordinates using Haversine formula
 *
 * @param coord1 - First coordinate
 * @param coord2 - Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Detects anomalous coordinate changes (security feature)
 *
 * @param oldCoords - Previous coordinates
 * @param newCoords - New coordinates
 * @param maxDistanceMeters - Maximum allowed distance change (default 500km)
 * @returns true if change is suspicious
 */
export function isAnomalousChange(
  oldCoords: Coordinates,
  newCoords: Coordinates,
  maxDistanceMeters: number = 500000 // 500km
): boolean {
  const distance = calculateDistance(oldCoords, newCoords);
  return distance > maxDistanceMeters;
}

/**
 * Validates and sanitizes coordinates in one step
 * Throws error if validation fails
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @param requireIsraelBounds - Whether to enforce Israel bounds
 * @returns Sanitized coordinates
 * @throws Error if validation fails
 */
export function validateAndSanitize(
  lat: unknown,
  lng: unknown,
  requireIsraelBounds: boolean = false
): Coordinates {
  // Basic validation
  const basicValidation = validateCoordinates(lat, lng);
  if (!basicValidation.valid) {
    throw new Error(basicValidation.error || 'Invalid coordinates');
  }

  // Sanitize
  const sanitized = sanitizeCoordinates({ lat: lat as number, lng: lng as number });

  // Israel bounds validation if required
  if (requireIsraelBounds) {
    const israelValidation = validateIsraelBounds(sanitized);
    if (!israelValidation.valid) {
      throw new Error(israelValidation.error || 'Coordinates outside Israel');
    }
  }

  return sanitized;
}

/**
 * Freezes coordinate object to prevent mutation
 *
 * @param coordinates - Coordinates to freeze
 * @returns Frozen (immutable) coordinates
 */
export function freezeCoordinates(coordinates: Coordinates): Readonly<Coordinates> {
  return Object.freeze({ ...coordinates });
}

/**
 * Validates coordinate object structure
 *
 * @param obj - Object to validate
 * @returns true if object has valid coordinate structure
 */
export function isValidCoordinateObject(obj: unknown): obj is Coordinates {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  const coords = obj as Record<string, unknown>;
  return (
    'lat' in coords &&
    'lng' in coords &&
    typeof coords.lat === 'number' &&
    typeof coords.lng === 'number' &&
    !isNaN(coords.lat) &&
    !isNaN(coords.lng)
  );
}

/**
 * Creates a bounding box around a center point
 * Useful for geographic queries
 *
 * @param center - Center coordinates
 * @param radiusMeters - Radius in meters
 * @returns Bounding box with min/max lat/lng
 */
export function createBoundingBox(center: Coordinates, radiusMeters: number) {
  const latDegreePerMeter = 1 / 111320;
  const lngDegreePerMeter = 1 / (111320 * Math.cos((center.lat * Math.PI) / 180));

  const latOffset = radiusMeters * latDegreePerMeter;
  const lngOffset = radiusMeters * lngDegreePerMeter;

  return {
    minLat: Math.max(center.lat - latOffset, GLOBAL_BOUNDS.MIN_LAT),
    maxLat: Math.min(center.lat + latOffset, GLOBAL_BOUNDS.MAX_LAT),
    minLng: Math.max(center.lng - lngOffset, GLOBAL_BOUNDS.MIN_LNG),
    maxLng: Math.min(center.lng + lngOffset, GLOBAL_BOUNDS.MAX_LNG),
  };
}

/**
 * Checks if coordinates are within a bounding box
 *
 * @param coords - Coordinates to check
 * @param bounds - Bounding box
 * @returns true if within bounds
 */
export function isWithinBoundingBox(
  coords: Coordinates,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
  return (
    coords.lat >= bounds.minLat &&
    coords.lat <= bounds.maxLat &&
    coords.lng >= bounds.minLng &&
    coords.lng <= bounds.maxLng
  );
}
