'use client';

import { useRouter } from '@/i18n/routing';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { ArrowLeft, User, Phone, Mail, Camera, Loader2, Save, Globe, Upload, CheckCircle, XCircle, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadProfileImage, testStorageConnection } from '@/src/lib/firebase/simple-upload';
import { updateUserInFirestore, getUserFromFirestore } from '@/src/lib/firebase/users';

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations('pages.UserSettingsPage');
  const locale = useLocale();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ progress: number; status: string; downloadURL?: string; error?: string } | null>(null);
  const [savingCookies, setSavingCookies] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    profileImage: null as File | null,
    profileImageURL: '',
    acceptCookies: false,
    language: locale
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
            // Use Firestore data if available
            setFormData(prev => ({
              ...prev,
              fullName: user.displayName || userResult.user.displayName || '',
              email: user.email || '',
              phone: userResult.user.phone || '',
              profileImageURL: userResult.user.profileImage || user.photoURL || '',
              acceptCookies: userResult.user.acceptCookies || false,
              language: locale // Always use current locale, not stored preference
            }));
          } else {
            // Fallback to localStorage and Firebase Auth data
            setFormData(prev => ({
              ...prev,
              fullName: user.displayName || '',
              email: user.email || '',
              profileImageURL: user.photoURL || '',
              acceptCookies: localStorage.getItem('acceptCookies') === 'true',
              language: locale // Always use current locale
            }));
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          // Fallback to basic data
          setFormData(prev => ({
            ...prev,
            fullName: user.displayName || '',
            email: user.email || '',
            profileImageURL: user.photoURL || '',
            acceptCookies: localStorage.getItem('acceptCookies') === 'true',
            language: locale // Always use current locale
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
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-save cookie preference immediately
    if (field === 'acceptCookies' && user) {
      localStorage.setItem('acceptCookies', value.toString());
      setSavingCookies(true);
      
      // Also save to Firestore immediately
      updateUserInFirestore(user.uid, { acceptCookies: value })
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
          await updateUserInFirestore(user.uid, {
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
      console.log('Current formData.language:', formData.language);
      
      setFormData(prev => ({
        ...prev,
        language: newLanguage
      }));
      
      // Save language preference
      localStorage.setItem('preferredLanguage', newLanguage);
      
      // Get current pathname and remove locale prefix
      const currentPath = window.location.pathname;
      console.log('Current path:', currentPath);
      
      // Remove locale prefix if it exists (e.g., /he/settings -> /settings)
      const pathWithoutLocale = currentPath.replace(/^\/[a-z]{2}/, '') || '/';
      console.log('Path without locale:', pathWithoutLocale);
      console.log('New language:', newLanguage);
      
      // Use window.location to navigate to the new locale
      // This ensures proper URL construction
      const newUrl = `/${newLanguage}${pathWithoutLocale}`;
      console.log('New URL:', newUrl);
      
      // Navigate to the new URL
      window.location.href = newUrl;
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error('Failed to change language');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Save to localStorage for immediate access
      localStorage.setItem('acceptCookies', formData.acceptCookies.toString());
      localStorage.setItem('preferredLanguage', formData.language);
      
      // Update user profile in Firestore
      const updateData: any = {
        acceptCookies: formData.acceptCookies,
        language: formData.language
      };

      // Add phone if provided
      if (formData.phone) {
        updateData.phone = formData.phone;
      }

      // Add profile image if uploaded
      if (formData.profileImageURL) {
        updateData.profileImage = formData.profileImageURL;
      }

      const userResult = await updateUserInFirestore(user.uid, updateData);
      
      if (!userResult.success) {
        console.error('Failed to update user in Firestore:', userResult.error);
        toast.error('Failed to save some preferences');
      } else {
        toast.success('Profile updated successfully!');
      }
      
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeletingAccount(true);
    try {
      // Delete user data from Firestore
      const { deleteDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/src/lib/firebase/config');
      
      // Delete user document
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Delete user's pets
      const { collection, query, where, getDocs } = await import('firebase/firestore');
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
      
      // Delete Firebase Auth user
      const { deleteUser } = await import('firebase/auth');
      const { auth } = await import('@/src/lib/firebase/config');
      await deleteUser(auth.currentUser!);
      
      toast.success('Account deleted successfully');
      
      // Redirect to landing page
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('Error deleting account:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        toast.error('Please sign in again before deleting your account');
      } else {
        toast.error('Failed to delete account. Please try again.');
      }
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 p-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back')}
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
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
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
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
                    <User className="h-8 w-8 text-gray-400" />
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
                    {uploading ? 'Uploading...' : t('uploadImage')}
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
                        {uploadProgress.status === 'uploading' && 'Uploading...'}
                        {uploadProgress.status === 'completed' && 'Upload completed!'}
                        {uploadProgress.status === 'error' && 'Upload failed'}
                      </span>
                      <span className="text-gray-500">
                        {Math.round(uploadProgress.progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          uploadProgress.status === 'completed' ? 'bg-green-500' :
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

            <div className="space-y-2">
              <Label htmlFor="email">{t('emailAddress')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="pl-10"
                  disabled
                />
              </div>
              <p className="text-sm text-gray-500">
                {t('emailNote')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="mb-6 shadow-xl">
          <CardHeader>
            <CardTitle>{t('privacySettings')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="acceptCookies">{t('acceptCookies')}</Label>
                <p className="text-sm text-gray-500">
                  {t('acceptCookiesDescription')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="acceptCookies"
                  checked={formData.acceptCookies}
                  onCheckedChange={(checked) => handleInputChange('acceptCookies', checked)}
                  disabled={savingCookies}
                />
                {savingCookies && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
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

                {/* Account Management Section */}
        <Card className="mb-6 shadow-xl border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <User className="h-5 w-5" />
              Account Management
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
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
  );
}