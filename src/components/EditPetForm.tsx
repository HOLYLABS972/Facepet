'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { uploadPetImage } from '@/src/lib/firebase/simple-upload';
import { updatePetInFirestore, deletePetFromFirestore } from '@/src/lib/firebase/pets';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, Loader2, CheckCircle, XCircle, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from '@/i18n/routing';
import { BreedSelect } from './ui/breed-select';
import { getBreedsForType, type PetType } from '@/src/lib/data/breeds';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  imageUrl?: string;
  description?: string;
  age?: string;
  gender?: string;
  notes?: string;
}

interface EditPetFormProps {
  pet: Pet;
}

interface PetFormData {
  name: string;
  type: string;
  breed: string;
  image: File | null;
  imageUrl: string;
  description: string;
  age: string;
  gender: string;
  notes: string;
}

interface UploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const petTypes: { value: PetType; label: string; emoji: string }[] = [
  { value: 'cat', label: 'Cat', emoji: '🐱' },
  { value: 'dog', label: 'Dog', emoji: '🐶' },
  { value: 'bird', label: 'Bird', emoji: '🐦' },
  { value: 'fish', label: 'Fish', emoji: '🐠' },
  { value: 'hamster', label: 'Hamster', emoji: '🐹' },
  { value: 'rabbit', label: 'Rabbit', emoji: '🐰' },
  { value: 'turtle', label: 'Turtle', emoji: '🐢' },
  { value: 'snake', label: 'Snake', emoji: '🐍' },
  { value: 'lizard', label: 'Lizard', emoji: '🦎' },
  { value: 'ferret', label: 'Ferret', emoji: '🦦' },
  { value: 'guinea-pig', label: 'Guinea Pig', emoji: '🐹' },
  { value: 'chinchilla', label: 'Chinchilla', emoji: '🐭' },
  { value: 'hedgehog', label: 'Hedgehog', emoji: '🦔' },
  { value: 'other', label: 'Other', emoji: '🐾' },
];

export default function EditPetForm({ pet }: EditPetFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState<PetFormData>({
    name: pet.name || '',
    type: pet.type || '',
    breed: pet.breed || '',
    image: null,
    imageUrl: pet.imageUrl || '',
    description: pet.description || '',
    age: pet.age || '',
    gender: pet.gender || '',
    notes: pet.notes || '',
  });
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'completed',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleInputChange = (field: keyof PetFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Reset breed when type changes
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        breed: '',
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;

      // Upload new image if one was selected
      if (formData.image) {
        setUploadProgress({ progress: 0, status: 'uploading' });
        
        const uploadResult = await uploadPetImage(
          formData.image,
          user.uid,
          (progress) => {
            setUploadProgress({ progress, status: 'uploading' });
          }
        );

        if (uploadResult.success && uploadResult.downloadURL) {
          imageUrl = uploadResult.downloadURL;
          setUploadProgress({ progress: 100, status: 'completed' });
        } else {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
      }

      const petData = {
        name: formData.name,
        type: formData.type,
        breedName: formData.breed,
        imageUrl,
        description: formData.description,
        age: formData.age,
        gender: formData.gender,
        notes: formData.notes,
      };

      await updatePetInFirestore(pet.id, petData);
      toast.success('Pet updated successfully!');
      router.push('/pages/my-pets');
    } catch (error) {
      console.error('Error updating pet:', error);
      toast.error('Failed to update pet. Please try again.');
      setUploadProgress({ progress: 0, status: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setIsDeleting(true);

    try {
      await deletePetFromFirestore(pet.id);
      toast.success('Pet deleted successfully!');
      router.push('/pages/my-pets');
    } catch (error) {
      console.error('Error deleting pet:', error);
      toast.error('Failed to delete pet. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-800">
                Edit Pet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pet Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Pet Name *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your pet's name"
                    required
                    className="w-full"
                  />
                </div>

                {/* Pet Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                    Pet Type *
                  </Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select pet type</option>
                    {petTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.emoji} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Breed Selection */}
                {formData.type && (
                  <div className="space-y-2">
                    <Label htmlFor="breed" className="text-sm font-medium text-gray-700">
                      Breed
                    </Label>
                    <BreedSelect
                      petType={formData.type as PetType}
                      value={formData.breed}
                      onChange={(value) => handleInputChange('breed', value)}
                      placeholder="Select breed"
                    />
                  </div>
                )}

                {/* Current Image Display */}
                {formData.imageUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Current Photo
                    </Label>
                    <div className="relative w-32 h-32 mx-auto">
                      <Image
                        src={formData.imageUrl}
                        alt={formData.name}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-sm font-medium text-gray-700">
                    {formData.imageUrl ? 'Change Photo' : 'Upload Photo'}
                  </Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="image"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 10MB)</p>
                      </div>
                      <input
                        id="image"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploadProgress.status === 'uploading' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploading...</span>
                      <span className="text-gray-600">{uploadProgress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description
                  </Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Tell us about your pet..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Age and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                      Age
                    </Label>
                    <Input
                      id="age"
                      type="text"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="e.g., 2 years old"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      Gender
                    </Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                    Notes
                  </Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional notes about your pet..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Action Buttons - Leading and Opposite Side */}
                <div className="flex justify-between items-center pt-6">
                  <Button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    variant="destructive"
                    className="flex items-center"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Pet
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={isSubmitting || uploadProgress.status === 'uploading'}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Update Pet
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
