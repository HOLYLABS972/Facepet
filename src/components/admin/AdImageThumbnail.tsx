'use client';

import { useState } from 'react';

interface AdImageThumbnailProps {
  src: string;
  alt: string;
  title: string;
}

export default function AdImageThumbnail({ src, alt, title }: AdImageThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  if (!src) {
    return (
      <span className="text-gray-400 text-sm">No image</span>
    );
  }

  if (imageError) {
    return (
      <div className="w-16 h-12 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
        No Image
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
        onError={() => setImageError(true)}
      />
    </div>
  );
}
