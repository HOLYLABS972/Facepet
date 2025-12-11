'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Pencil, Type, Eraser, Crop, Smile, Undo2, Redo2,
  Download, X, Check, Square, Circle, ArrowRight, Highlighter, MousePointer2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface ImageEditorProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (editedImageUrl: string) => void;
}

type Tool = 'select' | 'pen' | 'highlighter' | 'arrow' | 'text' | 'blur' | 'crop' | 'emoji';
type DrawingAction = {
  type: 'draw' | 'text' | 'emoji' | 'blur';
  tool: Tool;
  color: string;
  points?: { x: number; y: number }[];
  text?: string;
  emoji?: string;
  x?: number;
  y?: number;
  width?: number;
  fontSize?: number;
};

const COLORS = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#007AFF', '#5856D6', '#AF52DE', '#FFFFFF', '#000000'];
const EMOJIS = ['😀', '😂', '❤️', '👍', '👎', '🔥', '⭐', '✅', '❌', '💯'];

export default function ImageEditor({ imageUrl, isOpen, onClose, onSave }: ImageEditorProps) {
  const t = useTranslations('pages.Admin.imageEditor');
  const commonT = useTranslations('common');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<Tool>('select');
  const [cursor, setCursor] = useState<string>('default');
  const [color, setColor] = useState('#FF3B30');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [history, setHistory] = useState<DrawingAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  // Load image
  useEffect(() => {
    let objectUrl = '';

    if (isOpen && imageUrl) {
      const loadImage = async () => {
        try {
          // Try to fetch as blob to ensure we get a clean object URL and bypass some CORS/cache issues
          const response = await fetch(imageUrl, { mode: 'cors', cache: 'no-store' });
          if (!response.ok) throw new Error('Failed to fetch image');
          
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          
          const img = new Image();
          img.onload = () => {
            imageRef.current = img;
            setImageLoaded(true);
            initializeCanvas();
          };
          img.onerror = () => {
            toast.error('Failed to load image');
          };
          img.src = objectUrl;
        } catch (error) {
          console.warn('Direct fetch failed, trying proxy...', error);
          
          try {
            // Fallback 1: Try via local proxy (guarantees CORS headers)
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) throw new Error('Proxy fetch failed');
            
            const blob = await response.blob();
            objectUrl = URL.createObjectURL(blob);
            
            const img = new Image();
            img.onload = () => {
              imageRef.current = img;
              setImageLoaded(true);
              initializeCanvas();
            };
            img.onerror = () => {
              throw new Error('Failed to load image from blob');
            };
            img.src = objectUrl;
          } catch (proxyError) {
            console.error('Proxy fetch failed, falling back to direct load:', proxyError);
            
            // Fallback 2: try loading directly with crossOrigin and cache buster
            // This might still fail "tainted canvas" checks on save if server doesn't send CORS headers,
            // but at least shows the image for viewing.
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const urlWithTime = imageUrl.includes('?') 
              ? `${imageUrl}&t=${Date.now()}` 
              : `${imageUrl}?t=${Date.now()}`;
              
            img.onload = () => {
              imageRef.current = img;
              setImageLoaded(true);
              initializeCanvas();
            };
            img.onerror = () => {
              toast.error('Cannot edit this image due to security restrictions (CORS)');
            };
            img.src = urlWithTime;
          }
        }
      };

      loadImage();
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, imageUrl]);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    const img = imageRef.current;

    if (!canvas || !overlayCanvas || !img) return;

    // Set canvas size to match image
    const maxWidth = 800;
    const maxHeight = 600;
    let width = img.width;
    let height = img.height;

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    canvas.width = width;
    canvas.height = height;
    overlayCanvas.width = width;
    overlayCanvas.height = height;

    // Draw base image
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, 0, 0, width, height);
    }
  };

  // Redraw all annotations
  const redrawAnnotations = useCallback((historyOverride?: DrawingAction[]) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const actionsToDraw = historyOverride || history.slice(0, historyIndex + 1);

    // Draw all actions from history
    actionsToDraw.forEach((action) => {
      if (action.type === 'draw' && action.points) {
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.tool === 'highlighter' ? 20 : action.tool === 'pen' ? 3 : 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (action.tool === 'highlighter') {
          ctx.globalAlpha = 0.3;
        } else {
          ctx.globalAlpha = 1;
        }

        if (action.tool === 'arrow' && action.points.length >= 2) {
          // Draw arrow
          const start = action.points[0];
          const end = action.points[action.points.length - 1];
          drawArrow(ctx, start.x, start.y, end.x, end.y, action.color);
        } else {
          // Draw path
          ctx.beginPath();
          ctx.moveTo(action.points[0].x, action.points[0].y);
          action.points.forEach(point => ctx.lineTo(point.x, point.y));
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      } else if (action.type === 'text' && action.text && action.x !== undefined && action.y !== undefined) {
        const fontSize = action.fontSize || 24;
        ctx.fillStyle = action.color;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(action.text, action.x, action.y);
      } else if (action.type === 'emoji' && action.emoji && action.x !== undefined && action.y !== undefined) {
        const fontSize = action.fontSize || 48;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillText(action.emoji, action.x, action.y);
      } else if (action.type === 'blur' && action.points) {
        // Apply blur effect
        action.points.forEach(point => {
          ctx.filter = 'blur(10px)';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.fillRect(point.x - 15, point.y - 15, 30, 30);
          ctx.filter = 'none';
        });
      }
    });

    // Draw crop rectangle preview
    if (cropRect) {
      ctx.save();
      ctx.strokeStyle = '#0ea5e9';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeRect(cropRect.x, cropRect.y, cropRect.width, cropRect.height);
      ctx.restore();
    }
  }, [history, historyIndex, cropRect]);

  useEffect(() => {
    if (imageLoaded) {
      redrawAnnotations();
    }
  }, [imageLoaded, redrawAnnotations]);

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
    const headLength = 20;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const getTouchCoordinates = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  };

  const getTextDimensions = (text: string, fontSize: number, isBold: boolean = false) => {
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return { width: 0, height: fontSize };
    ctx.font = `${isBold ? 'bold ' : ''}${fontSize}px Arial`;
    const metrics = ctx.measureText(text);
    return { width: metrics.width, height: fontSize };
  };

  const findDraggableAnnotation = (coords: { x: number; y: number }) => {
    const actions = history.slice(0, historyIndex + 1);
    for (let i = actions.length - 1; i >= 0; i--) {
      const action = actions[i];
      if ((action.type === 'text' && action.text) || (action.type === 'emoji' && action.emoji)) {
        const fontSize = action.fontSize || (action.type === 'emoji' ? 48 : 24);
        const content = action.type === 'text' ? action.text! : action.emoji!;
        // Text is drawn as bold in redrawAnnotations
        const isBold = action.type === 'text';
        const { width, height } = getTextDimensions(content, fontSize, isBold);
        const x = action.x ?? 0;
        const y = action.y ?? 0;

        // Add padding for easier selection
        const padding = 20;
        const top = y - height - padding;
        const bottom = y + height * 0.25 + padding;
        const left = x - padding;
        const right = x + width + padding;

        if (coords.x >= left && coords.x <= right && coords.y >= top && coords.y <= bottom) {
          return {
            index: i,
            offset: { x: coords.x - x, y: coords.y - y },
          };
        }
      }
    }
    return null;
  };

  const handleStart = (coords: { x: number; y: number }) => {
    if (tool === 'select') {
      const hit = findDraggableAnnotation(coords);
      if (hit) {
        setDraggingIndex(hit.index);
        setDragOffset(hit.offset);
      }
      return;
    }

    if (tool === 'text') {
      setTextPosition(coords);
      setShowTextInput(true);
      return;
    }

    if (tool === 'crop') {
      setIsCropping(true);
      setCropRect({ x: coords.x, y: coords.y, width: 0, height: 0 });
      return;
    }

    if (tool === 'emoji') return;

    setIsDrawing(true);
    setCurrentPath([coords]);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    handleStart(coords);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getTouchCoordinates(e);
    handleStart(coords);
  };

  const handleMove = (coords: { x: number; y: number }) => {
    if (tool === 'select') {
      if (draggingIndex === null || !dragOffset) return;
      const actions = history.slice(0, historyIndex + 1);
      if (!actions[draggingIndex]) return;
      const updated = [...actions];
      const target = updated[draggingIndex];
      updated[draggingIndex] = {
        ...target,
        x: coords.x - dragOffset.x,
        y: coords.y - dragOffset.y,
      };
      setHistory(updated);
      setHistoryIndex(updated.length - 1);
      redrawAnnotations(updated);
      return;
    }

    if (tool === 'crop') {
      if (!isCropping || !cropRect) return;
      const width = coords.x - cropRect.x;
      const height = coords.y - cropRect.y;
      setCropRect({
        x: width < 0 ? coords.x : cropRect.x,
        y: height < 0 ? coords.y : cropRect.y,
        width: Math.abs(width),
        height: Math.abs(height),
      });
      redrawAnnotations();
      return;
    }

    if (!isDrawing || tool === 'text' || tool === 'emoji') return;

    setCurrentPath(prev => [...prev, coords]);

    // Draw preview
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    redrawAnnotations();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = tool === 'highlighter' ? 20 : tool === 'pen' ? 3 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'highlighter') {
      ctx.globalAlpha = 0.3;
    }

    if (tool === 'arrow' && currentPath.length >= 2) {
      const start = currentPath[0];
      const end = coords;
      drawArrow(ctx, start.x, start.y, end.x, end.y, color);
    } else if (tool === 'blur') {
      ctx.filter = 'blur(10px)';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(coords.x - 15, coords.y - 15, 30, 30);
      ctx.filter = 'none';
    } else {
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.forEach(point => ctx.lineTo(point.x, point.y));
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);

    // Update cursor for hover effect in select mode
    if (tool === 'select' && draggingIndex === null) {
      const hit = findDraggableAnnotation(coords);
      setCursor(hit ? 'move' : 'default');
    } else if (tool !== 'select') {
      setCursor('crosshair');
    }

    handleMove(coords);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const coords = getTouchCoordinates(e);
    handleMove(coords);
  };

  const handleMouseUp = () => {
    if (tool === 'select') {
      setDraggingIndex(null);
      setDragOffset(null);
      return;
    }

    if (tool === 'crop') {
      if (isCropping) {
        setIsCropping(false);
      }
      return;
    }

    if (!isDrawing) return;

    setIsDrawing(false);

    if (currentPath.length > 0) {
      const newAction: DrawingAction = {
        type: tool === 'blur' ? 'blur' : 'draw',
        tool,
        color,
        points: currentPath,
      };

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newAction);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }

    setCurrentPath([]);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseUp();
  };

  const handleTextSubmit = () => {
    if (!textInput.trim() || !textPosition) return;

    const newAction: DrawingAction = {
      type: 'text',
      tool: 'text',
      color,
      text: textInput,
      x: textPosition.x,
      y: textPosition.y,
      fontSize: 24,
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setTextInput('');
    setShowTextInput(false);
    setTextPosition(null);
    setTool('select');
  };

  const handleEmojiSelect = (emoji: string) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const newAction: DrawingAction = {
      type: 'emoji',
      tool: 'emoji',
      color: '',
      emoji,
      x: canvas.width / 2,
      y: canvas.height / 2,
      fontSize: 48,
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setShowEmojiPicker(false);
    setTool('select');
  };

  const handleUndo = () => {
    if (historyIndex >= 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const applyCrop = () => {
    if (!cropRect) return;
    const baseCanvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!baseCanvas || !overlayCanvas) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropRect.width;
    tempCanvas.height = cropRect.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCtx.drawImage(
      baseCanvas,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      cropRect.width,
      cropRect.height
    );

    tempCtx.drawImage(
      overlayCanvas,
      cropRect.x,
      cropRect.y,
      cropRect.width,
      cropRect.height,
      0,
      0,
      cropRect.width,
      cropRect.height
    );

    const dataUrl = tempCanvas.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setCropRect(null);
      setHistory([]);
      setHistoryIndex(-1);
      setTool('select');

      // Resize canvases to new image size
      baseCanvas.width = img.width;
      baseCanvas.height = img.height;
      overlayCanvas.width = img.width;
      overlayCanvas.height = img.height;

      const baseCtx = baseCanvas.getContext('2d');
      const overlayCtx = overlayCanvas.getContext('2d');
      baseCtx?.clearRect(0, 0, img.width, img.height);
      baseCtx?.drawImage(img, 0, 0, img.width, img.height);
      overlayCtx?.clearRect(0, 0, img.width, img.height);
      setImageLoaded(true);
      toast.success('Image cropped');
    };
    img.src = dataUrl;
  };

  const handleSave = () => {
    const baseCanvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!baseCanvas || !overlayCanvas) return;

    // Create a temporary canvas to merge both layers
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = baseCanvas.width;
    tempCanvas.height = baseCanvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) return;

    // Draw base image
    tempCtx.drawImage(baseCanvas, 0, 0);
    // Draw annotations
    tempCtx.drawImage(overlayCanvas, 0, 0);

    tempCanvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Failed to process image');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onSave(dataUrl);
        onClose();
        toast.success('Image edited successfully');
      };
      reader.readAsDataURL(blob);
    }, 'image/png', 1.0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[calc(95vh-120px)]">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Button
                variant={tool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('select')}
                title={commonT('select') || 'Select & Move'}
              >
                <MousePointer2 className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === 'pen' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('pen')}
                title="Pen"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === 'highlighter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('highlighter')}
                title="Highlighter"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === 'arrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('arrow')}
                title="Arrow"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === 'text' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('text')}
                title="Text"
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === 'blur' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('blur')}
                title="Blur"
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === 'crop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setTool('crop');
                  setCropRect(null);
                }}
                title="Crop"
              >
                <Crop className="h-4 w-4" />
              </Button>
              <Button
                variant={tool === 'emoji' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setTool('emoji');
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                title="Emoji"
              >
                <Smile className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-2" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={historyIndex < 0}
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>

              {tool === 'crop' && cropRect && (
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={applyCrop}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {t('applyCrop')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCropRect(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('clear')}
                  </Button>
                </div>
              )}
            </div>

            {/* Color Palette */}
            {(tool === 'pen' || tool === 'highlighter' || tool === 'arrow' || tool === 'text') && (
              <div className="flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${color === c ? 'border-blue-500 scale-110' : 'border-gray-300'
                      }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="px-4 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-2 flex-wrap">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-3xl hover:scale-125 transition-transform p-2"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text Input */}
          {showTextInput && (
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2" style={{ position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)', zIndex: 50, width: '90%', maxWidth: '400px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', backgroundColor: 'white', borderRadius: '0.5rem', padding: '0.75rem' }}>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                placeholder="Enter text..."
                className="flex-1 px-3 py-2 border rounded"
                autoFocus
              />
              <Button size="sm" onClick={handleTextSubmit}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowTextInput(false);
                  setTextInput('');
                  setTextPosition(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 overflow-auto relative">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0"
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0"
                style={{ cursor: tool === 'select' ? cursor : 'crosshair' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              {commonT('cancel')}
            </Button>
            <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
              <Check className="h-4 w-4 mr-2" />
              {commonT('save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
