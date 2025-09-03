'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Wifi, Share2, Copy, Check, Calendar, MapPin, Phone, Mail, Heart, Star, List, Loader2 } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';

interface Pet {
  id: string;
  name: string;
  type: string;
  breedName: string;
  imageUrl: string;
  description?: string;
  age?: string;
  gender?: string;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Owner {
  id: string;
  displayName?: string;
  phone?: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
}

interface PetProfilePageProps {
  pet: Pet;
  owner?: Owner;
}

export default function PetProfilePage({ pet, owner }: PetProfilePageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('pages.PetProfilePage');
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareEarning, setShowShareEarning] = useState(false);
  
  // Check if current user is the pet owner
  const isOwner = user?.email === pet.userEmail;

  const petShareUrl = typeof window !== 'undefined' ? `${window.location.origin}/pet/${pet.id}` : '';
  const shareText = t('messages.shareText', { name: pet.name, url: petShareUrl });

  const handleDeletePet = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'pets', pet.id));
      toast.success(t('messages.petDeleted'));
      router.push('/pages/my-pets');
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.error(t('messages.deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!petShareUrl) return;
    try {
      await navigator.clipboard.writeText(petShareUrl);
      setCopied(true);
      toast.success(t('messages.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t('messages.copyFailed'));
    }
  };

  const handleShare = async () => {
    if (!petShareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${pet.name} - Pet Profile`,
          text: shareText,
          url: petShareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast.success(t('messages.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getPetTypeEmoji = (type: string) => {
    switch (type.toLowerCase()) {
      case 'cat': return '🐱';
      case 'dog': return '🐶';
      default: return '🐾';
    }
  };

  useEffect(() => {
    if (showShareEarning) {
      localStorage.setItem('showShareEarning', 'true');
    }
  }, [showShareEarning]);

  useEffect(() => {
    if (localStorage.getItem('showShareEarning') === 'true') {
      setShowShareEarning(true);
      localStorage.removeItem('showShareEarning');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{pet.name}</h1>
                <p className="text-sm text-gray-600">{t('subtitle')}</p>
                {!user && (
                  <p className="text-xs text-blue-600 mt-1">
                    {t('messages.publicView')}
                  </p>
                )}
              </div>
            </div>
            
            {isOwner && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/pet/${pet.id}/tag`)}
                  className="flex items-center space-x-2"
                >
                  <Wifi className="h-4 w-4" />
                  <span>{t('actions.attachTag')}</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2">
                      <List className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/pages/pet/${pet.id}/edit`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('actions.editPet')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="overflow-hidden">
            <div className="relative h-64 md:h-80">
              {pet.imageUrl ? (
                <Image
                  src={pet.imageUrl}
                  alt={pet.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <span className="text-8xl">{getPetTypeEmoji(pet.type)}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 text-white">
                <h2 className="text-3xl font-bold mb-2">{pet.name}</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPetTypeEmoji(pet.type)}</span>
                  <span className="text-lg">{pet.breedName}</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>{t('sections.basicInformation')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">{t('labels.name')}</span>
                      <span className="font-semibold">{pet.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">{t('labels.type')}</span>
                      <span className="font-semibold capitalize">{pet.type}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">{t('labels.breed')}</span>
                      <span className="font-semibold">{pet.breedName}</span>
                    </div>
                    {pet.age && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">{t('labels.age')}</span>
                        <span className="font-semibold">{pet.age}</span>
                      </div>
                    )}
                    {pet.gender && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">{t('labels.gender')}</span>
                        <span className="font-semibold capitalize">{pet.gender}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Description */}
            {pet.description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      <span>{t('sections.description')} {pet.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{pet.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Contact Information - Only show to non-owners */}
            {owner && !isOwner && (owner.phone || owner.phoneNumber) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Phone className="w-5 h-5 text-green-500" />
                      <span>{t('labels.contactDetails')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">{t('labels.phone')}</p>
                        <p className="text-sm text-green-600">
                          {owner.phone || owner.phoneNumber}
                        </p>
                      </div>
                    </div>
                    {owner.displayName || owner.fullName ? (
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-800">בעלים</p>
                          <p className="text-sm text-blue-600">
                            {owner.displayName || owner.fullName}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Timeline - Only show for pet owner */}
            {isOwner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <span>{t('sections.timeline')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-green-800">{t('messages.profileCreated')}</p>
                        <p className="text-sm text-green-600">{formatDate(pet.createdAt)}</p>
                      </div>
                    </div>
                    {pet.updatedAt.getTime() !== pet.createdAt.getTime() && (
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-blue-800">{t('messages.lastUpdated')}</p>
                          <p className="text-sm text-blue-600">{formatDate(pet.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Share */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Share2 className="w-5 h-5" />
                    <span>{t('sections.share')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {t('messages.shareDescription')}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      {copied ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Delete Section - Only visible to authenticated pet owners */}
            {isOwner && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Trash2 className="w-5 h-5 text-red-500" />
                      <span>{t('actions.deletePet')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {t('messages.deleteConfirm', { petName: pet.name })}
                    </p>
                    <Button
                      onClick={handleDeletePet}
                      variant="outline"
                      disabled={isDeleting}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('actions.deleting')}
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('actions.deletePet')}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Call to Action for Non-Authenticated Users */}
            {!user && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-800">
                      <Heart className="w-5 h-5 text-blue-600" />
                      <span>{t('sections.createYourOwn')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-blue-700">
                      {t('messages.createProfileDescription')}
                    </p>
                    <Button
                      onClick={() => router.push('/auth/signup')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {t('actions.createProfile')}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}