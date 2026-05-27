export const getAnchors = (obj) => {
  if (obj && typeof obj.getPointByOrigin === 'function') {
    const center = obj.getPointByOrigin('center', 'center');
    const top = obj.getPointByOrigin('center', 'top');
    const bottom = obj.getPointByOrigin('center', 'bottom');
    const left = obj.getPointByOrigin('left', 'center');
    const right = obj.getPointByOrigin('right', 'center');
    
    return { center, top, bottom, left, right };
  }

  // Fallback to getBoundingRect for raw rect objects
  const rect = obj.getBoundingRect ? obj.getBoundingRect(true, true) : obj;
  
  return {
    center: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
    top: { x: rect.left + rect.width / 2, y: rect.top },
    bottom: { x: rect.left + rect.width / 2, y: rect.top + rect.height },
    left: { x: rect.left, y: rect.top + rect.height / 2 },
    right: { x: rect.left + rect.width, y: rect.top + rect.height / 2 }
  };
};

export const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const getClosestAnchorName = (anchors, targetPoint) => {
  const distances = {
    top: getDistance(anchors.top, targetPoint),
    bottom: getDistance(anchors.bottom, targetPoint),
    left: getDistance(anchors.left, targetPoint),
    right: getDistance(anchors.right, targetPoint),
  };
  
  let closest = 'top';
  let min = distances.top;
  
  for (const [name, dist] of Object.entries(distances)) {
    if (dist < min) {
      min = dist;
      closest = name;
    }
  }
  return closest;
};
