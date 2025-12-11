'use client';

import { cn } from '@/src/lib/utils';
import {
  CircleUserRound,
  Coins,
  LogIn,
  LogOut,
  PawPrint,
  Stethoscope,
  UserRoundPlus,
  LayoutDashboard,
  Mail,
  ShoppingBag,
  Ticket,
  Tag,
  Wallet
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useNotifications } from '@/src/contexts/NotificationsContext';
import PointsExplenationPopup from '../PointsExplenationPopup';
import { getUserFromFirestore } from '@/src/lib/firebase/users';
import { getContactInfo } from '@/src/lib/actions/admin';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

type NavLink = {
  label: string;
  key: string;
  path: string;
  icon?: React.ReactNode;
};

const Navbar = () => {
  const t = useTranslations('components.Navbar');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { notifications } = useNotifications();
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'super_admin' | null>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const locale = useLocale();
  const router = useRouter();

  // Fetch user role and store URL
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setUserRole(null);
        return;
      }

      try {
        const userResult = await getUserFromFirestore(user.uid);
        if (userResult.success && userResult.user) {
          setUserRole(userResult.user.role || 'user');
        } else {
          setUserRole('user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user');
      }
    };

    const fetchStoreUrl = async () => {
      try {
        const contactInfo = await getContactInfo();
        if (contactInfo?.storeUrl) {
          setStoreUrl(contactInfo.storeUrl);
        }
      } catch (error) {
        console.error('Error fetching store URL:', error);
      }
    };

    checkUserRole();
    fetchStoreUrl();
  }, [user]);

  const handleLogout = async () => {
    try {
      console.log('Firebase logout...', { user });
      await signOut();
      console.log('Firebase logout completed, redirecting to landing page...');
      // Use window.location.href to force full page reload and bypass AuthGuard
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: force redirect even if signOut fails
      window.location.href = '/';
    }
  };

  const publicPages: NavLink[] = [
    {
      label: t('contact'),
      key: 'contact',
      path: '/contact',
      icon: <Mail className="h-5 w-5" />
    },
    {
      label: t('signIn'),
      key: 'login',
      path: '/auth',
      icon: <LogIn className="h-5 w-5" />
    }
  ];

  const authPages: NavLink[] = [
    {
      label: t('myPets'),
      key: 'mypets',
      path: '/pages/my-pets',
      icon: <PawPrint className="h-5 w-5" />
    },
    {
      label: t('services'),
      key: 'services',
      path: '/services',
      icon: <Stethoscope className="h-5 w-5" />
    },
    {
      label: t('coupons'),
      key: 'coupons',
      path: '/coupons',
      icon: <Wallet className="h-5 w-5" />
    },
    {
      label: t('allPromos'),
      key: 'promos',
      path: '/promos',
      icon: <Tag className="h-5 w-5" />
    },
    {
      label: t('contact'),
      key: 'contact',
      path: '/contact',
      icon: <Mail className="h-5 w-5" />
    }
  ];

  return (
    <>
      {isPopupOpen && (
        <PointsExplenationPopup onClose={() => setIsPopupOpen(false)} />
      )}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'bg-background'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between rtl:flex-row-reverse">
            {/* Brand / Logo */}
            <Link href="/">
              <div
                className="flex cursor-pointer items-center"
              >
                <span className="text-primary font-['Lobster'] text-2xl">
                  Facepet
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-4">
              {/* Store Button - always visible */}
              {storeUrl && (
                <Button
                  onClick={() => window.location.href = storeUrl}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  {t('store')}
                </Button>
              )}

              {user ? (
                <>
                  {/* User Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <CircleUserRound className="h-5 w-5 text-white" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                          {user?.displayName && (
                            <p className="font-medium">{user.displayName}</p>
                          )}
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/pages/my-pets" className="flex items-center">
                          <PawPrint className="mr-2 h-4 w-4" />
                          <span>{t('myPets')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/user/settings" className="flex items-center">
                          <CircleUserRound className="mr-2 h-4 w-4" />
                          <span>{t('profile')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/services" className="flex items-center">
                          <Stethoscope className="mr-2 h-4 w-4" />
                          <span>{t('services')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/coupons" className="flex items-center">
                          <Ticket className="mr-2 h-4 w-4" />
                          <span>{t('coupons')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/promos" className="flex items-center">
                          <Tag className="mr-2 h-4 w-4" />
                          <span>{t('allPromos')}</span>
                        </Link>
                      </DropdownMenuItem>
                      {(userRole === 'admin' || userRole === 'super_admin') && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>{t('adminPanel')}</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/contact" className="flex items-center">
                          <Mail className="mr-2 h-4 w-4" />
                          <span>{t('contact')}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('signOut')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/contact">
                    <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
                      <Mail className="h-4 w-4 mr-2" />
                      {t('contact')}
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                      <LogIn className="h-5 w-5 mr-2" />
                      {t('signIn')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
