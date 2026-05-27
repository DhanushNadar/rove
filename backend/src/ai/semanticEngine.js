const { getBoundingBox, intersects, distance } = require('./utils/spatial');

const CONNECTION_RADIUS = 60; // Pixels distance to consider a line connected to a node

/**
 * Parses raw Fabric.js canvas JSON and extracts a Semantic Graph
 * @param {Object} canvasData Fabric.js serialized canvas object
 * @returns {Object} { nodes: [], edges: [] }
 */
const parseCanvasToGraph = (canvasData) => {
  if (!canvasData || !canvasData.objects) {
    return { nodes: [], edges: [] };
  }

  const rawObjects = canvasData.objects;
  
  const nodes = [];
  const edges = [];
  const texts = [];

  // 1. Categorize objects
  rawObjects.forEach((obj, index) => {
    // Generate a stable fallback ID if the frontend doesn't provide one
    const id = obj.id || `obj_${index}`;
    obj.id = id;
    
    const type = obj.type.toLowerCase();
    
    if (['rect', 'circle', 'ellipse', 'polygon'].includes(type)) {
      nodes.push(obj);
    } else if (['i-text', 'text', 'textbox'].includes(type)) {
      texts.push(obj);
    } else if (['line', 'path', 'polyline'].includes(type)) {
      edges.push(obj);
    }
  });

  // 2. Map Text Labels to Nodes
  const semanticNodes = nodes.map(node => {
    const nodeBox = getBoundingBox(node);
    let assignedLabel = 'Unknown Component';
    
    // Find text that intersects or is enclosed by this node
    for (const text of texts) {
      const textBox = getBoundingBox(text);
      if (intersects(nodeBox, textBox)) {
        assignedLabel = text.text;
        break; // Assume first intersecting text is the primary label
      }
    }

    return {
      id: node.id,
      label: assignedLabel,
      type: node.type,
      box: nodeBox // Keep for edge mapping
    };
  });

  // 3. Map Edges to Nodes via spatial proximity
  const semanticEdges = [];
  edges.forEach(edge => {
    let startPoint, endPoint;

    if (edge.type === 'line') {
      // Fabric.js line coords
      startPoint = { x: edge.x1 + edge.left, y: edge.y1 + edge.top };
      endPoint = { x: edge.x2 + edge.left, y: edge.y2 + edge.top };
    } else if (edge.type === 'path' && edge.path && edge.path.length >= 2) {
      // Very basic path heuristic (first point and last point)
      const first = edge.path[0];
      const last = edge.path[edge.path.length - 1];
      startPoint = { x: first[1] + edge.left, y: first[2] + edge.top };
      endPoint = { x: last[1] + edge.left, y: last[2] + edge.top };
    } else {
      return; // Unsupported edge type for now
    }

    let fromNode = null;
    let toNode = null;
    let minFromDist = Infinity;
    let minToDist = Infinity;

    // Find closest nodes to start and end points
    semanticNodes.forEach(sNode => {
      // Distance from startPoint to node center
      const fromDist = distance(startPoint.x, startPoint.y, sNode.box.centerX, sNode.box.centerY);
      if (fromDist < CONNECTION_RADIUS && fromDist < minFromDist) {
        minFromDist = fromDist;
        fromNode = sNode.id;
      }

      // Distance from endPoint to node center
      const toDist = distance(endPoint.x, endPoint.y, sNode.box.centerX, sNode.box.centerY);
      if (toDist < CONNECTION_RADIUS && toDist < minToDist) {
        minToDist = toDist;
        toNode = sNode.id;
      }
    });

    if (fromNode && toNode && fromNode !== toNode) {
      semanticEdges.push({
        id: edge.id,
        from: fromNode,
        to: toNode
      });
    }
  });

  // Cleanup internal box data before returning
  const cleanedNodes = semanticNodes.map(({ id, label, type }) => ({ id, label, type }));

  return {
    nodes: cleanedNodes,
    edges: semanticEdges
  };
};

module.exports = {
  parseCanvasToGraph
};
