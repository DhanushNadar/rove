import { DagreLayout } from './dagreLayout';
import { CollisionResolver } from './collisionResolver';

export class LayoutEngine {
  static run(graphData, config) {
    // Engine abstraction. Could be swapped for ELK.js or Force-directed later.
    let layoutResult = DagreLayout.compute(graphData, config);
    
    // Post-process to fix any minor congestion
    layoutResult = CollisionResolver.resolve(layoutResult, config.collisionPadding);
    
    return layoutResult;
  }
}
