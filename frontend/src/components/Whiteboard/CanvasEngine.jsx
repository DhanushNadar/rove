import { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import axios from 'axios';
import { useUIStore } from '../../stores/useUIStore';
import { useCollabStore } from '../../stores/useCollabStore';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { usePan } from '../../hooks/usePan';
import { useZoom } from '../../hooks/useZoom';
import { ToolFactory } from '../../canvas/tools/ToolFactory';
import { MediaImage } from '../../canvas/objects/ImageObject';
import { FileIcon } from '../../canvas/objects/FileObject';
import { setupConnectorControls } from '../../canvas/connectors/connectorBindings';

// Register custom objects with Fabric for JSON serialization/deserialization
fabric.MediaImage = MediaImage;
fabric.MediaImage.fromObject = MediaImage.fromObject;
fabric.FileIcon = FileIcon;
fabric.FileIcon.fromObject = FileIcon.fromObject;

const FABRIC_PROPS = ['id', 'customType', 'connectorData', 'semanticType', 'metadata', 'mediaId', 'fileName', 'mimeType', 'uploadStatus', 'version'];

// Customize global selection handle visuals for maximum cursor contrast on white/light themes
fabric.Object.prototype.set({
  borderColor: '#4f46e5',      // Indigo-600
  borderScaleFactor: 2,        // Bold selection outlines
  cornerColor: '#ffffff',      // Solid white handle centers
  cornerStrokeColor: '#4f46e5', // High-contrast Indigo borders
  cornerSize: 10,              // Figma-style circular grabbers
  cornerStyle: 'circle',
  transparentCorners: false,   // Prevents camo background bleed
  padding: 8,                  // Clear visual outline breathing room
  rotatingPointOffset: 30,
  objectCaching: false         // Prevents rendering glitches/clipping on zoom/pan
});

const CanvasEngine = () => {
  const canvasRef = useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const isUpdatingFromServer = useRef(false);
  const snappingGuides = useRef({ vertical: null, horizontal: null });
  const clipboard = useRef(null);
  
  const { currentTool, brushColor, brushSize } = useUIStore();
  const { socket, token, user } = useCollabStore();
  const { activeWhiteboard, saveHistoryState } = useCanvasStore();

  const isOwner = activeWhiteboard?.owner?._id === user?._id || activeWhiteboard?.owner === user?._id;
  const collab = activeWhiteboard?.collaborators?.find(c => (c.user?._id || c.user) === user?._id);
  const isViewer = !isOwner && collab?.role === 'viewer';

  const activeToolInstance = useRef(null);

  const clearSnappingGuides = useCallback((canvas) => {
    if (!canvas) return;
    if (snappingGuides.current.vertical) {
      canvas.remove(snappingGuides.current.vertical);
      snappingGuides.current.vertical = null;
    }
    if (snappingGuides.current.horizontal) {
      canvas.remove(snappingGuides.current.horizontal);
      snappingGuides.current.horizontal = null;
    }
  }, []);

  const handleObjectMoving = useCallback((canvas, activeObj) => {
    if (!canvas || !activeObj) return;

    const objects = canvas.getObjects().filter(o => 
      o !== activeObj && 
      o.id && 
      o.customType !== 'arrow' && 
      o.customType !== 'line' && 
      o.customType !== 'pen' &&
      o.type !== 'guide'
    );

    const threshold = 8;
    let snapX = null;
    let snapY = null;
    let guideX = null;
    let guideY = null;

    // Active object bounds
    const activeBounds = activeObj.getBoundingRect(true, true);
    const activeLeft = activeBounds.left;
    const activeTop = activeBounds.top;
    const activeWidth = activeBounds.width;
    const activeHeight = activeBounds.height;
    const activeCenterX = activeLeft + activeWidth / 2;
    const activeCenterY = activeTop + activeHeight / 2;
    const activeRight = activeLeft + activeWidth;
    const activeBottom = activeTop + activeHeight;

    // Clear existing guides first
    clearSnappingGuides(canvas);

    for (let obj of objects) {
      const bounds = obj.getBoundingRect(true, true);
      const objLeft = bounds.left;
      const objTop = bounds.top;
      const objWidth = bounds.width;
      const objHeight = bounds.height;
      const objCenterX = objLeft + objWidth / 2;
      const objCenterY = objTop + objHeight / 2;
      const objRight = objLeft + objWidth;
      const objBottom = objTop + objHeight;

      // --- Vertical Snapping (X-axis alignment) ---
      if (Math.abs(activeLeft - objLeft) < threshold) {
        snapX = objLeft;
        guideX = objLeft;
      } else if (Math.abs(activeCenterX - objCenterX) < threshold) {
        snapX = objCenterX - activeWidth / 2;
        guideX = objCenterX;
      } else if (Math.abs(activeRight - objRight) < threshold) {
        snapX = objRight - activeWidth;
        guideX = objRight;
      } else if (Math.abs(activeLeft - objRight) < threshold) {
        snapX = objRight;
        guideX = objRight;
      } else if (Math.abs(activeRight - objLeft) < threshold) {
        snapX = objLeft - activeWidth;
        guideX = objLeft;
      }

      // --- Horizontal Snapping (Y-axis alignment) ---
      if (Math.abs(activeTop - objTop) < threshold) {
        snapY = objTop;
        guideY = objTop;
      } else if (Math.abs(activeCenterY - objCenterY) < threshold) {
        snapY = objCenterY - activeHeight / 2;
        guideY = objCenterY;
      } else if (Math.abs(activeBottom - objBottom) < threshold) {
        snapY = objBottom - activeHeight;
        guideY = objBottom;
      } else if (Math.abs(activeTop - objBottom) < threshold) {
        snapY = objBottom;
        guideY = objBottom;
      } else if (Math.abs(activeBottom - objTop) < threshold) {
        snapY = objTop - activeHeight;
        guideY = objTop;
      }
    }

    // Set guides and adjust positions
    if (snapX !== null) {
      activeObj.set({ left: snapX }).setCoords();
      
      const vLine = new fabric.Line([guideX, -5000, guideX, 8000], {
        stroke: '#a855f7',
        strokeWidth: 1.5,
        strokeDashArray: [6, 4],
        selectable: false,
        evented: false,
        type: 'guide'
      });
      canvas.add(vLine);
      snappingGuides.current.vertical = vLine;
    }

    if (snapY !== null) {
      activeObj.set({ top: snapY }).setCoords();
      
      const hLine = new fabric.Line([-5000, guideY, 8000, guideY], {
        stroke: '#a855f7',
        strokeWidth: 1.5,
        strokeDashArray: [6, 4],
        selectable: false,
        evented: false,
        type: 'guide'
      });
      canvas.add(hLine);
      snappingGuides.current.horizontal = hLine;
    }
  }, [clearSnappingGuides]);
  // Initialize Canvas
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      isDrawingMode: false,
      selection: true,
      preserveObjectStacking: true,
      fireRightClick: true,
      stopContextMenu: true,
      perPixelTargetFind: true, // Use accurate pixel-based hit testing instead of bounding boxes
      targetFindTolerance: 12    // Provide a small buffer for clicking thin lines and strokes
    });

    // Premium selection bounding box colors
    canvas.selectionColor = 'rgba(79, 70, 229, 0.08)';
    canvas.selectionBorderColor = '#4f46e5';
    canvas.selectionLineWidth = 1.5;

    // Default zoom to 50% on opening the board
    canvas.setZoom(0.5);
    const initialVpt = canvas.viewportTransform;
    if (initialVpt) {
      document.body.style.backgroundPosition = `${initialVpt[4]}px ${initialVpt[5]}px`;
      document.body.style.backgroundSize = `${20 * 0.5}px ${20 * 0.5}px`;
      useCanvasStore.getState().setTransform(0.5, { x: initialVpt[4], y: initialVpt[5] });
    }

    // Premium dynamic dots background
    canvas._renderBackground = function(ctx) {
      const zoom = canvas.getZoom();

      ctx.save();

      // Clear with clean canvas background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const vpt = canvas.viewportTransform;
      if (!vpt) {
        ctx.restore();
        return;
      }

      // Apply viewport transform to draw directly in canvas coordinates
      ctx.transform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);

      // Calculate visible boundaries in canvas coordinates
      const minX = -vpt[4] / zoom;
      const minY = -vpt[5] / zoom;
      const maxX = (canvas.width - vpt[4]) / zoom;
      const maxY = (canvas.height - vpt[5]) / zoom;

      // Determine dynamic grid size and opacity based on zoom level to keep the board visually premium and performant
      let gridSize = 20;
      let opacity = 0.12; // Base premium dot opacity

      if (zoom < 0.2) {
        gridSize = 80;
        opacity = Math.max(0, (zoom - 0.08) / 0.12) * 0.06;
      } else if (zoom < 0.5) {
        gridSize = 40;
        opacity = 0.06 + (zoom - 0.2) * 0.2;
      } else if (zoom > 2) {
        opacity = Math.min(0.18, 0.12 + (zoom - 2) * 0.01);
      }

      if (opacity <= 0) {
        ctx.restore();
        return;
      }

      const startX = Math.floor(minX / gridSize) * gridSize;
      const startY = Math.floor(minY / gridSize) * gridSize;
      const endX = Math.ceil(maxX / gridSize) * gridSize;
      const endY = Math.ceil(maxY / gridSize) * gridSize;

      ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;

      ctx.beginPath();
      const dotRadius = 1.2 / zoom;
      
      // Highly optimized single path rendering for the entire dot grid
      for (let x = startX; x <= endX; x += gridSize) {
        for (let y = startY; y <= endY; y += gridSize) {
          ctx.moveTo(x + dotRadius, y);
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        }
      }
      ctx.fill();

      ctx.restore();
    };

    setFabricCanvas(canvas);
    window.fabricCanvasInstance = canvas;

    // Attach Drag & Drop Handler
    import('../../context/dragDropHandler').then(({ DragDropHandler }) => {
      const token = useCollabStore.getState().token;
      DragDropHandler.attach(canvas, activeWhiteboard?._id, token, (targetObj, newAttachment) => {
        import('../../stores/useCanvasStore').then(({ useCanvasStore }) => {
          useCanvasStore.getState().saveHistoryState(canvas.toJSON(FABRIC_PROPS));
        });
        import('../../stores/useCollabStore').then(({ useCollabStore }) => {
          const socket = useCollabStore.getState().socket;
          if (socket) socket.emit('draw', canvas.toJSON(FABRIC_PROPS));
        });
      });
    });

    if (activeWhiteboard?.canvasData) {
      useCanvasStore.getState().setIsBoardReady(false);
      canvas.loadFromJSON(activeWhiteboard.canvasData, () => {
        canvas.renderAll();
        saveHistoryState(activeWhiteboard.canvasData);
        // Minimum 1 second delay buffer to guarantee all assets, groups, and connections are cleanly pre-rendered
        setTimeout(() => {
          useCanvasStore.getState().setIsBoardReady(true);
        }, 1000);
      }, (o, obj) => {
        if (obj) {
          FABRIC_PROPS.forEach(p => {
            if (o[p] !== undefined) obj[p] = o[p];
          });
          if (obj.customType === 'arrow' || obj.customType === 'line') {
            if (!isViewer) {
              setupConnectorControls(obj);
            }
          }
        }
      });
    } else {
      saveHistoryState(canvas.toJSON(FABRIC_PROPS));
      useCanvasStore.getState().setIsBoardReady(true);
    }

    const resizeCanvas = () => {
      canvas.setWidth(window.innerWidth);
      canvas.setHeight(window.innerHeight);
      canvas.renderAll();
    };
    window.addEventListener('resize', resizeCanvas);

    // Garbage-collect connected arrows when parent shapes are deleted
    const handleObjectRemoved = (opt) => {
      const removedObj = opt.target;
      if (removedObj && removedObj.id && removedObj.customType !== 'arrow' && removedObj.customType !== 'line' && removedObj.type !== 'guide') {
        const objects = canvas.getObjects();
        const connectors = objects.filter(o => 
          o.connectorData && 
          (o.connectorData.sourceObjectId === removedObj.id || o.connectorData.targetObjectId === removedObj.id)
        );
        connectors.forEach(conn => canvas.remove(conn));
      }
    };
    canvas.on('object:removed', handleObjectRemoved);

    const handleObjectAdded = (opt) => {
      const obj = opt.target;
      if (obj && (obj.customType === 'arrow' || obj.customType === 'line')) {
        if (!isViewer) {
          setupConnectorControls(obj);
        }
      }
    };
    canvas.on('object:added', handleObjectAdded);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.off('object:removed', handleObjectRemoved);
      canvas.off('object:added', handleObjectAdded);
      canvas.dispose();
    };
  }, [activeWhiteboard, isViewer]);

  // Infinite Canvas Hooks
  useZoom(fabricCanvas);
  usePan(fabricCanvas);

  // Keyboard Shortcuts (Undo/Redo/Delete)
  useEffect(() => {
    if (!fabricCanvas) return;
    const handleKeyDown = (e) => {
      if (isViewer) return;
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        useCanvasStore.getState().undo(fabricCanvas).then((state) => {
          if (state && socket) {
            socket.emit('draw', state);
            triggerAutoSaveRef.current(state);
          }
        });
        return;
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        useCanvasStore.getState().redo(fabricCanvas).then((state) => {
          if (state && socket) {
            socket.emit('draw', state);
            triggerAutoSaveRef.current(state);
          }
        });
        return;
      }
      
      // Z-Index Controls
      if (e.ctrlKey && e.key === '[') {
        e.preventDefault();
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length) {
          activeObjects.forEach(obj => fabricCanvas.sendBackwards(obj));
          fabricCanvas.discardActiveObject(); 
          const sel = new fabric.ActiveSelection(activeObjects, { canvas: fabricCanvas });
          fabricCanvas.setActiveObject(sel);
          fabricCanvas.requestRenderAll();
          broadcastCanvas();
        }
        return;
      }
      if (e.ctrlKey && e.key === ']') {
        e.preventDefault();
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length) {
          activeObjects.forEach(obj => fabricCanvas.bringForward(obj));
          fabricCanvas.discardActiveObject(); 
          const sel = new fabric.ActiveSelection(activeObjects, { canvas: fabricCanvas });
          fabricCanvas.setActiveObject(sel);
          fabricCanvas.requestRenderAll();
          broadcastCanvas();
        }
        return;
      }
      
      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (fabricCanvas.getActiveObject() && fabricCanvas.getActiveObject().isEditing) return;
        const activeObjects = fabricCanvas.getActiveObjects();
        if (activeObjects.length) {
          activeObjects.forEach(obj => fabricCanvas.remove(obj));
          fabricCanvas.discardActiveObject();
          broadcastCanvas();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas, socket, isViewer]);

  // Cursors & Selection States
  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = false;

    // Custom Black SVG Crosshair to prevent OS-level invisible white crosshairs
    const customCrosshair = `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none' stroke='black' stroke-width='1.5'%3E%3Cline x1='8' y1='0' x2='8' y2='16'/%3E%3Cline x1='0' y1='8' x2='16' y2='8'/%3E%3C/svg%3E") 8 8, crosshair`;

    const cursors = {
      eraser: customCrosshair,
      text: 'text',
      line: customCrosshair,
      arrow: customCrosshair,
      rect: customCrosshair,
      circle: customCrosshair,
      diamond: customCrosshair,
      pen: customCrosshair,
      pan: 'grab'
    };
    
    if (isViewer) {
      fabricCanvas.defaultCursor = 'grab';
      fabricCanvas.freeDrawingCursor = 'grab';
      fabricCanvas.hoverCursor = 'grab';
      fabricCanvas.selection = false;
      fabricCanvas.forEachObject(obj => {
        obj.selectable = false;
        obj.evented = false;
      });
    } else {
      fabricCanvas.defaultCursor = cursors[currentTool] || 'default';
      fabricCanvas.freeDrawingCursor = customCrosshair;
      fabricCanvas.hoverCursor = currentTool === 'eraser' ? 'no-drop' : (cursors[currentTool] || 'move');

      const isSelectMode = currentTool === 'select' || currentTool === 'eraser';
      fabricCanvas.selection = isSelectMode;
      fabricCanvas.forEachObject(obj => {
        obj.selectable = true;
        obj.evented = true;
      });
    }
  }, [currentTool, fabricCanvas, isViewer]);

  // Clipboard & Duplication Engine (Figma style Ctrl+C, Ctrl+V, Ctrl+D)
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleCopy = () => {
      if (isViewer) return;
      const activeObject = fabricCanvas.getActiveObject();
      if (!activeObject) return;
      activeObject.clone((cloned) => {
        clipboard.current = cloned;
      }, FABRIC_PROPS);
    };

    const handlePaste = () => {
      if (isViewer) return;
      if (!clipboard.current) return;

      clipboard.current.clone((clonedObj) => {
        fabricCanvas.discardActiveObject();
        
        const idMap = {};
        const pastedObjects = [];
        
        const addCloned = (obj) => {
          const oldId = obj.id;
          const newId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          obj.set({
            id: newId,
            left: obj.left + 30,
            top: obj.top + 30,
            evented: true,
            selectable: true
          });
          if (oldId) idMap[oldId] = newId;
          fabricCanvas.add(obj);
          pastedObjects.push(obj);
        };

        if (clonedObj.type === 'activeSelection') {
          clonedObj.canvas = fabricCanvas;
          clonedObj.forEachObject((obj) => {
            addCloned(obj);
          });
          
          // Re-bind cloned connectors that link between copied shapes
          clonedObj.forEachObject((obj) => {
            if (obj.connectorData && obj.connectorData.sourceObjectId && obj.connectorData.targetObjectId) {
               const newSrc = idMap[obj.connectorData.sourceObjectId];
               const newTgt = idMap[obj.connectorData.targetObjectId];
               if (newSrc && newTgt) {
                 obj.connectorData.sourceObjectId = newSrc;
                 obj.connectorData.targetObjectId = newTgt;
                 const objects = fabricCanvas.getObjects();
                 const srcObj = objects.find(o => o.id === newSrc);
                 const tgtObj = objects.find(o => o.id === newTgt);
                 if (srcObj && tgtObj) {
                   import('../../canvas/connectors/connectorBindings').then(({ ConnectorBindings }) => {
                     ConnectorBindings.updateConnector(obj, srcObj, tgtObj);
                   });
                 }
               } else {
                 fabricCanvas.remove(obj);
               }
            }
          });
          
          const sel = new fabric.ActiveSelection(pastedObjects, { canvas: fabricCanvas });
          fabricCanvas.setActiveObject(sel);
        } else {
          addCloned(clonedObj);
          fabricCanvas.setActiveObject(clonedObj);
        }
        
        fabricCanvas.requestRenderAll();
        broadcastCanvas();
      }, FABRIC_PROPS);
    };

    const handleDuplicate = () => {
      if (isViewer) return;
      const activeObject = fabricCanvas.getActiveObject();
      if (!activeObject) return;

      activeObject.clone((clonedObj) => {
        fabricCanvas.discardActiveObject();
        
        const idMap = {};
        const duplicatedObjects = [];
        
        const addCloned = (obj) => {
          const oldId = obj.id;
          const newId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          obj.set({
            id: newId,
            left: obj.left + 30,
            top: obj.top + 30,
            evented: true,
            selectable: true
          });
          if (oldId) idMap[oldId] = newId;
          fabricCanvas.add(obj);
          duplicatedObjects.push(obj);
        };

        if (clonedObj.type === 'activeSelection') {
          clonedObj.canvas = fabricCanvas;
          clonedObj.forEachObject((obj) => {
            addCloned(obj);
          });
          
          clonedObj.forEachObject((obj) => {
            if (obj.connectorData && obj.connectorData.sourceObjectId && obj.connectorData.targetObjectId) {
               const newSrc = idMap[obj.connectorData.sourceObjectId];
               const newTgt = idMap[obj.connectorData.targetObjectId];
               if (newSrc && newTgt) {
                 obj.connectorData.sourceObjectId = newSrc;
                 obj.connectorData.targetObjectId = newTgt;
                 const objects = fabricCanvas.getObjects();
                 const srcObj = objects.find(o => o.id === newSrc);
                 const tgtObj = objects.find(o => o.id === newTgt);
                 if (srcObj && tgtObj) {
                   import('../../canvas/connectors/connectorBindings').then(({ ConnectorBindings }) => {
                     ConnectorBindings.updateConnector(obj, srcObj, tgtObj);
                   });
                 }
               } else {
                 fabricCanvas.remove(obj);
               }
            }
          });
          
          const sel = new fabric.ActiveSelection(duplicatedObjects, { canvas: fabricCanvas });
          fabricCanvas.setActiveObject(sel);
        } else {
          addCloned(clonedObj);
          fabricCanvas.setActiveObject(clonedObj);
        }
        
        fabricCanvas.requestRenderAll();
        broadcastCanvas();
      }, FABRIC_PROPS);
    };

    const handleClipboardKeys = (e) => {
      if (isViewer) return;
      if (e.ctrlKey && e.key === 'c') {
        handleCopy();
      } else if (e.ctrlKey && e.key === 'v') {
        handlePaste();
      } else if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }
    };

    window.addEventListener('keydown', handleClipboardKeys);
    return () => window.removeEventListener('keydown', handleClipboardKeys);
  }, [fabricCanvas, isViewer]);

  // Apply Colors & Styles to Active Selection
  useEffect(() => {
    if (!fabricCanvas) return;
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => {
        if (obj.type === 'i-text') {
          obj.set('fill', brushColor);
        } else if (obj.customType === 'pen') {
          obj.set('fill', brushColor);
        } else {
          obj.set('stroke', brushColor);
          obj.set('strokeWidth', brushSize);
        }
      });
      fabricCanvas.requestRenderAll();
      broadcastCanvas();
    }
  }, [brushColor, brushSize, fabricCanvas]);

  // Network & Save Mechanisms
  const broadcastCanvas = useCallback(() => {
    if (!socket || !fabricCanvas || isUpdatingFromServer.current) return;
    const json = fabricCanvas.toJSON(FABRIC_PROPS);
    socket.emit('draw', json);
    triggerAutoSaveRef.current(json);
    saveHistoryState(json);
  }, [socket, fabricCanvas]);

  const triggerAutoSaveRef = useRef(
    debounce(async (json) => {
      const board = useCanvasStore.getState().activeWhiteboard;
      const currentToken = useCollabStore.getState().token;
      if (!board || !currentToken) return;
      try {
        await axios.put(
          `http://localhost:5000/api/v1/whiteboards/${board._id}/canvas`,
          { canvasData: json },
          { headers: { Authorization: `Bearer ${currentToken}` } }
        );
      } catch (err) {
        console.error('Auto-save failed');
      }
    }, 2000)
  );

  // Core Event Dispatcher
  useEffect(() => {
    if (!fabricCanvas) return;

    // Load ConnectorManager
    import('../../canvas/connectors/connectorManager').then(({ ConnectorManager }) => {
      const handleNodeMove = (opt) => {
        ConnectorManager.updateForObject(fabricCanvas, opt.target);
        handleObjectMoving(fabricCanvas, opt.target);
      };
      fabricCanvas.on('object:moving', handleNodeMove);
      fabricCanvas.on('object:scaling', handleNodeMove);
    });

    // Load HoverManager for Media Artifacts
    import('../../media/hoverManager').then(({ HoverManager }) => {
      HoverManager.attach(fabricCanvas);
    });

    // Selection events for Context Layer
    fabricCanvas.on('selection:created', (opt) => {
      if (opt.selected && opt.selected.length === 1 && opt.selected[0].id) {
        useUIStore.getState().setActiveNodeId(opt.selected[0].id);
      }
      if (opt.selected) {
        opt.selected.forEach(obj => {
          if (obj.customType === 'arrow' || obj.customType === 'line') {
            if (!isViewer) {
              setupConnectorControls(obj);
            }
          }
        });
      }
    });
    fabricCanvas.on('selection:updated', (opt) => {
      if (opt.selected && opt.selected.length === 1 && opt.selected[0].id) {
        useUIStore.getState().setActiveNodeId(opt.selected[0].id);
      } else {
        useUIStore.getState().setActiveNodeId(null);
      }
      if (opt.selected) {
        opt.selected.forEach(obj => {
          if (obj.customType === 'arrow' || obj.customType === 'line') {
            if (!isViewer) {
              setupConnectorControls(obj);
            }
          }
        });
      }
    });
    fabricCanvas.on('selection:cleared', () => {
      useUIStore.getState().setActiveNodeId(null);
    });

    const handleMouseDown = (opt) => {
      const evt = opt.e;
      if (currentTool === 'pan' || evt.button === 1 || evt.altKey || currentTool === 'select') return;

      // If we are currently trying to draw (e.g. rect, circle, pen), DO NOT switch to select tool.
      // This allows drawing on top of existing shapes.
      const isDrawingTool = ['rect', 'circle', 'diamond', 'arrow', 'line', 'pen'].includes(currentTool);
      
      const target = fabricCanvas.findTarget(evt);
      if (target && !isDrawingTool && currentTool !== 'eraser' && currentTool !== 'text') {
        useUIStore.getState().setCurrentTool('select');
        fabricCanvas.setActiveObject(target);
        return;
      }

      // Special handling for Erasing via click
      if (currentTool === 'eraser') {
        const target = fabricCanvas.findTarget(evt);
        if (target) {
          fabricCanvas.remove(target);
          broadcastCanvas();
        }
        return;
      }

      // Special handling for Text Tool
      if (currentTool === 'text') {
        const pointer = fabricCanvas.getPointer(evt);
        const text = new fabric.IText('', {
          left: pointer.x, top: pointer.y,
          fill: brushColor,
          cursorColor: '#1e293b', 
          originX: 'left', originY: 'top',
          fontSize: 24, fontFamily: 'Inter',
          id: `obj_${Date.now()}`
        });
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);
        text.enterEditing();
        useUIStore.getState().setCurrentTool('select');
        return;
      }

      // Dispatch to Geometric Tool Handlers
      const baseOptions = {
        fill: 'rgba(255, 255, 255, 0.01)',
        stroke: brushColor,
        strokeWidth: brushSize,
        id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      activeToolInstance.current = ToolFactory.getTool(currentTool, fabricCanvas);
      if (activeToolInstance.current) {
        activeToolInstance.current.onMouseDown(opt, baseOptions);
      }
    };

    const handleMouseMove = (opt) => {
      if (activeToolInstance.current) {
        activeToolInstance.current.onMouseMove(opt);
      }
    };

    const handleMouseUp = (opt) => {
      clearSnappingGuides(fabricCanvas);
      if (activeToolInstance.current) {
        activeToolInstance.current.onMouseUp(opt);
        activeToolInstance.current = null;
        broadcastCanvas();
        
        // Auto-revert to 'select' tool after drawing shapes (industry standard UX)
        if (['rect', 'circle', 'diamond', 'arrow', 'line'].includes(currentTool)) {
          useUIStore.getState().setCurrentTool('select');
        }
      }
    };

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);

    const handleModified = () => {
      clearSnappingGuides(fabricCanvas);
      broadcastCanvas();
    };
    fabricCanvas.on('object:modified', handleModified);

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
      fabricCanvas.off('object:modified', handleModified);
    };
  }, [fabricCanvas, currentTool, brushColor, brushSize]);

  // Remote Sync Subscription
  useEffect(() => {
    if (!socket || !fabricCanvas) return;

    const handleIncomingDraw = (incomingData) => {
      isUpdatingFromServer.current = true;
      fabricCanvas.loadFromJSON(incomingData, () => {
        // Enforce correct selection states for the user's current tool
        const tool = useUIStore.getState().currentTool;
        const isSelectMode = tool === 'select' || tool === 'eraser';
        
        fabricCanvas.forEachObject(obj => {
          if (isViewer || tool === 'pan') {
            obj.selectable = false;
            obj.evented = false;
          } else if (isSelectMode) {
            obj.selectable = true;
            obj.evented = true;
          } else {
            obj.selectable = false;
            obj.evented = true;
          }
        });

        fabricCanvas.renderAll();
        isUpdatingFromServer.current = false;
      }, (o, obj) => {
        if (obj) {
          if (o.id) obj.id = o.id;
          if (o.customType) obj.customType = o.customType;
          if (o.connectorData) obj.connectorData = o.connectorData;
          if (o.semanticType) obj.semanticType = o.semanticType;
          if (o.metadata) obj.metadata = o.metadata;
          if (o.mediaId) obj.mediaId = o.mediaId;
          if (o.fileName) obj.fileName = o.fileName;
          if (o.mimeType) obj.mimeType = o.mimeType;
          if (o.uploadStatus) obj.uploadStatus = o.uploadStatus;
          if (o.version) obj.version = o.version;

          if (obj.customType === 'arrow' || obj.customType === 'line') {
            if (!isViewer) {
              setupConnectorControls(obj);
            }
          }
        }
      });
    };

    socket.on('draw', handleIncomingDraw);

    return () => {
      socket.off('draw', handleIncomingDraw);
    };
  }, [socket, fabricCanvas, isViewer]);

  return (
    <div className="absolute inset-0 z-10 touch-none">
      <canvas ref={canvasRef} />
    </div>
  );
};

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default CanvasEngine;
