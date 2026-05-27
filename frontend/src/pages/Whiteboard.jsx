import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, Save, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollabStore } from '../stores/useCollabStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import CanvasEngine from '../components/Whiteboard/CanvasEngine';
import Toolbar from '../components/Whiteboard/Toolbar';
import AttachmentSidebar from '../components/Whiteboard/AttachmentSidebar';
import AttachmentIndicator from '../components/Whiteboard/AttachmentIndicator';
import HoverPreviews from '../components/Whiteboard/HoverPreviews';
import MediaPreviewModal from '../components/Whiteboard/MediaPreviewModal';
import ZoomControl from '../components/Whiteboard/ZoomControl';

const SOCKET_URL = 'http://localhost:5000';

const Whiteboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { token, setSocket, socket, activeUsers, user } = useCollabStore();
  const { activeWhiteboard, setActiveWhiteboard } = useCanvasStore();
  const isBoardReady = useCanvasStore((state) => state.isBoardReady);

  const isOwner = activeWhiteboard?.owner?._id === user?._id || activeWhiteboard?.owner === user?._id;
  const collab = activeWhiteboard?.collaborators?.find(c => (c.user?._id || c.user) === user?._id);
  const isViewer = !isOwner && collab?.role === 'viewer';
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'

  // Get all registered members of the board
  const boardMembers = [];
  if (activeWhiteboard) {
    if (activeWhiteboard.owner) {
      const ownerId = activeWhiteboard.owner._id || activeWhiteboard.owner;
      boardMembers.push({
        _id: ownerId,
        name: activeWhiteboard.owner.name,
        email: activeWhiteboard.owner.email,
        initial: (activeWhiteboard.owner.name || 'Owner').charAt(0).toUpperCase(),
        isOwner: true
      });
    }

    if (activeWhiteboard.collaborators) {
      activeWhiteboard.collaborators.forEach(collab => {
        if (collab.status === 'accepted' && collab.user) {
          const collabId = collab.user._id || collab.user;
          // Prevent adding owner again if they are somehow listed in collaborators
          if (boardMembers.some(m => m._id.toString() === collabId.toString())) return;
          boardMembers.push({
            _id: collabId,
            name: collab.user.name,
            email: collab.user.email,
            initial: (collab.user.name || 'Collaborator').charAt(0).toUpperCase(),
            isOwner: false
          });
        }
      });
    }
  }

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchWhiteboard = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/v1/whiteboards/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setActiveWhiteboard(res.data.data);
      } catch (err) {
        console.error(err);
        navigate('/dashboard');
      }
    };

    if (!activeWhiteboard || activeWhiteboard._id !== id) {
      fetchWhiteboard();
    }
  }, [id, token, activeWhiteboard, navigate, setActiveWhiteboard]);

  useEffect(() => {
    if (!token || !activeWhiteboard) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      newSocket.emit('join-room', { whiteboardId: id });
    });

    // Listen to real-time collaboration presence updates
    newSocket.on('room-joined', ({ users }) => {
      useCollabStore.getState().setActiveUsers(users);
    });

    newSocket.on('user-joined', ({ user }) => {
      useCollabStore.getState().addActiveUser(user);
    });

    newSocket.on('user-left', ({ socketId }) => {
      useCollabStore.getState().removeActiveUser(socketId);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
    };
  }, [id, token, activeWhiteboard, setSocket]);

  const handleManualSave = async () => {
    if (!window.fabricCanvasInstance || !activeWhiteboard) return;
    setSaveStatus('saving');
    try {
      const json = window.fabricCanvasInstance.toJSON(['id', 'customType', 'connectorData', 'semanticType', 'metadata', 'mediaId', 'fileName', 'mimeType', 'uploadStatus', 'version']);
      await axios.put(
        `http://localhost:5000/api/v1/whiteboards/${activeWhiteboard._id}/canvas`,
        { canvasData: json },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      console.error('Manual save failed', err);
    }
  };

  // Render a full-viewport loader if we don't even have activeWhiteboard metadata yet
  if (!activeWhiteboard) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-white text-slate-900 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xl border border-slate-200 p-8 rounded-3xl shadow-2xl max-w-sm text-center">
          <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
          <h2 className="text-xl font-bold tracking-wide text-slate-800">Connecting...</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Securing collaboration server room</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-canvas">

      {/* Screen Loader Overlay - Fades out only when the whole board and its contents are 100% ready */}
      <AnimatePresence>
        {!isBoardReady && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white"
          >
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
            <div className="relative flex flex-col items-center justify-center p-8 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl max-w-sm text-center">
              <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
              <h2 className="text-xl font-bold tracking-wide text-slate-800">Rendering Whiteboard...</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">Parsing canvas workspace details and pre-rendering connector links</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header - Premium Light Glass Style */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center px-4 py-3 bg-white/85 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={20} />
          </button>
          <h3 className="font-semibold text-slate-800 tracking-wide">{activeWhiteboard.title}</h3>
        </div>

        {/* Active Collaborators Online Stacked Avatars */}
        <div className="flex items-center gap-2 select-none">
          <div className="flex -space-x-2 overflow-hidden mr-2">
            {boardMembers.slice(0, 5).map((member) => {
              const isOnline = activeUsers.some(u => u.userId?.toString() === member._id?.toString());
              return (
                <div 
                  key={member._id}
                  title={`${member.name} (${isOnline ? 'Online' : 'Offline'})${member.isOwner ? ' - Owner' : ''}`}
                  className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full border-2 text-[10px] font-black shadow-sm transition-all duration-300 ${
                    isOnline 
                      ? 'border-emerald-500 bg-indigo-600 text-white opacity-100 scale-100 ring-2 ring-emerald-500/20' 
                      : 'border-slate-200 bg-slate-100 text-slate-400 opacity-50'
                  }`}
                >
                  {member.initial}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1.5 ring-white" />
                  )}
                </div>
              );
            })}
            {boardMembers.length > 5 && (
              <div 
                title={`${boardMembers.length - 5} more members`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold shadow-sm"
              >
                +{boardMembers.length - 5}
              </div>
            )}
          </div>
          {boardMembers.length <= 1 && (
            <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-slate-500 font-semibold uppercase tracking-wider">Solo Session</span>
          )}
        </div>
      </div>

      <CanvasEngine />
      <AttachmentIndicator />
      <Toolbar />
      <AttachmentSidebar />
      <HoverPreviews />
      <MediaPreviewModal />
      <ZoomControl />

      {/* Manual Save Button - Light Glass Style */}
      {!isViewer && (
        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={handleManualSave}
            disabled={saveStatus === 'saving'}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 font-semibold shadow-sm
              ${saveStatus === 'saving' ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 
                saveStatus === 'saved' ? 'bg-black border-black text-white' :
                saveStatus === 'error' ? 'bg-gray-200 border-gray-400 text-black' :
                'bg-white/80 hover:bg-white border-border text-slate-700 backdrop-blur-md'}
            `}
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : saveStatus === 'saved' ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className={`w-4 h-4 ${saveStatus === 'idle' ? 'text-accent' : ''}`} />
            )}
            <span className="text-sm">
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'saved' ? 'Saved' : 
               saveStatus === 'error' ? 'Failed' : 'Save'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
