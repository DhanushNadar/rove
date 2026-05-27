import axios from 'axios';

export class AttachmentManager {
  static async upload(file, objectId, boardId, token) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('objectId', objectId);
    formData.append('boardId', boardId);

    const response = await axios.post('http://localhost:5000/api/v1/attachments/upload', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  static async getAttachments(objectId, token) {
    const response = await axios.get(`http://localhost:5000/api/v1/attachments/object/${objectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  }

  static async getDownloadUrl(attachmentId, token) {
    const response = await axios.get(`http://localhost:5000/api/v1/attachments/${attachmentId}/url`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data.url;
  }

  static async deleteAttachment(attachmentId, token) {
    const response = await axios.delete(`http://localhost:5000/api/v1/attachments/${attachmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  }
}
