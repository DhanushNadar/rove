import { fabric } from 'fabric';
import { getAnchors, getClosestAnchorName } from './connectorAnchors';
import { calculateConnectorPath, RoutingModes } from './connectorRouting';

export const ConnectorBindings = {
  bind: (connectorObj, sourceObj, targetObj, routingMode = RoutingModes.BEZIER) => {
    connectorObj.set({
      connectorData: {
        sourceObjectId: sourceObj.id,
        targetObjectId: targetObj.id,
        routingMode,
        // Will be dynamically calculated
        sourceAnchor: 'center',
        targetAnchor: 'center',
        curvature: 0
      }
    });
    // Set up custom curve control
    setupConnectorControls(connectorObj);
  },

  updateConnector: (connectorObj, sourceObj, targetObj) => {
    if (!connectorObj) return;

    if (!connectorObj.connectorData) {
      connectorObj.connectorData = {
        sourceObjectId: null,
        targetObjectId: null,
        routingMode: RoutingModes.BEZIER,
        sourceAnchor: 'center',
        targetAnchor: 'center',
        curvature: 0
      };
    }

    const data = connectorObj.connectorData;
    const mode = data.routingMode || RoutingModes.BEZIER;
    const curvature = data.curvature || 0;

    const canvas = connectorObj.canvas;
    const objects = canvas ? canvas.getObjects() : [];

    // Resolve source point
    let p1 = null;
    let sourceAnchorName = data.sourceAnchor || 'center';
    const resolvedSourceObj = sourceObj || (canvas && data.sourceObjectId ? objects.find(o => o.id === data.sourceObjectId) : null);
    if (resolvedSourceObj) {
      const sourceAnchors = getAnchors(resolvedSourceObj);
      const targetCenter = targetObj ? targetObj.getCenterPoint() : (data.targetPoint || connectorObj.getCenterPoint());
      sourceAnchorName = getClosestAnchorName(sourceAnchors, targetCenter);
      data.sourceAnchor = sourceAnchorName;
      p1 = sourceAnchors[sourceAnchorName];
    } else {
      p1 = data.sourcePoint || getPathEndpoints(connectorObj).p1;
    }

    // Resolve target point
    let p2 = null;
    let targetAnchorName = data.targetAnchor || 'center';
    const resolvedTargetObj = targetObj || (canvas && data.targetObjectId ? objects.find(o => o.id === data.targetObjectId) : null);
    if (resolvedTargetObj) {
      const targetAnchors = getAnchors(resolvedTargetObj);
      const sourceCenter = sourceObj ? sourceObj.getCenterPoint() : (data.sourcePoint || connectorObj.getCenterPoint());
      targetAnchorName = getClosestAnchorName(targetAnchors, sourceCenter);
      data.targetAnchor = targetAnchorName;
      p2 = targetAnchors[targetAnchorName];
    } else {
      p2 = data.targetPoint || getPathEndpoints(connectorObj).p2;
    }

    if (!p1 || !p2) return;

    // Save points inside connectorData
    data.sourcePoint = { x: p1.x, y: p1.y };
    data.targetPoint = { x: p2.x, y: p2.y };

    const pathData = calculateConnectorPath(p1, p2, sourceAnchorName, targetAnchorName, mode, curvature);

    const tempPath = new fabric.Path(pathData);
    connectorObj.set({
      path: tempPath.path,
      width: tempPath.width,
      height: tempPath.height,
      pathOffset: tempPath.pathOffset,
      left: tempPath.left,
      top: tempPath.top
    });
    connectorObj.setCoords();
    connectorObj.dirty = true;
    
    if (connectorObj.canvas) {
      connectorObj.canvas.requestRenderAll();
    }
  }
};

