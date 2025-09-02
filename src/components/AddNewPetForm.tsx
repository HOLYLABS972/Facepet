'use client';

import { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { uploadPetImage } from '@/src/lib/firebase/simple-upload';
import { createPetInFirestore } from '@/src/lib/firebase/simple-pets';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, Loader2, CheckCircle, XCircle, ArrowRight, ArrowLeft, Heart, Star, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from '@/i18n/routing';
import { BreedSelect } from './ui/breed-select';
import { getBreedsForType, type PetType } from '@/src/lib/data/breeds';
import { motion, AnimatePresence } from 'framer-motion';

interface PetFormData {
  name: string;
  type: string;
  breed: string;
  image: File | null;
  imageUrl: string;
}

interface UploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}

const PET_TYPES = [
  { id: 'cat', name: 'Cat', emoji: '🐱', icon: '🐱' },
  { id: 'dog', name: 'Dog', emoji: '🐶', icon: '🐶' },
  { id: 'other', name: 'Other', emoji: '🐾', icon: '🐾' }
];

const STEPS = [
  { id: 1, title: 'Choose Pet Type', description: 'What kind of pet are you adding?' },
  { id: 2, title: 'Select Breed', description: 'Pick the specific breed' },
  { id: 3, title: 'Name Your Pet', description: 'Give your pet a special name' },
  { id: 4, title: 'Add Photo', description: 'Upload a cute photo of your pet' },
  { id: 5, title: 'Complete!', description: 'Your pet is ready to join the family!' }
];

export default function AddNewPetForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    type: '',
    breed: '',
    image: null,
    imageUrl: ''
  });

  const handleInputChange = (field: keyof PetFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset breed when type changes
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        breed: ''
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      toast.error('Please log in to upload images');
      return;
    }

    setFormData(prev => ({
      ...prev,
      image: file
    }));

    setUploading(true);
    setUploadProgress({ progress: 0, status: 'uploading' });

    try {
      const result = await uploadPetImage(file, user);
      
      if (result.success && result.downloadURL) {
        setFormData(prev => ({
          ...prev,
          imageUrl: result.downloadURL
        }));
        setUploadProgress({ progress: 100, status: 'completed' });
        toast.success('Image uploaded successfully!');
      } else {
        setUploadProgress({ progress: 0, status: 'error' });
        toast.error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress({ progress: 0, status: 'error' });
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to add a pet');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a pet name');
      return;
    }

    if (!formData.imageUrl) {
      toast.error('Please upload a pet image');
      return;
    }

    setLoading(true);

    try {
      const petData = {
        name: formData.name.trim(),
        type: formData.type,
        breedName: formData.breed,
        imageUrl: formData.imageUrl,
        description: '',
        age: '',
        gender: '',
        notes: ''
      };

      console.log('Creating pet with data:', petData);

      const result = await createPetInFirestore(petData, user);

      if (result.success) {
        toast.success('Pet added successfully!');
        router.push('/pages/my-pets');
      } else {
        toast.error(result.error || 'Failed to add pet');
      }
    } catch (error) {
      console.error('Error adding pet:', error);
      toast.error('Failed to add pet');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.type !== '';
      case 2: return formData.breed !== '';
      case 3: return formData.name.trim() !== '';
      case 4: return formData.imageUrl !== '';
      default: return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-3 gap-4">
              {PET_TYPES.map((type) => (
                <motion.button
                  key={type.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleInputChange('type', type.id)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                    formData.type === type.id
                      ? 'border-primary bg-primary/10 shadow-lg'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-4xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium text-gray-700">{type.name}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">
                {PET_TYPES.find(t => t.id === formData.type)?.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                {PET_TYPES.find(t => t.id === formData.type)?.name} Breeds
              </h3>
            </div>
            <BreedSelect
              petType={formData.type as PetType}
              value={formData.breed}
              onValueChange={(value) => handleInputChange('breed', value)}
              placeholder="Select breed"
            />
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">
                {PET_TYPES.find(t => t.id === formData.type)?.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800">What's your pet's name?</h3>
              <p className="text-gray-600">Choose a special name for your {PET_TYPES.find(t => t.id === formData.type)?.name.toLowerCase()}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Pet Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your pet's name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="text-center text-lg"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">
                {PET_TYPES.find(t => t.id === formData.type)?.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Add a photo of {formData.name}</h3>
              <p className="text-gray-600">Upload a cute picture of your pet</p>
            </div>
            
            <div className="flex justify-center">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer"
                >
                  <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-primary transition-colors">
                    {formData.imageUrl ? (
                      <img
                        src={formData.imageUrl}
                        alt="Pet preview"
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : (
                      <>
                        <Camera className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 text-center">Click to upload photo</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {uploadProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  {uploadProgress.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploadProgress.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {uploadProgress.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                  <span className="text-sm text-gray-600">
                    {uploadProgress.status === 'uploading' && 'Uploading...'}
                    {uploadProgress.status === 'completed' && 'Upload complete!'}
                    {uploadProgress.status === 'error' && 'Upload failed'}
                  </span>
                </div>
                {uploadProgress.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-6"
          >
            <div className="text-8xl mb-6">🎉</div>
            <h3 className="text-2xl font-bold text-gray-800">Congratulations!</h3>
            <p className="text-gray-600">
              <strong>{formData.name}</strong> is now part of your pet family!
            </p>
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-semibold">+10 Points Earned!</span>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center justify-center space-x-4">
                <img
                  src={formData.imageUrl}
                  alt={formData.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="text-left">
                  <h4 className="font-semibold text-lg">{formData.name}</h4>
                  <p className="text-gray-600">{formData.breed}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Welcome to Facepet!</h2>
          <p className="text-gray-600 mb-4">Please log in to add your pet</p>
          <Button onClick={() => router.push('/login')}>
            Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Add New Pet</CardTitle>
          <div className="flex items-center justify-center space-x-2 mt-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle className="w-4 h-4" /> : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      currentStep > step.id ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">{STEPS[currentStep - 1].title}</h3>
            <p className="text-gray-600">{STEPS[currentStep - 1].description}</p>
          </div>
        </CardHeader>
        
        <CardContent>
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className="w-4 h-4" />
                )}
                <span>{loading ? 'Adding Pet...' : 'Complete!'}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}