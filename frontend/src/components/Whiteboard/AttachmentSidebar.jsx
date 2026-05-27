import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useCollabStore } from '../../stores/useCollabStore';
import { MetadataManager } from '../../context/metadataManager';
import { AttachmentManager } from '../../context/attachmentManager';
import { Paperclip, X, Download, Trash, FileText, FileImage, File, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const AttachmentSidebar = () => {
  const { activeNodeId, setActiveNodeId } = useUIStore();
  const { activeWhiteboard } = useCanvasStore();
  const boardId = activeWhiteboard?._id;
  const { token, user } = useCollabStore();
  const [metadata, setMetadata] = useState({ notes: '', attachments: [] });
  const [activeObj, setActiveObj] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const isOwner = activeWhiteboard?.owner?._id === user?._id || activeWhiteboard?.owner === user?._id;
  const collab = activeWhiteboard?.collaborators?.find(c => (c.user?._id || c.user) === user?._id);
  const isViewer = !isOwner && collab?.role === 'viewer';

  const FABRIC_PROPS = ['id', 'customType', 'connectorData', 'semanticType', 'metadata', 'mediaId', 'fileName', 'mimeType', 'uploadStatus', 'version'];

  const triggerAutoSaveRef = useRef(
    debounce(async (json) => {
      const board = useCanvasStore.getState().activeWhiteboard;
      const currentToken = useCollabStore.getState().token;
      if (!board || !currentToken) return;
      try {
        await axios.put(
          `http://localhost:5000/api/v1/whiteboards/${board._id}/canvas`,
          { canvasData: json },
          { headers: { Authorization: `Bearer ${currentToken}` } }
        );
      } catch (err) {
        console.error('Auto-save failed', err);
      }
    }, 2000)
  );

  useEffect(() => {
    if (!activeNodeId || !window.fabricCanvasInstance) {
      setActiveObj(null);
      return;
    }
    
    const obj = window.fabricCanvasInstance.getObjects().find(o => o.id === activeNodeId);
    setActiveObj(obj);
    if (obj && obj.customType !== 'file-icon') {
      setMetadata(MetadataManager.getMetadata(obj));
    }
  }, [activeNodeId]);

  if (!activeNodeId || !activeObj) return null;

  // Render a simplified Download UI for independent file artifacts
  if (activeObj.customType === 'file-icon') {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="absolute top-20 right-4 w-72 bg-white/90 backdrop-blur-xl border border-border rounded-xl shadow-lg p-4 flex flex-col gap-4 z-40"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-slate-800 font-semibold flex items-center gap-2 truncate pr-2">
               <File size={18} className="text-accent" /> {activeObj.fileName || 'File'}
            </h3>
            <button onClick={() => setActiveNodeId(null)} className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 p-1 rounded-md transition-colors flex-shrink-0">
               <X size={18} />
            </button>
          </div>
          
          <button 
             onClick={() => {
                const proxyUrl = `http://localhost:5000/api/v1/media/proxy/${activeObj.mediaId}?token=${token}`;
                const a = document.createElement('a');
                a.href = proxyUrl;
                a.download = activeObj.fileName || 'download';
                a.target = '_blank';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
             }}
             className="w-full bg-gray-100 hover:bg-gray-200 text-black py-2 rounded-lg flex items-center justify-center gap-2 font-semibold transition-colors border border-gray-200 shadow-sm"
          >
             <Download size={18} /> Download File
          </button>
        </motion.div>
      </AnimatePresence>
    );
  }

  const handleNotesChange = (e) => {
    if (isViewer) return;
    const val = e.target.value;
    setMetadata(prev => ({ ...prev, notes: val }));
    
    const obj = window.fabricCanvasInstance.getObjects().find(o => o.id === activeNodeId);
    if (obj) {
      MetadataManager.updateNotes(obj, val);
      
      const json = window.fabricCanvasInstance.toJSON(FABRIC_PROPS);
      
      import('../../stores/useCanvasStore').then(({ useCanvasStore }) => {
        useCanvasStore.getState().saveHistoryState(json);
      });
      import('../../stores/useCollabStore').then(({ useCollabStore }) => {
        const socket = useCollabStore.getState().socket;
        if (socket) socket.emit('draw', json);
      });

      triggerAutoSaveRef.current(json);
    }
  };

  const handleFileUpload = async (e) => {
    if (isViewer) return;
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await AttachmentManager.upload(file, activeNodeId, boardId, token);
      if (res.success) {
        const obj = window.fabricCanvasInstance.getObjects().find(o => o.id === activeNodeId);
        if (obj) {
          MetadataManager.addAttachment(obj, res.data);
          setMetadata({ ...MetadataManager.getMetadata(obj) });
          
          const json = window.fabricCanvasInstance.toJSON(FABRIC_PROPS);
          
          import('../../stores/useCanvasStore').then(({ useCanvasStore }) => {
            useCanvasStore.getState().saveHistoryState(json);
          });
          import('../../stores/useCollabStore').then(({ useCollabStore }) => {
            const socket = useCollabStore.getState().socket;
            if (socket) socket.emit('draw', json);
          });

          triggerAutoSaveRef.current(json);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (att) => {
    if (isViewer) return;
    try {
      await AttachmentManager.deleteAttachment(att._id, token);
      const obj = window.fabricCanvasInstance.getObjects().find(o => o.id === activeNodeId);
      if (obj) {
        MetadataManager.removeAttachment(obj, att._id);
        setMetadata({ ...MetadataManager.getMetadata(obj) });
        
        const json = window.fabricCanvasInstance.toJSON(FABRIC_PROPS);
        
        import('../../stores/useCanvasStore').then(({ useCanvasStore }) => {
          useCanvasStore.getState().saveHistoryState(json);
        });
        import('../../stores/useCollabStore').then(({ useCollabStore }) => {
          const socket = useCollabStore.getState().socket;
          if (socket) socket.emit('draw', json);
        });

        triggerAutoSaveRef.current(json);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDownload = async (att) => {
    try {
      const url = await AttachmentManager.getDownloadUrl(att._id, token);
      window.open(url, '_blank');
    } catch(err) {
      console.error(err);
    }
  };

  const renderIcon = (mime) => {
    if (mime.includes('image')) return <FileImage size={24} className="text-blue-400" />;
    if (mime.includes('pdf')) return <FileText size={24} className="text-red-400" />;
    return <File size={24} className="text-gray-400" />;
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        className="absolute top-20 right-4 w-80 bg-white/90 backdrop-blur-xl border border-border rounded-xl shadow-lg p-4 flex flex-col gap-4 z-40 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-slate-800 font-semibold flex items-center gap-2">
            <Paperclip size={18} className="text-accent" /> Context Layer
          </h3>
          <button onClick={() => setActiveNodeId(null)} className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs text-slate-500 font-medium">NOTES (MARKDOWN)</label>
          <textarea 
            className="w-full h-32 bg-slate-50 border border-border rounded-lg p-3 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:border-accent transition-colors"
            placeholder={isViewer ? "No architectural notes available" : "Add architectural notes, reasoning, or links..."}
            value={metadata.notes}
            onChange={handleNotesChange}
            readOnly={isViewer}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-xs text-slate-500 font-medium">ATTACHMENTS</label>
            {!isViewer && (
              <label className={`text-xs flex items-center gap-1 cursor-pointer hover:underline ${isUploading ? 'text-slate-400' : 'text-accent'}`}>
                {isUploading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" /> Uploading...
                  </>
                ) : (
                  '+ Add File'
                )}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {metadata.attachments.length === 0 && (
              <div className="text-center p-4 border border-dashed border-border rounded-lg text-slate-500 text-sm bg-slate-50/50">
                {isViewer ? 'No attachments loaded for this node.' : 'Drag & Drop files onto this node, or click + Add File.'}
              </div>
            )}
            {metadata.attachments.map(att => (
              <div key={att._id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-border group hover:border-gray-400 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  {renderIcon(att.mimeType)}
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-800 truncate w-32" title={att.fileName}>{att.fileName}</span>
                    <span className="text-xs text-slate-500">{(att.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDownload(att)} className="p-1.5 text-slate-500 hover:text-black hover:bg-gray-200 rounded" title="Download">
                    <Download size={14} />
                  </button>
                  {!isViewer && (
                    <button onClick={() => handleDelete(att)} className="p-1.5 text-slate-500 hover:text-black hover:bg-gray-200 rounded" title="Delete">
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default AttachmentSidebar;
