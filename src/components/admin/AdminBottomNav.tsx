'use client';

import { LayoutDashboard, AppWindow, Users, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminBottomNavProps {
    locale: string;
}

export default function AdminBottomNav({ locale }: AdminBottomNavProps) {
    const t = useTranslations('Admin');
    const pathname = usePathname();

    const navItems = [
        {
            href: `/${locale}/admin`,
            icon: LayoutDashboard,
            label: t('navigation.dashboard'),
            isActive: pathname === `/${locale}/admin`,
        },
        {
            href: `/${locale}/admin/ads`,
            icon: AppWindow,
            label: t('navigation.manageAds'),
            isActive: pathname?.startsWith(`/${locale}/admin/ads`),
        },
        {
            href: `/${locale}/admin/users`,
            icon: Users,
            label: t('navigation.manageUsers'),
            isActive: pathname?.startsWith(`/${locale}/admin/users`),
        },
        {
            href: `/${locale}/admin/settings`,
            icon: Settings,
            label: t('navigation.settings'),
            isActive: pathname?.startsWith(`/${locale}/admin/settings`),
        },
    ];

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
        >
            <nav className="flex items-center justify-around px-2 pt-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-colors ${item.isActive
                                    ? 'text-primary bg-primary/5'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className={`h-6 w-6 mb-1 ${item.isActive ? 'text-primary' : ''}`} />
                            <span className={`text-[10px] font-medium truncate max-w-full ${item.isActive ? 'text-primary' : ''
                                }`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
