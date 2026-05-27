class StorageProvider {
  async upload(file) { throw new Error('Not implemented'); }
  async delete(fileId) { throw new Error('Not implemented'); }
  async get(fileId) { throw new Error('Not implemented'); }
  async generateAccessUrl(fileId) { throw new Error('Not implemented'); }
}
module.exports = StorageProvider;
