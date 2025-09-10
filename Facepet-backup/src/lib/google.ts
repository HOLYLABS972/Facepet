'use server';

import { Client, Language } from '@googlemaps/google-maps-services-js';

const client = new Client();
export const autocomplete = async (input: string, language?: Language) => {
  if (!input) return [];

  try {
    const response = await client.placeAutocomplete({
      params: {
        input,
        language,
        key: process.env.GOOGLE_API_KEY!
      }
    });

    return response.data.predictions;
  } catch (error) {
    console.error(error);
  }
};

/**
 * Address formatting that fetches from Google Places API
 */
export const getPlaceFormattedAddress = async (
  place_id: string,
  language?: Language
): Promise<string> => {
  try {
    // Fetch directly from API
    const response = await client.placeDetails({
      params: {
        place_id,
        language: language || ('en' as Language),
        key: process.env.GOOGLE_API_KEY!
      }
    });

    if (
      response.data &&
      response.data.result &&
      response.data.result.formatted_address
    ) {
      return response.data.result.formatted_address;
    }

    return place_id; // Return original as fallback
  } catch (error) {
    console.error('Error in getPlaceFormattedAddress:', error);
    return place_id;
  }
};
