export class GraphParser {
  static parse(canvas) {
    const objects = canvas.getObjects();
    const nodes = [];
    const edges = [];

    objects.forEach(obj => {
      // It is an edge if it has explicit connectorData
      if (obj.connectorData && obj.connectorData.sourceObjectId && obj.connectorData.targetObjectId) {
        edges.push({
          id: obj.id,
          source: obj.connectorData.sourceObjectId,
          target: obj.connectorData.targetObjectId,
          fabricObj: obj
        });
      } else if (obj.id && !obj.connectorData && obj.customType !== 'arrow' && obj.customType !== 'line') {
        // It is a node
        const rect = obj.getBoundingRect(true, true);
        nodes.push({
          id: obj.id,
          width: rect.width,
          height: rect.height,
          fabricObj: obj,
          semanticType: obj.semanticType || 'generic'
        });
      }
    });

    return { nodes, edges };
  }
}
