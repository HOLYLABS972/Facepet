'use client';

import { cn } from '@/src/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CircleUserRound,
  Coins,
  Gift,
  LogIn,
  LogOut,
  Menu,
  PawPrint,
  Stethoscope,
  UserRoundPlus,
  X,
  LayoutDashboard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import React, { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import PointsExplenationPopup from '../PointsExplenationPopup';
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const locale = useLocale();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log('Firebase logout...', { user });
      await signOut();
      console.log('Firebase logout completed, redirecting to landing page...');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: force redirect even if signOut fails
      window.location.href = '/';
    }
  };

  const publicPages: NavLink[] = [
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
      path: '/pages/services',
      icon: <Stethoscope className="h-5 w-5" />
    }
  ];

  return (
    <>
      {isPopupOpen && (
        <PointsExplenationPopup onClose={() => setIsPopupOpen(false)} />
      )}
      <nav
        className={cn(
          'sticky top-0 z-50',
          isMenuOpen
            ? 'to-background bg-linear-to-t from-white'
            : 'bg-background'
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between rtl:flex-row-reverse">
            {/* Brand / Logo */}
            <Link href="/">
              <div
                className="flex cursor-pointer items-center"
                onClick={() => {
                  setIsMenuOpen(false);
                }}
              >
                <span className="text-primary font-['Lobster'] text-2xl">
                  Facepet
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    type="button"
                    className="group active:bg-accent relative rounded-md p-2"
                  >
                    <Link href="/pages/my-gifts" className="relative">
                      <span className="bg-primary border-background group-hover:border-accent absolute -top-1 -right-1 z-50 h-3 w-3 rounded-full border-3 transition-colors"></span>
                      <Gift className="block h-6 w-6" />
                    </Link>
                  </Button>
                  
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
                          <p className="font-medium">{user?.displayName || user?.email}</p>
                          <p className="w-[200px] truncate text-sm text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/pages/my-pets" className="flex items-center">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/user/settings" className="flex items-center">
                          <CircleUserRound className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/pages/services" className="flex items-center">
                          <Stethoscope className="mr-2 h-4 w-4" />
                          <span>Services</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth">
                    <Button className="bg-primary hover:bg-primary/90 text-white">
                      <LogIn className="h-5 w-5 mr-2" />
                      {t('signIn')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden rtl:flex-row-reverse">
              {user && (
                <div className="flex">
                  <Button
                    variant="ghost"
                    type="button"
                    className="group active:bg-accent relative rounded-md p-2"
                  >
                    <Link href="/pages/my-gifts" className="relative">
                      <span className="bg-primary border-background group-hover:border-accent absolute -top-1 -right-1 z-50 h-3 w-3 rounded-full border-3 transition-colors"></span>
                      <Gift className="block h-6 w-6" />
                    </Link>
                  </Button>
                </div>
              )}
              <Button
                variant={'ghost'}
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 active:bg-inherit"
                aria-expanded={isMenuOpen}
              >
                <AnimatePresence mode="wait">
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0.8, rotate: 90 }}
                      transition={{ duration: 0.1 }}
                    >
                      <X className="block h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0.8, rotate: -90 }}
                      transition={{ duration: 0.1 }}
                    >
                      <Menu className="block h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.1 }}
              className="overflow-hidden"
            >
              {user ? (
                <div className="border-b px-4 pb-2">
                  <div className="space-y-1">
                    {authPages.map((link) => (
                      <MobileNavLink
                        key={link.key}
                        path={link.path}
                        locale={locale}
                        onClick={() => setIsMenuOpen(false)}
                        icon={link.icon}
                      >
                        {link.label}
                      </MobileNavLink>
                    ))}
                  </div>
                  <Button
                    variant={'ghost'}
                    type="button"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="active:bg-accent flex w-full justify-start gap-5 rounded-md p-2 text-left text-base font-medium text-black transition-colors rtl:text-right"
                  >
                    <LogOut className="h-5 w-5" />
                    {t('signOut')}
                  </Button>
                  <Separator className="mt-5 mb-2" />
                  <div className="flex w-full justify-between rounded-md px-2 text-base font-medium text-black transition-colors">
                    <Link href={'/user/settings'} locale={locale} passHref>
                      <Button
                        variant={'ghost'}
                        type="button"
                        id="profile"
                        onClick={() => {
                          setIsMenuOpen(false);
                        }}
                        className="active:text-primary m-0 flex gap-5 p-0 hover:bg-inherit active:bg-inherit"
                      >
                        <CircleUserRound className="h-5 w-5" />
                        {user?.displayName || user?.email}
                      </Button>
                    </Link>
                    <Button
                      variant={'ghost'}
                      type="button"
                      id="balance"
                      className="active:text-primary m-0 flex gap-4 p-0 hover:bg-inherit active:bg-inherit"
                      onClick={() => setIsPopupOpen(true)}
                    >
                      30 {/* user balance - 30 registration + 10 phone + 10 pet = 50 total */}
                      <Coins className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-b px-4 pb-7">
                  {publicPages.map((link) => (
                    <MobileNavLink
                      key={link.key}
                      path={link.path}
                      locale={locale}
                      onClick={() => setIsMenuOpen(false)}
                      icon={link.icon}
                    >
                      {link.label}
                    </MobileNavLink>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

type MobileNavLinkProps = {
  onClick: () => void;
  path: string;
  locale: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
};

const MobileNavLink = ({
  onClick,
  path,
  locale,
  icon,
  children
}: MobileNavLinkProps) => (
  <Link href={path} locale={locale} passHref>
    <Button
      variant={'ghost'}
      type="button"
      onClick={onClick}
      className="active:bg-accent flex w-full justify-start gap-5 rounded-md p-2 text-left text-base font-medium text-black transition-colors rtl:text-right"
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </Button>
  </Link>
);

export default Navbar;
