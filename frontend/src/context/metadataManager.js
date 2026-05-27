export class MetadataManager {
  static getMetadata(fabricObj) {
    if (!fabricObj) return { notes: '', attachments: [] };
    return fabricObj.metadata || { notes: '', attachments: [] };
  }

  static setMetadata(fabricObj, metadata) {
    if (!fabricObj) return;
    fabricObj.set({ metadata });
    fabricObj.dirty = true;
    if (fabricObj.canvas) fabricObj.canvas.requestRenderAll();
  }

  static updateNotes(fabricObj, notes) {
    const md = Object.assign({ notes: '', attachments: [] }, this.getMetadata(fabricObj));
    md.notes = notes;
    this.setMetadata(fabricObj, md);
  }

  static addAttachment(fabricObj, attachmentRecord) {
    const md = Object.assign({ notes: '', attachments: [] }, this.getMetadata(fabricObj));
    // check if exists
    if (!md.attachments.find(a => a._id === attachmentRecord._id)) {
      md.attachments.push(attachmentRecord);
    }
    this.setMetadata(fabricObj, md);
  }

  static removeAttachment(fabricObj, attachmentId) {
    const md = Object.assign({ notes: '', attachments: [] }, this.getMetadata(fabricObj));
    md.attachments = md.attachments.filter(a => a._id !== attachmentId);
    this.setMetadata(fabricObj, md);
  }
}
