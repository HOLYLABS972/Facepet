'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Pencil, Type, Eraser, Crop, Smile, Undo2, Redo2,
  Download, X, Check, Square, Circle, ArrowRight, Highlighter
} from 'lucide-react';
import toast from 'react-hot-toast';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<Tool>('select');
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

  // Load image
  useEffect(() => {
    if (isOpen && imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageRef.current = img;
        setImageLoaded(true);
        initializeCanvas();
      };
      img.onerror = () => {
        // If CORS fails, try loading without crossOrigin
        const img2 = new Image();
        img2.onload = () => {
          imageRef.current = img2;
          setImageLoaded(true);
          initializeCanvas();
        };
        img2.onerror = () => {
          toast.error('Failed to load image');
        };
        img2.src = imageUrl;
      };
      img.src = imageUrl;
    }
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
  const redrawAnnotations = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all actions from history
    history.slice(0, historyIndex + 1).forEach((action) => {
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
        ctx.fillStyle = action.color;
        ctx.font = `bold ${action.fontSize || 24}px Arial`;
        ctx.fillText(action.text, action.x, action.y);
      } else if (action.type === 'emoji' && action.emoji && action.x !== undefined && action.y !== undefined) {
        ctx.font = '48px Arial';
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
  }, [history, historyIndex]);

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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);

    if (tool === 'text') {
      setTextPosition(coords);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    setCurrentPath([coords]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'text') return;

    const coords = getCanvasCoordinates(e);
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

  const handleMouseUp = () => {
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
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAction);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setShowEmojiPicker(false);
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
          <DialogTitle>Edit Image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[calc(95vh-120px)]">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center gap-2">
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
            <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
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
          <div className="flex-1 flex items-center justify-center bg-gray-100 p-4 overflow-auto">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0"
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute top-0 left-0 cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-white">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-teal-600 hover:bg-teal-700">
              <Check className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
