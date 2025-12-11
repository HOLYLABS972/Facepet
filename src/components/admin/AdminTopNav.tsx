'use client';

import { useState } from 'react';
import { Menu, X, MessageSquare, Mail, Ticket, LayoutDashboard, AppWindow, Users, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AdminTopNavProps {
    userEmail: string;
    userRole: string;
    locale: string;
}

export default function AdminTopNav({ userEmail, userRole, locale }: AdminTopNavProps) {
    const t = useTranslations('Admin');
    const [menuOpen, setMenuOpen] = useState(false);

    const navItems = [
        {
            href: `/${locale}/admin`,
            icon: LayoutDashboard,
            label: t('navigation.dashboard'),
        },
        {
            href: `/${locale}/admin/ads`,
            icon: AppWindow,
            label: t('navigation.manageAds'),
        },
        {
            href: `/${locale}/admin/users`,
            icon: Users,
            label: t('navigation.manageUsers'),
        },
        {
            href: `/${locale}/admin/settings`,
            icon: Settings,
            label: t('navigation.settings'),
        },
        {
            href: `/${locale}/admin/comments`,
            icon: MessageSquare,
            label: t('navigation.manageComments'),
        },
        {
            href: `/${locale}/admin/contact-submissions`,
            icon: Mail,
            label: t('navigation.contactSubmissions'),
        },
        {
            href: `/${locale}/admin/coupons`,
            icon: Ticket,
            label: t('navigation.manageCoupons'),
        },
    ];

    return (
        <>
            <div className="sticky top-0 z-50 bg-white border-b border-gray-200 md:hidden w-full">
                <div
                    className="px-4 py-3 flex items-center justify-between"
                    style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}
                >
                    {/* Logo/Branding */}
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                            <p className="text-xs text-gray-500 truncate max-w-[180px]">{userEmail}</p>
                        </div>
                    </div>

                    {/* Menu Button */}
                    <Button
                        onClick={() => setMenuOpen(!menuOpen)}
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0"
                    >
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>

                {/* Dropdown Menu */}
                {menuOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-20 z-40"
                            onClick={() => setMenuOpen(false)}
                        />

                        {/* Menu Content */}
                        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
                            <nav className="py-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                                        >
                                            <Icon className="h-5 w-5 text-gray-600" />
                                            <span className="text-sm font-medium text-gray-900">{item.label}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* User Role Badge */}
                            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                <p className="text-xs text-gray-500">Role</p>
                                <p className="text-sm font-medium text-gray-900 capitalize">{userRole}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
