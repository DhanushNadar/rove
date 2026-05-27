export class CollisionResolver {
  static resolve(layoutResult, padding = 40) {
    // Dagre naturally prevents node overlap.
    // In the future, orthogonal routing congestion checks and edge collision offsets go here.
    return layoutResult;
  }
}
