import { fabric } from 'fabric';
import { useCollabStore } from '../../stores/useCollabStore';

// Extended Fabric Image Class for Board Media
export const MediaImage = fabric.util.createClass(fabric.Image, {
  type: 'media-image',

  initialize: function(element, options) {
    options || (options = {});
    this.callSuper('initialize', element, options);
    
    // Core Media Properties
    this.set('mediaId', options.mediaId || null);
    this.set('fileName', options.fileName || '');
    this.set('mimeType', options.mimeType || '');
    this.set('uploadStatus', options.uploadStatus || 'success');
    this.set('version', options.version || 1);
    
    // Performance & UX Properties
    this.set('objectCaching', true);
    this.set('lockUniScaling', true); // Maintain aspect ratio during resize
    
    this.on('modified', () => {
      this.set('version', this.get('version') + 1);
    });
  },

  toObject: function(propertiesToInclude) {
    return this.callSuper('toObject', [
      'mediaId', 'fileName', 'mimeType', 'uploadStatus', 'version',
      'id', 'customType'
    ].concat(propertiesToInclude));
  }
});

// Async Reviver for loadFromJSON
MediaImage.fromObject = function(object, callback) {
  if (object.uploadStatus === 'uploading') {
    // If it was saved in uploading state, it might be corrupt or incomplete
    // For MVP, we can render a placeholder or just fail gracefully.
    // We'll render a placeholder image.
    const placeholderSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="#64748b" text-anchor="middle" dy=".3em">Loading Image...</text></svg>`;
    fabric.Image.fromURL(placeholderSvg, function(img) {
      const instance = new MediaImage(img.getElement(), object);
      callback && callback(instance);
    });
    return;
  }

  const token = useCollabStore.getState().token;
  const url = `http://localhost:5000/api/v1/media/proxy/${object.mediaId}`;
  
  // Create an image element manually to set headers if needed, 
  // but standard Image object doesn't support Authorization header.
  // Instead, the user needs to be authenticated via cookies or we pass token in query.
  // For now, assume the proxy checks token via query if needed, or we just rely on standard img loading.
  // Wait, if it's protected, we must pass the token.
  // Let's pass it as a query param for the image tag to work:
  const proxyUrl = `${url}?token=${token}`;

  fabric.Image.fromURL(proxyUrl, function(img) {
    if (!img || !img.getElement()) {
      console.error('Failed to load MediaImage fromURL:', proxyUrl);
      callback && callback(null);
      return;
    }
    // `img` is a standard fabric.Image. We need to wrap it in MediaImage.
    const instance = new MediaImage(img.getElement(), object);
    callback && callback(instance);
  }, { crossOrigin: 'anonymous' });
};
