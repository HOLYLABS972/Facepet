/**
 * Admin Component Lazy Loader
 * Dynamically imports admin components to reduce initial bundle size
 * Admin pages are typically only used by a small percentage of users
 */

import dynamic from 'next/dynamic';

// Lazy load admin components with loading fallback
export const AdminPetsPage = dynamic(() => import('@/components/admin/AdminPetsPage'), {
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
  ssr: true,
});

export const AdminUsersPage = dynamic(() => import('@/components/admin/AdminUsersPage'), {
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
  ssr: true,
});

export const AdminBusinessesPage = dynamic(() => import('@/components/admin/AdminBusinessesPage'), {
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
  ssr: true,
});

export const AdsPageWithTabs = dynamic(() => import('@/components/admin/AdsPageWithTabs'), {
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
  ssr: true,
});

export const AdminCouponsPage = dynamic(() => import('@/components/admin/AdminCouponsPage'), {
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
  ssr: true,
});

export const ContactSubmissionsPage = dynamic(() => import('@/components/admin/ContactSubmissionsPage'), {
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading...</div>,
  ssr: true,
});
