import { fabric } from 'fabric';
import { BaseTool } from './BaseTool';
import { getStroke } from 'perfect-freehand';
import getSvgPathFromStroke from '../../utils/getSvgPathFromStroke';
import { useUIStore } from '../../stores/useUIStore';

export class PenTool extends BaseTool {
  constructor(canvas) {
    super(canvas);
    this.points = [];
  }

  onMouseDown(opt, baseOptions) {
    super.onMouseDown(opt, baseOptions);
    this.points = [[this.startPointer.x, this.startPointer.y]];
    this.baseOptions = baseOptions; // Save for redraws
    
    this.shape = new fabric.Path('M 0 0', {
      ...baseOptions,
      fill: baseOptions.stroke,
      stroke: null,
      selectable: false,
      evented: false,
      customType: 'pen'
    });
    
    this.canvas.add(this.shape);
  }

  onMouseMove(opt) {
    if (!this.isDrawing || !this.shape) return;
    const pointer = this.canvas.getPointer(opt.e);
    
    this.points.push([pointer.x, pointer.y]);
    
    const brushSize = useUIStore.getState().brushSize;
    
    const stroke = getStroke(this.points, {
      size: brushSize * 2,
      thinning: 0.5,
      smoothing: 0.5,
      streamline: 0.5,
    });
    
    const pathData = getSvgPathFromStroke(stroke);
    
    // Completely replace the shape to avoid fabric.Path bounding box caching issues
    this.canvas.remove(this.shape);
    this.shape = new fabric.Path(pathData, {
      ...this.baseOptions,
      fill: this.baseOptions.stroke,
      stroke: null,
      selectable: false,
      evented: false,
      customType: 'pen'
    });
    this.canvas.add(this.shape);
  }
}
