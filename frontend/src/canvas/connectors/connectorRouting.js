export const RoutingModes = {
  STRAIGHT: 'straight',
  BEZIER: 'bezier',
  ORTHOGONAL: 'orthogonal',
  SMART: 'smart'
};

const getArrowheadPath = (sx, sy, ex, ey) => {
  const angle = Math.atan2(ey - sy, ex - sx);
  const headLen = 18;
  const p1x = ex - headLen * Math.cos(angle - Math.PI / 6);
  const p1y = ey - headLen * Math.sin(angle - Math.PI / 6);
  const p2x = ex - headLen * Math.cos(angle + Math.PI / 6);
  const p2y = ey - headLen * Math.sin(angle + Math.PI / 6);
  return `M ${ex} ${ey} L ${p1x} ${p1y} M ${ex} ${ey} L ${p2x} ${p2y}`;
};

export const getStraightPath = (p1, p2) => {
  const line = `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  const arrow = getArrowheadPath(p1.x, p1.y, p2.x, p2.y);
  return `${line} ${arrow}`;
};

export const getBezierPath = (p1, p2, sourceAnchor = 'center', targetAnchor = 'center', curvature = 0) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate control point offset based on distance
  const offset = Math.max(40, Math.min(150, dist / 2.5));
  
  const cp1 = { x: p1.x, y: p1.y };
  const cp2 = { x: p2.x, y: p2.y };
  
  // Push source control point outward from the edge
  if (sourceAnchor === 'right') cp1.x += offset;
  else if (sourceAnchor === 'left') cp1.x -= offset;
  else if (sourceAnchor === 'bottom') cp1.y += offset;
  else if (sourceAnchor === 'top') cp1.y -= offset;
  else {
    if (Math.abs(dx) > Math.abs(dy)) cp1.x += dx * 0.25;
    else cp1.y += dy * 0.25;
  }
  
  // Push target control point outward from the edge
  if (targetAnchor === 'right') cp2.x += offset;
  else if (targetAnchor === 'left') cp2.x -= offset;
  else if (targetAnchor === 'bottom') cp2.y += offset;
  else if (targetAnchor === 'top') cp2.y -= offset;
  else {
    if (Math.abs(dx) > Math.abs(dy)) cp2.x -= dx * 0.25;
    else cp2.y -= dy * 0.25;
  }

  // Shift control points perpendicular to p1->p2 based on curvature
  const len = dist || 1;
  const nx = -dy / len;
  const ny = dx / len;

  cp1.x += nx * curvature;
  cp1.y += ny * curvature;
  cp2.x += nx * curvature;
  cp2.y += ny * curvature;
  
  const line = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
  
  // Tangent at end point is calculated from cp2 to p2
  const arrow = getArrowheadPath(cp2.x, cp2.y, p2.x, p2.y);
  return `${line} ${arrow}`;
};

export const getOrthogonalPath = (p1, p2, sourceAnchor = 'center', targetAnchor = 'center') => {
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  
  let path = '';
  let lastX = p1.x;
  let lastY = p1.y;

  if (sourceAnchor === 'left' || sourceAnchor === 'right') {
    // Exit horizontal first, step vertical, then step horizontal to target
    path = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
    lastX = midX;
    lastY = p2.y;
  } else if (sourceAnchor === 'top' || sourceAnchor === 'bottom') {
    // Exit vertical first, step horizontal, then step vertical to target
    path = `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
    lastX = p2.x;
    lastY = midY;
  } else {
    // Fallback: exit horizontal or vertical based on dominant delta
    if (Math.abs(p2.x - p1.x) > Math.abs(p2.y - p1.y)) {
      path = `M ${p1.x} ${p1.y} L ${midX} ${p1.y} L ${midX} ${p2.y} L ${p2.x} ${p2.y}`;
      lastX = midX;
      lastY = p2.y;
    } else {
      path = `M ${p1.x} ${p1.y} L ${p1.x} ${midY} L ${p2.x} ${midY} L ${p2.x} ${p2.y}`;
      lastX = p2.x;
      lastY = midY;
    }
  }

  const arrow = getArrowheadPath(lastX, lastY, p2.x, p2.y);
  return `${path} ${arrow}`;
};

export const calculateConnectorPath = (p1, p2, sourceAnchor, targetAnchor, mode = RoutingModes.BEZIER, curvature = 0) => {
  switch (mode) {
    case RoutingModes.STRAIGHT: return getStraightPath(p1, p2);
    case RoutingModes.ORTHOGONAL: return getOrthogonalPath(p1, p2, sourceAnchor, targetAnchor);
    case RoutingModes.BEZIER:
    case RoutingModes.SMART:
    default:
      return getBezierPath(p1, p2, sourceAnchor, targetAnchor, curvature);
  }
};
