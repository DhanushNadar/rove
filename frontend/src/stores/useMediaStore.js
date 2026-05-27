import { create } from 'zustand';

export const useMediaStore = create((set) => ({
  hoveredMedia: null,
  setHoveredMedia: (mediaInfo) => set({ hoveredMedia: mediaInfo }),
  
  previewMediaId: null,
  setPreviewMediaId: (mediaId) => set({ previewMediaId: mediaId })
}));
