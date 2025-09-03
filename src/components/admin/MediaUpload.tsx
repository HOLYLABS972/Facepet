'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { FileUp, Image as ImageIcon, Video, X } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('pages.Admin');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

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
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${type}_${timestamp}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `advertisements/${type}s/${fileName}`);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);

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

  const handleRemoveFile = async () => {
    if (!value) return;

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
      }
    } catch (error: any) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
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

      {value ? (
        <Card className="relative overflow-hidden">
          <CardContent className="p-2">
            <div className="relative aspect-video w-full overflow-hidden rounded-md">
              {type === 'image' ? (
                <img
                  src={value}
                  alt="Advertisement image"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={value}
                  controls
                  className="h-full w-full"
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                Replace {type === 'image' ? 'Image' : 'Video'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-32 w-full border-dashed"
          onClick={handleUploadClick}
          disabled={isUploading}
        >
          <div className="flex flex-col items-center justify-center">
            {type === 'image' ? (
              <ImageIcon className="text-muted-foreground mb-2 h-8 w-8" />
            ) : (
              <Video className="text-muted-foreground mb-2 h-8 w-8" />
            )}
            <span className="text-sm font-medium">
              {isUploading
                ? t('uploading')
                : `Click to upload ${type === 'image' ? 'an image' : 'a video'}`}
            </span>
            <span className="text-muted-foreground mt-1 text-xs">
              {type === 'image'
                ? 'JPG, PNG or GIF up to 20MB'
                : 'MP4, WebM or MOV up to 100MB'}
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
    </div>
  );
}
