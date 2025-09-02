'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';
import LocaleSwitcher from '@/components/LocaleSwitcher';

const AuthPage = () => {
  const t = useTranslations('pages.AuthPage');
  const { signIn, signUp, signInWithGoogle, sendVerificationCode, user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Debug logging
  console.log('AuthPage rendered:', { user, authLoading });
  
  // Redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      console.log('User already authenticated, redirecting to dashboard');
      router.push('/pages/my-pets');
    }
  }, [user, authLoading, router]);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (isSignUp) {
        // Send verification code using your simple API
        await sendVerificationCode(formData.email);
        toast.success(t('verificationCodeSent'));
        
        // Redirect to email verification page with simple parameters
        router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(formData.password)}&fullName=${encodeURIComponent(formData.fullName)}`);
      } else {
        await signIn(formData.email, formData.password);
        toast.success(t('signInSuccess'));
        router.push('/pages/my-pets');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || t('authError'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setFormLoading(true);
    try {
      await signInWithGoogle();
      toast.success(t('signInSuccessGoogle'));
      router.push('/pages/my-pets');
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error(error.message || t('authErrorGoogle'));
    } finally {
      setFormLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Image and Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-8">
          <div className="relative w-80 h-80">
            <Image
              src="/pets/bear.png"
              alt="FacePet Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-['Lobster'] text-primary">
              FacePet
            </h1>
            <p className="text-xl text-gray-600 max-w-md">
              {t('tagline')}
            </p>
          </div>
        </div>

        {/* Right Side - Authentication Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            {/* Language Switcher */}
            <div className="flex justify-end p-4">
              <LocaleSwitcher />
            </div>
            <CardHeader className="space-y-2 text-center pb-8">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {isSignUp ? t('createAccount') : t('welcomeBack')}
              </CardTitle>
              <p className="text-gray-600">
                {isSignUp 
                  ? t('joinFacePet') 
                  : t('signInToAccount')
                }
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Google Sign In Button */}
              <Button
                onClick={handleGoogleAuth}
                disabled={formLoading}
                variant="outline"
                className="w-full h-12 text-gray-700 border-gray-300 hover:bg-gray-50"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('signInWithGoogle')}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">{t('or')}</span>
                </div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">{t('fullName')}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        name="fullName"
                        type="text"
                        placeholder={t('fullNamePlaceholder')}
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required={isSignUp}
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      name="email"
                      type="email"
                      placeholder={t('emailPlaceholder')}
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('password')}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('passwordPlaceholder')}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="pl-10 pr-10 h-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={formLoading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white"
                >
                  {formLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('loading')}</span>
                    </div>
                  ) : (
                    isSignUp ? t('signUpButton') : t('signInButton')
                  )}
                </Button>

                {!isSignUp && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => router.push('/auth/forgot')}
                      className="text-sm text-gray-600 hover:text-primary underline"
                    >
                      {t('forgotPassword')}
                    </button>
                  </div>
                )}
              </form>

              {/* Toggle Sign In/Sign Up */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  {isSignUp ? t('haveAccount') : t('noAccount')}
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="ml-1 text-primary hover:underline font-medium"
                  >
                    {isSignUp ? t('signInLink') : t('signUpLink')}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
