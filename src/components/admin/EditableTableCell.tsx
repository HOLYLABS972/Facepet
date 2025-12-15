'use client';

import { useState, useEffect } from 'react';
import { Check, X, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updatePetField } from '@/lib/actions/admin';
import { getBreedsForDropdown, getGendersForDropdown, getPetTypesForDropdown } from '@/src/lib/firebase/dropdown-data';
import { getPetTypes, getBreeds, getGenders } from '@/src/lib/hardcoded-data';
import toast from 'react-hot-toast';
import { useLocale } from 'next-intl';

interface EditableTableCellProps {
  value: string;
  field: 'type' | 'breed' | 'gender' | 'weight';
  petId: string;
  className?: string;
  onUpdate?: (petId: string, field: 'type' | 'breed' | 'gender' | 'weight', newValue: string) => void;
}

export default function EditableTableCell({ 
  value, 
  field, 
  petId, 
  className = '',
  onUpdate
}: EditableTableCellProps) {
  const locale = useLocale() as 'en' | 'he';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch dropdown options when editing starts
  useEffect(() => {
    if (isEditing) {
      fetchOptions();
    }
  }, [isEditing, field]);

  const fetchOptions = async () => {
    setIsLoading(true);
    try {
      let data: { value: string; label: string }[] = [];
      
      switch (field) {
        case 'type':
          data = await getPetTypesForDropdown(locale);
          break;
        case 'breed':
          data = await getBreedsForDropdown(undefined, locale);
          break;
        case 'gender':
          data = await getGendersForDropdown(locale);
          break;
      }
      
      setOptions(data);
    } catch (error) {
      console.error('Error fetching options:', error);
      toast.error('Failed to load options');
    } finally {
      setIsLoading(false);
    }
  };

  // Get the translated label for the current value
  const getTranslatedLabel = (value: string): string => {
    if (field === 'weight') return value;
    
    try {
      let data: { value: string; label: string }[] = [];
      
      switch (field) {
        case 'type':
          data = getPetTypes(locale);
          break;
        case 'breed':
          data = getBreeds(locale);
          break;
        case 'gender':
          data = getGenders(locale);
          break;
      }
      
      const option = data.find(opt => opt.value === value);
      return option ? option.label : value;
    } catch (error) {
      console.error('Error getting translated label:', error);
      return value;
    }
  };

  const handleSave = async () => {
    if (editValue.trim() !== value.trim()) {
      try {
        const result = await updatePetField(petId, field, editValue.trim());
        if (result.success) {
          toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
          // Notify parent component of the update
          if (onUpdate) {
            onUpdate(petId, field, editValue.trim());
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
          <span>{getTranslatedLabel(value) || 'Not specified'}</span>
          <Edit className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {field === 'weight' ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="Enter weight (e.g., 5 kg, 10 lbs)"
          disabled={isLoading}
          className="w-full"
        />
      ) : (
        <Select value={editValue} onValueChange={setEditValue} disabled={isLoading}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? 'Loading...' : `Select ${field}`} />
          </SelectTrigger>
          <SelectContent>
            {isLoading ? (
              <SelectItem value="loading" disabled>Loading...</SelectItem>
            ) : (
              options
                .filter((option) => option.value && option.value !== '')
                .map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
            )}
          </SelectContent>
        </Select>
      )}
      
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