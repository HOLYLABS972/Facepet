/**
 * Generate a unique token for callback URLs
 * @returns A unique token string
 */
export function generateCallbackToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}`;
}

/**
 * Generate a shop URL with userid, coupon, and callback parameters
 * This URL will be used to redirect to the shop's website where cookies will be set
 * 
 * @param shopUrl - The base URL of the shop website
 * @param userId - The user ID from your system
 * @param coupon - The coupon code or ID
 * @param callbackUrl - Optional callback URL (defaults to your app's callback endpoint)
 * @param uniqueCallback - If true, generates a unique callback URL with a token (default: false)
 * @returns The complete URL with all parameters
 */
export function generateShopUrl(
  shopUrl: string,
  userId: string,
  coupon: string,
  callbackUrl?: string,
  uniqueCallback: boolean = false
): string {
  // Use tag.chapiz.co.il as the base URL for callbacks
  const baseUrl = 'https://tag.chapiz.co.il';

  // Generate unique callback URL if requested
  let finalCallbackUrl: string;
  if (callbackUrl) {
    finalCallbackUrl = callbackUrl;
  } else if (uniqueCallback) {
    const token = generateCallbackToken();
    finalCallbackUrl = `${baseUrl}/?token=${token}`;
  } else {
    finalCallbackUrl = `${baseUrl}/`;
  }

  // Ensure shopUrl doesn't end with a slash
  const cleanShopUrl = shopUrl.replace(/\/$/, '');

  // Create URL with parameters
  const url = new URL(cleanShopUrl);
  url.searchParams.set('userid', userId);
  url.searchParams.set('coupon', coupon);
  url.searchParams.set('callback', finalCallbackUrl);

  return url.toString();
}

/**
 * Generate a shop URL with additional custom parameters
 * 
 * @param shopUrl - The base URL of the shop website
 * @param params - Object containing userid, coupon, and optional callback and other params
 * @param uniqueCallback - If true, generates a unique callback URL with a token (default: false)
 * @returns The complete URL with all parameters
 */
export function generateShopUrlWithParams(
  shopUrl: string,
  params: {
    userid: string;
    coupon: string;
    callback?: string;
    [key: string]: string | undefined;
  },
  uniqueCallback: boolean = false
): string {
  // Use tag.chapiz.co.il as the base URL for callbacks
  const baseUrl = 'https://tag.chapiz.co.il';

  // Ensure shopUrl doesn't end with a slash
  const cleanShopUrl = shopUrl.replace(/\/$/, '');

  // Create URL with parameters
  const url = new URL(cleanShopUrl);
  
  // Set required parameters
  url.searchParams.set('userid', params.userid);
  url.searchParams.set('coupon', params.coupon);
  
  // Set callback URL (default if not provided)
  if (params.callback) {
    url.searchParams.set('callback', params.callback);
  } else if (uniqueCallback) {
    const token = generateCallbackToken();
    url.searchParams.set('callback', `${baseUrl}/?token=${token}`);
  } else {
    url.searchParams.set('callback', `${baseUrl}/`);
  }

  // Add any additional custom parameters
  Object.keys(params).forEach(key => {
    if (key !== 'userid' && key !== 'coupon' && key !== 'callback' && params[key]) {
      url.searchParams.set(key, params[key]!);
    }
  });

  return url.toString();
}

/**
 * Generate a shop URL with a unique callback token
 * Each call generates a new unique callback URL for tracking individual requests
 * 
 * @param shopUrl - The base URL of the shop website
 * @param userId - The user ID from your system
 * @param coupon - The coupon code or ID
 * @param customToken - Optional custom token (if not provided, one will be generated)
 * @returns Object containing the shop URL and the callback token
 */
export function generateShopUrlWithUniqueCallback(
  shopUrl: string,
  userId: string,
  coupon: string,
  customToken?: string
): { shopUrl: string; callbackToken: string; callbackUrl: string } {
  // Use tag.chapiz.co.il as the base URL for callbacks
  const baseUrl = 'https://tag.chapiz.co.il';

  const token = customToken || generateCallbackToken();
  const callbackUrl = `${baseUrl}/?token=${token}`;
  const shopUrlWithParams = generateShopUrl(shopUrl, userId, coupon, callbackUrl, false);

  return {
    shopUrl: shopUrlWithParams,
    callbackToken: token,
    callbackUrl
  };
}

