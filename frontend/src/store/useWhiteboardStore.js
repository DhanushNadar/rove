import { create } from 'zustand';

const useWhiteboardStore = create((set, get) => ({
  // Authentication & API
  token: localStorage.getItem('token') || '',
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('token');
    const socket = get().socket;
    if (socket) socket.disconnect();
    set({ token: '', socket: null, activeWhiteboard: null });
  },

  // Active Whiteboard State
  activeWhiteboard: null,
  setActiveWhiteboard: (whiteboard) => set({ activeWhiteboard: whiteboard }),

  // Tools State
  currentTool: 'select', // 'select', 'pen', 'rect', 'circle', 'text', 'eraser'
  setCurrentTool: (tool) => set({ currentTool: tool }),
  brushColor: '#ffffff',
  setBrushColor: (color) => set({ brushColor: color }),
  brushSize: 3,
  setBrushSize: (size) => set({ brushSize: size }),

  // Socket & Real-time State
  socket: null,
  setSocket: (socket) => set({ socket }),
  activeUsers: [],
  setActiveUsers: (users) => set({ activeUsers: users }),
  addActiveUser: (user) => set((state) => ({ 
    activeUsers: state.activeUsers.some(u => u.socketId === user.socketId) 
      ? state.activeUsers 
      : [...state.activeUsers, user] 
  })),
  removeActiveUser: (socketId) => set((state) => ({
    activeUsers: state.activeUsers.filter((u) => u.socketId !== socketId)
  })),
  
  // Remote Cursors: { socketId: { x, y, name } }
  remoteCursors: {},
  updateRemoteCursor: (socketId, cursorData) => set((state) => ({
    remoteCursors: {
      ...state.remoteCursors,
      [socketId]: cursorData
    }
  })),
  removeRemoteCursor: (socketId) => set((state) => {
    const newCursors = { ...state.remoteCursors };
    delete newCursors[socketId];
    return { remoteCursors: newCursors };
  }),

  // AI Semantic Graph State
  aiGraph: null,
  setAiGraph: (graph) => set({ aiGraph: graph })
}));

export default useWhiteboardStore;
