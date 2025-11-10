'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { uploadPetImage } from '@/src/lib/firebase/simple-upload';
import { updatePetInFirestore } from '@/src/lib/firebase/simple-pets';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, Loader2, CheckCircle, XCircle, Save, ArrowLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from '@/i18n/routing';
import { getBreedsForDropdown, getGendersForDropdown, getPetTypesForDropdown } from '@/src/lib/firebase/dropdown-data';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import Image from 'next/image';
import GetStartedDatePicker from './get-started/ui/GetStartedDatePicker';

interface Pet {
  id: string;
  name: string;
  type: string;
  breedName: string;
  breedId?: string;
  imageUrl?: string;
  description?: string;
  age?: string;
  gender?: string;
  weight?: string;
  notes?: string;
  birthDate?: string;
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
  birthDate: string;
  gender: string;
  weight: string;
  notes: string;
}

interface UploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}


export default function EditPetForm({ pet }: EditPetFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('Pet.edit');
  const locale = useLocale() as 'en' | 'he';
  const [formData, setFormData] = useState<PetFormData>({
    name: pet.name || '',
    type: pet.type || '',
    breed: pet.breedName || '',
    image: null,
    imageUrl: pet.imageUrl || '',
    birthDate: pet.birthDate || '',
    gender: pet.gender || '',
    weight: pet.weight || '',
    notes: pet.notes || '',
  });
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'completed',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [breeds, setBreeds] = useState<{ value: string; label: string }[]>([]);
  const [genders, setGenders] = useState<{ value: string; label: string }[]>([]);
  const [petTypes, setPetTypes] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  // Fetch dropdown data from database
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        setIsLoadingDropdowns(true);
        const [breedsData, gendersData, typesData] = await Promise.all([
          getBreedsForDropdown(undefined, locale),
          getGendersForDropdown(locale),
          getPetTypesForDropdown(locale)
        ]);
        
        setBreeds(breedsData);
        setGenders(gendersData);
        setPetTypes(typesData);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
        toast.error('Failed to load form data');
      } finally {
        setIsLoadingDropdowns(false);
      }
    };

    fetchDropdownData();
  }, [locale]);

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error('Please log in to upload images');
      return;
    }

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setFormData(prev => ({
      ...prev,
      image: file,
    }));

    setUploadProgress({ progress: 0, status: 'uploading' });

    try {
      const result = await uploadPetImage(file, user);
      
      if (result.success && result.downloadURL) {
        setFormData(prev => ({
          ...prev,
          imageUrl: result.downloadURL || ''
        }));
        setUploadProgress({ progress: 100, status: 'completed' });
        toast.success('Image uploaded successfully');
      } else {
        setUploadProgress({ progress: 0, status: 'error' });
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({ progress: 0, status: 'error' });
      toast.error('Upload failed. Please try again.');
    }
  };

  const handleDeletePet = async () => {
    if (!pet.id) {
      toast.error('Pet ID not found');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/pets/${pet.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast.success(t('deleteSuccess'));
        router.push('/pages/my-pets');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || t('deleteError'));
      }
    } catch (error) {
      console.error('Delete pet error:', error);
      toast.error(t('deleteError'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const petData = {
        name: formData.name,
        type: formData.type,
        breedName: formData.breed,
        imageUrl: formData.imageUrl, // Use the already uploaded image URL
        birthDate: formData.birthDate,
        gender: formData.gender,
        weight: formData.weight,
        notes: formData.notes,
      };

      console.log('Updating pet with data:', petData);
      console.log('Original pet name:', pet.name);
      console.log('Form data name:', formData.name);
      console.log('Pet data name being sent:', petData.name);
      
      const updateResult = await updatePetInFirestore(pet.id, petData);
      console.log('Update result:', updateResult);
      
      if (updateResult.success) {
        toast.success(t('success'));
        // Force refresh the page to ensure updated data is displayed
        window.location.href = '/pages/my-pets';
      } else {
        throw new Error(updateResult.error || 'Failed to update pet');
      }
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
            <CardHeader className="text-center relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="absolute left-0 top-1/2 -translate-y-1/2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
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
                    disabled={isLoadingDropdowns}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="">{isLoadingDropdowns ? 'Loading...' : t('form.selectType')}</option>
                    {petTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
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
                    <select
                      id="breed"
                      value={formData.breed}
                      onChange={(e) => handleInputChange('breed', e.target.value)}
                      disabled={isLoadingDropdowns}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">{isLoadingDropdowns ? 'Loading...' : t('form.selectBreed')}</option>
                      {breeds.map((breed) => (
                        <option key={breed.value} value={breed.value}>
                          {breed.label}
                        </option>
                      ))}
                    </select>
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
                      <span className="text-gray-600">{t('form.updating')}</span>
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


                {/* Birth Date and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-2">
                    <GetStartedDatePicker
                      label={t('form.birthDate')}
                      id="birthDate"
                      value={formData.birthDate}
                      maxDate={new Date()}
                      onChange={(date) => {
                        if (date) {
                          handleInputChange('birthDate', date.toISOString());
                        }
                      }}
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
                      disabled={isLoadingDropdowns}
                      className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">{isLoadingDropdowns ? 'Loading...' : t('form.selectGender')}</option>
                      {genders.map((gender) => (
                        <option key={gender.value} value={gender.value}>
                          {gender.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Weight and Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                      {t('form.weight')}
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder={t('form.weightPlaceholder')}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                      {t('form.notes')}
                    </Label>
                    <Input
                      id="notes"
                      type="text"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder={t('form.notesPlaceholder')}
                      className="w-full"
                    />
                  </div>
                </div>



                {/* Action Buttons */}
                <div className="flex justify-between pt-6">
                  {/* Delete Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isSubmitting || isDeleting || uploadProgress.status === 'uploading'}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('form.delete')}
                  </Button>

                  {/* Save Button */}
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('deleteConfirm.title')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('deleteConfirm.message')}
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                {t('deleteConfirm.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePet}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('deleteConfirm.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('deleteConfirm.delete')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
