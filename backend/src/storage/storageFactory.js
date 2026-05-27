const TelegramProvider = require('./telegramProvider');

class StorageFactory {
  static getProvider() {
    // Future abstraction: if (process.env.STORAGE_PROVIDER === 's3') return new S3Provider();
    return new TelegramProvider();
  }
}
module.exports = StorageFactory;
