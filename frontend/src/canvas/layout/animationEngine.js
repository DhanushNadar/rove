import { ConnectorManager } from '../connectors/connectorManager';

export class AnimationEngine {
  static animate(canvas, layoutResult, graphData, duration = 400) {
    const startTime = performance.now();
    
    // Snapshot positions for interpolation
    const startPositions = {};
    graphData.nodes.forEach(n => {
      startPositions[n.id] = { left: n.fabricObj.left, top: n.fabricObj.top };
    });

    const animateFrame = (time) => {
      let progress = (time - startTime) / duration;
      if (progress > 1) progress = 1;
      
      // easeInOutCubic smoothing
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      graphData.nodes.forEach(node => {
        const target = layoutResult[node.id];
        if (target) {
          const start = startPositions[node.id];
          
          // Dagre returns the center, we need to assign left/top relative to bounding box logic
          // A simple approximation is adjusting by half width/height
          const targetLeft = target.x - node.width / 2;
          const targetTop = target.y - node.height / 2;

          node.fabricObj.set({
            left: start.left + (targetLeft - start.left) * ease,
            top: start.top + (targetTop - start.top) * ease
          });
          node.fabricObj.setCoords();
        }
      });

      // Recalculate ALL bound connectors on this animation frame!
      ConnectorManager.updateAll(canvas);
      canvas.requestRenderAll();

      if (progress < 1) {
        requestAnimationFrame(animateFrame);
      } else {
        // Animation complete! Commit to Undo/Redo history as a single event.
        import('../../stores/useCanvasStore').then(({ useCanvasStore }) => {
          const json = canvas.toJSON(['id', 'customType', 'connectorData', 'semanticType']);
          useCanvasStore.getState().saveHistoryState(json);
          
          // Broadcast to collaborators
          import('../../stores/useCollabStore').then(({ useCollabStore }) => {
            const socket = useCollabStore.getState().socket;
            if (socket) socket.emit('draw', json);
          });
        });
      }
    };

    // Kickoff the loop
    requestAnimationFrame(animateFrame);
  }
}
