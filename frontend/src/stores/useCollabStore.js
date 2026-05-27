import { create } from 'zustand';

export const useCollabStore = create((set, get) => ({
  token: localStorage.getItem('token') || '',
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },
  setTokenAndUser: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const socket = get().socket;
    if (socket) socket.disconnect();
    set({ token: '', user: null, socket: null, remoteCursors: {}, activeUsers: [] });
  },

  socket: null,
  setSocket: (socket) => set({ socket }),

  // Online Active Collaborators (Presence)
  activeUsers: [],
  setActiveUsers: (users) => set({ activeUsers: users }),
  addActiveUser: (user) => set((state) => {
    // Prevent duplicate entries for the same socket connection
    if (state.activeUsers.some(u => u.socketId === user.socketId)) return {};
    return { activeUsers: [...state.activeUsers, user] };
  }),
  removeActiveUser: (socketId) => set((state) => ({
    activeUsers: state.activeUsers.filter(u => u.socketId !== socketId)
  })),
  
  // Remote Cursors (We will keep store properties, but not render cursors on canvas as requested)
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
  })
}));
