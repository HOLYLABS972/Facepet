import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { generateShopUrl, generateShopUrlWithParams, generateShopUrlWithUniqueCallback } from '@/lib/utils/shop-url';

/**
 * Hook to generate shop redirect URLs with userid, coupon, and callback parameters
 * 
 * @example
 * const { redirectToShop } = useShopRedirect();
 * 
 * // Simple usage
 * redirectToShop('https://shop.example.com', 'COUPON123');
 * 
 * // With custom callback
 * redirectToShop('https://shop.example.com', 'COUPON123', 'https://myapp.com/custom-callback');
 */
export function useShopRedirect() {
  const { user } = useAuth();

  /**
   * Generate and redirect to shop URL with parameters
   * 
   * @param shopUrl - The base URL of the shop website
   * @param coupon - The coupon code or ID
   * @param callbackUrl - Optional custom callback URL
   * @param uniqueCallback - If true, generates a unique callback URL with a token (default: false)
   */
  const redirectToShop = useCallback(
    (shopUrl: string, coupon: string, callbackUrl?: string, uniqueCallback: boolean = false) => {
      if (!user?.uid) {
        console.error('User must be authenticated to redirect to shop');
        return;
      }

      const url = generateShopUrl(shopUrl, user.uid, coupon, callbackUrl, uniqueCallback);
      window.location.href = url;
    },
    [user]
  );

  /**
   * Generate shop URL without redirecting (useful for links)
   * 
   * @param shopUrl - The base URL of the shop website
   * @param coupon - The coupon code or ID
   * @param callbackUrl - Optional custom callback URL
   * @param uniqueCallback - If true, generates a unique callback URL with a token (default: false)
   * @returns The generated URL string
   */
  const getShopUrl = useCallback(
    (shopUrl: string, coupon: string, callbackUrl?: string, uniqueCallback: boolean = false): string | null => {
      if (!user?.uid) {
        console.error('User must be authenticated to generate shop URL');
        return null;
      }

      return generateShopUrl(shopUrl, user.uid, coupon, callbackUrl, uniqueCallback);
    },
    [user]
  );

  /**
   * Generate shop URL with additional custom parameters
   * 
   * @param shopUrl - The base URL of the shop website
   * @param params - Object containing coupon and optional callback and other params
   * @param uniqueCallback - If true, generates a unique callback URL with a token (default: false)
   * @returns The generated URL string
   */
  const getShopUrlWithParams = useCallback(
    (
      shopUrl: string,
      params: {
        coupon: string;
        callback?: string;
        [key: string]: string | undefined;
      },
      uniqueCallback: boolean = false
    ): string | null => {
      if (!user?.uid) {
        console.error('User must be authenticated to generate shop URL');
        return null;
      }

      return generateShopUrlWithParams(shopUrl, {
        ...params,
        userid: user.uid,
      }, uniqueCallback);
    },
    [user]
  );

  /**
   * Generate shop URL with a unique callback token
   * Each call generates a new unique callback URL for tracking individual requests
   * 
   * @param shopUrl - The base URL of the shop website
   * @param coupon - The coupon code or ID
   * @param customToken - Optional custom token (if not provided, one will be generated)
   * @returns Object containing the shop URL, callback token, and callback URL
   */
  const getShopUrlWithUniqueCallback = useCallback(
    (
      shopUrl: string,
      coupon: string,
      customToken?: string
    ): { shopUrl: string; callbackToken: string; callbackUrl: string } | null => {
      if (!user?.uid) {
        console.error('User must be authenticated to generate shop URL');
        return null;
      }

      return generateShopUrlWithUniqueCallback(shopUrl, user.uid, coupon, customToken);
    },
    [user]
  );

  return {
    redirectToShop,
    getShopUrl,
    getShopUrlWithParams,
    getShopUrlWithUniqueCallback,
    isAuthenticated: !!user?.uid,
  };
}

