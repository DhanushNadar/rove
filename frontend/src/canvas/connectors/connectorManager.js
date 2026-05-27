import { ConnectorBindings } from './connectorBindings';

export class ConnectorManager {
  static updateAll(canvas) {
    if (!canvas) return;
    const objects = canvas.getObjects();
    const connectors = objects.filter(obj => obj.connectorData && obj.connectorData.sourceObjectId);

    connectors.forEach(conn => {
      const source = objects.find(o => o.id === conn.connectorData.sourceObjectId);
      const target = objects.find(o => o.id === conn.connectorData.targetObjectId);
      if (source && target) {
        ConnectorBindings.updateConnector(conn, source, target);
      }
    });
  }

  static updateForObject(canvas, obj) {
    if (!canvas || !obj || !obj.id) return;
    const objects = canvas.getObjects();
    const connectors = objects.filter(o => 
      o.connectorData && 
      (o.connectorData.sourceObjectId === obj.id || o.connectorData.targetObjectId === obj.id)
    );

    connectors.forEach(conn => {
      const source = objects.find(o => o.id === conn.connectorData.sourceObjectId);
      const target = objects.find(o => o.id === conn.connectorData.targetObjectId);
      if (source && target) {
        ConnectorBindings.updateConnector(conn, source, target);
      }
    });
  }
}
