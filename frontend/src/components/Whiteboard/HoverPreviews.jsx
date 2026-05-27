import React from 'react';
import { useMediaStore } from '../../stores/useMediaStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollabStore } from '../../stores/useCollabStore';

const HoverPreviews = () => {
  const { hoveredMedia } = useMediaStore();
  const token = useCollabStore((state) => state.token);

  if (!hoveredMedia) return null;

  const { x, y, mediaId, fileName, mimeType, type, width, height } = hoveredMedia;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 5, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 pointer-events-none drop-shadow-xl"
        style={{
          left: x + 20,
          top: y - 80, // Position above the cursor
        }}
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-xl p-3 shadow-2xl flex items-center gap-3 w-64">
          
          {/* Image Thumbnail Preview */}
          {type === 'image' && mediaId && (
            <div className="w-12 h-12 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
              <img 
                src={`http://localhost:5000/api/v1/media/thumbnail/${mediaId}?token=${token}`}
                className="w-full h-full object-cover"
                alt="Thumbnail preview"
              />
            </div>
          )}

          {/* File Icon Preview */}
          {type === 'file' && (
            <div className="w-12 h-12 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <span className="text-2xl">📄</span>
            </div>
          )}

          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-sm font-semibold text-slate-800 truncate" title={fileName}>
              {fileName || 'Unknown File'}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="truncate max-w-[80px]">{mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}</span>
              <span>•</span>
              {type === 'image' && (
                <span>{Math.round(width)}x{Math.round(height)}</span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HoverPreviews;
