import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { useCanvasStore } from '../../stores/useCanvasStore';

const ZoomControl = () => {
  const zoom = useCanvasStore((state) => state.zoom);
  const setTransform = useCanvasStore((state) => state.setTransform);

  const handleZoomIn = () => setCanvasZoom(Math.min(zoom * 1.25, 20));
  const handleZoomOut = () => setCanvasZoom(Math.max(zoom / 1.25, 0.05));
  const handleSliderChange = (e) => setCanvasZoom(parseFloat(e.target.value));

  const setCanvasZoom = (newZoom) => {
    const canvas = window.fabricCanvasInstance;
    if (!canvas) return;
    
    // Zoom centered on canvas viewport midpoint
    canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, newZoom);
    
    const vpt = canvas.viewportTransform;
    // Align background grid settings
    document.body.style.backgroundPosition = `${vpt[4]}px ${vpt[5]}px`;
    document.body.style.backgroundSize = `${20 * newZoom}px ${20 * newZoom}px`;
    
    // Reactively update store transforms
    setTransform(newZoom, { x: vpt[4], y: vpt[5] });
  };

  return (
    <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-lg p-2 px-3 transition-shadow duration-300 hover:shadow-xl">
      <button 
        onClick={handleZoomOut} 
        className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
        title="Zoom Out (Scroll Down)"
      >
        <Minus size={16} strokeWidth={2.5} />
      </button>
      
      <input 
        type="range" 
        min="0.1" 
        max="5" 
        step="0.01" 
        value={zoom > 5 ? 5 : zoom} 
        onChange={handleSliderChange}
        className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 transition-all focus:outline-none"
        style={{
          background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${Math.min(100, (Math.max(0.1, zoom > 5 ? 5 : zoom) - 0.1) / 4.9 * 100)}%, #e2e8f0 ${Math.min(100, (Math.max(0.1, zoom > 5 ? 5 : zoom) - 0.1) / 4.9 * 100)}%, #e2e8f0 100%)`
        }}
      />
      
      <button 
        onClick={handleZoomIn} 
        className="p-1.5 text-slate-500 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-100"
        title="Zoom In (Scroll Up)"
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
      
      <span className="text-xs font-mono font-bold text-slate-700 min-w-[44px] text-right pr-1 select-none">
        {Math.round(zoom * 100)}%
      </span>
    </div>
  );
};

export default ZoomControl;
