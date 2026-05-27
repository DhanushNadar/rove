import { useEffect } from 'react';
import { useCanvasStore } from '../stores/useCanvasStore';

export const useZoom = (canvas) => {
  useEffect(() => {
    if (!canvas) return;

    const handleWheel = (opt) => {
      const evt = opt.e;
      evt.preventDefault(); // Always prevent default scroll behavior on canvas
      
      let zoom = canvas.getZoom();
      const vpt = canvas.viewportTransform;
      
      if (evt.ctrlKey || evt.metaKey) {
        // Zoom speed
        zoom *= 0.999 ** evt.deltaY;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.05) zoom = 0.05;
        
        canvas.zoomToPoint({ x: evt.offsetX, y: evt.offsetY }, zoom);
        // Dynamically adjust click target finding tolerance based on zoom level
        // so thin lines are still easy to click when zoomed way out.
        canvas.targetFindTolerance = Math.min(24, Math.max(4, 4 / zoom));
        
        // Disable pixel-perfect clicking when extremely zoomed out, so users can just 
        // click the general bounding box area of tiny shapes
        canvas.perPixelTargetFind = zoom >= 0.5;
      } else {
        // Pan
        const panX = evt.shiftKey ? evt.deltaY : evt.deltaX;
        const panY = evt.shiftKey ? evt.deltaX : evt.deltaY;
        vpt[4] -= panX;
        vpt[5] -= panY;
        canvas.requestRenderAll();
      }
      
      // Update Zustand store
      const nextVpt = canvas.viewportTransform;
      useCanvasStore.getState().setTransform(zoom, { x: nextVpt[4], y: nextVpt[5] });
    };

    canvas.on('mouse:wheel', handleWheel);
    return () => canvas.off('mouse:wheel', handleWheel);
  }, [canvas]);
};
