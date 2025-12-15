'use client';

import { Gift, Ticket, PawPrint, MapPin } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function BottomNavigation() {
  const pathname = usePathname();
  const t = useTranslations('components.Navbar.bottomNav');

  const navItems = [
    {
      href: '/pages/my-pets',
      icon: PawPrint,
      label: t('myPets'),
      isActive: pathname?.startsWith('/pages/my-pets'),
    },
    {
      href: '/promos',
      icon: Gift,
      label: t('giftsAndVouchers'),
      isActive: pathname?.startsWith('/promos'),
    },
    {
      href: '/coupons',
      icon: Ticket,
      label: t('myCoupons'),
      isActive: pathname?.startsWith('/coupons') || pathname?.startsWith('/vouchers'),
    },
    {
      href: '/services',
      icon: MapPin,
      label: t('businessesNearby'),
      isActive: pathname?.startsWith('/services'),
    },
  ];

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
              className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-colors ${
                item.isActive
                  ? 'text-primary bg-primary/5'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${item.isActive ? 'text-primary' : ''}`} />
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
