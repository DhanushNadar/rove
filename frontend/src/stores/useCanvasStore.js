import { create } from 'zustand';

export const useCanvasStore = create((set, get) => ({
  activeWhiteboard: null,
  setActiveWhiteboard: (board) => set({ activeWhiteboard: board }),
  
  // Canvas Viewport Transform
  zoom: 0.5,
  pan: { x: 0, y: 0 },
  setTransform: (zoom, pan) => set({ zoom, pan }),

  // Loading State
  isBoardReady: false,
  setIsBoardReady: (ready) => set({ isBoardReady: ready }),

  // Undo/Redo State
  history: [],
  historyIndex: -1,
  
  saveHistoryState: (jsonState) => {
    const { history, historyIndex } = get();
    // If we're not at the end of history and we make a new change, discard future history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(jsonState);
    
    // Cap history length to prevent memory leaks
    if (newHistory.length > 50) newHistory.shift();
    
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: (canvas) => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      return new Promise((resolve) => {
        canvas.loadFromJSON(state, () => {
          canvas.renderAll();
          set({ historyIndex: newIndex });
          resolve(state);
        });
      });
    }
    return Promise.resolve(null);
  },

  redo: (canvas) => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      return new Promise((resolve) => {
        canvas.loadFromJSON(state, () => {
          canvas.renderAll();
          set({ historyIndex: newIndex });
          resolve(state);
        });
      });
    }
    return Promise.resolve(null);
  }
}));
