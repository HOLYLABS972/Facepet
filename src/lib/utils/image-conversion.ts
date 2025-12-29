/**
 * Convert an image file to WebP format
 * @param file - The image file to convert
 * @param quality - Quality of the WebP image (0-1, default: 0.85)
 * @param maxWidth - Maximum width in pixels (optional, maintains aspect ratio)
 * @param maxHeight - Maximum height in pixels (optional, maintains aspect ratio)
 * @returns Promise with the converted WebP File
 */
export async function convertToWebP(
  file: File,
  quality: number = 0.85,
  maxWidth?: number,
  maxHeight?: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    // Skip conversion if already WebP
    if (file.type === 'image/webp') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions if maxWidth or maxHeight is specified
        let width = img.width;
        let height = img.height;
        
        if (maxWidth || maxHeight) {
          const aspectRatio = width / height;
          
          if (maxWidth && width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }
          
          if (maxHeight && height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image to WebP'));
              return;
            }

            // Create a new File object with WebP extension
            const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
            const webpFile = new File([blob], fileName, {
              type: 'image/webp',
              lastModified: Date.now()
            });

            resolve(webpFile);
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check if WebP is supported in the browser
 * @returns Promise that resolves to true if WebP is supported
 */
export function isWebPSupported(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Convert image to WebP with automatic quality optimization
 * Tries to maintain file size while improving quality
 * @param file - The image file to convert
 * @param targetSizeKB - Target file size in KB (optional)
 * @param maxWidth - Maximum width in pixels (optional)
 * @param maxHeight - Maximum height in pixels (optional)
 * @returns Promise with the converted WebP File
 */
export async function convertToWebPOptimized(
  file: File,
  targetSizeKB?: number,
  maxWidth?: number,
  maxHeight?: number
): Promise<File> {
  // Start with high quality
  let quality = 0.9;
  let webpFile: File;
  const minQuality = 0.5;
  const qualityStep = 0.1;

  // First conversion
  webpFile = await convertToWebP(file, quality, maxWidth, maxHeight);

  // If target size is specified, optimize quality to meet it
  if (targetSizeKB) {
    const targetSizeBytes = targetSizeKB * 1024;
    
    // If file is already smaller than target, return it
    if (webpFile.size <= targetSizeBytes) {
      return webpFile;
    }

    // Reduce quality until we meet the target size or hit minimum quality
    while (webpFile.size > targetSizeBytes && quality > minQuality) {
      quality -= qualityStep;
      webpFile = await convertToWebP(file, quality, maxWidth, maxHeight);
    }
  }

  return webpFile;
}

