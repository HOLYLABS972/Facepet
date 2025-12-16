'use client';

import { Gift, Ticket, PawPrint, MapPin, Mail, LogIn } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/src/contexts/AuthContext';

export default function BottomNavigation() {
  const pathname = usePathname();
  const t = useTranslations('components.Navbar');
  const { user } = useAuth();

  // Navigation items for logged-in users
  const loggedInNavItems = [
    {
      href: '/pages/my-pets',
      icon: PawPrint,
      label: t('bottomNav.myPets') || t('myPets'),
      isActive: pathname?.startsWith('/pages/my-pets'),
    },
    {
      href: '/promos',
      icon: Gift,
      label: t('bottomNav.giftsAndVouchers') || t('allPromos'),
      isActive: pathname?.startsWith('/promos'),
    },
    {
      href: '/coupons',
      icon: Ticket,
      label: t('bottomNav.myCoupons') || t('coupons'),
      isActive: pathname?.startsWith('/coupons') || pathname?.startsWith('/vouchers'),
    },
    {
      href: '/services',
      icon: MapPin,
      label: t('bottomNav.businessesNearby') || t('services'),
      isActive: pathname?.startsWith('/services'),
    },
  ];

  // Don't show bottom navigation for non-logged-in users
  if (!user) {
    return null;
  }

  const navItems = loggedInNavItems;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t-2 border-gray-300 shadow-lg md:hidden"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
    >
      <nav className="flex items-center justify-around px-1 pt-2 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-all duration-200 ${item.isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-gray-600 hover:text-primary hover:bg-primary/5 hover:scale-105 active:scale-95'
                }`}
            >
              <Icon className={`h-6 w-6 mb-1 transition-transform ${item.isActive ? 'text-primary' : ''}`} />
              <span className={`text-[10px] font-medium text-center leading-tight ${item.isActive ? 'text-primary' : 'text-gray-600'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
