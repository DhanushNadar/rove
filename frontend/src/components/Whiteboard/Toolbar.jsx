import { 
  MousePointer2, 
  Hand,
  Pen, 
  Minus,
  ArrowRight,
  Square, 
  Circle,
  Diamond, 
  Type, 
  Eraser,
  Undo2,
  Redo2,
  LayoutTemplate,
  ImagePlus
} from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useCollabStore } from '../../stores/useCollabStore';
import { motion } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { AutoArrange } from '../../canvas/layout/autoArrange';
import { fabric } from 'fabric';
import { MediaManager } from '../../media/mediaManager';
import { FileIcon } from '../../canvas/objects/FileObject';
import { MediaImage } from '../../canvas/objects/ImageObject';
import axios from 'axios';
import { API_URL } from '../../config';

const Toolbar = () => {
  const { currentTool, setCurrentTool, brushColor, setBrushColor, brushSize, setBrushSize } = useUIStore();
  
  const { user } = useCollabStore();
  const board = useCanvasStore((state) => state.activeWhiteboard);
  const isOwner = board?.owner?._id === user?._id || board?.owner === user?._id;
  const collab = board?.collaborators?.find(c => (c.user?._id || c.user) === user?._id);
  const isViewer = !isOwner && collab?.role === 'viewer';

  if (isViewer) return null;
  
  const triggerAutoSave = async (json) => {
    const board = useCanvasStore.getState().activeWhiteboard;
    const currentToken = useCollabStore.getState().token;
    if (!board || !currentToken) return;
    try {
      await axios.put(
        `${API_URL}/whiteboards/${board._id}/canvas`,
        { canvasData: json },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
    } catch (err) {
      console.error('Auto-save failed', err);
    }
  };

  const handleUndo = () => {
    const canvas = window.fabricCanvasInstance;
    if (!canvas) return;
    useCanvasStore.getState().undo(canvas).then((state) => {
      if (state) {
        const socket = useCollabStore.getState().socket;
        if (socket) socket.emit('draw', state);
        triggerAutoSave(state);
      }
    });
  };

  const handleRedo = () => {
    const canvas = window.fabricCanvasInstance;
    if (!canvas) return;
    useCanvasStore.getState().redo(canvas).then((state) => {
      if (state) {
        const socket = useCollabStore.getState().socket;
        if (socket) socket.emit('draw', state);
        triggerAutoSave(state);
      }
    });
  };
  
  // Excalidraw specific tools
  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)', key: 'v' },
    { id: 'pan', icon: Hand, label: 'Pan (Space)', key: 'space' },
    { id: 'pen', icon: Pen, label: 'Draw (P)', key: 'p' },
    { id: 'line', icon: Minus, label: 'Line (L)', key: 'l' },
    { id: 'arrow', icon: ArrowRight, label: 'Arrow (A)', key: 'a' },
    { id: 'rect', icon: Square, label: 'Rectangle (R)', key: 'r' },
    { id: 'diamond', icon: Diamond, label: 'Diamond (D)', key: 'd' },
    { id: 'circle', icon: Circle, label: 'Circle (O)', key: 'o' },
    { id: 'text', icon: Type, label: 'Text (T)', key: 't' },
    { id: 'eraser', icon: Eraser, label: 'Eraser (E)', key: 'e' }
  ];

  // Colors
  const colors = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

  // Keyboard Shortcuts
  tools.forEach(t => {
    if (t.key !== 'space') { // Handled specifically in CanvasEngine
      useHotkeys(t.key, () => setCurrentTool(t.id));
    }
  });

  const handleAutoArrange = () => {
    if (window.fabricCanvasInstance) {
      AutoArrange.execute(window.fabricCanvasInstance, { direction: 'TB', spacing: 120, collisionPadding: 40 });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const boardId = useCanvasStore.getState().activeWhiteboard?._id;
    const token = useCollabStore.getState().token;
    const canvas = window.fabricCanvasInstance;
    
    if (!canvas || !boardId || !token) return;

    // Viewport center
    const vpt = canvas.viewportTransform;
    const x = (-vpt[4] + canvas.width / 2) / vpt[0];
    const y = (-vpt[5] + canvas.height / 2) / vpt[3];

    // 1. Create Placeholder
    let placeholderObj = new FileIcon({
      left: x,
      top: y,
      mimeType: file.type || 'unknown',
      fileName: file.name,
      uploadStatus: 'uploading',
      id: `temp_${Date.now()}`
    });
    canvas.add(placeholderObj);
    canvas.requestRenderAll();

    // 2. Upload
    const res = await MediaManager.uploadMedia(file, boardId, x, y, token);
    
    if (res.success) {
      const data = res.data;
      
      // 3. Swap Placeholder
      if (placeholderObj) canvas.remove(placeholderObj);

      if (data.type === 'image') {
        const proxyUrl = `${API_URL}/media/proxy/${data.mediaId}?token=${token}`;
        fabric.Image.fromURL(proxyUrl, function(img) {
          if (!img || !img.getElement()) {
            console.error('Failed to load proxy URL:', proxyUrl);
            return;
          }
          const instance = new MediaImage(img.getElement(), {
            left: x,
            top: y,
            mediaId: data.mediaId,
            mimeType: data.mimeType,
            fileName: data.fileName,
            id: `media_${Date.now()}`
          });
          if (instance.width > 800) instance.scaleToWidth(800);
          canvas.add(instance);
          canvas.requestRenderAll();
        }, { crossOrigin: 'anonymous' });
      } else {
        const instance = new FileIcon({
          left: x,
          top: y,
          mediaId: data.mediaId,
          mimeType: data.mimeType,
          fileName: data.fileName,
          uploadStatus: 'success',
          id: `media_${Date.now()}`
        });
        canvas.add(instance);
        canvas.requestRenderAll();
      }
    } else {
      if (placeholderObj) canvas.remove(placeholderObj);
      canvas.requestRenderAll();
      console.error("Board Media Upload failed", res.error);
    }

    e.target.value = null; // Reset input
  };

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0, x: '-50%' }}
      animate={{ y: 0, opacity: 1, x: '-50%' }}
      className="absolute top-20 left-1/2 z-30 flex flex-col items-center gap-3"
    >
      <div className="flex items-center p-2 bg-white/90 backdrop-blur-xl border border-border rounded-xl shadow-lg">
        <div className="flex gap-1">
          {tools.map(tool => {
            const Icon = tool.icon;
            const isActive = currentTool === tool.id;
            return (
              <button
                key={tool.id}
                title={tool.label}
                onClick={() => setCurrentTool(tool.id)}
                className={`p-2 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-gray-200 text-black' 
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </button>
            );
          })}
        </div>

        <div className="w-px h-8 bg-border mx-2" />

        {/* Undo / Redo / Layout UI */}
        <div className="flex gap-1">
          <button 
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" 
            title="Undo (Ctrl+Z)"
            onClick={handleUndo}
          >
            <Undo2 size={20} />
          </button>
          <button 
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" 
            title="Redo (Ctrl+Y)"
            onClick={handleRedo}
          >
            <Redo2 size={20} />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button 
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" 
            title="Auto Arrange"
            onClick={handleAutoArrange}
          >
            <LayoutTemplate size={20} />
          </button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <label 
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center" 
            title="Upload Media"
          >
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileUpload} 
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
            />
            <ImagePlus size={20} />
          </label>
        </div>
      </div>

      {/* Formatting Tools (Only show for drawing and select tools) */}
      {['pen', 'line', 'arrow', 'rect', 'circle', 'diamond', 'text', 'select'].includes(currentTool) && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-2 bg-white/90 backdrop-blur-xl border border-border rounded-xl shadow-md"
        >
          {/* Colors */}
          <div className="flex gap-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => setBrushColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${brushColor === c ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Stroke Width */}
          <div className="flex gap-2">
            {[2, 4, 8].map(size => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${brushSize === size ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
              >
                <div className="bg-slate-700 rounded-full" style={{ width: size + 2, height: size + 2 }} />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Toolbar;
