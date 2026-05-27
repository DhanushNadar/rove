import { fabric } from 'fabric';
import { BaseTool } from './BaseTool';
import { getAnchors } from '../connectors/connectorAnchors';
import { getBezierPath } from '../connectors/connectorRouting';

export class ArrowTool extends BaseTool {
  constructor(canvas) {
    super(canvas);
    this.sourceObj = null;
    this.targetObj = null;
    this.sourceAnchorName = 'center';
    this.targetAnchorName = 'center';
    this.connectionIndicator = null;
  }

  onMouseDown(opt, baseOptions) {
    super.onMouseDown(opt, baseOptions);
    this.baseOptions = baseOptions;
    this.sourceObj = null;
    this.targetObj = null;
    this.sourceAnchorName = 'center';
    this.targetAnchorName = 'center';
    
    // Find if start pointer is near any node anchor
    const pointer = this.startPointer;
    const objects = this.canvas.getObjects().filter(o => 
      o.id && o.customType !== 'arrow' && o.customType !== 'line' && o.customType !== 'pen' && o.type !== 'guide'
    );

    let closestDist = Infinity;
    objects.forEach(obj => {
      const anchors = getAnchors(obj);
      for (const [name, pt] of Object.entries(anchors)) {
        if (name === 'center') continue; // Anchor to edges only for arrows
        const dist = Math.sqrt(Math.pow(pt.x - pointer.x, 2) + Math.pow(pt.y - pointer.y, 2));
        if (dist < 50 && dist < closestDist) {
          closestDist = dist;
          this.startPointer = { x: pt.x, y: pt.y }; // Snap start position
          this.sourceObj = obj;
          this.sourceAnchorName = name;
        }
      }
    });

    const sx = this.startPointer.x;
    const sy = this.startPointer.y;
    const pathData = `M ${sx} ${sy} L ${sx} ${sy}`;
    
    this.shape = new fabric.Path(pathData, {
      ...baseOptions,
      fill: null,
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      selectable: false,
      evented: false,
      customType: 'arrow'
    });
    
    this.canvas.add(this.shape);
  }

  onMouseMove(opt) {
    if (!this.isDrawing || !this.shape) return;
    const pointer = this.canvas.getPointer(opt.e);
    
    let sx = this.startPointer.x;
    let sy = this.startPointer.y;
    let ex = pointer.x;
    let ey = pointer.y;
    
    this.targetObj = null;
    this.targetAnchorName = 'center';
    
    // Find closest anchor for endpoint snapping
    const objects = this.canvas.getObjects().filter(o => 
      o.id && o !== this.shape && o !== this.sourceObj &&
      o.customType !== 'arrow' && o.customType !== 'line' && o.customType !== 'pen' && o.type !== 'guide'
    );

    let closestDist = Infinity;
    let snapAnchorPoint = null;

    objects.forEach(obj => {
      const anchors = getAnchors(obj);
      for (const [name, pt] of Object.entries(anchors)) {
        if (name === 'center') continue;
        const dist = Math.sqrt(Math.pow(pt.x - pointer.x, 2) + Math.pow(pt.y - pointer.y, 2));
        if (dist < 50 && dist < closestDist) {
          closestDist = dist;
          snapAnchorPoint = pt;
          this.targetObj = obj;
          this.targetAnchorName = name;
        }
      }
    });

    if (snapAnchorPoint) {
      ex = snapAnchorPoint.x;
      ey = snapAnchorPoint.y;
      
      // Update or create glowing connection dot
      if (!this.connectionIndicator) {
        this.connectionIndicator = new fabric.Circle({
          radius: 6,
          fill: '#4f46e5',
          stroke: '#ffffff',
          strokeWidth: 2,
          selectable: false,
          evented: false,
          originX: 'center',
          originY: 'center',
          type: 'guide',
          id: 'temp_connection_indicator'
        });
        this.canvas.add(this.connectionIndicator);
      }
      this.connectionIndicator.set({ left: ex, top: ey }).setCoords();
      this.connectionIndicator.bringToFront();
    } else {
      if (this.connectionIndicator) {
        this.canvas.remove(this.connectionIndicator);
        this.connectionIndicator = null;
      }
    }

    // Build curve path
    let pathData = '';
    if (this.sourceObj || this.targetObj) {
      // Draw live cubic Bezier curve
      pathData = getBezierPath(
        { x: sx, y: sy },
        { x: ex, y: ey },
        this.sourceAnchorName,
        this.targetAnchorName
      );
    } else {
      // Standard curved line
      const cx = (sx + ex) / 2;
      const cy = (sy + ey) / 2;
      const angle = Math.atan2(ey - sy, ex - sx);
      const headLen = 18;
      const p1x = ex - headLen * Math.cos(angle - Math.PI / 6);
      const p1y = ey - headLen * Math.sin(angle - Math.PI / 6);
      const p2x = ex - headLen * Math.cos(angle + Math.PI / 6);
      const p2y = ey - headLen * Math.sin(angle + Math.PI / 6);
      pathData = `M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey} M ${ex} ${ey} L ${p1x} ${p1y} M ${ex} ${ey} L ${p2x} ${p2y}`;
    }
    
    const tempPath = new fabric.Path(pathData);
    this.shape.set({
      path: tempPath.path,
      width: tempPath.width,
      height: tempPath.height,
      pathOffset: tempPath.pathOffset,
      left: tempPath.left,
      top: tempPath.top
    });
    this.shape.setCoords();
    this.shape.dirty = true;
    this.canvas.requestRenderAll();
  }

  onMouseUp(opt) {
    super.onMouseUp(opt);
    
    // Clear glowing indicator
    if (this.connectionIndicator) {
      this.canvas.remove(this.connectionIndicator);
      this.connectionIndicator = null;
    }

    if (this.sourceObj && this.targetObj && this.sourceObj !== this.targetObj) {
      import('../connectors/connectorBindings').then(({ ConnectorBindings }) => {
        import('../connectors/connectorRouting').then(({ RoutingModes }) => {
          ConnectorBindings.bind(this.shape, this.sourceObj, this.targetObj, RoutingModes.BEZIER);
          ConnectorBindings.updateConnector(this.shape, this.sourceObj, this.targetObj);
          this.canvas.requestRenderAll();
        });
      });
    }
  }
}
