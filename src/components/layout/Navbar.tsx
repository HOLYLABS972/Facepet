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
  Wallet,
  Menu,
  Gift,
  MapPin
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
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
  const [isMounted, setIsMounted] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch user role
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

    checkUserRole();
  }, [user]);

  // Fetch store URL (always, regardless of user status)
  useEffect(() => {
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

    fetchStoreUrl();
  }, []);

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
      label: t('contact'),
      key: 'contact',
      path: '/contact',
      icon: <Mail className="h-5 w-5" />
    }
  ];

  // Show loading state during hydration
  if (!isMounted || loading) {
    return (
      <>
        {isPopupOpen && (
          <PointsExplenationPopup onClose={() => setIsPopupOpen(false)} />
        )}
        <nav
          className={cn(
            'fixed top-0 left-0 right-0 z-50',
            'bg-gray-50'
          )}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
            <div className="flex h-16 items-center justify-between rtl:flex-row-reverse">
              <div className="h-8 w-8" />
            </div>
          </div>
        </nav>
      </>
    );
  }

  return (
    <>
      {isPopupOpen && (
        <PointsExplenationPopup onClose={() => setIsPopupOpen(false)} />
      )}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50',
          'bg-gray-50'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="flex h-14 sm:h-16 items-center justify-between rtl:flex-row-reverse flex-nowrap">
            {/* Brand / Logo */}
            <Link href="/" className="flex-shrink-0">
              <div
                className="flex cursor-pointer items-center"
              >
                <Image
                  src="/assets/Facepet.png"
                  alt="Chapiz"
                  width={180}
                  height={60}
                  className="h-8 sm:h-10 w-auto object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="flex items-center gap-2 sm:gap-4 relative flex-shrink-0">
              {loading ? (
                // Show loading state during authentication check
                <div className="h-8 w-8" />
              ) : user ? (
                <>
                  {/* User Dropdown Menu - Using Burger Icon */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                        <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
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
                      {/* Desktop Navigation Items - Hidden on mobile (mobile has bottom nav) */}
                      <div className="hidden md:block">
                        <DropdownMenuItem asChild>
                          <Link href="/pages/my-pets" className="flex items-center">
                            <PawPrint className="mr-2 h-4 w-4" />
                            <span>{t('bottomNav.myPets') || t('myPets')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/promos" className="flex items-center">
                            <Gift className="mr-2 h-4 w-4" />
                            <span>{t('bottomNav.giftsAndVouchers') || t('allPromos')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/coupons" className="flex items-center">
                            <Ticket className="mr-2 h-4 w-4" />
                            <span>{t('bottomNav.myCoupons') || t('coupons')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/services" className="flex items-center">
                            <MapPin className="mr-2 h-4 w-4" />
                            <span>{t('bottomNav.businessesNearby') || t('services')}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </div>
                      {/* Settings and Actions */}
                      <DropdownMenuItem asChild>
                        <Link href="/user/settings" className="flex items-center">
                          <CircleUserRound className="mr-2 h-4 w-4" />
                          <span>{t('profile')}</span>
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
                      <DropdownMenuItem onClick={handleLogout} className="text-orange-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>{t('signOut')}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {/* Store Button - Outlined Orange (Always visible for logged in users) */}
                  {storeUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = storeUrl}
                      className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-600 flex items-center justify-center whitespace-nowrap text-xs px-2 sm:px-3"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span>חנות צ'אפיז</span>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {/* Desktop: Group Login, Store, Contact on the right */}
                  <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => router.push('/auth')}
                      className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500 flex items-center justify-center text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {t('signIn')}
                    </Button>
                    {storeUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = storeUrl}
                        className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-600 flex items-center justify-center whitespace-nowrap text-xs px-2 sm:px-3"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span>חנות צ'אפיז</span>
                      </Button>
                    )}
                    <Button
                      variant={pathname?.includes('/contact') ? 'outline' : 'ghost'}
                      size="sm"
                      onClick={() => router.push('/contact')}
                      className={`${pathname?.includes('/contact') ? 'border-primary text-primary' : ''} flex items-center justify-center text-xs sm:text-sm px-2 sm:px-3`}
                    >
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {t('contact') || 'Contact'}
                    </Button>
                  </div>

                  {/* Mobile: Show burger menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0 md:hidden">
                        <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align={locale === 'he' ? 'start' : 'end'}>
                      <DropdownMenuItem asChild>
                        <Link href="/contact" className="flex items-center">
                          <Mail className="mr-2 h-4 w-4" />
                          <span>{t('contact')}</span>
                        </Link>
                      </DropdownMenuItem>
                      {storeUrl && (
                        <DropdownMenuItem onClick={() => window.location.href = storeUrl}>
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          <span>חנות צ'אפיז</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/auth" className="flex items-center">
                          <LogIn className="mr-2 h-4 w-4" />
                          <span>{t('signIn')}</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
