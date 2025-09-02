'use client';

import { useState } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { uploadPetImage } from '@/src/lib/firebase/simple-upload';
import { createPetInFirestore } from '@/src/lib/firebase/pets';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from '@/i18n/routing';
import { BreedSelect } from './ui/breed-select';
import { getBreedsForType, type PetType } from '@/src/lib/data/breeds';

interface PetFormData {
  name: string;
  description: string;
  type: 'cat' | 'dog' | 'bird' | 'fish' | 'rabbit' | 'hamster' | 'guinea-pig' | 'turtle' | 'snake' | 'lizard' | 'ferret' | 'other';
  breed: string;
  image: File | null;
  imageUrl: string;
}

export default function AddNewPetForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ progress: number; status: string } | null>(null);
  
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    description: '',
    type: 'cat',
    breed: '',
    image: null,
    imageUrl: ''
  });

  const handleInputChange = (field: keyof PetFormData, value: string | File) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // If type changes, reset breed selection
      if (field === 'type') {
        newData.breed = '';
      }
      
      return newData;
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) {
      toast.error('Please select an image file and make sure you are logged in');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setFormData(prev => ({
      ...prev,
      image: file
    }));

    // Upload image
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
      // Clear progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      // Create pet data
      const petData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        breedName: formData.breed, // Store the selected breed name
        imageUrl: formData.imageUrl,
        genderId: 1, // Default to first gender (you can make this configurable)
        breedId: 1,  // Default to first breed (you can make this configurable)
        ownerName: user.displayName || 'Pet Owner',
        ownerPhone: '',
        ownerEmail: user.email || '',
        ownerAddress: '',
        birthDate: '',
        notes: '',
        vetId: ''
      };

      const result = await createPetInFirestore(petData, user);

      if (result.success) {
        toast.success('Pet added successfully!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          type: 'cat',
          breed: '',
          image: null,
          imageUrl: ''
        });
        // Redirect to pets page
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

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Pet</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please log in to add a new pet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add New Pet</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pet Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Pet Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your pet's name"
                required
              />
            </div>

            {/* Pet Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Pet Type *</Label>
              <Select value={formData.type} onValueChange={(value: any) => handleInputChange('type', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select pet type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cat">🐱 Cat</SelectItem>
                  <SelectItem value="dog">🐶 Dog</SelectItem>
                  <SelectItem value="bird">🐦 Bird</SelectItem>
                  <SelectItem value="fish">🐠 Fish</SelectItem>
                  <SelectItem value="rabbit">🐰 Rabbit</SelectItem>
                  <SelectItem value="hamster">🐹 Hamster</SelectItem>
                  <SelectItem value="guinea-pig">🐹 Guinea Pig</SelectItem>
                  <SelectItem value="turtle">🐢 Turtle</SelectItem>
                  <SelectItem value="snake">🐍 Snake</SelectItem>
                  <SelectItem value="lizard">🦎 Lizard</SelectItem>
                  <SelectItem value="ferret">🦦 Ferret</SelectItem>
                  <SelectItem value="other">🐾 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Breed Selection */}
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <BreedSelect
                petType={formData.type as PetType}
                value={formData.breed}
                onValueChange={(value) => handleInputChange('breed', value)}
                placeholder="Select breed"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Tell us about your pet..."
                rows={4}
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Pet Image *</Label>
              <div className="space-y-4">
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                
                {uploading && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading image...</span>
                  </div>
                )}

                {uploadProgress && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      {uploadProgress.status === 'completed' && (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">Image uploaded successfully!</span>
                        </>
                      )}
                      {uploadProgress.status === 'error' && (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-red-600">Upload failed</span>
                        </>
                      )}
                    </div>
                    {uploadProgress.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.progress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                )}

                {formData.imageUrl && (
                  <div className="mt-4">
                    <img 
                      src={formData.imageUrl} 
                      alt="Pet preview" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/pages/my-pets')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || uploading || !formData.name.trim() || !formData.imageUrl}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Add Pet
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
