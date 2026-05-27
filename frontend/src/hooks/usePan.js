import { useEffect, useRef } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useCanvasStore } from '../stores/useCanvasStore';
import { useCollabStore } from '../stores/useCollabStore';

export const usePan = (canvas) => {
  const isDragging = useRef(false);
  const lastPosX = useRef(0);
  const lastPosY = useRef(0);
  const { currentTool } = useUIStore();
  const { user } = useCollabStore();
  const board = useCanvasStore((state) => state.activeWhiteboard);

  const isOwner = board?.owner?._id === user?._id || board?.owner === user?._id;
  const collab = board?.collaborators?.find(c => (c.user?._id || c.user) === user?._id);
  const isViewer = !isOwner && collab?.role === 'viewer';

  useEffect(() => {
    if (!canvas) return;

    const handleMouseDown = (opt) => {
      const evt = opt.e;
      // Pan if middle mouse button (1), Spacebar is held, or if the user is a read-only viewer
      if (isViewer || currentTool === 'pan' || evt.button === 1 || evt.altKey) {
        isDragging.current = true;
        canvas.selection = false;
        lastPosX.current = evt.clientX;
        lastPosY.current = evt.clientY;
        canvas.setCursor('grabbing');
      }
    };

    const handleMouseMove = (opt) => {
      if (isDragging.current) {
        const e = opt.e;
        const vpt = canvas.viewportTransform;
        vpt[4] += e.clientX - lastPosX.current;
        vpt[5] += e.clientY - lastPosY.current;
        canvas.requestRenderAll();
        lastPosX.current = e.clientX;
        lastPosY.current = e.clientY;
        // Update Zustand transform
        useCanvasStore.getState().setTransform(canvas.getZoom(), { x: vpt[4], y: vpt[5] });
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        canvas.setViewportTransform(canvas.viewportTransform); // Trigger save state internally
        if (!isViewer && currentTool !== 'pan') canvas.selection = true;
        
        // Update Zustand transform
        const vpt = canvas.viewportTransform;
        useCanvasStore.getState().setTransform(canvas.getZoom(), { x: vpt[4], y: vpt[5] });
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvas, currentTool, isViewer]);
};
