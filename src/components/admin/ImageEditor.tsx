'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { ZoomIn, ZoomOut, Maximize2, RotateCw, Download, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImageUrl: string) => void;
}

export default function ImageEditor({ imageUrl, isOpen, onClose, onSave }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [opacity, setOpacity] = useState([100]);
  const [zoom, setZoom] = useState([100]);
  const [padding, setPadding] = useState([0]);
  const [rotation, setRotation] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setImageLoaded(true);
        drawImage();
      };
      img.onerror = () => {
        toast.error('Failed to load image');
        setImageLoaded(false);
      };
      img.src = imageUrl;
    }
  }, [isOpen, imageUrl]);

  useEffect(() => {
    if (imageLoaded) {
      drawImage();
    }
  }, [opacity, zoom, padding, rotation, imageLoaded]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const paddingValue = padding[0];
    const zoomValue = zoom[0] / 100;
    const opacityValue = opacity[0] / 100;

    // Calculate canvas size with padding
    const canvasWidth = img.width + paddingValue * 2;
    const canvasHeight = img.height + paddingValue * 2;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Save context
    ctx.save();

    // Move to center of canvas
    ctx.translate(canvasWidth / 2, canvasHeight / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Set opacity
    ctx.globalAlpha = opacityValue;

    // Calculate scaled dimensions
    const scaledWidth = img.width * zoomValue;
    const scaledHeight = img.height * zoomValue;

    // Draw image centered
    ctx.drawImage(
      img,
      -scaledWidth / 2,
      -scaledHeight / 2,
      scaledWidth,
      scaledHeight
    );

    // Restore context
    ctx.restore();
  };

  const handleZoomIn = () => {
    setZoom([Math.min(zoom[0] + 10, 500)]);
  };

  const handleZoomOut = () => {
    setZoom([Math.max(zoom[0] - 10, 10)]);
  };

  const handleReset = () => {
    setOpacity([100]);
    setZoom([100]);
    setPadding([0]);
    setRotation(0);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Failed to process image');
        return;
      }

      // Convert blob to data URL
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onSave(dataUrl);
        onClose();
        toast.success('Image edited successfully');
      };
      reader.onerror = () => {
        toast.error('Failed to process image');
      };
      reader.readAsDataURL(blob);
    }, 'image/png', 1.0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'edited-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Preview Canvas */}
          <div className="flex justify-center items-center bg-gray-100 rounded-lg p-4 min-h-[400px]">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[400px] border border-gray-300 rounded shadow-lg bg-white"
              style={{ imageRendering: 'high-quality' }}
            />
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Opacity Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="opacity">Opacity: {opacity[0]}%</Label>
                <span className="text-sm text-gray-500">Image Visibility</span>
              </div>
              <Slider
                id="opacity"
                min={0}
                max={100}
                step={1}
                value={opacity}
                onValueChange={setOpacity}
                className="w-full"
              />
            </div>

            {/* Zoom Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="zoom">Zoom: {zoom[0]}%</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom[0] <= 10}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom[0] >= 500}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Slider
                id="zoom"
                min={10}
                max={500}
                step={5}
                value={zoom}
                onValueChange={setZoom}
                className="w-full"
              />
            </div>

            {/* Padding Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="padding">Padding: {padding[0]}px</Label>
                <span className="text-sm text-gray-500">Empty space around image</span>
              </div>
              <Slider
                id="padding"
                min={0}
                max={200}
                step={5}
                value={padding}
                onValueChange={setPadding}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="rotation">Rotation: {rotation}°</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Rotate 90°
                </Button>
              </div>
              <Slider
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={[rotation]}
                onValueChange={(value) => setRotation(value[0])}
                className="w-full"
              />
            </div>

            {/* Reset Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Reset All
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
