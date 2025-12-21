import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { markCouponAsUsed } from '@/lib/firebase/user-coupons';
import { addPointsToUserByUid } from '@/lib/firebase/points-server';

// Validation schema for shop callback
const shopCallbackSchema = z.object({
  userid: z.string().min(1, 'User ID is required'),
  coupon: z.string().optional(), // Coupon code is optional now
  status: z.enum(['success', 'failed', 'pending']).optional(),
  orderId: z.string().optional(),
  message: z.string().optional(),
  token: z.string().optional(), // Unique callback token for tracking
  points: z.number().optional(), // Optional points to credit (defaults to 20)
  // Allow additional fields from the shop
}).passthrough();

// CORS headers for external shop requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, replace with specific shop domain(s)
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Check if a callback token has already been processed (idempotency)
 */
async function checkIfTokenProcessed(token: string): Promise<boolean> {
  try {
    // Check if there's a userCoupon with this token in metadata
    const userCouponsRef = collection(db, 'userCoupons');
    const q = query(
      userCouponsRef,
      where('metadata.callbackToken', '==', token),
      where('status', '==', 'used')
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking callback token:', error);
    return false;
  }
}

/**
 * Mark coupon as used by coupon code and user ID
 */
async function markCouponAsUsedByCode(
  userId: string,
  couponCode: string,
  callbackToken?: string,
  metadata?: {
    status?: string;
    orderId?: string;
    message?: string;
  }
): Promise<{ success: boolean; error?: string; userCouponId?: string }> {
  try {
    // Find the user's active coupon with this code
    const userCouponsRef = collection(db, 'userCoupons');
    const q = query(
      userCouponsRef,
      where('userId', '==', userId),
      where('couponCode', '==', couponCode),
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Active coupon not found for this code' };
    }

    // Get the first matching coupon
    const userCouponDoc = querySnapshot.docs[0];
    const userCouponId = userCouponDoc.id;

    // Mark as used with metadata
    const couponMetadata = {
      callbackToken,
      source: 'shop_callback',
      ...metadata
    };
    
    const result = await markCouponAsUsed(userCouponId, couponMetadata);

    return { success: true, userCouponId };
  } catch (error: any) {
    console.error('Error marking coupon as used by code:', error);
    return { success: false, error: 'Failed to mark coupon as used' };
  }
}

/**
 * POST endpoint to receive callback from shop
 * The shop will call this endpoint after processing the coupon/user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = shopCallbackSchema.parse(body);
    
    // Extract token from query params if not in body (for unique callbacks)
    const { searchParams } = new URL(request.url);
    const token = validatedData.token || searchParams.get('token');
    
    // Log the callback for debugging
    console.log('Shop callback received:', {
      userid: validatedData.userid,
      coupon: validatedData.coupon,
      status: validatedData.status,
      orderId: validatedData.orderId,
      token: token,
      timestamp: new Date().toISOString(),
      fullData: validatedData
    });

    // Validate coupon code is provided
    if (!validatedData.coupon) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Coupon code is required' 
        },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    // Check if this callback token has already been processed (idempotency)
    if (token) {
      const processedCheck = await checkIfTokenProcessed(token);
      if (processedCheck) {
        console.log('Callback token already processed:', token);
        return NextResponse.json(
          { 
            success: true, 
            message: 'Callback already processed',
            couponMarkedAsUsed: false,
            receivedAt: new Date().toISOString()
          },
          { 
            status: 200,
            headers: corsHeaders
          }
        );
      }
    }

    // Mark coupon as used and move to history
    const couponResult = await markCouponAsUsedByCode(
      validatedData.userid,
      validatedData.coupon,
      token,
      {
        status: validatedData.status,
        orderId: validatedData.orderId,
        message: validatedData.message
      }
    );

    if (!couponResult.success) {
      console.error('Failed to mark coupon as used:', couponResult.error);
      return NextResponse.json(
        { 
          success: false, 
          message: couponResult.error || 'Failed to process coupon',
          receivedAt: new Date().toISOString()
        },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Coupon marked as used successfully',
        couponMarkedAsUsed: true,
        userCouponId: couponResult.userCouponId,
        receivedAt: new Date().toISOString()
      },
      { 
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error('Shop callback error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error',
          errors: error.errors 
        },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

/**
 * GET endpoint to receive callback from shop (if shop prefers GET)
 * Some shops may use GET requests with query parameters
 * Returns an HTML page for user-facing redirects
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract parameters from query string
    const callbackData = {
      userid: searchParams.get('userid'),
      coupon: searchParams.get('coupon'),
      status: searchParams.get('status'),
      orderId: searchParams.get('orderId'),
      message: searchParams.get('message'),
      token: searchParams.get('token'), // Unique callback token
      points: searchParams.get('points') ? parseInt(searchParams.get('points')!) : 20, // Default 20 points
    };

    // Validate required fields
    if (!callbackData.userid) {
      return new NextResponse(
        generateErrorPage('User ID is required'),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    // Log the callback for debugging
    console.log('Shop callback received (GET):', {
      userid: callbackData.userid,
      coupon: callbackData.coupon,
      status: callbackData.status,
      orderId: callbackData.orderId,
      token: callbackData.token,
      points: callbackData.points,
      timestamp: new Date().toISOString(),
      fullData: callbackData
    });

    // Check if this callback token has already been processed (idempotency)
    // Use userid as token if no token provided
    const trackingToken = callbackData.token || `shop_visit_${callbackData.userid}`;
    const processedCheck = await checkIfTokenProcessed(trackingToken);
    if (processedCheck) {
      console.log('Callback token already processed:', trackingToken);
      return new NextResponse(
        generateSuccessPage('הנקודות כבר נזקפו בעבר!', 'Points already credited!'),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    // Credit points to user (default 20 points for shop visit)
    const pointsResult = await addPointsToUserByUid(
      callbackData.userid,
      'share', // Using 'share' category for shop visits
      callbackData.points,
      `Shop visit reward - ${callbackData.points} points`,
      {
        source: 'shop_callback',
        orderId: callbackData.orderId,
        coupon: callbackData.coupon,
        status: callbackData.status,
        token: trackingToken,
        timestamp: new Date().toISOString()
      }
    );

    if (!pointsResult.success) {
      console.error('Failed to credit points:', pointsResult.error);
      return new NextResponse(
        generateErrorPage(pointsResult.error || 'Failed to credit points'),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
        }
      );
    }

    // If coupon code is provided, also mark it as used
    if (callbackData.coupon) {
      const couponResult = await markCouponAsUsedByCode(
        callbackData.userid!,
        callbackData.coupon,
        trackingToken,
        {
          status: callbackData.status || undefined,
          orderId: callbackData.orderId || undefined,
          message: callbackData.message || undefined
        }
      );
      
      if (!couponResult.success) {
        console.warn('Failed to mark coupon as used (points already credited):', couponResult.error);
      }
    }

    return new NextResponse(
      generateSuccessPage(
        `${callbackData.points} נקודות נזקפו בהצלחה! 🎉`, 
        `Successfully credited ${callbackData.points} points! 🎉`
      ),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  } catch (error) {
    console.error('Shop callback error (GET):', error);
    
    return new NextResponse(
      generateErrorPage('Internal server error'),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

/**
 * Generate a success HTML page with auto-redirect
 */
function generateSuccessPage(hebrewMessage: string, englishMessage: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>הצלחה - Facepet</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: slideUp 0.5s ease-out;
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .success-icon {
      font-size: 80px;
      margin-bottom: 20px;
      animation: bounce 1s ease infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    h1 {
      font-size: 32px;
      color: #2d3748;
      margin-bottom: 10px;
      font-weight: bold;
    }
    p {
      font-size: 18px;
      color: #718096;
      margin-bottom: 30px;
    }
    .redirect-text {
      font-size: 14px;
      color: #a0aec0;
    }
    .logo {
      width: 120px;
      height: auto;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✅</div>
    <h1>${hebrewMessage}</h1>
    <p>${englishMessage}</p>
    <p class="redirect-text">מיד תועברו חזרה לאפליקציה...</p>
    <p class="redirect-text">Redirecting back to the app...</p>
  </div>
  <script>
    // Redirect after 3 seconds
    setTimeout(() => {
      window.location.href = 'https://facepet.club/he/coupons';
    }, 3000);
  </script>
</body>
</html>`;
}

/**
 * Generate an error HTML page
 */
function generateErrorPage(errorMessage: string): string {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>שגיאה - Facepet</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .error-icon {
      font-size: 80px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 32px;
      color: #2d3748;
      margin-bottom: 10px;
      font-weight: bold;
    }
    p {
      font-size: 18px;
      color: #718096;
      margin-bottom: 30px;
    }
    .error-message {
      font-size: 14px;
      color: #e53e3e;
      background: #fed7d7;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
    .redirect-text {
      font-size: 14px;
      color: #a0aec0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">❌</div>
    <h1>אופס! משהו השתבש</h1>
    <p>Oops! Something went wrong</p>
    <div class="error-message">${errorMessage}</div>
    <p class="redirect-text">מיד תועברו חזרה לאפליקציה...</p>
    <p class="redirect-text">Redirecting back to the app...</p>
  </div>
  <script>
    // Redirect after 5 seconds
    setTimeout(() => {
      window.location.href = 'https://facepet.club/he/coupons';
    }, 5000);
  </script>
</body>
</html>`;
}

