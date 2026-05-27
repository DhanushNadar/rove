import { fabric } from 'fabric';

const getFileLogoUrl = (mimeType, fileName = '') => {
  const type = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();

  if (type.includes('pdf') || name.endsWith('.pdf')) return '/file-icons/pdf.png';
  
  // Specific checks for Word, Excel, PowerPoint
  if (type.includes('excel') || type.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) return '/file-icons/xls.png';
  if (type.includes('powerpoint') || type.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) return '/file-icons/ppt.png';
  if (type.includes('word') || type.includes('wordprocessing') || name.endsWith('.doc') || name.endsWith('.docx')) return '/file-icons/docs.png';
  
  if (type.includes('zip') || type.includes('archive') || type.includes('compressed') || name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z')) return '/file-icons/zip.png';
  if (type.includes('video') || name.endsWith('.mp4') || name.endsWith('.mov') || name.endsWith('.avi')) return '/file-icons/video.png';
  if (type.includes('audio') || name.endsWith('.mp3') || name.endsWith('.wav')) return '/file-icons/audio.png';
  if (type.includes('json') || name.endsWith('.json')) return '/file-icons/json.png';
  if (type.includes('markdown') || name.endsWith('.md')) return '/file-icons/md.png';
  
  // Generic Text or unrecognized fallback
  return '/file-icons/txt.png';
};

// Extended Fabric Group Class for File Icons
export const FileIcon = fabric.util.createClass(fabric.Group, {
  type: 'file-icon',

  initialize: function(options) {
    options || (options = {});

    const fileNameStr = options.fileName || 'Unknown File';
    const displayFileName = fileNameStr.length > 14 ? fileNameStr.substring(0, 11) + '...' : fileNameStr;

    // Force fixed size regardless of previous saved state in MongoDB
    // Halved dimensions
    options.width = 105;
    options.height = 128;
    options.scaleX = 1;
    options.scaleY = 1;

    // Invisible bounding box to strictly enforce tight padding and prevent async alignment bugs
    // We use 1% opacity white so Fabric.js registers clicks and drags in the "transparent" areas!
    const rect = new fabric.Rect({
      width: 105,
      height: 128,
      fill: 'rgba(255,255,255,0.01)',
      stroke: 'rgba(255,255,255,0.01)',
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 0
    });

    // File Name
    const text = new fabric.Text(displayFileName, {
      fontSize: 10, // Scaled down font size
      fontFamily: 'Inter, sans-serif',
      fill: '#1e293b', // Dark text for light mode
      originX: 'center',
      originY: 'center',
      left: 0,
      top: 45,
      textAlign: 'center'
    });

    const items = [rect, text];
    
    // Add uploading indicator synchronously if needed
    if (options.uploadStatus === 'uploading') {
      items.push(new fabric.Text('Uploading...', {
        fontSize: 9,
        fontFamily: 'Inter, sans-serif',
        fill: '#818cf8', // accent color
        originX: 'center',
        originY: 'center',
        left: 0,
        top: -15
      }));
    }

    this.callSuper('initialize', items, {
      ...options,
      objectCaching: true,
      subTargetCheck: false, // Group behaves as single entity
      hasControls: false,    // Remove resize/rotate handles
      lockScalingX: true,    // Prevent resizing
      lockScalingY: true,
      lockRotation: true
    });

    this.setCoords();

    // Load Logo Asynchronously if it's not uploading
    if (options.uploadStatus !== 'uploading') {
      fabric.Image.fromURL(getFileLogoUrl(options.mimeType, options.fileName), (img) => {
        if (!img || !img.width || !img.height) {
          console.error("Failed to load file icon for mimeType:", options.mimeType);
          return;
        }
        const targetSize = 75; // Halved file icon size
        const scale = Math.min(targetSize / img.width, targetSize / img.height);
        
        img.set({
          originX: 'center',
          originY: 'center',
          left: 0,
          top: -15,
          scaleX: scale,
          scaleY: scale
        });
        
        // Push directly to _objects list to bypass group re-centering calculations
        this._objects.push(img);
        this.setCoords();
        
        this.dirty = true;
        if (this.canvas) this.canvas.requestRenderAll();
      });
    }

    // Core Properties
    this.set('mediaId', options.mediaId || null);
    this.set('fileName', options.fileName || '');
    this.set('mimeType', options.mimeType || '');
    this.set('uploadStatus', options.uploadStatus || 'success');
    this.set('version', options.version || 1);
    this.set('customType', 'file-icon');

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

// Sync Reviver for loadFromJSON
FileIcon.fromObject = function(object, callback) {
  const instance = new FileIcon(object);
  callback && callback(instance);
};
