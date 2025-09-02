'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { uploadPetImage } from '@/src/lib/firebase/simple-upload';
import { updatePetInFirestore } from '@/src/lib/firebase/simple-pets';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, Loader2, CheckCircle, XCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from '@/i18n/routing';
import { BreedSelect } from './ui/breed-select';
import { getBreedsForType, type PetType } from '@/src/lib/data/breeds';
import { useTranslations } from 'next-intl';
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
}

interface UploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const petTypes: { value: PetType; label: string; emoji: string }[] = [
  { value: 'cat', label: 'Cat', emoji: '🐱' },
  { value: 'dog', label: 'Dog', emoji: '🐶' },
  { value: 'other', label: 'Other', emoji: '🐾' },
];

export default function EditPetForm({ pet }: EditPetFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('Pet.edit');
  const [formData, setFormData] = useState<PetFormData>({
    name: pet.name || '',
    type: pet.type || '',
    breed: pet.breed || '',
    image: null,
    imageUrl: pet.imageUrl || '',
    description: pet.description || '',
    age: pet.age || '',
    gender: pet.gender || '',
  });
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'completed',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      };

      await updatePetInFirestore(pet.id, petData);
      toast.success(t('success'));
      router.push('/pages/my-pets');
    } catch (error) {
      console.error('Error updating pet:', error);
      toast.error(t('error'));
      setUploadProgress({ progress: 0, status: 'error' });
    } finally {
      setIsSubmitting(false);
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
                {t('title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pet Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    {t('form.name')} *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={t('form.name')}
                    required
                    className="w-full"
                  />
                </div>

                {/* Pet Type */}
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                    {t('form.type')} *
                  </Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('form.selectType')}</option>
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
                      {t('form.breed')}
                    </Label>
                    <BreedSelect
                      petType={formData.type as PetType}
                      value={formData.breed}
                      onValueChange={(value) => handleInputChange('breed', value)}
                      placeholder={t('form.selectBreed')}
                    />
                  </div>
                )}

                {/* Current Image Display */}
                {formData.imageUrl && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
{t('form.currentPhoto')}
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
{formData.imageUrl ? t('form.changePhoto') : t('form.uploadPhoto')}
                  </Label>
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="image"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">{t('form.uploadPrompt')}</span>
                        </p>
                        <p className="text-xs text-gray-500">{t('form.imageRequirements')}</p>
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
                    {t('form.description')}
                  </Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={t('form.descriptionPlaceholder')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Age and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age" className="text-sm font-medium text-gray-700">
                      {t('form.age')}
                    </Label>
                    <Input
                      id="age"
                      type="text"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder={t('form.agePlaceholder')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      {t('form.gender')}
                    </Label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('form.selectGender')}</option>
                      <option value="male">{t('form.genderMale')}</option>
                      <option value="female">{t('form.genderFemale')}</option>
                    </select>
                  </div>
                </div>



                {/* Action Button */}
                <div className="flex justify-center pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting || uploadProgress.status === 'uploading'}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('form.updating')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {t('form.save')}
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
