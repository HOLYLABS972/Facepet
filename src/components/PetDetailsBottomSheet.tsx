'use client';

import { motion } from 'framer-motion';
import { X, Trash2, MoreVertical, Edit } from 'lucide-react';
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

interface Pet {
  id: string;
  name: string;
  breed: string;
  image: string;
  description?: string;
  age?: string;
  gender?: string;
  notes?: string;
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
  const router = useRouter();

  if (!pet) return null;

  const handleDeletePet = async () => {
    try {
      await deleteDoc(doc(db, 'pets', pet.id));
      toast.success('Pet deleted successfully');
      if (onDeletePet) {
        onDeletePet(pet.id);
      }
      onClose();
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.error('Failed to delete pet');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{pet.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/pet/${pet.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Pet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClose} className="text-gray-500">
                  Close
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pet Image */}
          {pet.image && pet.image !== '/default-pet.png' ? (
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
            <div className="w-full h-48 rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-6xl">🐾</span>
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
                <span>{pet.breed}</span>
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
              
              {pet.notes && (
                <div>
                  <span className="font-medium text-gray-600 block mb-1">Notes:</span>
                  <p className="text-sm text-gray-700">{pet.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete Pet Button */}
          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDeletePet}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Pet
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
