'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface AddBreedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PetType {
  id: string;
  name: string;
  labels: {
    en: string;
    he: string;
  };
}

export default function AddBreedModal({ isOpen, onClose }: AddBreedModalProps) {
  const t = useTranslations('Admin.dialogs.addBreed');
  const [breedName, setBreedName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [petTypes, setPetTypes] = useState<PetType[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPetTypes();
    }
  }, [isOpen]);

  const fetchPetTypes = async () => {
    try {
      const typesSnapshot = await getDocs(collection(db, 'petTypes'));
      const types = typesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PetType));
      setPetTypes(types);
    } catch (error) {
      console.error('Error fetching pet types:', error);
      toast.error('Failed to load pet types');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!breedName.trim()) {
      toast.error('Breed name is required');
      return;
    }

    if (!selectedType) {
      toast.error('Please select a pet type');
      return;
    }

    setIsLoading(true);
    
    try {
      // Find the selected pet type to get its name
      const selectedPetType = petTypes.find(type => type.id === selectedType);
      const typeName = selectedPetType?.labels?.en || selectedPetType?.name || selectedType;
      
      await addDoc(collection(db, 'breeds'), {
        name: breedName.trim(),
        type: typeName.toLowerCase(), // Store the actual type name in lowercase
        labels: {
          en: breedName.trim()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Breed added successfully');
      setBreedName('');
      setSelectedType('');
      onClose();
    } catch (error) {
      console.error('Error adding breed:', error);
      toast.error('Failed to add breed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="petType" className="text-right">
                {t('petType')}
              </Label>
              <Select value={selectedType} onValueChange={setSelectedType} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={t('petTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {petTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.labels.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="breedName" className="text-right">
                {t('breedName')}
              </Label>
              <Input
                id="breedName"
                value={breedName}
                onChange={(e) => setBreedName(e.target.value)}
                className="col-span-3"
                placeholder={t('breedNamePlaceholder')}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('adding') : t('add')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
