'use client';

import { useState } from 'react';

interface AdImageThumbnailProps {
  src: string;
  alt: string;
  title: string;
}

export default function AdImageThumbnail({ src, alt, title }: AdImageThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  // Debug log
  console.log('AdImageThumbnail - src:', src, 'alt:', alt, 'title:', title);

  if (!src || src === 'image' || src === 'text') {
    return (
      <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
        {src === 'image' ? 'Image' : 'No Image'}
      </div>
    );
  }

  if (imageError) {
    return (
      <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
        Error
      </div>
    );
  }

  return (
    <div className="w-16 h-12 relative">
      <img
        src={src}
        alt={alt}
        title={title}
        className="w-full h-full object-cover rounded border"
        onError={() => {
          console.log('Image failed to load:', src);
          setImageError(true);
        }}
        onLoad={() => console.log('Image loaded successfully:', src)}
      />
    </div>
  );
}
