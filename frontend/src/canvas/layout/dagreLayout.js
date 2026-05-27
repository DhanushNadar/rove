import dagre from 'dagre';

export class DagreLayout {
  static compute(graphData, config) {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: config.direction || 'TB',
      nodesep: config.spacing || 120,
      ranksep: config.spacing || 120,
    });
    g.setDefaultEdgeLabel(() => ({}));

    graphData.nodes.forEach(node => {
      g.setNode(node.id, { width: node.width, height: node.height });
    });

    graphData.edges.forEach(edge => {
      g.setEdge(edge.source, edge.target);
    });

    dagre.layout(g);

    const layoutResult = {};
    g.nodes().forEach(v => {
      layoutResult[v] = g.node(v);
    });

    return layoutResult;
  }
}
