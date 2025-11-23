# Shop Callback - Coupon Deactivation Example

## Overview
When a user uses a coupon at the shop website, the shop will call your callback endpoint, which automatically **marks the coupon as used** and moves it to the user's coupon history.

## How It Works

### 1. Generate Shop URL with Unique Callback

```typescript
import { useShopRedirect } from '@/hooks/use-shop-redirect';

function MyComponent() {
  const { getShopUrlWithUniqueCallback } = useShopRedirect();

  const handleShopRedirect = () => {
    // Generate URL with unique callback
    const result = getShopUrlWithUniqueCallback(
      'https://shop.example.com',  // Shop URL
      'COUPON123'                   // Coupon code
    );

    if (result) {
      console.log('Shop URL:', result.shopUrl);
      console.log('Callback Token:', result.callbackToken);
      console.log('Callback URL:', result.callbackUrl);
      
      // Redirect user to shop
      window.location.href = result.shopUrl;
    }
  };

  return <button onClick={handleShopRedirect}>Go to Shop</button>;
}
```

### 2. Generated URL Format

The generated URL will look like:
```
https://shop.example.com?userid=USER123&coupon=COUPON123&callback=https://yourapp.com/api/shop/callback?token=1234567890_abc123
```

### 3. Shop Processes Request

The shop website will:
- Read the `userid` and `coupon` parameters
- Set cookies based on these parameters
- Process the purchase/action
- Call your callback URL

### 4. Callback Marks Coupon as Used

When the shop calls your callback endpoint:

**POST Request:**
```bash
POST https://yourapp.com/api/shop/callback?token=1234567890_abc123
Content-Type: application/json

{
  "userid": "USER123",
  "coupon": "COUPON_CODE_123",  // Required: The coupon code (from description field)
  "status": "success",
  "orderId": "ORDER456"
}
```

**GET Request (alternative):**
```bash
GET https://yourapp.com/api/shop/callback?token=1234567890_abc123&userid=USER123&coupon=COUPON_CODE_123&status=success&orderId=ORDER456
```

**Note:** The `coupon` parameter must match the coupon code (description field) that the user purchased.

### 5. Response

The callback endpoint will:
- ✅ Validate the request (userid and coupon code required)
- ✅ Check if token was already processed (idempotency)
- ✅ Find the user's active coupon with the provided code
- ✅ Mark the coupon as **used**
- ✅ Move the coupon to **history**
- ✅ Return success response

**Response:**
```json
{
  "success": true,
  "message": "Coupon marked as used successfully",
  "couponMarkedAsUsed": true,
  "userCouponId": "coupon123",
  "receivedAt": "2024-01-15T10:30:00.000Z"
}
```

## Features

### ✅ Idempotency
- Each callback token can only be processed once
- Prevents duplicate coupon deactivations if shop retries the callback

### ✅ Coupon Management
- Automatically finds the user's active coupon by code
- Marks coupon as used and moves to history
- Stores callback metadata for tracking

### ✅ Error Handling
- Validates that coupon code and user ID are provided
- Returns clear error messages if coupon not found
- Errors are logged for debugging

## Example Usage in UserCouponsPage

When a user clicks "Go to Store" button with a purchased coupon:

```typescript
const handleGoToStore = (couponCode: string) => {
  // Copy the code first
  handleCopyCode(couponCode);
  // Then redirect to shop with the coupon code
  const shopUrl = 'https://shop.example.com';
  redirectToShop(shopUrl, couponCode, undefined, true);
};
```

The shop will:
1. Process the coupon code
2. Call your callback: `POST /api/shop/callback?token=xxx` with `{ userid, coupon: "CODE" }`
3. Your callback marks the coupon as used and moves it to history

## Testing

You can test the callback manually:

```bash
# Test POST callback (mark coupon as used)
curl -X POST https://yourapp.com/api/shop/callback?token=test123 \
  -H "Content-Type: application/json" \
  -d '{
    "userid": "YOUR_USER_ID",
    "coupon": "COUPON_CODE_FROM_DESCRIPTION",
    "status": "success",
    "orderId": "ORDER123"
  }'

# Test GET callback
curl "https://yourapp.com/api/shop/callback?token=test123&userid=YOUR_USER_ID&coupon=COUPON_CODE_FROM_DESCRIPTION&status=success"
```

**Important:** The `coupon` parameter must match the exact coupon code (description field) that the user purchased.

