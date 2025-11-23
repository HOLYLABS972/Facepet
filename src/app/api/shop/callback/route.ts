import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { markCouponAsUsed } from '@/lib/firebase/user-coupons';

// Validation schema for shop callback
const shopCallbackSchema = z.object({
  userid: z.string().min(1, 'User ID is required'),
  coupon: z.string().min(1, 'Coupon code is required'), // Coupon code is required
  status: z.enum(['success', 'failed', 'pending']).optional(),
  orderId: z.string().optional(),
  message: z.string().optional(),
  token: z.string().optional(), // Unique callback token for tracking
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
    };

    // Validate required fields
    if (!callbackData.userid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'User ID is required' 
        },
        { 
          status: 400,
          headers: corsHeaders
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
      timestamp: new Date().toISOString(),
      fullData: callbackData
    });

    // Validate coupon code is provided
    if (!callbackData.coupon) {
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
    if (callbackData.token) {
      const processedCheck = await checkIfTokenProcessed(callbackData.token);
      if (processedCheck) {
        console.log('Callback token already processed:', callbackData.token);
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
      callbackData.userid!,
      callbackData.coupon,
      callbackData.token || undefined,
      {
        status: callbackData.status || undefined,
        orderId: callbackData.orderId || undefined,
        message: callbackData.message || undefined
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
    console.error('Shop callback error (GET):', error);
    
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

