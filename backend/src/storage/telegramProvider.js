const StorageProvider = require('./storageProvider');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class TelegramProvider extends StorageProvider {
  constructor() {
    super();
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    if (!this.botToken || !this.chatId) {
      console.warn('WARNING: Telegram credentials missing in environment variables. Uploads will fail.');
    }
  }

  async upload(file) {
    const formData = new FormData();
    formData.append('chat_id', this.chatId);
    formData.append('document', fs.createReadStream(file.path), file.originalname);

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendDocument`,
        formData,
        { headers: formData.getHeaders() }
      );
      
      const document = response.data.result.document;
      // In newer Telegram API versions, it's 'thumbnail'. In older, it's 'thumb'.
      const thumb = document.thumbnail || document.thumb;
      return {
        fileId: document.file_id,
        messageId: response.data.result.message_id,
        fileName: document.file_name,
        mimeType: document.mime_type,
        size: document.file_size,
        thumbnailId: thumb ? thumb.file_id : null
      };
    } catch (error) {
      console.error('Telegram Upload Error:', error.response?.data || error.message);
      throw new Error('Failed to upload file to Telegram');
    }
  }

  async delete(messageId) {
    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/deleteMessage`, {
        chat_id: this.chatId,
        message_id: messageId
      });
      return true;
    } catch (error) {
      console.error('Telegram Delete Error:', error.response?.data || error.message);
      return false; // Soft fail, doesn't matter too much if it fails
    }
  }

  async get(fileId) {
    try {
      const response = await axios.get(`https://api.telegram.org/bot${this.botToken}/getFile?file_id=${fileId}`);
      const filePath = response.data.result.file_path;
      return `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;
    } catch (error) {
      console.error('Telegram GetFile Error:', error.response?.data || error.message);
      throw new Error('Failed to retrieve file from Telegram');
    }
  }

  async generateAccessUrl(fileId) {
    return await this.get(fileId);
  }
}
module.exports = TelegramProvider;
