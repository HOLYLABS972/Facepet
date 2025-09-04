'use client';

import { useState } from 'react';
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
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/src/lib/firebase/config';
import toast from 'react-hot-toast';

interface AddTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddTypeModal({ isOpen, onClose }: AddTypeModalProps) {
  const [typeName, setTypeName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!typeName.trim()) {
      toast.error('Type name is required');
      return;
    }

    setIsLoading(true);
    
    try {
      await addDoc(collection(db, 'petTypes'), {
        name: typeName.trim(),
        labels: {
          en: typeName.trim()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Pet type added successfully');
      setTypeName('');
      onClose();
    } catch (error) {
      console.error('Error adding pet type:', error);
      toast.error('Failed to add pet type');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Pet Type</DialogTitle>
          <DialogDescription>
            Add a new pet type to the system. This will be available for pet registration.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="typeName" className="text-right">
                Type Name
              </Label>
              <Input
                id="typeName"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Dog, Cat, Bird"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