// Robust path parser to extract endpoint positions directly from path segments
function getPathEndpoints(fabricObject) {
  const path = fabricObject.path;
  if (!path || path.length < 2) {
    const center = fabricObject.getCenterPoint();
    return { p1: center, p2: center };
  }

  // Segment 0: ['M', x, y]
  const p1Raw = { x: path[0][1], y: path[0][2] };

  // Segment 1: main line/curve endpoint
  const seg1 = path[1];
  let p2Raw = { x: p1Raw.x, y: p1Raw.y };
  if (seg1) {
    if (seg1[0] === 'L') {
      p2Raw = { x: seg1[1], y: seg1[2] };
    } else if (seg1[0] === 'Q') {
      p2Raw = { x: seg1[3], y: seg1[4] };
    } else if (seg1[0] === 'C') {
      p2Raw = { x: seg1[5], y: seg1[6] };
    }
  }

  const offset = fabricObject.pathOffset || { x: 0, y: 0 };
  const p1Local = { x: p1Raw.x - offset.x, y: p1Raw.y - offset.y };
  const p2Local = { x: p2Raw.x - offset.x, y: p2Raw.y - offset.y };

  const matrix = fabricObject.calcTransformMatrix();
  const p1 = fabric.util.transformPoint(p1Local, matrix);
  const p2 = fabric.util.transformPoint(p2Local, matrix);

  return { p1, p2 };
}

