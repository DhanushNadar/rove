import { AttachmentManager } from './attachmentManager';
import { MetadataManager } from './metadataManager';
import { MediaManager } from '../media/mediaManager';
import { FileIcon } from '../canvas/objects/FileObject';
import { MediaImage } from '../canvas/objects/ImageObject';
import { fabric } from 'fabric';

export class DragDropHandler {
  static attach(canvas, boardId, token, onUploadSuccess) {
    if (!canvas || !canvas.wrapperEl) return;
    
    const container = canvas.wrapperEl;

    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
    });

    container.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      // Find if we dropped exactly onto a node
      const targetObj = canvas.findTarget(e);

      if (targetObj && targetObj.id) {
        // Upload the first file to the node context
        try {
          const res = await AttachmentManager.upload(files[0], targetObj.id, boardId, token);
          if (res.success) {
            MetadataManager.addAttachment(targetObj, res.data);
            if (onUploadSuccess) onUploadSuccess(targetObj, res.data);
          }
        } catch (error) {
          console.error("Upload failed", error);
        }
      } else {
        // Independent Board Artifact Drop
        const file = files[0];
        const pointer = canvas.getPointer(e);
        const x = pointer.x;
        const y = pointer.y;

        // 1. Create Placeholder
        let placeholderObj = new FileIcon({
          left: x,
          top: y,
          mimeType: file.type || 'unknown',
          fileName: file.name,
          uploadStatus: 'uploading',
          id: `temp_${Date.now()}`
        });
        canvas.add(placeholderObj);
        canvas.requestRenderAll();

        // 2. Upload
        const res = await MediaManager.uploadMedia(file, boardId, x, y, token);
        
        if (res.success) {
          const data = res.data;
          
          // 3. Swap Placeholder
          if (placeholderObj) canvas.remove(placeholderObj);

          if (data.type === 'image') {
            const proxyUrl = `http://localhost:5000/api/v1/media/proxy/${data.mediaId}?token=${token}`;
            fabric.Image.fromURL(proxyUrl, function(img) {
              if (!img || !img.getElement()) {
                console.error('Failed to load proxy URL:', proxyUrl);
                return;
              }
              const instance = new MediaImage(img.getElement(), {
                left: x,
                top: y,
                mediaId: data.mediaId,
                mimeType: data.mimeType,
                fileName: data.fileName,
                id: `media_${Date.now()}`
              });
              // Optionally scale down if too large
              if (instance.width > 800) instance.scaleToWidth(800);
              canvas.add(instance);
              canvas.requestRenderAll();
              if (onUploadSuccess) onUploadSuccess(instance, data);
            }, { crossOrigin: 'anonymous' });
          } else {
            const instance = new FileIcon({
              left: x,
              top: y,
              mediaId: data.mediaId,
              mimeType: data.mimeType,
              fileName: data.fileName,
              uploadStatus: 'success',
              id: `media_${Date.now()}`
            });
            canvas.add(instance);
            canvas.requestRenderAll();
            if (onUploadSuccess) onUploadSuccess(instance, data);
          }
        } else {
          // Remove placeholder on fail, or set to failed
          if (placeholderObj) canvas.remove(placeholderObj);
          canvas.requestRenderAll();
          console.error("Board Media Upload failed", res.error);
        }
      }
    });
  }
}
