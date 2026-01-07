'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { ArrowLeft, User, Phone, Camera, Loader2, Save, Globe, Upload, CheckCircle, XCircle, AlertTriangle, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadProfileImage, testStorageConnection } from '@/src/lib/supabase/storage';
import { updateUserByUid, getUserFromFirestore } from '@/src/lib/supabase/database/users';
import LocationAutocompleteComboSelect from '../get-started/ui/LocationAutocompleteSelector';
import DeletionVerificationPage from '../auth/DeletionVerificationPage';

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('pages.UserSettingsPage');
  const locale = useLocale();
  const { user, loading: authLoading, sendDeletionVerificationCode, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ progress: number; status: string; downloadURL?: string; error?: string } | null>(null);
  const [savingCookies, setSavingCookies] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeletionVerification, setShowDeletionVerification] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    profileImage: null as File | null,
    profileImageURL: '',
    acceptCookies: false,
    language: locale,
    freeCouponPrice: false
  });

  // Available languages
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'he', name: 'עברית', flag: '🇮🇱' }
  ];


  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);


  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      const loadUserData = async () => {
        try {
          // Try to get user data from Firestore first
          const userResult = await getUserFromFirestore(user.uid);

          if (userResult.success && userResult.user) {
            // Use Firestore data if available - prioritize Firestore over Firebase Auth
            console.log('Loading user data from Firestore:');
            console.log('- Firebase Auth user.displayName:', user.displayName);
            console.log('- Firestore userResult.user.displayName:', userResult.user.displayName);
            console.log('- Firestore userResult.user:', userResult.user);

            // Prioritize Firestore displayName over Firebase Auth displayName
            const fullName = userResult.user.displayName || user.displayName || '';
            console.log('- Final fullName being set (prioritizing Firestore):', fullName);

            setFormData(prev => ({
              ...prev,
              fullName: fullName,
              phone: userResult.user.phone || '',
              address: userResult.user.address || '',
              profileImageURL: userResult.user.profileImage || user.photoURL || '',
              acceptCookies: userResult.user.acceptCookies || false,
              language: locale, // Always use current locale, not stored preference
              freeCouponPrice: userResult.user.freeCouponPrice || false
            }));
          } else {
            // Fallback to localStorage and Firebase Auth data
            let acceptCookies = false;
            if (typeof window !== 'undefined') {
              try {
                acceptCookies = localStorage.getItem('acceptCookies') === 'true';
              } catch (error) {
                console.error('Error accessing localStorage:', error);
              }
            }
            setFormData(prev => ({
              ...prev,
              fullName: user.displayName || '',
              address: '',
              profileImageURL: user.photoURL || '',
              acceptCookies,
              language: locale, // Always use current locale
              freeCouponPrice: false
            }));
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Fallback to basic data
          let acceptCookies = false;
          if (typeof window !== 'undefined') {
            try {
              acceptCookies = localStorage.getItem('acceptCookies') === 'true';
            } catch (storageError) {
              console.error('Error accessing localStorage:', storageError);
            }
          }
          setFormData(prev => ({
            ...prev,
            fullName: user.displayName || '',
            address: '',
            profileImageURL: user.photoURL || '',
            acceptCookies,
            language: locale, // Always use current locale
            freeCouponPrice: false
          }));
        }
      };

      loadUserData();
    }
  }, [user, locale]);

  // Update language when locale changes
  useEffect(() => {
    console.log('Locale changed to:', locale);
    setFormData(prev => ({
      ...prev,
      language: locale
    }));
  }, [locale]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    console.log(`Input change - field: "${field}", value:`, value);

    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('New formData after input change:', newData);
      return newData;
    });

    // Auto-save cookie preference immediately
    if (field === 'acceptCookies' && user) {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('acceptCookies', value.toString());
        } catch (error) {
          console.error('Error setting localStorage:', error);
        }
      }
      setSavingCookies(true);

      // Also save to Firestore immediately
      updateUserByUid(user.uid, { acceptCookies: value })
        .then(result => {
          if (result.success) {
            toast.success('Cookie preference saved!');
          } else {
            toast.error('Failed to save cookie preference');
          }
        })
        .catch(error => {
          console.error('Failed to save cookie preference:', error);
          toast.error('Failed to save cookie preference');
        })
        .finally(() => {
          setSavingCookies(false);
        });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Set the file for preview
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));

      // Test storage connection
      const storageTest = await testStorageConnection();
      if (!storageTest.success) {
        toast.error(`Storage connection failed: ${storageTest.error}`);
        return;
      }

      // Auto-upload the image
      setUploading(true);
      setUploadProgress({ progress: 0, status: 'uploading' });

      try {
        // Use the new simple upload function
        const result = await uploadProfileImage(file, user);

        if (result.success) {
          setUploadProgress({ progress: 100, status: 'completed', downloadURL: result.downloadURL });
        } else {
          setUploadProgress({ progress: 0, status: 'error', error: result.error });
        }

        if (result.success && result.downloadURL) {
          setFormData(prev => ({
            ...prev,
            profileImageURL: result.downloadURL
          }));

          // Update user profile in Firestore
          await updateUserByUid(user.uid, {
            profileImage: result.downloadURL
          });

          toast.success('Profile image uploaded successfully!');
        } else {
          toast.error(result.error || 'Failed to upload image');
        }
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error('Failed to upload image');
      } finally {
        setUploading(false);
        // Clear progress after 2 seconds
        setTimeout(() => {
          setUploadProgress(null);
        }, 2000);
      }
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    try {
      console.log('Language change requested:', newLanguage);
      console.log('Current locale:', locale);
      console.log('Current pathname:', pathname);

      setFormData(prev => ({
        ...prev,
        language: newLanguage
      }));

      // Save language preference
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('preferredLanguage', newLanguage);
        } catch (error) {
          console.error('Error setting localStorage:', error);
        }
      }

      // Always redirect to My Pets after switching language
      const newUrl = `/${newLanguage}/pages/my-pets`;

      console.log('New URL:', newUrl);

      // Use window.location.replace to avoid history issues and ensure proper navigation
      window.location.replace(newUrl);
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error('Failed to change language');
    }
  };

  const handleSave = async (showToast: boolean = true) => {
    setSaving(true);
    try {
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      console.log('Saving profile with formData:', formData);
      console.log('Full name being saved:', formData.fullName);

      // Save to localStorage for immediate access
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('acceptCookies', formData.acceptCookies.toString());
          localStorage.setItem('preferredLanguage', formData.language);
        } catch (error) {
          console.error('Error setting localStorage:', error);
        }
      }

      // Update user profile in Firestore
      const updateData: any = {
        acceptCookies: formData.acceptCookies,
        language: formData.language,
        freeCouponPrice: formData.freeCouponPrice
      };

      // Add full name if provided
      if (formData.fullName) {
        updateData.displayName = formData.fullName;
        console.log('Adding displayName to updateData:', formData.fullName);
      }

      // Add phone if provided
      if (formData.phone) {
        updateData.phone = formData.phone;
      }

      // Add address if provided
      if (formData.address) {
        updateData.address = formData.address;
      }

      // Add profile image if uploaded
      if (formData.profileImageURL) {
        updateData.profileImage = formData.profileImageURL;
      }

      const userResult = await updateUserByUid(user.uid, updateData);

      if (!userResult.success) {
        console.error('Failed to update user in Firestore:', userResult.error);
        if (showToast) {
          toast.error('Failed to save some preferences');
        }
      } else {
        // Also update Firebase Auth profile if displayName was changed
        if (formData.fullName && formData.fullName !== user.displayName) {
          // Firebase Auth update temporarily disabled due to dependency removal
          /*
          try {
            const { updateProfile } = await import('firebase/auth');
            await updateProfile(user, {
              displayName: formData.fullName
            });
            console.log('Firebase Auth displayName updated successfully');
          } catch (authError) {
            console.error('Failed to update Firebase Auth displayName:', authError);
            // Don't show error to user since Firestore was updated successfully
          }
          */
        }

        if (showToast) {
          toast.success('Profile updated successfully!');
        }

        // Reload user data to ensure latest information is displayed
        if (user) {
          const userResult = await getUserFromFirestore(user.uid);
          if (userResult.success && userResult.user) {
            console.log('Reloading user data after save:', userResult.user);
            setFormData(prev => ({
              ...prev,
              fullName: userResult.user.displayName || user.displayName || '',
              phone: userResult.user.phone || '',
              address: userResult.user.address || '',
              profileImageURL: userResult.user.profileImage || user.photoURL || '',
              acceptCookies: userResult.user.acceptCookies || false,
              language: locale,
              freeCouponPrice: userResult.user.freeCouponPrice || false
            }));
          }
        }
      }

    } catch (error) {
      console.error('Error saving profile:', error);
      if (showToast) {
        toast.error('Failed to save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    // Navigate to dashboard in current language instead of using browser back
    // This prevents going back to the previous language route
    router.push('/pages/my-pets');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setDeletingAccount(true);
    try {
      // Send deletion verification code
      const result = await sendDeletionVerificationCode(user.email!, user.displayName || 'User');

      if (result.success) {
        toast.success('Verification code sent to your email');
        console.log('✅ Deletion verification code sent, showing verification page');
        setShowDeletionVerification(true);
      } else {
        toast.error(result.message || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('Error sending deletion verification code:', error);
      toast.error('Failed to send verification code. Please try again.');
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleVerifiedDeletion = async () => {
    if (!user) return;

    setDeletingAccount(true);
    try {
      // Firebase dependency removed. TODO: Implement Supabase deletion logic.
      console.warn('Account deletion temporarily unavailable during migration.');
      toast.error('Account deletion is temporarily unavailable. Please contact support.');
      setDeletingAccount(false);
      setShowDeletionVerification(false);
      return;

      /*
      // Delete user data from Firestore collections
      const { deleteDoc, doc, collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/src/lib/firebase/config');

      // Delete user document
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete user's pets
      const petsQuery = query(collection(db, 'pets'), where('userEmail', '==', user.email));
      const petsSnapshot = await getDocs(petsQuery);

      for (const petDoc of petsSnapshot.docs) {
        await deleteDoc(petDoc.ref);
      }

      // Delete user's owners
      const ownersQuery = query(collection(db, 'owners'), where('email', '==', user.email));
      const ownersSnapshot = await getDocs(ownersQuery);

      for (const ownerDoc of ownersSnapshot.docs) {
        await deleteDoc(ownerDoc.ref);
      }

      // Delete user's ads if any
      const adsQuery = query(collection(db, 'ads'), where('userEmail', '==', user.email));
      const adsSnapshot = await getDocs(adsQuery);

      for (const adDoc of adsSnapshot.docs) {
        await deleteDoc(adDoc.ref);
      }

      // Delete user's favorites if any
      const favoritesQuery = query(collection(db, 'favorites'), where('userEmail', '==', user.email));
      const favoritesSnapshot = await getDocs(favoritesQuery);

      for (const favoriteDoc of favoritesSnapshot.docs) {
        await deleteDoc(favoriteDoc.ref);
      }

      // Delete user's comments if any
      const commentsQuery = query(collection(db, 'comments'), where('userEmail', '==', user.email));
      const commentsSnapshot = await getDocs(commentsQuery);

      for (const commentDoc of commentsSnapshot.docs) {
        await deleteDoc(commentDoc.ref);
      }

      toast.success('Account data deleted successfully');

      // Sign out user instead of deleting Firebase Auth user
      await signOut();

      // Redirect to landing page
      window.location.href = '/';
      */
    } catch (error: any) {
      console.error('Error deleting account data:', error);
      toast.error('Failed to delete account data. Please try again.');
    } finally {
      setDeletingAccount(false);
      setShowDeletionVerification(false);
    }
  };

  // Show deletion verification page if needed
  if (showDeletionVerification) {
    console.log('🔍 Rendering DeletionVerificationPage with email:', user.email);
    return (
      <DeletionVerificationPage
        email={user.email!}
        userName={user.displayName || 'User'}
        onVerified={handleVerifiedDeletion}
        onBack={() => setShowDeletionVerification(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
            <div className="flex items-center gap-4">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={handleBack}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('title')}
                </h1>
                <p className="text-gray-600">
                  {t('subtitle')}
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end md:justify-start">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-white px-8"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('saving')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    <span>{t('saveChanges')}</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Image Section */}
        <Card className="mb-6 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {t('profileImage')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                  {formData.profileImage ? (
                    <img
                      src={URL.createObjectURL(formData.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : formData.profileImageURL ? (
                    <img
                      src={formData.profileImageURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="profile-image" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-primary hover:text-primary/80">
                    {uploading ? (
                      <Upload className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    {uploading ? t('uploading') : t('uploadImage')}
                  </div>
                </Label>
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('imageRequirements')}
                </p>

                {/* Upload Progress Bar */}
                {uploadProgress && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {uploadProgress.status === 'uploading' && t('uploading')}
                        {uploadProgress.status === 'completed' && 'Upload completed!'}
                        {uploadProgress.status === 'error' && 'Upload failed'}
                      </span>
                      <span className="text-gray-500">
                        {Math.round(uploadProgress.progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${uploadProgress.status === 'completed' ? 'bg-green-500' :
                          uploadProgress.status === 'error' ? 'bg-red-500' :
                            'bg-primary'
                          }`}
                        style={{ width: `${uploadProgress.progress}%` }}
                      />
                    </div>
                    {uploadProgress.status === 'completed' && (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Image uploaded successfully!</span>
                      </div>
                    )}
                    {uploadProgress.status === 'error' && (
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <XCircle className="h-4 w-4" />
                        <span>{uploadProgress.error || 'Upload failed'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="mb-6 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('personalInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('fullName')}</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder={t('fullNamePlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('phoneNumber')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t('phonePlaceholder')}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 mt-8">
              <LocationAutocompleteComboSelect
                label={t('address')}
                id="address"
                value={formData.address}
                onChange={(value) => handleInputChange('address', value)}
                hasError={false}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="mb-6 shadow-xl">
          <CardHeader>
            <CardTitle>{t('privacySettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="acceptCookies"
                checked={formData.acceptCookies}
                onCheckedChange={(checked) => handleInputChange('acceptCookies', checked)}
                disabled={savingCookies}
              />
              <div className="space-y-1 flex-1">
                <Label htmlFor="acceptCookies" className="cursor-pointer">{t('acceptCookies')}</Label>
                <p className="text-sm text-gray-500">
                  {t('acceptCookiesDescription')}
                </p>
              </div>
              {savingCookies && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Checkbox
                id="freeCouponPrice"
                checked={formData.freeCouponPrice}
                onCheckedChange={(checked) => handleInputChange('freeCouponPrice', checked)}
              />
              <div className="space-y-1 flex-1">
                <Label htmlFor="freeCouponPrice" className="cursor-pointer">{t('freeCouponPrice')}</Label>
                <p className="text-sm text-gray-500">
                  {t('freeCouponPriceDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="mb-6 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('languageSettings')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language">{t('preferredLanguage')}</Label>
              <Select value={formData.language} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                {t('languageDescription')}
              </p>
            </div>
          </CardContent>
        </Card>


        {/* Action Buttons */}
        <div className="flex justify-between items-center gap-4">
          {/* Delete Account Button */}
          <Button
            variant="ghost"
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="text-gray-400 hover:text-gray-600 hover:bg-transparent p-2 h-auto font-normal text-sm"
          >
            {deletingAccount ? t('deleteAccount.deleting') : t('deleteAccount.button')}
          </Button>
        </div>
      </div>


    </div>
  );
}