import { create } from 'zustand';

export const useUIStore = create((set) => ({
  currentTool: 'select', // 'select', 'pan', 'pen', 'line', 'arrow', 'rect', 'circle', 'diamond', 'text', 'eraser'
  setCurrentTool: (tool) => set({ currentTool: tool }),
  brushColor: '#1e293b', // slate-800 for light theme default
  setBrushColor: (color) => set({ brushColor: color }),
  brushSize: 3,
  setBrushSize: (size) => set({ brushSize: size }),
  activeNodeId: null,
  setActiveNodeId: (id) => set({ activeNodeId: id }),
  isAIPanelOpen: false,
  toggleAIPanel: () => set((state) => ({ isAIPanelOpen: !state.isAIPanelOpen })),
  aiGraph: null,
  setAiGraph: (graph) => set({ aiGraph: graph }),
}));
