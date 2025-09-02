'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Trash2, Wifi, Share2, Copy, Check, Calendar, MapPin, Phone, Mail, Heart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useRouter } from '@/i18n/routing';
import Image from 'next/image';
import toast from 'react-hot-toast';
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

interface PetProfilePageProps {
  pet: Pet;
}

export default function PetProfilePage({ pet }: PetProfilePageProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const petShareUrl = typeof window !== 'undefined' ? `${window.location.origin}/pet/${pet.id}` : '';

  const handleDeletePet = async () => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'pets', pet.id));
      toast.success('Pet deleted successfully');
      router.push('/pages/my-pets');
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.error('Failed to delete pet');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!petShareUrl) return;
    try {
      await navigator.clipboard.writeText(petShareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    if (!petShareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${pet.name} - Pet Profile`,
          text: `Check out ${pet.name}'s pet profile!`,
          url: petShareUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyLink();
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
                <p className="text-sm text-gray-600">Pet Profile</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full mx-1"></div>
                    <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/pet/${pet.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Pet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/pet/${pet.id}/nfc`)}>
                  <Wifi className="mr-2 h-4 w-4" />
                  Attach NFC
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDeletePet} className="text-red-600" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Deleting...' : 'Delete Pet'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Name</span>
                      <span className="font-semibold">{pet.name}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Type</span>
                      <span className="font-semibold capitalize">{pet.type}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-600">Breed</span>
                      <span className="font-semibold">{pet.breedName}</span>
                    </div>
                    {pet.age && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Age</span>
                        <span className="font-semibold">{pet.age}</span>
                      </div>
                    )}
                    {pet.gender && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-600">Gender</span>
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
                      <span>About {pet.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{pet.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span>Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-green-800">Profile Created</p>
                      <p className="text-sm text-green-600">{formatDate(pet.createdAt)}</p>
                    </div>
                  </div>
                  {pet.updatedAt.getTime() !== pet.createdAt.getTime() && (
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-blue-800">Last Updated</p>
                        <p className="text-sm text-blue-600">{formatDate(pet.updatedAt)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => router.push(`/pet/${pet.id}/edit`)}
                    className="w-full"
                    variant="outline"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button
                    onClick={() => router.push(`/pet/${pet.id}/nfc`)}
                    className="w-full"
                    variant="outline"
                  >
                    <Wifi className="w-4 h-4 mr-2" />
                    Attach NFC
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Share */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Share2 className="w-5 h-5" />
                    <span>Share Profile</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Share {pet.name}'s profile with others
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

            {/* Pet Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Profile Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Profile Views</span>
                    <span className="font-semibold">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Days Active</span>
                    <span className="font-semibold">
                      {Math.ceil((Date.now() - pet.createdAt.getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="font-semibold text-sm">
                      {Math.ceil((Date.now() - pet.updatedAt.getTime()) / (1000 * 60 * 60 * 24))} days ago
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}