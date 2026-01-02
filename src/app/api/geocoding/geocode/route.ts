/**
 * Server-Side Geocoding API Endpoint
 *
 * This endpoint geocodes addresses to coordinates ONCE during registration.
 * All geocoding happens server-side to:
 * 1. Protect API keys
 * 2. Enable rate limiting
 * 3. Validate and sanitize coordinates
 * 4. Maintain audit trail
 *
 * Usage: Called during user/vet registration, NOT during map display
 */

import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@googlemaps/google-maps-services-js';
import { z } from 'zod';
import {
  GeocodeRequestSchema,
  GeocodeResponseSchema,
  type GeocodeResponse,
} from '@/types/coordinates';
import { validateAndSanitize, isWithinIsrael } from '@/lib/utils/coordinate-validation';

// Initialize Google Maps client
const googleMapsClient = new Client({});

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Rate limit configuration
const RATE_LIMIT = {
  MAX_REQUESTS: 10, // Max requests per window
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS_PER_DAY: 100, // Daily limit per IP
};

/**
 * Cleans up expired rate limit entries
 */
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Checks rate limit for an identifier (IP address or user ID)
 *
 * @param identifier - IP address or user ID
 * @returns true if rate limit exceeded
 */
function isRateLimited(identifier: string): boolean {
  cleanupRateLimitMap();

  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT.WINDOW_MS,
    });
    return false;
  }

  if (now > entry.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT.WINDOW_MS,
    });
    return false;
  }

  if (entry.count >= RATE_LIMIT.MAX_REQUESTS) {
    return true;
  }

  entry.count += 1;
  return false;
}

/**
 * Gets client identifier for rate limiting
 *
 * @param request - Next.js request object
 * @returns Client identifier (IP address)
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (handle proxies)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to request IP (may be proxy in production)
  return request.ip || 'unknown';
}

/**
 * POST /api/geocoding/geocode
 *
 * Geocodes an address to coordinates with validation
 *
 * Request body:
 * {
 *   address: string,
 *   placeId?: string,
 *   validateIsraelBounds?: boolean
 * }
 *
 * Response:
 * {
 *   address: string,
 *   coordinates: { lat: number, lng: number },
 *   formattedAddress: string,
 *   placeId?: string,
 *   withinIsrael: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientId = getClientIdentifier(request);
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many geocoding requests. Please try again later.',
          retryAfter: RATE_LIMIT.WINDOW_MS / 1000,
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = GeocodeRequestSchema.parse(body);

    // Check for Google Maps API key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return NextResponse.json(
        { error: 'Geocoding service unavailable' },
        { status: 503 }
      );
    }

    // Geocode using Google Places API
    let geocodingResult;

    if (validatedRequest.placeId) {
      // Use Place ID for more accurate results
      const response = await googleMapsClient.geocode({
        params: {
          place_id: validatedRequest.placeId,
          key: apiKey,
        },
      });

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        return NextResponse.json(
          {
            error: 'Geocoding failed',
            message: 'Could not geocode the provided place ID',
            status: response.data.status,
          },
          { status: 400 }
        );
      }

      geocodingResult = response.data.results[0];
    } else {
      // Use address string
      const response = await googleMapsClient.geocode({
        params: {
          address: validatedRequest.address,
          key: apiKey,
          region: 'il', // Bias results to Israel
        },
      });

      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        return NextResponse.json(
          {
            error: 'Geocoding failed',
            message: 'Could not geocode the provided address',
            status: response.data.status,
          },
          { status: 400 }
        );
      }

      geocodingResult = response.data.results[0];
    }

    // Extract coordinates
    const rawLat = geocodingResult.geometry.location.lat;
    const rawLng = geocodingResult.geometry.location.lng;

    // Validate and sanitize coordinates
    const coordinates = validateAndSanitize(
      rawLat,
      rawLng,
      validatedRequest.validateIsraelBounds
    );

    // Check if within Israel
    const withinIsrael = isWithinIsrael(coordinates);

    // Warn if Israel bounds validation was requested but coordinates are outside
    if (validatedRequest.validateIsraelBounds && !withinIsrael) {
      return NextResponse.json(
        {
          error: 'Location validation failed',
          message: 'The provided address is outside Israel',
          coordinates,
          formattedAddress: geocodingResult.formatted_address,
        },
        { status: 400 }
      );
    }

    // Build response
    const response: GeocodeResponse = {
      address: validatedRequest.address,
      coordinates,
      formattedAddress: geocodingResult.formatted_address,
      placeId: geocodingResult.place_id,
      withinIsrael,
    };

    // Validate response schema
    const validatedResponse = GeocodeResponseSchema.parse(response);

    // Log successful geocoding (for audit)
    console.log('Geocoding successful:', {
      address: validatedRequest.address,
      coordinates,
      clientId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(validatedResponse, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=86400', // Cache for 24 hours
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Geocoding error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          message: error.errors[0]?.message || 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle coordinate validation errors
    if (error instanceof Error && error.message.includes('coordinates')) {
      return NextResponse.json(
        {
          error: 'Invalid coordinates',
          message: error.message,
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred during geocoding',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/geocoding/geocode
 *
 * Not supported - geocoding requires POST for security
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Geocoding requires POST request with address data',
    },
    {
      status: 405,
      headers: {
        Allow: 'POST',
      },
    }
  );
}
