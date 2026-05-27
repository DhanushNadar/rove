import axios from 'axios';
import { API_URL } from '../config';

export class MediaManager {
  static async uploadMedia(file, boardId, x, y, token) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('boardId', boardId);
    
    // Determine type based on mime
    let type = 'file';
    if (file.type.startsWith('image/')) type = 'image';
    else if (file.type.startsWith('video/')) type = 'video';
    
    formData.append('type', type);
    formData.append('x', x);
    formData.append('y', y);

    try {
      const response = await axios.post(`${API_URL}/media/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      console.error('Failed to upload media:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }
}
