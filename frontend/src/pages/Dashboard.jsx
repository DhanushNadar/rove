import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCollabStore } from '../stores/useCollabStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { LogOut, Plus, Loader2, Pencil, UserPlus, Trash, X, Mail, User, Bell, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_URL } from '../config';

const Dashboard = () => {
  const { token, user, logout } = useCollabStore();
  const { setActiveWhiteboard } = useCanvasStore();
  const [whiteboards, setWhiteboards] = useState([]);
  const [error, setError] = useState('');
  
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [openingBoardId, setOpeningBoardId] = useState(null);

  // Rename modal states
  const [renameBoardId, setRenameBoardId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  // Invite modal states
  const [shareBoardId, setShareBoardId] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('editor'); // 'editor', 'viewer'
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('idle'); // 'idle', 'verifying', 'verified', 'not_found'
  const [verificationMessage, setVerificationMessage] = useState('');

  // Pending invitations states
  const [invitations, setInvitations] = useState([]);
  const [showInvDropdown, setShowInvDropdown] = useState(false);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchWhiteboards();
    fetchInvitations();
  }, [token, navigate]);

  const fetchWhiteboards = async () => {
    setIsLoadingBoards(true);
    try {
      const res = await axios.get(`${API_URL}/whiteboards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWhiteboards(res.data.data);
    } catch (err) {
      setError('Failed to load whiteboards');
    } finally {
      setIsLoadingBoards(false);
    }
  };

  const fetchInvitations = async () => {
    if (!token) return;
    setIsLoadingInvites(true);
    try {
      const res = await axios.get(`${API_URL}/whiteboards/invitations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvitations(res.data.data);
    } catch (err) {
      console.error('Failed to load invitations', err);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  const handleAcceptInvitation = async (e, boardId) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_URL}/whiteboards/${boardId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh dashboards and invitations list
      fetchWhiteboards();
      fetchInvitations();
    } catch (err) {
      setError('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (e, boardId) => {
    e.stopPropagation();
    try {
      await axios.post(`${API_URL}/whiteboards/${boardId}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh invitations list
      fetchInvitations();
    } catch (err) {
      setError('Failed to decline invitation');
    }
  };

  const createWhiteboard = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/whiteboards`, 
        { title: 'New Architecture Board' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await openWhiteboard(res.data.data);
    } catch (err) {
      setError('Failed to create whiteboard');
    } finally {
      setIsCreating(false);
    }
  };

  const openWhiteboard = async (board) => {
    if (openingBoardId) return;
    setOpeningBoardId(board._id);
    try {
      const res = await axios.get(`${API_URL}/whiteboards/${board._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveWhiteboard(res.data.data);
      navigate(`/board/${board._id}`);
    } catch (err) {
      setError('Failed to load whiteboard');
    } finally {
      setOpeningBoardId(null);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!renameBoardId || !renameTitle.trim() || isRenaming) return;
    setIsRenaming(true);
    setError('');
    try {
      const res = await axios.put(`${API_URL}/whiteboards/${renameBoardId}/rename`, 
        { title: renameTitle },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWhiteboards(prev => prev.map(wb => wb._id === renameBoardId ? { ...wb, title: res.data.data.title } : wb));
      setRenameBoardId(null);
      setRenameTitle('');
    } catch (err) {
      setError('Failed to rename whiteboard');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this whiteboard?')) return;
    setError('');
    try {
      await axios.delete(`${API_URL}/whiteboards/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWhiteboards(prev => prev.filter(wb => wb._id !== id));
    } catch (err) {
      setError('Failed to delete whiteboard');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareBoardId || !shareEmail.trim() || isSharing) return;
    setIsSharing(true);
    setShareSuccess('');
    setError('');
    try {
      await axios.post(`${API_URL}/whiteboards/${shareBoardId}/share`, 
        { email: shareEmail, role: shareRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShareSuccess(`Invited ${shareEmail} successfully!`);
      setTimeout(() => {
        setShareBoardId(null);
        setShareEmail('');
        setShareSuccess('');
      }, 1500);
    } catch (err) {
      setError('Failed to invite member. Ensure the user is registered.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!shareEmail.trim()) return;
    setVerificationStatus('verifying');
    setVerificationMessage('');
    setError('');
    try {
      await axios.get(`${API_URL}/auth/verify-email?email=${shareEmail.trim()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerificationStatus('verified');
      setVerificationMessage('Verified');
    } catch (err) {
      setVerificationStatus('not_found');
      setVerificationMessage('No user with this email, enter correct email');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-full bg-canvas text-slate-900 p-8 relative">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 transition-colors text-sm font-medium flex items-center gap-1 mr-4">
               &larr; Home
            </button>
            <h2 className="text-3xl font-black flex items-center gap-3 text-slate-900 tracking-tight">
              <img src="/logo.webp" alt="Rove" className="h-10 w-10 object-contain shadow-sm border border-slate-200 rounded-lg p-1 bg-white" />
              My Dashboards
            </h2>
          </div>
          
          <div className="flex items-center gap-4 relative">
            {user && (
              <span className="hidden sm:inline text-sm text-slate-500 font-semibold mr-2">
                Welcome, <span className="text-slate-900">{user.name}</span>
              </span>
            )}

            <div className="relative">
              <button 
                type="button"
                className={`relative p-2 rounded-lg border transition-all duration-300 bg-white shadow-sm flex items-center justify-center ${
                  showInvDropdown ? 'border-indigo-600 text-indigo-600' : 'border-gray-300 text-slate-600 hover:bg-gray-100'
                }`}
                onClick={() => setShowInvDropdown(!showInvDropdown)}
              >
                <Bell size={18} />
                {invitations.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center animate-pulse border border-white">
                    {invitations.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showInvDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowInvDropdown(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-40 p-4"
                    >
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <Bell size={14} className="text-indigo-600" /> Board Invitations
                        </h4>
                        {invitations.length > 0 && (
                          <span className="text-[10px] bg-indigo-600/10 text-indigo-600 font-semibold px-2 py-0.5 rounded-full">
                            {invitations.length} Pending
                          </span>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto flex flex-col gap-2.5 custom-scrollbar pr-0.5">
                        {isLoadingInvites ? (
                          <div className="py-8 flex flex-col items-center justify-center text-slate-400">
                            <Loader2 size={20} className="animate-spin mb-2" />
                            <span className="text-xs font-semibold">Loading invites...</span>
                          </div>
                        ) : invitations.length === 0 ? (
                          <div className="py-8 text-center text-slate-400">
                            <p className="text-xs font-semibold">No pending invitations</p>
                            <p className="text-[10px] text-slate-400 mt-1">Invited boards will appear here</p>
                          </div>
                        ) : (
                          invitations.map((inv) => (
                            <div 
                              key={inv._id}
                              className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex flex-col gap-2 transition-all hover:bg-slate-100/50"
                            >
                              <div>
                                <h5 className="font-bold text-slate-800 text-sm truncate" title={inv.title}>
                                  {inv.title}
                                </h5>
                                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  Owner: <span className="text-slate-700 font-semibold">{inv.owner?.name || inv.owner?.email}</span>
                                </p>
                              </div>
                              <div className="flex gap-2 mt-1">
                                <button 
                                  type="button"
                                  onClick={(e) => handleAcceptInvitation(e, inv._id)}
                                  className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                                >
                                  <Check size={12} /> Accept
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => handleDeclineInvitation(e, inv._id)}
                                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-all shadow-sm"
                                >
                                  Decline
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <button 
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm font-medium"
              onClick={handleLogout}
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </header>

        {error && (
          <div className="text-red-500 bg-red-50 border border-red-200 p-3 px-4 rounded-xl mb-6 font-medium text-sm">
            {error}
          </div>
        )}

        {isLoadingBoards ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 size={40} className="animate-spin mb-4 text-accent" />
            <p className="font-medium">Loading your whiteboards...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* Create Card */}
            <motion.div 
              whileHover={isCreating ? {} : { scale: 1.02, translateY: -4 }}
              whileTap={isCreating ? {} : { scale: 0.98 }}
              className={`h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors bg-white/60 backdrop-blur-sm shadow-sm ${
                isCreating ? 'border-gray-300 cursor-not-allowed opacity-70' : 'border-accent/40 cursor-pointer hover:border-accent hover:bg-accent/5'
              }`}
              onClick={createWhiteboard}
            >
              {isCreating ? (
                <>
                  <Loader2 size={40} className="text-accent mb-3 animate-spin" />
                  <span className="text-accent font-semibold text-lg">Creating...</span>
                </>
              ) : (
                <>
                  <Plus size={40} className="text-accent mb-3" />
                  <span className="text-accent font-semibold text-lg">Create New</span>
                </>
              )}
            </motion.div>

            {/* Existing Boards */}
            {whiteboards.map(wb => {
              const isThisOpening = openingBoardId === wb._id;
              const isAnyOpening = openingBoardId !== null;
              
              return (
                <motion.div 
                  key={wb._id}
                  whileHover={isAnyOpening ? {} : { scale: 1.02, translateY: -4 }}
                  whileTap={isAnyOpening ? {} : { scale: 0.98 }}
                  className={`relative group h-48 p-6 bg-white/85 backdrop-blur-md border border-border rounded-2xl flex flex-col justify-between shadow-md transition-colors overflow-hidden ${
                    isAnyOpening && !isThisOpening ? 'opacity-50 cursor-not-allowed' : 
                    isThisOpening ? 'border-accent cursor-wait' : 'cursor-pointer hover:border-accent/50 hover:shadow-lg'
                  }`}
                  onClick={() => openWhiteboard(wb)}
                >
                  {isThisOpening && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                      <Loader2 size={32} className="animate-spin text-accent" />
                    </div>
                  )}

                  {/* Actions Toolbar on Hover */}
                  <div className="absolute top-4 right-4 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      title="Rename Board"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameBoardId(wb._id);
                        setRenameTitle(wb.title);
                      }}
                      className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-black rounded-lg shadow-sm hover:shadow transition-all"
                    >
                      <Pencil size={12} />
                    </button>
                    
                    <button 
                      title="Share / Add Member"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareBoardId(wb._id);
                        setVerificationStatus('idle');
                        setVerificationMessage('');
                      }}
                      className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-black rounded-lg shadow-sm hover:shadow transition-all"
                    >
                      <UserPlus size={12} />
                    </button>

                    <button 
                      title="Delete Board"
                      onClick={(e) => handleDelete(e, wb._id)}
                      className="p-1.5 bg-white border border-slate-200 text-red-500 hover:bg-red-50 rounded-lg shadow-sm hover:shadow transition-all"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2 truncate text-slate-800 pr-16" title={wb.title}>{wb.title}</h3>
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-black border border-gray-200">
                      {(wb.owner?._id || wb.owner) === user?._id ? 'Owner' : 'Collaborator'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    Updated: {new Date(wb.updatedAt).toLocaleDateString()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      <AnimatePresence>
        {renameBoardId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.form 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleRename}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl w-full max-w-sm flex flex-col gap-4 relative"
            >
              <button 
                type="button" 
                onClick={() => setRenameBoardId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
              
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Pencil size={18} className="text-accent" /> Rename Board
              </h3>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">NEW TITLE</label>
                <input 
                  type="text"
                  required
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm font-semibold"
                  placeholder="Enter board title"
                />
              </div>
              
              <button 
                type="submit"
                disabled={isRenaming}
                className="w-full bg-black hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm text-sm"
              >
                {isRenaming ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Share / Invite Modal */}
      <AnimatePresence>
        {shareBoardId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.form 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleShare}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl w-full max-w-sm flex flex-col gap-4 relative"
            >
              <button 
                type="button" 
                onClick={() => setShareBoardId(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
              
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserPlus size={18} className="text-accent" /> Share Board
              </h3>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Invite registered team members to collaborate on this board in real-time.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">EMAIL ADDRESS</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input 
                      type="email"
                      required
                      value={shareEmail}
                      onChange={(e) => {
                        setShareEmail(e.target.value);
                        setVerificationStatus('idle');
                        setVerificationMessage('');
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm font-semibold"
                      placeholder="name@company.com"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    disabled={verificationStatus === 'verifying' || !shareEmail.trim()}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-sm flex items-center justify-center gap-1 ${
                      verificationStatus === 'verified'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : verificationStatus === 'not_found'
                        ? 'bg-red-50 border-red-200 text-red-600 font-medium'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {verificationStatus === 'verifying' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : verificationStatus === 'verified' ? (
                      <>
                        <Check size={14} /> Verified
                      </>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
                
                {verificationMessage && (
                  <p className={`text-[10px] font-bold mt-1 leading-snug ${
                    verificationStatus === 'verified' ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {verificationMessage}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500 font-semibold">ROLE PERMISSION</label>
                <select 
                  value={shareRole}
                  onChange={(e) => setShareRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all text-sm font-semibold"
                >
                  <option value="editor">Editor (Can draw & save)</option>
                  <option value="viewer">Viewer (Read-only access)</option>
                </select>
              </div>

              {shareSuccess && (
                <div className="text-xs text-green-600 font-semibold text-center mt-1">
                  {shareSuccess}
                </div>
              )}
              
              <button 
                type="submit"
                disabled={isSharing || verificationStatus !== 'verified'}
                className="w-full bg-black hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSharing ? <Loader2 size={16} className="animate-spin" /> : 'Send Invite'}
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
