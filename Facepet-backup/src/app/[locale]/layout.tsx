import { auth } from '@/auth';
import MainLayout from '@/components/layout/MainLayout';
import type { Metadata } from 'next';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { Lobster, Rubik } from 'next/font/google';
import './globals.css';

// Dynamically import analytics components
const Analytics = dynamic(
  () => import('@vercel/analytics/react').then((mod) => mod.Analytics),
  { ssr: true, loading: () => null }
);

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((mod) => mod.SpeedInsights),
  { ssr: true, loading: () => null }
);

export const metadata: Metadata = {
  title: 'FacePet',
  description: 'Tiny pet guardians for big peace of mind.',
  icons: {
    icon: [
      { url: '/icons/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { url: '/icons/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/icons/favicon.ico',
    apple: { url: '/icons/apple-touch-icon.png', sizes: '180x180' }
  },
  manifest: '/icons/site.webmanifest',
  appleWebApp: {
    title: 'Facepet',
    statusBarStyle: 'default'
  },
  // For meta tags that are not directly supported (like Microsoft's navbutton color),
  // you can add them under the `other` property.
  other: {
    'msapplication-navbutton-color': '#eff1f6'
  }
};

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  variable: '--font-rubik'
});

const lobster = Lobster({
  subsets: ['latin'],
  variable: '--font-lobster',
  weight: '400'
});

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await auth();
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction}>
      <SessionProvider session={session} key={session?.user?.id}>
        <body className={`${rubik.className} antialiased`}>
          <NextIntlClientProvider messages={messages}>
            <MainLayout direction={direction}>{children}</MainLayout>
          </NextIntlClientProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </SessionProvider>
    </html>
  );
}
