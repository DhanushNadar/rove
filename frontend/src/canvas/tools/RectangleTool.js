import { fabric } from 'fabric';
import { BaseTool } from './BaseTool';

export class RectangleTool extends BaseTool {
  onMouseDown(opt, baseOptions) {
    super.onMouseDown(opt, baseOptions);
    this.shape = new fabric.Rect({
      ...baseOptions,
      left: this.startPointer.x,
      top: this.startPointer.y,
      width: 0,
      height: 0,
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top'
    });
    this.canvas.add(this.shape);
  }

  onMouseMove(opt) {
    if (!this.isDrawing || !this.shape) return;
    const pointer = this.canvas.getPointer(opt.e);
    
    // Negative Drag Support
    const width = Math.abs(pointer.x - this.startPointer.x);
    const height = Math.abs(pointer.y - this.startPointer.y);
    const left = Math.min(pointer.x, this.startPointer.x);
    const top = Math.min(pointer.y, this.startPointer.y);

    this.shape.set({ left, top, width, height });
    this.canvas.requestRenderAll();
  }
}
