'use client';

import { useState, useEffect } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getPetTypesFromFirestore } from '@/lib/firebase/collections/types';
import { getBreedsFromFirestore } from '@/lib/firebase/collections/breeds';
import { updatePetField } from '@/lib/actions/admin';
import toast from 'react-hot-toast';

interface EditableTableCellProps {
  value: string;
  field: 'type' | 'breed';
  petId: string;
  currentType?: string;
  className?: string;
  onUpdate?: (petId: string, field: 'type' | 'breed', newValue: string) => void;
}

export default function EditableTableCell({ 
  value, 
  field, 
  petId, 
  currentType,
  className = '',
  onUpdate
}: EditableTableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [options, setOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      loadOptions();
    }
  }, [isEditing, currentType]);

  const loadOptions = async () => {
    console.log('loadOptions called for field:', field);
    setIsLoading(true);
    try {
      if (field === 'type') {
        console.log('Loading pet types...');
        const types = await getPetTypesFromFirestore();
        console.log('Pet types loaded:', types);
        setOptions(types);
      } else if (field === 'breed') {
        console.log('Loading breeds...');
        const breeds = await getBreedsFromFirestore();
        console.log('All breeds from Firebase:', breeds);
        console.log('Current type for filtering:', currentType);
        
        // Get pet types to map document IDs to type names
        const types = await getPetTypesFromFirestore();
        const typeMap = new Map();
        types.forEach(type => {
          typeMap.set(type.id, type.labels?.en || type.name);
        });
        console.log('Type mapping:', typeMap);
        
        // Filter breeds by current type if available (case-insensitive)
        // Handle both old format (document ID) and new format (type name)
        const filteredBreeds = currentType 
          ? breeds.filter(breed => {
              let breedType = breed.type;
              
              // If breed.type is a document ID, convert it to the actual type name
              if (breed.type && breed.type.length > 10 && typeMap.has(breed.type)) {
                breedType = typeMap.get(breed.type);
                console.log('Converted breed type from', breed.type, 'to', breedType);
              }
              
              return breedType?.toLowerCase() === currentType.toLowerCase();
            })
          : breeds;
        console.log('Filtered breeds for type', currentType, ':', filteredBreeds);
        setOptions(filteredBreeds);
      }
    } catch (error) {
      console.error('Error loading options:', error);
      toast.error('Failed to load options');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (editValue !== value) {
      try {
        const result = await updatePetField(petId, field, editValue);
        if (result.success) {
          toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
          // Notify parent component of the update
          if (onUpdate) {
            onUpdate(petId, field, editValue);
          }
        } else {
          toast.error(result.error || 'Failed to update pet');
        }
      } catch (error) {
        console.error('Error updating pet:', error);
        toast.error('Failed to update pet');
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div 
        className={`cursor-pointer hover:bg-gray-50 p-2 rounded ${className}`}
        onClick={() => setIsEditing(true)}
      >
        <div className="flex items-center justify-between">
          <span>{value}</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={editValue} onValueChange={setEditValue}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${field}`} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <SelectItem value="loading" disabled>Loading...</SelectItem>
          ) : (
            options.map((option) => (
              <SelectItem key={option.id} value={option.labels?.en || option.name}>
                {option.labels?.en || option.name}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSave}
        disabled={isLoading}
        className="h-8 w-8 p-0"
      >
        <Check className="h-4 w-4 text-green-600" />
      </Button>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4 text-red-600" />
      </Button>
    </div>
  );
}