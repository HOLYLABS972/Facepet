/**
 * Client-Side Geocoding Helper
 *
 * Provides functions to call the secure server-side geocoding API.
 * Used ONLY during registration, never during map display.
 */

import type { GeocodeRequest, GeocodeResponse, Coordinates } from '@/types/coordinates';

/**
 * Error class for geocoding failures
 */
export class GeocodingError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'GeocodingError';
  }
}

/**
 * Geocodes an address to coordinates using the server-side API
 *
 * @param address - Address to geocode
 * @param options - Optional geocoding options
 * @returns Geocoding result with coordinates
 * @throws GeocodingError if geocoding fails
 */
export async function geocodeAddress(
  address: string,
  options?: {
    placeId?: string;
    validateIsraelBounds?: boolean;
  }
): Promise<GeocodeResponse> {
  try {
    const requestBody: GeocodeRequest = {
      address,
      placeId: options?.placeId,
      validateIsraelBounds: options?.validateIsraelBounds ?? true,
    };

    const response = await fetch('/api/geocoding/geocode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new GeocodingError(
        data.message || 'Geocoding failed',
        response.status,
        data
      );
    }

    return data as GeocodeResponse;
  } catch (error) {
    if (error instanceof GeocodingError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new GeocodingError('Network error during geocoding', undefined, error);
    }

    throw new GeocodingError('Unknown error during geocoding');
  }
}

/**
 * Geocodes an address and returns only the coordinates
 *
 * @param address - Address to geocode
 * @param validateIsraelBounds - Whether to validate Israel bounds
 * @returns Coordinates object
 * @throws GeocodingError if geocoding fails
 */
export async function geocodeAddressToCoordinates(
  address: string,
  validateIsraelBounds: boolean = true
): Promise<Coordinates> {
  const result = await geocodeAddress(address, { validateIsraelBounds });
  return result.coordinates;
}

/**
 * Geocodes a Google Place ID to coordinates
 *
 * @param placeId - Google Place ID
 * @param validateIsraelBounds - Whether to validate Israel bounds
 * @returns Geocoding result with coordinates
 * @throws GeocodingError if geocoding fails
 */
export async function geocodePlaceId(
  placeId: string,
  validateIsraelBounds: boolean = true
): Promise<GeocodeResponse> {
  return geocodeAddress('', { placeId, validateIsraelBounds });
}

/**
 * Validates if an address can be geocoded (dry-run check)
 *
 * @param address - Address to validate
 * @returns true if address can be geocoded
 */
export async function canGeocodeAddress(address: string): Promise<boolean> {
  try {
    await geocodeAddress(address, { validateIsraelBounds: false });
    return true;
  } catch {
    return false;
  }
}

/**
 * Geocodes an address with retry logic
 *
 * @param address - Address to geocode
 * @param maxRetries - Maximum number of retries (default 3)
 * @param validateIsraelBounds - Whether to validate Israel bounds
 * @returns Geocoding result
 * @throws GeocodingError if all retries fail
 */
export async function geocodeAddressWithRetry(
  address: string,
  maxRetries: number = 3,
  validateIsraelBounds: boolean = true
): Promise<GeocodeResponse> {
  let lastError: GeocodingError | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await geocodeAddress(address, { validateIsraelBounds });
    } catch (error) {
      lastError = error instanceof GeocodingError ? error : new GeocodingError(String(error));

      // Don't retry on client errors (4xx)
      if (lastError.statusCode && lastError.statusCode >= 400 && lastError.statusCode < 500) {
        throw lastError;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new GeocodingError('Geocoding failed after retries');
}
