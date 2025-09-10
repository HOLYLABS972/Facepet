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
  X
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import React, { useState } from 'react';
import PointsExplenationPopup from '../PointsExplenationPopup';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

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
  const { data: session, status } = useSession();
  const locale = useLocale();

  const publicPages: NavLink[] = [
    {
      label: t('signIn'),
      key: 'login',
      path: '/auth/sign-in',
      icon: <LogIn className="h-5 w-5" />
    },
    {
      label: t('signUp'),
      key: 'signup',
      path: '/auth/sign-up',
      icon: <UserRoundPlus className="h-5 w-5" />
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
            <Link href={status === 'authenticated' ? '/pages/my-pets' : '/'}>
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

            {/* Mobile Menu Button */}
            <div className="flex rtl:flex-row-reverse">
              {status === 'authenticated' && (
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
              {status === 'authenticated' ? (
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
                      signOut({ redirectTo: '/' });
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
                        {session?.user?.name}
                      </Button>
                    </Link>
                    <Button
                      variant={'ghost'}
                      type="button"
                      id="balance"
                      className="active:text-primary m-0 flex gap-4 p-0 hover:bg-inherit active:bg-inherit"
                      onClick={() => setIsPopupOpen(true)}
                    >
                      50 {/* change to user balance  */}
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
