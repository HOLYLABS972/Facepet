/**
 * Secure Coordinate System Types
 *
 * This file defines immutable coordinate types for storing location data.
 * Coordinates are geocoded ONCE during registration and stored permanently.
 * No runtime geocoding occurs during map display.
 */

import { z } from 'zod';

/**
 * Israel Geographic Boundaries
 * Used for validation to ensure coordinates are within expected region
 */
export const ISRAEL_BOUNDS = {
  MIN_LAT: 29.5,
  MAX_LAT: 33.3,
  MIN_LNG: 34.2,
  MAX_LNG: 35.9,
} as const;

/**
 * Global coordinate boundaries (WGS84 standard)
 */
export const GLOBAL_BOUNDS = {
  MIN_LAT: -90,
  MAX_LAT: 90,
  MIN_LNG: -180,
  MAX_LNG: 180,
} as const;

/**
 * Zod schema for validating coordinates
 * Ensures coordinates are valid numbers within global bounds
 */
export const CoordinateSchema = z.object({
  lat: z
    .number()
    .min(GLOBAL_BOUNDS.MIN_LAT, 'Latitude must be >= -90')
    .max(GLOBAL_BOUNDS.MAX_LAT, 'Latitude must be <= 90')
    .refine((val) => !isNaN(val) && isFinite(val), 'Invalid latitude value'),
  lng: z
    .number()
    .min(GLOBAL_BOUNDS.MIN_LNG, 'Longitude must be >= -180')
    .max(GLOBAL_BOUNDS.MAX_LNG, 'Longitude must be <= 180')
    .refine((val) => !isNaN(val) && isFinite(val), 'Invalid longitude value'),
});

/**
 * Zod schema for Israel-specific coordinates
 * Validates that coordinates are within Israel's geographic bounds
 */
export const IsraelCoordinateSchema = z.object({
  lat: z
    .number()
    .min(ISRAEL_BOUNDS.MIN_LAT, `Latitude must be >= ${ISRAEL_BOUNDS.MIN_LAT} (Israel bounds)`)
    .max(ISRAEL_BOUNDS.MAX_LAT, `Latitude must be <= ${ISRAEL_BOUNDS.MAX_LAT} (Israel bounds)`)
    .refine((val) => !isNaN(val) && isFinite(val), 'Invalid latitude value'),
  lng: z
    .number()
    .min(ISRAEL_BOUNDS.MIN_LNG, `Longitude must be >= ${ISRAEL_BOUNDS.MIN_LNG} (Israel bounds)`)
    .max(ISRAEL_BOUNDS.MAX_LNG, `Longitude must be <= ${ISRAEL_BOUNDS.MAX_LNG} (Israel bounds)`)
    .refine((val) => !isNaN(val) && isFinite(val), 'Invalid longitude value'),
});

/**
 * TypeScript type for coordinates (derived from Zod schema)
 */
export type Coordinates = z.infer<typeof CoordinateSchema>;

/**
 * Immutable location data stored in database
 * Includes both human-readable address and geocoded coordinates
 */
export interface LocationData {
  /** Human-readable address (for display) */
  readonly address: string;

  /** Immutable coordinates (geocoded once during creation) */
  readonly coordinates: Readonly<Coordinates>;

  /** When the location was geocoded (audit trail) */
  readonly geocodedAt: Date;

  /** Source of geocoding (for audit) */
  readonly geocodingSource: 'GOOGLE_PLACES' | 'MANUAL_ENTRY' | 'ADMIN_IMPORT';

  /** Optional: Place ID from Google Places for reference */
  readonly placeId?: string;
}

/**
 * Geocoding request schema (for API validation)
 */
export const GeocodeRequestSchema = z.object({
  address: z.string().min(5, 'Address must be at least 5 characters').max(500, 'Address too long'),
  placeId: z.string().optional(),
  validateIsraelBounds: z.boolean().optional().default(true),
});

export type GeocodeRequest = z.infer<typeof GeocodeRequestSchema>;

/**
 * Geocoding response schema
 */
export const GeocodeResponseSchema = z.object({
  address: z.string(),
  coordinates: CoordinateSchema,
  placeId: z.string().optional(),
  formattedAddress: z.string(),
  withinIsrael: z.boolean(),
});

export type GeocodeResponse = z.infer<typeof GeocodeResponseSchema>;

/**
 * User location data (extends base user type)
 */
export interface UserLocationData extends LocationData {
  /** User ID for audit trail */
  readonly userId: string;
}

/**
 * Vet clinic location data (extends base vet type)
 */
export interface VetLocationData extends LocationData {
  /** Vet clinic ID for audit trail */
  readonly vetId: string;
}

/**
 * Service location data (for map display)
 */
export interface ServiceLocationData extends LocationData {
  /** Service ID */
  readonly serviceId: string;

  /** Service name */
  readonly serviceName: string;

  /** Service type/category */
  readonly serviceType: string;
}

/**
 * Coordinate change audit log entry
 */
export interface CoordinateChangeLog {
  /** Entity ID (user, vet, service, etc.) */
  readonly entityId: string;

  /** Entity type */
  readonly entityType: 'USER' | 'VET' | 'SERVICE';

  /** Old coordinates (if updating) */
  readonly oldCoordinates?: Coordinates;

  /** New coordinates */
  readonly newCoordinates: Coordinates;

  /** Old address */
  readonly oldAddress?: string;

  /** New address */
  readonly newAddress: string;

  /** Who made the change */
  readonly changedBy: string;

  /** Why the change was made */
  readonly changeReason: string;

  /** When the change occurred */
  readonly changedAt: Date;

  /** IP address of requester */
  readonly ipAddress?: string;

  /** User agent */
  readonly userAgent?: string;
}
