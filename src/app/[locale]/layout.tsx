import MainLayout from '@/components/layout/MainLayout';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Lobster, Rubik } from 'next/font/google';
import AppProviders from '@/components/providers/AppProviders';
import GoogleSignupHandler from '@/components/GoogleSignupHandler';
import AnalyticsWrapper from '@/components/AnalyticsWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chapiz',
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
    title: 'Chapiz',
    statusBarStyle: 'default'
  },
  // For meta tags that are not directly supported (like Microsoft's navbutton color),
  // you can add them under the `other` property.
  other: {
    'msapplication-navbutton-color': '#eff1f6',
    'google': 'notranslate',
    'translate': 'no'
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
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning={true}>
      <body 
        className={`${rubik.className} antialiased`} 
        suppressHydrationWarning={true}
        data-testim-main-word-scripts-loaded="false"
      >
        <AppProviders>
          <NextIntlClientProvider messages={messages}>
            <MainLayout direction={direction}>{children}</MainLayout>
            <GoogleSignupHandler />
          </NextIntlClientProvider>
        </AppProviders>
        <AnalyticsWrapper />
      </body>
    </html>
  );
}
