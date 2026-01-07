'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, Code, Bookmark, Download, Terminal, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InstallAutomationTools() {
  const [copied, setCopied] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.origin);
    }
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  // Bookmarklet script
  const bookmarkletScript = `javascript:(function(){if(window.matchMedia('(display-mode: standalone)').matches||(window.navigator).standalone===true){alert('App is already installed!');return;}const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);const isAndroid=/Android/i.test(navigator.userAgent);if(isIOS){alert('iOS: Tap Share button, then "Add to Home Screen"');}else if(isAndroid){if(window.deferredPrompt){window.deferredPrompt.prompt();window.deferredPrompt.userChoice.then((choice)=>{if(choice.outcome==='accepted'){alert('App installed successfully!');}window.deferredPrompt=null;});}else{alert('Android: Use browser menu to "Add to Home Screen" or "Install App"');}}else{alert('Please use a mobile device to install this app.');}})();`;

  // JavaScript automation script
  const automationScript = `// Install App Automation Script
// Add this to your website or run in browser console

(function() {
  // Check if already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator).standalone === true;
  
  if (isStandalone) {
    console.log('App is already installed!');
    return;
  }

  // Detect platform
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = isIOS || isAndroid;

  if (!isMobile) {
    console.log('Please use a mobile device to install this app.');
    return;
  }

  // Handle Android installation
  if (isAndroid) {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // Auto-trigger install prompt
      setTimeout(() => {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
            } else {
              console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
          });
        }
      }, 1000);
    });
  }

  // Handle iOS - show instructions
  if (isIOS) {
    const instructions = document.createElement('div');
    instructions.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #007AFF;
      color: white;
      padding: 20px;
      text-align: center;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    \`;
    instructions.innerHTML = \`
      <p style="margin: 0 0 10px 0; font-weight: bold;">Add to Home Screen</p>
      <p style="margin: 0; font-size: 14px;">Tap the Share button <span style="font-size: 18px;">📤</span> then "Add to Home Screen"</p>
      <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 15px; background: white; color: #007AFF; border: none; border-radius: 5px; cursor: pointer;">Close</button>
    \`;
    document.body.appendChild(instructions);
  }
})();`;

  // Service Worker registration script
  const serviceWorkerScript = `// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// Listen for beforeinstallprompt event
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('Install prompt available');
  
  // You can trigger this manually or automatically
  // deferredPrompt.prompt();
});`;

  // HTML meta tags for PWA
  const metaTags = `<!-- Add these to your <head> section -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#007AFF">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Chapiz">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="/icons/android-chrome-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/icons/android-chrome-512x512.png">`;

  // Manifest.json template
  const manifestTemplate = `{
  "name": "Chapiz",
  "short_name": "Chapiz",
  "description": "Tiny pet guardians for big peace of mind.",
  "start_url": "${currentUrl}/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007AFF",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "My Pets",
      "short_name": "Pets",
      "description": "View your pets",
      "url": "${currentUrl}/pets",
      "icons": [{ "src": "/icons/android-chrome-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "Services",
      "short_name": "Services",
      "description": "Browse services",
      "url": "${currentUrl}/services",
      "icons": [{ "src": "/icons/android-chrome-192x192.png", "sizes": "192x192" }]
    }
  ]
}`;

  const scripts = [
    {
      id: 'bookmarklet',
      title: 'Bookmarklet',
      description: 'Drag this to your bookmarks bar or click to add to home screen',
      icon: Bookmark,
      content: bookmarkletScript,
      instructions: 'Drag the button below to your bookmarks bar, then click it on any page to trigger the install prompt.'
    },
    {
      id: 'automation',
      title: 'JavaScript Automation Script',
      description: 'Auto-trigger install prompts on mobile devices',
      icon: Code,
      content: automationScript,
      instructions: 'Add this script to your website or run it in the browser console. It will automatically detect mobile devices and trigger install prompts.'
    },
    {
      id: 'serviceworker',
      title: 'Service Worker Registration',
      description: 'Register service worker for PWA functionality',
      icon: Terminal,
      content: serviceWorkerScript,
      instructions: 'Add this to your main JavaScript file to register the service worker and handle install prompts.'
    },
    {
      id: 'meta',
      title: 'HTML Meta Tags',
      description: 'Required meta tags for PWA support',
      icon: Smartphone,
      content: metaTags,
      instructions: 'Add these meta tags to your HTML <head> section for proper PWA support across all platforms.'
    },
    {
      id: 'manifest',
      title: 'Manifest.json Template',
      description: 'Web app manifest configuration',
      icon: Download,
      content: manifestTemplate,
      instructions: 'Save this as manifest.json in your public folder. Update icons and URLs as needed.'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Install Automation Tools</CardTitle>
        <CardDescription>
          Generate scripts and tools to automate adding your website to shortcuts and home screens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {scripts.map((script) => {
            const Icon = script.icon;
            return (
              <div key={script.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">{script.title}</h3>
                      <p className="text-sm text-gray-600">{script.description}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(script.content, script.id)}
                  >
                    {copied === script.id ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500">{script.instructions}</p>
                
                {script.id === 'bookmarklet' ? (
                  <div className="space-y-2">
                    <Label>Bookmarklet Link</Label>
                    <div className="flex gap-2">
                      <a
                        href={bookmarkletScript}
                        className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          copyToClipboard(bookmarkletScript, 'bookmarklet');
                        }}
                      >
                        Install App
                      </a>
                      <p className="text-xs text-gray-500 self-center">
                        Drag this button to your bookmarks bar
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <Textarea
                      value={script.content}
                      readOnly
                      className="font-mono text-xs h-32 resize-none"
                      onClick={(e) => {
                        (e.target as HTMLTextAreaElement).select();
                        copyToClipboard(script.content, script.id);
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Platform-Specific Instructions</h3>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">iOS (iPhone/iPad)</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-2">
                  <li>Open Safari browser</li>
                  <li>Tap the Share button (square with arrow)</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Customize the name if desired</li>
                  <li>Tap "Add"</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Android (Chrome)</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-2">
                  <li>Open Chrome browser</li>
                  <li>Tap the menu (three dots)</li>
                  <li>Tap "Add to Home screen" or "Install app"</li>
                  <li>Confirm the installation</li>
                </ol>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Desktop (Chrome/Edge)</h4>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 ml-2">
                  <li>Look for the install icon in the address bar</li>
                  <li>Click the install icon</li>
                  <li>Confirm installation in the popup</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
