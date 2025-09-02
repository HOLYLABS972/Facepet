'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
// Assets - using public paths
const assets = {
  upload_figures: '/assets/upload_figures.png'
};
import { IKImage, IKUpload, ImageKitProvider } from 'imagekitio-next';
import { ArrowLeftRight } from 'lucide-react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

const authenticator = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PROD_API_ENDPOINT!}/api/imagekit`
    );

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

interface Props {
  label: string;
  folder: string;
  onFileChange: (filePath: string) => void;
  value?: string;
}

const ImageUpload = ({
  label,
  folder,
  onFileChange,
  value,
  ...props
}: Props) => {
  const ikUploadRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const onError = (error: any) => {
    console.log(error);

    toast.error('image upload failed');
  };

  const onSuccess = (res: any) => {
    onFileChange(res.filePath);

    toast.success('image uploaded successfully');
  };

  const onValidate = (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size too large');

      return false;
    }

    return true;
  };

  return (
    <ImageKitProvider
      publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!}
      urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
      authenticator={authenticator}
    >
      <Card className="h-15 w-full overflow-visible rounded-lg border-none bg-transparent shadow-none">
        <CardContent className="p-0">
          <IKUpload
            ref={ikUploadRef}
            onError={onError}
            onSuccess={onSuccess}
            useUniqueFileName={true}
            validateFile={onValidate}
            onUploadStart={() => setProgress(0)}
            onUploadProgress={({ loaded, total }) => {
              const percent = Math.round((loaded / total) * 100);

              setProgress(percent);
            }}
            folder={folder}
            accept="image/*"
            className="hidden rounded-lg"
            {...props}
          />
          {value ? (
            <div className="relative h-15 w-full rounded-lg">
              {/* Image */}
              <ImageKitProvider
                publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!}
                urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
                authenticator={authenticator}
              >
                <IKImage
                  alt={value}
                  path={value}
                  width={500}
                  height={80}
                  loading="lazy"
                  transformation={[
                    {
                      quality: '30'
                    }
                  ]}
                  className="h-full w-full rounded-lg object-cover"
                />
              </ImageKitProvider>

              {/* Retry Button */}
              <Button
                variant="ghost"
                className="bg-primary absolute inset-0 m-auto flex h-10 w-10 items-center justify-center rounded-lg opacity-80"
                onClick={(e) => {
                  e.preventDefault();

                  if (ikUploadRef.current) {
                    // @ts-ignore
                    ikUploadRef.current?.click();
                  }
                }}
              >
                <ArrowLeftRight />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="relative h-15 w-full rounded-[8px] border-0 bg-[#FBCDD0]"
              onClick={(e) => {
                e.preventDefault();

                if (ikUploadRef.current) {
                  // @ts-ignore
                  ikUploadRef.current?.click();
                }
              }}
            >
              <span className="w-full text-base font-medium ltr:pl-3 ltr:text-left rtl:pr-3 rtl:text-right">
                {label}
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
      </Card>

      {progress > 0 && progress !== 100 && (
        <Progress className="[&>*]:bg-primary" value={progress} />
      )}
    </ImageKitProvider>
  );
};

export default ImageUpload;
