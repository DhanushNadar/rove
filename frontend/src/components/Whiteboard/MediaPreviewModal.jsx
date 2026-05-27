import React from 'react';
import { useMediaStore } from '../../stores/useMediaStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useCollabStore } from '../../stores/useCollabStore';
import { API_URL } from '../../config';

const MediaPreviewModal = () => {
  const { previewMediaId, setPreviewMediaId } = useMediaStore();
  const token = useCollabStore((state) => state.token);

  if (!previewMediaId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-8"
        onClick={() => setPreviewMediaId(null)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-5xl max-h-full bg-slate-900 rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col overflow-hidden"
        >
          <button
            onClick={() => setPreviewMediaId(null)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-800/50 p-4">
            {/* The image is requested via the proxy endpoint securely */}
            <img 
              src={`${API_URL}/media/proxy/${previewMediaId}?token=${token}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              alt="Full Preview"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MediaPreviewModal;
