'use client';

import { motion } from 'framer-motion';
import { MoreVertical, X, Trash2, Share2, Edit, Wifi, List, PawPrint } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useRouter } from '@/i18n/routing';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { getBreedNameFromId } from '@/src/lib/firebase/breed-utils';
import { useLocale, useTranslations } from 'next-intl';

interface Pet {
  id: string;
  name: string;
  breed: string;
  image: string;
  description?: string;
  age?: string;
  gender?: string;
}

interface PetDetailsBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pet: Pet | null;
  onDeletePet?: (petId: string) => void;
}

export default function PetDetailsBottomSheet({
  isOpen,
  onClose,
  pet,
  onDeletePet
}: PetDetailsBottomSheetProps) {
  const locale = useLocale() as 'en' | 'he';
  const t = useTranslations('Pet');
  const router = useRouter();

  if (!pet) return null;

  const handleDeletePet = async () => {
    try {
      await deleteDoc(doc(db, 'pets', pet.id));
      toast.success(t('messages.petDeleted'));
      if (onDeletePet) {
        onDeletePet(pet.id);
      }
      onClose();
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.error(t('messages.deleteFailed'));
    }
  };

  const handleSharePet = async () => {
    const petShareUrl = `${window.location.origin}/pet/${pet.id}`;
    
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
      try {
        await navigator.clipboard.writeText(petShareUrl);
        toast.success(t('messages.linkCopied'));
      } catch (error) {
        toast.error(t('messages.copyFailed'));
      }
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <span className="flex-1 text-center">{pet.name}</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/pet/${pet.id}/tag`)}
                className="flex items-center space-x-1"
              >
                <Wifi className="h-4 w-4" />
                <span>{t('actions.attachTag')}</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/pet/${pet.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    {t('actions.editPet')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSharePet}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {t('actions.share')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDeletePet} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('actions.deletePet')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pet Image */}
          {pet.image && pet.image !== '/default-pet.png' && !pet.image.includes('default') ? (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <Image
                src={pet.image}
                alt={pet.name}
                fill
                className="object-cover"
                onError={(e) => {
                  console.log('Image failed to load:', pet.image);
                }}
              />
            </div>
          ) : (
            <div className="w-full h-48 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <PawPrint className="h-16 w-16 text-gray-400" />
            </div>
          )}

          {/* Pet Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{pet.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Breed:</span>
                <span>{getBreedNameFromId(pet.breed, locale as 'en' | 'he')}</span>
              </div>
              
              {pet.age && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Age:</span>
                  <span>{pet.age} years</span>
                </div>
              )}
              
              {pet.gender && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Gender:</span>
                  <span>{pet.gender}</span>
                </div>
              )}
              
              {pet.description && (
                <div>
                  <span className="font-medium text-gray-600 block mb-1">Description:</span>
                  <p className="text-sm text-gray-700">{pet.description}</p>
                </div>
              )}
              
              {pet.age && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Age:</span>
                  <span>{pet.age}</span>
                </div>
              )}
              
              {pet.gender && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Gender:</span>
                  <span className="capitalize">{pet.gender}</span>
                </div>
              )}
              

            </CardContent>
          </Card>


        </div>
      </DialogContent>
    </Dialog>
  );
}
