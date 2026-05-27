import { useMediaStore } from '../stores/useMediaStore';

export class HoverManager {
  static attach(canvas) {
    if (!canvas) return;

    canvas.on('mouse:over', (opt) => {
      const obj = opt.target;
      if (obj && (obj.customType === 'media-image' || obj.customType === 'file-icon')) {
        // Need pointer coordinates relative to viewport
        const pointer = canvas.getPointer(opt.e);
        const vpt = canvas.viewportTransform;
        
        // Calculate screen coordinates
        const screenX = (pointer.x * vpt[0]) + vpt[4];
        const screenY = (pointer.y * vpt[3]) + vpt[5];

        useMediaStore.getState().setHoveredMedia({
          x: screenX,
          y: screenY,
          mediaId: obj.mediaId,
          fileName: obj.fileName,
          mimeType: obj.mimeType,
          type: obj.customType === 'media-image' ? 'image' : 'file',
          width: obj.width * obj.scaleX,
          height: obj.height * obj.scaleY,
        });
      }
    });

    canvas.on('mouse:out', (opt) => {
      const obj = opt.target;
      if (obj && (obj.customType === 'media-image' || obj.customType === 'file-icon')) {
        useMediaStore.getState().setHoveredMedia(null);
      }
    });

    canvas.on('mouse:dblclick', (opt) => {
      const obj = opt.target;
      if (obj && obj.customType === 'media-image') {
        if (obj.mediaId) {
          useMediaStore.getState().setPreviewMediaId(obj.mediaId);
        }
      }
    });
  }
}
