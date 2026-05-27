import { fabric } from 'fabric';
import { BaseTool } from './BaseTool';

export class DiamondTool extends BaseTool {
  onMouseDown(opt, baseOptions) {
    super.onMouseDown(opt, baseOptions);
    this.baseOptions = baseOptions;
    
    this.shape = new fabric.Polygon(
      [{ x: 0, y: 0 }, { x: 50, y: 50 }, { x: 0, y: 100 }, { x: -50, y: 50 }],
      {
        ...baseOptions,
        left: this.startPointer.x,
        top: this.startPointer.y,
        selectable: false,
        evented: false,
        originX: 'left',
        originY: 'top',
      }
    );
    this.canvas.add(this.shape);
  }

  onMouseMove(opt) {
    if (!this.isDrawing || !this.shape) return;
    const pointer = this.canvas.getPointer(opt.e);
    
    const width = Math.abs(pointer.x - this.startPointer.x);
    const height = Math.abs(pointer.y - this.startPointer.y);
    const left = Math.min(pointer.x, this.startPointer.x);
    const top = Math.min(pointer.y, this.startPointer.y);

    const points = [
      { x: width / 2, y: 0 },
      { x: width, y: height / 2 },
      { x: width / 2, y: height },
      { x: 0, y: height / 2 }
    ];

    this.canvas.remove(this.shape);
    this.shape = new fabric.Polygon(points, {
      ...this.baseOptions,
      left,
      top,
      selectable: false,
      evented: false,
      originX: 'left',
      originY: 'top',
    });
    this.canvas.add(this.shape);
  }
}
