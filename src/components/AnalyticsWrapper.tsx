'use client';

import dynamic from 'next/dynamic';

// Dynamically import analytics components with error handling
const Analytics = dynamic(
  () => import('@vercel/analytics/react').then((mod) => mod.Analytics).catch(() => null),
  { ssr: false, loading: () => null }
);

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights).catch(() => null),
  { ssr: false, loading: () => null }
);

export default function AnalyticsWrapper() {
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}

