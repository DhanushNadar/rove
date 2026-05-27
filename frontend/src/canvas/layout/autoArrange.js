import { GraphParser } from './graphParser';
import { LayoutEngine } from './layoutEngine';
import { AnimationEngine } from './animationEngine';

export class AutoArrange {
  static execute(canvas, config = { direction: 'TB', spacing: 120, collisionPadding: 40 }) {
    if (!canvas) return;

    // 1. Extract the semantic graph from the Fabric canvas
    const graphData = GraphParser.parse(canvas);
    
    if (graphData.nodes.length === 0) return;

    // 2. Compute Layout algorithmically
    const layoutResult = LayoutEngine.run(graphData, config);

    // 3. Render smoothly via centralized Animation Scheduler
    AnimationEngine.animate(canvas, layoutResult, graphData, 500);
  }
}
