'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { uploadPetImage } from '@/src/lib/supabase/storage';
import { useAuth } from '@/src/contexts/AuthContext';
import { ArrowLeftRight, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

// Assets - using public paths
const assets = {
  upload_figures: '/assets/upload_figures.png'
};

interface Props {
  label: string;
  folder: string;
  onFileChange: (filePath: string) => void;
  value?: string;
  required?: boolean;
  error?: string;
}

const ImageUpload = ({
  label,
  folder,
  onFileChange,
  value,
  required = false,
  error,
  ...props
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadPetImage(file, user);

      clearInterval(progressInterval);
      setProgress(100);

      if (result.success && result.downloadURL) {
        onFileChange(result.downloadURL);
        toast.success('Image uploaded successfully');
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    onFileChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <Card className="h-15 w-full overflow-visible rounded-lg border-none bg-transparent shadow-none">
        <CardContent className="p-0">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {value ? (
          <div className="relative h-15 w-full rounded-lg">
            {/* Image */}
            <Image
              alt="Uploaded pet image"
              src={value}
              width={500}
              height={80}
              className="h-full w-full rounded-lg object-cover"
            />

            {/* Action buttons */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black bg-opacity-50 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="bg-primary text-white hover:bg-primary/90"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
                disabled={uploading}
              >
                <ArrowLeftRight className="h-4 w-4 mr-1" />
                Replace
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveImage();
                }}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="relative h-15 w-full rounded-[8px] border-0 bg-[#FBCDD0]"
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            disabled={uploading}
          >
            <span className="w-full text-base font-medium ltr:pl-3 ltr:text-left rtl:pr-3 rtl:text-right">
              {uploading ? 'Uploading...' : label}
            </span>
            <Image
              src={assets.upload_figures}
              alt="figure"
              width={162.67}
              height={121.53}
              className="absolute -top-11 ltr:right-6 rtl:left-6"
            />
          </Button>
        )}
      </CardContent>

        {/* Progress bar */}
        {progress > 0 && progress < 100 && (
          <Progress className="[&>*]:bg-primary" value={progress} />
        )}
      </Card>
      
      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      
      {/* Required indicator removed - image is now optional */}
    </div>
  );
};

export default ImageUpload;
