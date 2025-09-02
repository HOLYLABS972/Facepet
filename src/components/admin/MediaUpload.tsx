'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { IKImage, IKUpload, IKVideo, ImageKitProvider } from 'imagekitio-next';
import { FileUp, Image as ImageIcon, Video } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

const authenticator = async () => {
  try {
    const response = await fetch('/api/imagekit');

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Request failed with status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();
    const { signature, expire, token } = data;
    return { token, expire, signature };
  } catch (error: any) {
    throw new Error(`Authentication request failed: ${error.message}`);
  }
};

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
  const ikUploadRef = useRef<any>(null);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const onError = (error: any) => {
    console.error('Upload error:', error);
    toast.error(`${type} upload failed`);
    setIsUploading(false);
  };

  const onSuccess = (res: any) => {
    onChange(res.filePath);
    toast.success(`${type} uploaded successfully`);
    setIsUploading(false);
  };

  const onValidate = (file: File) => {
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

  const handleUploadClick = () => {
    if (ikUploadRef.current) {
      ikUploadRef.current.click();
    }
  };

  return (
    <ImageKitProvider
      publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!}
      urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
      authenticator={authenticator}
    >
      <div className={`space-y-2 ${className}`}>
        <IKUpload
          ref={ikUploadRef}
          onError={onError}
          onSuccess={onSuccess}
          useUniqueFileName={true}
          validateFile={onValidate}
          onUploadStart={() => {
            setProgress(0);
            setIsUploading(true);
          }}
          onUploadProgress={({ loaded, total }) => {
            const percent = Math.round((loaded / total) * 100);
            setProgress(percent);
          }}
          folder={`business/${type}`}
          accept={type === 'image' ? 'image/*' : 'video/*'}
          className="hidden"
        />

        {value ? (
          <Card className="relative overflow-hidden">
            <CardContent className="p-2">
              <div className="relative aspect-video w-full overflow-hidden rounded-md">
                {type === 'image' ? (
                  <IKImage
                    path={value}
                    transformation={[{ quality: '60', crop: 'maintain_ratio' }]}
                    loading="lazy"
                    lqip={{ active: true }}
                    className="h-full w-full object-cover"
                    alt="Advertisement image"
                  />
                ) : (
                  <IKVideo
                    path={value}
                    controls={true}
                    className="h-full w-full"
                  />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={handleUploadClick}
              >
                Replace {type === 'image' ? 'Image' : 'Video'}
              </Button>
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
    </ImageKitProvider>
  );
}
