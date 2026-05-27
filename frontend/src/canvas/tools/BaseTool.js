export class BaseTool {
  constructor(canvas) {
    this.canvas = canvas;
    this.isDrawing = false;
    this.startPointer = null;
    this.shape = null;
  }

  // To be overridden by specific tools
  onMouseDown(opt, baseOptions) {
    this.isDrawing = true;
    this.startPointer = this.canvas.getPointer(opt.e);
  }

  // To be overridden by specific tools
  onMouseMove(opt) {}

  onMouseUp() {
    this.isDrawing = false;
    if (this.shape) {
      this.shape.setCoords();
      // Do NOT set selectable: true here. The CanvasEngine will handle 
      // setting all objects to selectable when the user switches to the 'select' tool.
      // This prevents objects from being accidentally selectable while still in a drawing tool mode.
    }
  }

  // Clean up references
  destroy() {
    this.canvas = null;
    this.shape = null;
    this.startPointer = null;
  }
}
