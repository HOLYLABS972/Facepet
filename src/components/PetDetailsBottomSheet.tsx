'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
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
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Pet
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-lg p-6 max-w-sm mx-4"
              >
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
                  <h3 className="text-lg font-semibold">Delete Pet</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete <strong>{pet.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeletePet}
                    className="flex-1"
                  >
                    Yes, Delete
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
