/**
 * Spatial Utility for Semantic Canvas Engine
 */

// Calculate true bounding box (accounting for scale)
const getBoundingBox = (obj) => {
  const left = obj.left || 0;
  const top = obj.top || 0;
  const width = (obj.width || 0) * (obj.scaleX || 1);
  const height = (obj.height || 0) * (obj.scaleY || 1);
  const angle = obj.angle || 0; // Keeping simple for now, standard AABB
  
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2,
    width,
    height
  };
};

// Check if a point is inside a bounding box
const isPointInside = (x, y, box) => {
  return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
};

// Check if two bounding boxes intersect
const intersects = (box1, box2) => {
  return !(box2.left > box1.right || 
           box2.right < box1.left || 
           box2.top > box1.bottom ||
           box2.bottom < box1.top);
};

// Calculate Euclidean distance between two points
const distance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

module.exports = {
  getBoundingBox,
  isPointInside,
  intersects,
  distance
};
