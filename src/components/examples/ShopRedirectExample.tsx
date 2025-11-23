'use client';

import { useState } from 'react';
import { useShopRedirect } from '@/hooks/use-shop-redirect';
import { Button } from '@/components/ui/button';

/**
 * Example component showing how to use the shop redirect with unique callbacks
 */
export default function ShopRedirectExample() {
  const { redirectToShop, getShopUrlWithUniqueCallback, isAuthenticated } = useShopRedirect();
  const [shopUrl, setShopUrl] = useState('https://shop.example.com');
  const [coupon, setCoupon] = useState('COUPON123');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [callbackInfo, setCallbackInfo] = useState<{
    shopUrl: string;
    callbackToken: string;
    callbackUrl: string;
  } | null>(null);

  // Example 1: Simple redirect with unique callback
  const handleSimpleRedirect = () => {
    if (!isAuthenticated) {
      alert('Please log in first');
      return;
    }
    // This will redirect immediately with a unique callback URL
    redirectToShop(shopUrl, coupon, undefined, true);
  };

  // Example 2: Generate URL with unique callback (for links or buttons)
  const handleGenerateUniqueUrl = () => {
    if (!isAuthenticated) {
      alert('Please log in first');
      return;
    }

    const result = getShopUrlWithUniqueCallback(shopUrl, coupon);
    if (result) {
      setCallbackInfo(result);
      setGeneratedUrl(result.shopUrl);
      console.log('Generated callback info:', result);
    }
  };

  // Example 3: Copy callback URL to clipboard
  const handleCopyCallbackUrl = () => {
    if (callbackInfo) {
      navigator.clipboard.writeText(callbackInfo.callbackUrl);
      alert('Callback URL copied to clipboard!');
    }
  };

  // Example 4: Copy full shop URL to clipboard
  const handleCopyShopUrl = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      alert('Shop URL copied to clipboard!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 border rounded-lg bg-yellow-50">
        <p className="text-sm text-yellow-800">
          Please log in to use shop redirect functionality
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold">Shop Redirect Example</h2>

      {/* Input Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Shop URL</label>
          <input
            type="text"
            value={shopUrl}
            onChange={(e) => setShopUrl(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="https://shop.example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Coupon Code</label>
          <input
            type="text"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="COUPON123"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div>
          <h3 className="font-semibold mb-2">Example 1: Direct Redirect</h3>
          <p className="text-sm text-gray-600 mb-2">
            Redirects immediately to shop with unique callback URL
          </p>
          <Button onClick={handleSimpleRedirect} className="w-full">
            Redirect to Shop (with unique callback)
          </Button>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Example 2: Generate URL</h3>
          <p className="text-sm text-gray-600 mb-2">
            Generates shop URL with unique callback (doesn't redirect)
          </p>
          <Button onClick={handleGenerateUniqueUrl} variant="outline" className="w-full">
            Generate Shop URL with Unique Callback
          </Button>
        </div>
      </div>

      {/* Generated URL Display */}
      {generatedUrl && (
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <div>
            <h3 className="font-semibold mb-2">Generated Shop URL:</h3>
            <div className="flex gap-2">
              <code className="flex-1 p-2 bg-white border rounded text-sm break-all">
                {generatedUrl}
              </code>
              <Button onClick={handleCopyShopUrl} size="sm" variant="outline">
                Copy
              </Button>
            </div>
          </div>

          {callbackInfo && (
            <div className="space-y-2">
              <div>
                <h4 className="font-semibold text-sm mb-1">Callback Token:</h4>
                <code className="p-2 bg-white border rounded text-sm block">
                  {callbackInfo.callbackToken}
                </code>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Callback URL:</h4>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-white border rounded text-sm break-all">
                    {callbackInfo.callbackUrl}
                  </code>
                  <Button onClick={handleCopyCallbackUrl} size="sm" variant="outline">
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Link to test */}
          <div className="pt-2 border-t">
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Open shop URL in new tab →
            </a>
          </div>
        </div>
      )}

      {/* How it works explanation */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How it works:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
          <li>Generate a shop URL with unique callback token</li>
          <li>User clicks/redirects to shop URL: <code className="bg-white px-1 rounded">shop.com?userid=xxx&coupon=xxx&callback=https://yourapp.com/api/shop/callback?token=unique123</code></li>
          <li>Shop sets cookies based on userid and coupon parameters</li>
          <li>Shop processes the request and calls your callback: <code className="bg-white px-1 rounded">POST/GET /api/shop/callback?token=unique123</code></li>
          <li>Your callback endpoint receives the data with the unique token for tracking</li>
        </ol>
      </div>
    </div>
  );
}

