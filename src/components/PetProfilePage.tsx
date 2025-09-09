'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Wifi, Share2, Copy, Check, Calendar, MapPin, Phone, Mail, Heart, Star, Loader2, Users, Plus, Edit, MessageCircle } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import VetDataModal from './VetDataModal';

import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';
import { 
  generateEmailPrefillUrl, 
  generateWhatsAppPrefillUrl, 
  generateSMSPrefillUrl,
  generatePetFoundMessage,
  isLikelyWhatsApp,
  formatPhoneNumber
} from '@/utils/contact-utils';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  imageUrl: string;
  description?: string;
  age?: string;
  gender?: string;
  weight?: string;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  birthDate?: string;
}

interface Owner {
  id: string;
  displayName?: string;
  phone?: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  homeAddress?: string;
}

interface Vet {
  id: string;
  name?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  // Vet privacy settings - all vet info can be private
  isNamePrivate?: boolean;
  isPhonePrivate?: boolean;
  isEmailPrivate?: boolean;
  isAddressPrivate?: boolean;
}

interface PetProfilePageProps {
  pet: Pet;
  owner?: Owner;
  vet?: Vet;
}

export default function PetProfilePage({ pet, owner, vet }: PetProfilePageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('pages.PetProfilePage');
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareEarning, setShowShareEarning] = useState(false);
  const [isVetModalOpen, setIsVetModalOpen] = useState(false);
  const [isEditingVet, setIsEditingVet] = useState(false);
  const [currentVet, setCurrentVet] = useState(vet);
  
  // Debug: Log the pet data to see what's being received
  console.log('PetProfilePage received pet data:', {
    id: pet.id,
    name: pet.name,
    weight: pet.weight,
    allPetData: pet
  });
  
  // Update currentVet when vet prop changes
  useEffect(() => {
    setCurrentVet(vet);
  }, [vet]);
  
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

  const handleAddVet = () => {
    setIsEditingVet(false);
    setIsVetModalOpen(true);
  };

  const handleEditVet = () => {
    setIsEditingVet(true);
    setIsVetModalOpen(true);
  };

  const handleSaveVet = async (vetData: any) => {
    try {
      // For now, we'll just update the local state
      // In a real implementation, you'd save this to Firebase
      const newVet = {
        id: currentVet?.id || 'new-vet-id',
        ...vetData
      };
      setCurrentVet(newVet);
      toast.success('Veterinary information saved successfully');
    } catch (error) {
      console.error('Error saving vet data:', error);
      toast.error('Failed to save veterinary information');
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
              {!user ? (
                <div className="flex flex-col items-start">
                  <button
                    onClick={() => router.push('/')}
                    className="text-primary font-['Lobster'] text-2xl font-bold hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    FacePet
                  </button>
                  <div className="text-xs text-gray-500 mt-1">
                    Powered by NFC technology
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
            </div>
            
            <div className="text-right">
              <h1 className="text-xl font-bold">{pet.name}</h1>
              <p className="text-sm text-gray-600">{t('subtitle')}</p>
              {!user && (
                <p className="text-xs text-gray-500 mt-1">
                  {t('messages.publicView')}
                </p>
              )}
            </div>
            
            {/* Attach Tag button removed */}
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
                  <span className="text-lg">{pet.breed}</span>
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
                      <span className="font-semibold">{pet.breed || t('labels.notSpecified')}</span>
                    </div>
                    {pet.age && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">{t('labels.age')}</span>
                        <span className="font-semibold">{pet.age}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">{t('labels.gender')}</span>
                      <span className="font-semibold capitalize">{pet.gender || t('labels.notSpecified')}</span>
                    </div>
                    {pet.weight && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">{t('labels.weight')}</span>
                        <span className="font-semibold">{pet.weight}</span>
                      </div>
                    )}
                    {pet.notes && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">{t('labels.notes')}</span>
                        <span className="font-semibold">{pet.notes}</span>
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
            {owner && !isOwner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-black" />
                      <span className="text-black">{t('labels.contactDetails')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(owner.phone || owner.phoneNumber) && (
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <Phone className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-medium text-green-800">{t('labels.phone')}</p>
                          <p className="text-sm text-green-600">
                            {owner.phone || owner.phoneNumber}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {isLikelyWhatsApp(owner.phone || owner.phoneNumber || '') && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-green-600 border-green-300 hover:bg-green-100"
                              onClick={() => {
                                const phoneNumber = formatPhoneNumber(owner.phone || owner.phoneNumber || '');
                                const message = generatePetFoundMessage(pet.name);
                                const whatsappUrl = generateWhatsAppPrefillUrl(phoneNumber, message);
                                window.open(whatsappUrl, '_blank');
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              WhatsApp
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-green-600 border-green-300 hover:bg-green-100"
                            onClick={() => {
                              const phoneNumber = formatPhoneNumber(owner.phone || owner.phoneNumber || '');
                              const message = generatePetFoundMessage(pet.name);
                              const smsUrl = generateSMSPrefillUrl(phoneNumber, message);
                              window.open(smsUrl, '_blank');
                            }}
                          >
                            <Phone className="w-4 h-4 mr-1" />
                            SMS
                          </Button>
                        </div>
                      </div>
                    )}
                    {(owner.displayName || owner.fullName) && (
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-800">{t('labels.owner')}</p>
                          <p className="text-sm text-blue-600">
                            {owner.displayName || owner.fullName}
                          </p>
                        </div>
                      </div>
                    )}
                    {owner.email && (
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-blue-800">{t('labels.email')}</p>
                          <p className="text-sm text-blue-600">
                            {owner.email}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-blue-600 border-blue-300 hover:bg-blue-100"
                          onClick={() => {
                            const subject = `Pet Found: ${pet.name}`;
                            const message = generatePetFoundMessage(pet.name);
                            const emailUrl = generateEmailPrefillUrl(owner.email, subject, message);
                            window.open(emailUrl, '_blank');
                          }}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Email
                        </Button>
                      </div>
                    )}
                    {owner.homeAddress && (
                      <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                        <MapPin className="w-5 h-5 text-orange-600" />
                        <div className="flex-1">
                          <p className="font-medium text-orange-800">{t('labels.address')}</p>
                          <p className="text-sm text-orange-600">{owner.homeAddress}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-orange-600 border-orange-300 hover:bg-orange-100"
                          onClick={() => {
                            const encodedAddress = encodeURIComponent(owner.homeAddress || '');
                            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                            window.open(googleMapsUrl, '_blank');
                          }}
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          Maps
                        </Button>
                      </div>
                    )}
                    {!(owner.phone || owner.phoneNumber) && !(owner.displayName || owner.fullName) && !owner.email && !owner.homeAddress && (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <p>No contact information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Vet Information - Show to both owners and non-owners */}
            {currentVet && (currentVet.name || currentVet.phoneNumber || currentVet.email || currentVet.address) ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        <span>{t('sections.veterinaryInformation')}</span>
                      </div>
                      {/* Edit Vet button removed */}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Vet Clinic Info */}
                    <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                      <div className="w-5 h-5 text-purple-600">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 21h18"/>
                          <path d="M5 21V7l8-4v18"/>
                          <path d="M19 21V11l-6-4"/>
                          <path d="M9 9v.01"/>
                          <path d="M9 12v.01"/>
                          <path d="M9 15v.01"/>
                          <path d="M9 18v.01"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-purple-800">{t('labels.veterinaryClinic')}</p>
                        <p className="text-sm text-purple-600">
                          {currentVet.name && (!isOwner || !currentVet.isNamePrivate) 
                            ? currentVet.name 
                            : t('messages.noVetData')
                          }
                        </p>
                        {(currentVet.phoneNumber && (!isOwner || !currentVet.isPhonePrivate)) && (
                          <p className="text-xs text-purple-500 mt-1">{currentVet.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional vet details with contact buttons */}
                    {(currentVet.email && (!isOwner || !currentVet.isEmailPrivate)) || (currentVet.address && (!isOwner || !currentVet.isAddressPrivate)) ? (
                      <div className="space-y-2">
                        {currentVet.email && (!isOwner || !currentVet.isEmailPrivate) && (
                          <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-blue-600" />
                              <span className="text-sm text-blue-600">{currentVet.email}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-blue-600 border-blue-300 hover:bg-blue-100 text-xs"
                              onClick={() => {
                                const subject = `Pet Found: ${pet.name} - Vet Contact`;
                                const message = generatePetFoundMessage(pet.name);
                                const emailUrl = generateEmailPrefillUrl(currentVet.email || '', subject, message);
                                window.open(emailUrl, '_blank');
                              }}
                            >
                              <Mail className="w-3 h-3 mr-1" />
                              Email
                            </Button>
                          </div>
                        )}
                        {currentVet.address && (!isOwner || !currentVet.isAddressPrivate) && (
                          <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-orange-600" />
                              <span className="text-sm text-orange-600">{currentVet.address}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-orange-600 border-orange-300 hover:bg-orange-100 text-xs"
                              onClick={() => {
                                const encodedAddress = encodeURIComponent(currentVet.address || '');
                                const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                                window.open(googleMapsUrl, '_blank');
                              }}
                            >
                              <MapPin className="w-3 h-3 mr-1" />
                              Maps
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : null}
                    
                    {/* Show message if all vet info is private for owner */}
                    {isOwner && currentVet.isNamePrivate && currentVet.isPhonePrivate && currentVet.isEmailPrivate && currentVet.isAddressPrivate && (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <p>{t('messages.vetInfoPrivate')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        <span>{t('sections.veterinaryInformation')}</span>
                      </div>
                      {isOwner && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddVet}
                          className="flex items-center space-x-1"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{t('messages.addVet')}</span>
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center p-6 text-gray-500">
                      <p>{t('messages.noVetData')}</p>
                    </div>
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
                <Card className="border-gray-200 bg-gray-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-800">
                      <Heart className="w-5 h-5 text-gray-600" />
                      <span>{t('sections.createYourOwn')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-700">
                      {t('messages.createProfileDescription')}
                    </p>
                    <Button
                      onClick={() => router.push('/auth')}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white"
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

      {/* Vet Data Modal */}
      <VetDataModal
        isOpen={isVetModalOpen}
        onClose={() => setIsVetModalOpen(false)}
        onSave={handleSaveVet}
        initialData={isEditingVet ? currentVet : null}
        isEditing={isEditingVet}
      />
    </div>
  );
}