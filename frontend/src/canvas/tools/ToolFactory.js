import { RectangleTool } from './RectangleTool';
import { EllipseTool } from './EllipseTool';
import { DiamondTool } from './DiamondTool';
import { LineTool } from './LineTool';
import { ArrowTool } from './ArrowTool';
import { PenTool } from './PenTool';

export class ToolFactory {
  static getTool(toolId, canvas) {
    switch (toolId) {
      case 'rect': return new RectangleTool(canvas);
      case 'circle': return new EllipseTool(canvas);
      case 'diamond': return new DiamondTool(canvas);
      case 'line': return new LineTool(canvas);
      case 'arrow': return new ArrowTool(canvas);
      case 'pen': return new PenTool(canvas);
      // text, eraser, pan, select are handled differently (via native events or simple handlers)
      default: return null;
    }
  }
}
