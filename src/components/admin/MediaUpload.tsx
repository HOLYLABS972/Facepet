'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileUp, Image as ImageIcon, Video, X, Edit } from 'lucide-react';
import { supabase } from '@/src/lib/supabase/client';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import ImageEditor from './ImageEditor';
import { convertToWebPOptimized } from '@/lib/utils/image-conversion';

interface MediaUploadProps {
  type: 'image' | 'video';
  value?: string;
  onChange: (filePath: string) => void;
  className?: string;
}

export default function MediaUpload({
  type,
  value,
  onChange,
  className = ''
}: MediaUploadProps) {
  const t = useTranslations('pages.Admin.mediaUpload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    // 20MB limit for images, 100MB for videos
    const maxSize = type === 'image' ? 20 * 1024 * 1024 : 100 * 1024 * 1024;

    if (file.size > maxSize) {
      toast.error(
        `File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
      );
      return false;
    }

    // Validate file type
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return false;
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setProgress(0);

    try {
      // Convert image to WebP if it's an image
      let fileToUpload = file;
      if (type === 'image' && file.type.startsWith('image/') && file.type !== 'image/webp') {
        try {
          console.log('🔄 Converting image to WebP...');
          fileToUpload = await convertToWebPOptimized(file, undefined, 1920, 1920);
          console.log('✅ Image converted to WebP', {
            originalSize: file.size,
            newSize: fileToUpload.size,
            reduction: `${((1 - fileToUpload.size / file.size) * 100).toFixed(1)}%`
          });
        } catch (error) {
          console.warn('⚠️ Failed to convert to WebP, using original file:', error);
          // Continue with original file if conversion fails
        }
      }

      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = fileToUpload.name.split('.').pop();
      const fileName = `${type}_${timestamp}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `advertisements/${type}s/${fileName}`);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          toast.error(`Upload failed: ${error.message}`);
          setIsUploading(false);
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onChange(downloadURL);
            toast.success(`${type} uploaded successfully`);
            setIsUploading(false);
          } catch (error: any) {
            console.error('Error getting download URL:', error);
            toast.error('Upload completed but failed to get file URL');
            setIsUploading(false);
          }
        }
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
    // Reset input value to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const isValidUrl = (urlString: string): boolean => {
    if (!urlString || urlString.trim() === '') return false;
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleRemoveFile = async () => {
    if (!value || !isValidUrl(value)) {
      // If no valid URL, just clear the value
      onChange('');
      return;
    }

    try {
      // Extract the file path from the download URL
      const url = new URL(value);
      const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
      
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        onChange('');
        toast.success('File removed successfully');
      } else {
        // If URL doesn't match expected pattern, just clear it
        onChange('');
      }
    } catch (error: any) {
      console.error('Error removing file:', error);
      // Silently clear the value if there's an error
      onChange('');
    }
  };

  const handleImageError = () => {
    // If image fails to load, clear the value
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={type === 'image' ? 'image/*' : 'video/*'}
        onChange={handleFileChange}
        className="hidden"
      />

      {value && isValidUrl(value) ? (
        <Card className="relative overflow-hidden">
          <CardContent className="p-2">
            <div className="relative w-full overflow-hidden rounded-md">
              {type === 'image' ? (
                <img
                  src={value}
                  alt="Advertisement image"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                  onError={handleImageError}
                />
              ) : (
                <video
                  src={value}
                  controls
                  className="h-full w-full"
                  onError={handleImageError}
                />
              )}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex gap-2">
              {type === 'image' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setIsEditorOpen(true)}
                  disabled={isUploading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-24 w-full border-dashed"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          <div className="flex flex-col items-center justify-center">
            {type === 'image' ? (
              <ImageIcon className="text-muted-foreground mb-1 h-6 w-6" />
            ) : (
              <Video className="text-muted-foreground mb-1 h-6 w-6" />
            )}
            <span className="text-xs font-medium">
              {isUploading
                ? t('uploading')
                : (type === 'image' ? t('clickToUploadImage') : t('clickToUploadVideo'))}
            </span>
            <span className="text-muted-foreground mt-0.5 text-[10px]">
              {type === 'image' ? t('fileFormats.image') : t('fileFormats.video')}
            </span>
          </div>
        </Button>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileUp className="h-4 w-4 animate-pulse" />
            <span className="text-sm">{t('uploading')} {type}...</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Image Editor */}
      {type === 'image' && value && isValidUrl(value) && (
        <ImageEditor
          imageUrl={value}
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditedImageUrl(null);
          }}
          onSave={async (editedDataUrl) => {
            try {
              // Convert data URL to blob
              const response = await fetch(editedDataUrl);
              const blob = await response.blob();
              
              // Create a file from blob (will be converted to WebP in uploadFile)
              const file = new File([blob], 'edited-image.png', { type: 'image/png' });
              
              // Upload the edited image (will be converted to WebP)
              await uploadFile(file);
              setEditedImageUrl(null);
              setIsEditorOpen(false);
            } catch (error: any) {
              console.error('Error saving edited image:', error);
              toast.error('Failed to save edited image');
            }
          }}
        />
      )}
    </div>
  );
}