export function setupConnectorControls(connectorObj) {
  if (!connectorObj) return;

  // Hides standard borders and selection bounding box resize/rotate handles
  connectorObj.set({
    hasBorders: false,
    hasControls: true,
    borderColor: 'transparent'
  });

  // Define the custom control for curving
  connectorObj.controls = {
    curve: new fabric.Control({
      x: 0,
      y: 0,
      sizeX: 20,
      sizeY: 20,
      touchSizeX: 30,
      touchSizeY: 30,
      positionHandler: function(dim, finalMatrix, fabricObject, control) {
        const canvas = fabricObject.canvas;
        if (!canvas) return new fabric.Point(0, 0);

        const data = fabricObject.connectorData || {};
        const curvature = data.curvature || 0;

        const { p1, p2 } = getPathEndpoints(fabricObject);

        // Calculate midpoint
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        // Perpendicular vector
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;

        // Curve control point position
        const handlePt = new fabric.Point(
          mid.x + nx * curvature,
          mid.y + ny * curvature
        );

        // Convert world coordinate to canvas screen coordinate
        return fabric.util.transformPoint(handlePt, canvas.viewportTransform);
      },
      actionHandler: function(eventData, transform, x, y) {
        const connector = transform.target;
        const canvas = connector.canvas;
        if (!canvas) return false;

        const data = connector.connectorData || {};
        const { p1, p2 } = getPathEndpoints(connector);

        // Calculate midpoint
        const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

        // Perpendicular vector
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;

        // Pointer coordinate in world coordinates
        const mousePt = canvas.getPointer(eventData);

        // Projected distance from midpoint along perpendicular vector
        const vx = mousePt.x - mid.x;
        const vy = mousePt.y - mid.y;
        const newCurvature = vx * nx + vy * ny;

        // Update curvature
        connector.connectorData.curvature = newCurvature;

        // Reposition and redraw the path
        ConnectorBindings.updateConnector(connector);

        return true;
      },
      actionName: 'curve',
      cursorStyle: 'pointer',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        const size = 12;
        ctx.save();
        ctx.beginPath();
        ctx.arc(left, top, size / 2, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#8b5cf6'; // Violet-500
        ctx.stroke();
        ctx.restore();
      }
    }),
    source: new fabric.Control({
      x: 0,
      y: 0,
      sizeX: 20,
      sizeY: 20,
      touchSizeX: 30,
      touchSizeY: 30,
      positionHandler: function(dim, finalMatrix, fabricObject, control) {
        const canvas = fabricObject.canvas;
        if (!canvas) return new fabric.Point(0, 0);

        const { p1 } = getPathEndpoints(fabricObject);
        return fabric.util.transformPoint(p1, canvas.viewportTransform);
      },
      actionHandler: function(eventData, transform, x, y) {
        const connector = transform.target;
        const canvas = connector.canvas;
        if (!canvas) return false;

        if (!connector.connectorData) {
          connector.connectorData = {
            sourceObjectId: null,
            targetObjectId: null,
            routingMode: RoutingModes.BEZIER,
            sourceAnchor: 'center',
            targetAnchor: 'center',
            curvature: 0
          };
        }

        const mousePt = canvas.getPointer(eventData);

        // Find closest anchor on any object (excluding connectors and guides)
        const objects = canvas.getObjects().filter(o => 
          o.id && o !== connector &&
          o.customType !== 'arrow' && o.customType !== 'line' && o.customType !== 'pen' && o.type !== 'guide'
        );

        let closestDist = Infinity;
        let closestObj = null;
        let closestAnchorName = 'center';

        objects.forEach(obj => {
          const anchors = getAnchors(obj);
          for (const [name, pt] of Object.entries(anchors)) {
            if (name === 'center') continue;
            const dist = Math.sqrt(Math.pow(pt.x - mousePt.x, 2) + Math.pow(pt.y - mousePt.y, 2));
            if (dist < 60 && dist < closestDist) {
              closestDist = dist;
              closestObj = obj;
              closestAnchorName = name;
            }
          }
        });

        if (closestObj) {
          connector.connectorData.sourceObjectId = closestObj.id;
          connector.connectorData.sourceAnchor = closestAnchorName;
          connector.connectorData.sourcePoint = null;
        } else {
          connector.connectorData.sourceObjectId = null;
          connector.connectorData.sourcePoint = { x: mousePt.x, y: mousePt.y };
        }

        ConnectorBindings.updateConnector(connector);
        return true;
      },
      actionName: 'resize',
      cursorStyle: 'crosshair',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        const size = 10;
        ctx.save();
        ctx.beginPath();
        ctx.arc(left, top, size / 2, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#4f46e5'; // Indigo-600
        ctx.stroke();
        ctx.restore();
      }
    }),
    target: new fabric.Control({
      x: 0,
      y: 0,
      sizeX: 20,
      sizeY: 20,
      touchSizeX: 30,
      touchSizeY: 30,
      positionHandler: function(dim, finalMatrix, fabricObject, control) {
        const canvas = fabricObject.canvas;
        if (!canvas) return new fabric.Point(0, 0);

        const { p2 } = getPathEndpoints(fabricObject);
        return fabric.util.transformPoint(p2, canvas.viewportTransform);
      },
      actionHandler: function(eventData, transform, x, y) {
        const connector = transform.target;
        const canvas = connector.canvas;
        if (!canvas) return false;

        if (!connector.connectorData) {
          connector.connectorData = {
            sourceObjectId: null,
            targetObjectId: null,
            routingMode: RoutingModes.BEZIER,
            sourceAnchor: 'center',
            targetAnchor: 'center',
            curvature: 0
          };
        }

        const mousePt = canvas.getPointer(eventData);

        // Find closest anchor on any object (excluding connectors and guides)
        const objects = canvas.getObjects().filter(o => 
          o.id && o !== connector &&
          o.customType !== 'arrow' && o.customType !== 'line' && o.customType !== 'pen' && o.type !== 'guide'
        );

        let closestDist = Infinity;
        let closestObj = null;
        let closestAnchorName = 'center';

        objects.forEach(obj => {
          const anchors = getAnchors(obj);
          for (const [name, pt] of Object.entries(anchors)) {
            if (name === 'center') continue;
            const dist = Math.sqrt(Math.pow(pt.x - mousePt.x, 2) + Math.pow(pt.y - mousePt.y, 2));
            if (dist < 60 && dist < closestDist) {
              closestDist = dist;
              closestObj = obj;
              closestAnchorName = name;
            }
          }
        });

        if (closestObj) {
          connector.connectorData.targetObjectId = closestObj.id;
          connector.connectorData.targetAnchor = closestAnchorName;
          connector.connectorData.targetPoint = null;
        } else {
          connector.connectorData.targetObjectId = null;
          connector.connectorData.targetPoint = { x: mousePt.x, y: mousePt.y };
        }

        ConnectorBindings.updateConnector(connector);
        return true;
      },
      actionName: 'resize',
      cursorStyle: 'crosshair',
      render: function(ctx, left, top, styleOverride, fabricObject) {
        const size = 10;
        ctx.save();
        ctx.beginPath();
        ctx.arc(left, top, size / 2, 0, 2 * Math.PI, false);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#4f46e5'; // Indigo-600
        ctx.stroke();
        ctx.restore();
      }
    })
  };
}
