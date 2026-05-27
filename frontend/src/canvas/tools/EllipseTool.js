import { fabric } from 'fabric';
import { BaseTool } from './BaseTool';

export class EllipseTool extends BaseTool {
  onMouseDown(opt, baseOptions) {
    super.onMouseDown(opt, baseOptions);
    this.shape = new fabric.Ellipse({
      ...baseOptions,
      left: this.startPointer.x,
      top: this.startPointer.y,
      rx: 0,
      ry: 0,
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
    
    const rx = Math.abs(this.startPointer.x - pointer.x) / 2;
    const ry = Math.abs(this.startPointer.y - pointer.y) / 2;
    const left = Math.min(pointer.x, this.startPointer.x);
    const top = Math.min(pointer.y, this.startPointer.y);

    this.shape.set({ rx, ry, left, top });
    this.canvas.requestRenderAll();
  }
}
