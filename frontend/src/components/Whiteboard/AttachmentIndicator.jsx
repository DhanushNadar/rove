import React, { useEffect, useState } from 'react';
import { Paperclip, FileText } from 'lucide-react';
import { useUIStore } from '../../stores/useUIStore';

const AttachmentIndicator = () => {
  const [indicators, setIndicators] = useState([]);
  
  useEffect(() => {
    // Wait for canvas to mount
    const checkCanvas = setInterval(() => {
      if (window.fabricCanvasInstance) {
        clearInterval(checkCanvas);
        setupIndicators(window.fabricCanvasInstance);
      }
    }, 500);

    return () => clearInterval(checkCanvas);
  }, []);

  const setupIndicators = (canvas) => {
    const updateIndicators = () => {
      const newIndicators = [];
      canvas.getObjects().forEach(obj => {
        if (!obj.id) return;
        const md = obj.metadata || {};
        const hasNotes = md.notes && md.notes.trim().length > 0;
        const hasAttachments = md.attachments && md.attachments.length > 0;
        
        if (hasNotes || hasAttachments) {
          const br = obj.getBoundingRect(true, true);
          const vpt = canvas.viewportTransform;
          
          const screenX = br.left * vpt[0] + vpt[4] + br.width * vpt[0];
          const screenY = br.top * vpt[3] + vpt[5];

          newIndicators.push({
            id: obj.id,
            x: screenX,
            y: screenY,
            hasNotes,
            hasAttachments,
            count: md.attachments ? md.attachments.length : 0
          });
        }
      });
      setIndicators(newIndicators);
    };

    canvas.on('after:render', updateIndicators);
    // Initial call
    updateIndicators();
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {indicators.map(ind => (
        <div 
          key={ind.id} 
          className="absolute flex items-center gap-1 bg-panel border border-border shadow-lg rounded-md px-1.5 py-0.5 pointer-events-auto cursor-pointer hover:border-accent transition-colors"
          style={{ 
            left: `${ind.x}px`, 
            top: `${ind.y}px`,
            transform: 'translate(-50%, -50%)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            useUIStore.getState().setActiveNodeId(ind.id);
          }}
          title="Click to view context"
        >
          {ind.hasAttachments && (
            <div className="flex items-center text-xs text-blue-400">
              <Paperclip size={10} />
              <span className="ml-0.5">{ind.count}</span>
            </div>
          )}
          {ind.hasNotes && <FileText size={10} className="text-yellow-400" />}
        </div>
      ))}
    </div>
  );
};

export default AttachmentIndicator;
