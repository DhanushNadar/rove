import { useState } from 'react';
import axios from 'axios';
import { X, Sparkles, AlertTriangle, Layers, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollabStore } from '../../stores/useCollabStore';
import { useCanvasStore } from '../../stores/useCanvasStore';
import { useUIStore } from '../../stores/useUIStore';
import { API_URL } from '../../config';

const AIPanel = ({ isOpen, onClose }) => {
  const { token } = useCollabStore();
  const { activeWhiteboard, setActiveWhiteboard } = useCanvasStore();
  const { aiGraph, setAiGraph } = useUIStore();
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!activeWhiteboard || !token) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/whiteboards/${activeWhiteboard._id}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setActiveWhiteboard(res.data.data);
      setAiGraph(res.data.data.aiMetadata);
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-3xl border-l border-border shadow-2xl z-40 flex flex-col"
        >
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Sparkles className="text-accent" /> Semantic Analysis
            </h3>
            <button className="text-slate-500 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-lg" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Our AI engine maps your raw canvas drawing into a structural Semantic Architecture Graph.
            </p>
            
            <button 
              className="w-full py-3 mb-6 bg-black hover:bg-gray-800 text-white font-bold rounded-lg transition-all flex justify-center items-center gap-2 shadow-sm"
              onClick={handleAnalyze} 
              disabled={loading}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                  <Cpu size={18} />
                </motion.div>
              ) : (
                <><Cpu size={18} /> Process Canvas</>
              )}
            </button>

            {aiGraph && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-slate-800 font-semibold flex items-center gap-2 mb-3">
                    <Layers size={16} className="text-black" /> Extracted Nodes
                  </h4>
                  <div className="space-y-2">
                    {aiGraph.nodes.map((node, i) => (
                      <div key={i} className="bg-slate-50 border border-border p-3 rounded-lg flex items-center justify-between group hover:border-gray-400 transition-colors">
                        <span className="font-medium text-slate-800">{node.label}</span>
                        <span className="text-xs text-black bg-gray-200 border border-gray-300 px-2 py-1 rounded-full">{node.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-slate-800 font-semibold flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-black" /> Detected Relationships
                  </h4>
                  <div className="space-y-2">
                    {aiGraph.edges.map((edge, i) => (
                      <div key={i} className="bg-slate-50 border border-border p-3 rounded-lg text-sm text-slate-600 group hover:border-gray-400 transition-colors">
                        {edge.sourceLabel || edge.sourceId} <span className="text-black font-bold mx-2">→</span> {edge.targetLabel || edge.targetId}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIPanel;
