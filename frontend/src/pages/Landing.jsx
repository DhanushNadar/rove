import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  MousePointer2, 
  Check, 
  X, 
  Play,
  ArrowRight, 
  Users, 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Network,
  PenTool,
  Share2,
  FileSpreadsheet,
  Hand,
  Bell,
  Lock
} from 'lucide-react';

const MiniWhiteboardMockup = () => {
  // Coordinated timeline configurations (Total duration: 12s)
  
  // Cursor A: Dhanush (Violet)
  const cursorAVariants = {
    animate: {
      x: [240, 240, 169, 169, 169, 169, 240, 240],
      y: [160, 160, 64, 64, 115, 64, 160, 160],
      scale: [1, 1, 1, 0.85, 1, 0.85, 1, 1],
      transition: {
        duration: 12,
        times: [0, 0.12, 0.22, 0.25, 0.40, 0.43, 0.52, 1],
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };

  // Cursor B: Sarah (Pink)
  const cursorBVariants = {
    animate: {
      x: [340, 340, 340, 369, 369, 239, 239, 340, 340],
      y: [200, 200, 200, 154, 154, 174, 174, 200, 200],
      scale: [1, 1, 1, 1, 0.85, 1, 0.85, 1, 1],
      transition: {
        duration: 12,
        times: [0, 0.50, 0.52, 0.60, 0.63, 0.75, 0.78, 0.88, 1],
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };

  // Node C: PostgreSQL
  const nodeCVariants = {
    animate: {
      x: [0, 0, 0, 0, -130, -130, 0, 0],
      y: [0, 0, 0, 0, 20, 20, 0, 0],
      scale: [1, 1, 1, 1, 1.05, 1, 1, 1],
      transition: {
        duration: 12,
        times: [0, 0.50, 0.63, 0.64, 0.75, 0.81, 0.88, 1],
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };

  // Connector 1 Path d
  const connector1PathVariants = {
    animate: {
      d: [
        "M 144,64 Q 169,64 194,64",
        "M 144,64 Q 169,64 194,64",
        "M 144,64 Q 169,64 194,64",
        "M 144,64 Q 169,115 194,64",
        "M 144,64 Q 169,64 194,64",
        "M 144,64 Q 169,64 194,64"
      ],
      transition: {
        duration: 12,
        times: [0, 0.25, 0.28, 0.40, 0.43, 1],
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };

  // Connector 2 Path d
  const connector2PathVariants = {
    animate: {
      d: [
        "M 239,88 C 239,109 369,109 369,130",
        "M 239,88 C 239,109 369,109 369,130",
        "M 239,88 C 239,109 369,109 369,130",
        "M 239,88 C 239,119 239,119 239,150",
        "M 239,88 C 239,119 239,119 239,150",
        "M 239,88 C 239,109 369,109 369,130",
        "M 239,88 C 239,109 369,109 369,130"
      ],
      transition: {
        duration: 12,
        times: [0, 0.50, 0.63, 0.75, 0.81, 0.88, 1],
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };

  // Connector 1 Midpoint Handle Y coordinate
  const handleYVariants = {
    animate: {
      y: [64, 64, 64, 115, 64, 64],
      transition: {
        duration: 12,
        times: [0, 0.25, 0.28, 0.40, 0.43, 1],
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };

  // Connector 1 Controls/Guideline Opacity
  const controlsOpacityVariants = {
    animate: {
      opacity: [0, 0, 1, 1, 0, 0],
      transition: {
        duration: 12,
        times: [0, 0.20, 0.23, 0.43, 0.46, 1],
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };

  // Snapping Guide Line Opacity
  const snapLineOpacityVariants = {
    animate: {
      opacity: [0, 0, 1, 1, 0, 0],
      transition: {
        duration: 12,
        times: [0, 0.73, 0.75, 0.80, 0.82, 1],
        ease: "easeInOut",
        repeat: Infinity,
      }
    }
  };

  // Active user presence pulse in top-right
  const userPulseVariants = {
    animate: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="w-[440px] h-[300px] bg-white rounded-3xl border-2 border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col relative select-none bg-slate-50/40">
      
      {/* 1. App Top Window Header Bar */}
      <div className="h-10 border-b border-slate-200/80 bg-white/95 px-4 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
        </div>
        
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Rove Workspace
        </div>

        {/* Dynamic active avatars */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          <motion.div 
            variants={userPulseVariants}
            animate="animate"
            className="w-5 h-5 rounded-full bg-violet-600 text-white text-[9px] font-black flex items-center justify-center border border-white shadow-sm ring-1 ring-violet-300"
          >
            D
          </motion.div>
          <motion.div 
            className="w-5 h-5 rounded-full bg-pink-500 text-white text-[9px] font-black flex items-center justify-center border border-white shadow-sm ring-1 ring-pink-300"
          >
            S
          </motion.div>
        </div>
      </div>

      {/* 2. Interactive Canvas Container */}
      <div className="flex-1 w-full relative overflow-hidden bg-[#f8fafc] bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
        
        {/* 2.1 Sidebar Toolbar Mockup */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-slate-200/90 shadow-md rounded-xl p-1 flex flex-col gap-1.5 z-10">
          <div className="w-6 h-6 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
            <MousePointer2 size={12} strokeWidth={2.5} />
          </div>
          <div className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
            <PenTool size={12} strokeWidth={2} />
          </div>
          <div className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
            <Network size={12} strokeWidth={2} />
          </div>
        </div>

        {/* 2.2 SVG Connectors Area */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker id="mini-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" />
            </marker>
          </defs>

          {/* Vertical Snap Guidelines */}
          <motion.line
            variants={snapLineOpacityVariants}
            animate="animate"
            x1="239"
            y1="40"
            x2="239"
            y2="210"
            stroke="#c084fc"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="drop-shadow-sm"
          />

          {/* Connector 1: Client -> API Gateway */}
          <motion.path
            variants={connector1PathVariants}
            animate="animate"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2.5"
            markerEnd="url(#mini-arrow)"
            className="text-violet-500 drop-shadow-sm"
          />

          {/* Dynamic Selection controls for Connector 1 */}
          <motion.g variants={controlsOpacityVariants} animate="animate">
            {/* Start anchor control */}
            <circle cx="144" cy="64" r="3.5" fill="white" stroke="#4f46e5" strokeWidth="1.5" />
            
            {/* End anchor control */}
            <circle cx="194" cy="64" r="3.5" fill="white" stroke="#4f46e5" strokeWidth="1.5" />
            
            {/* Guideline to curve handle */}
            <motion.line
              x1="169"
              y1="64"
              x2="169"
              variants={handleYVariants}
              animate="animate"
              stroke="#8b5cf6"
              strokeWidth="1"
              strokeDasharray="2.2 2.2"
            />
            
            {/* Midpoint Curve Handle */}
            <motion.circle
              cx="169"
              variants={handleYVariants}
              animate="animate"
              r="4.5"
              fill="white"
              stroke="#8b5cf6"
              strokeWidth="2"
              className="shadow-sm"
            />
          </motion.g>

          {/* Connector 2: API Gateway -> PostgreSQL */}
          <motion.path
            variants={connector2PathVariants}
            animate="animate"
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="5 3.5"
            style={{
              animation: 'flow 1.5s linear infinite'
            }}
            markerEnd="url(#mini-arrow)"
            className="text-emerald-500 drop-shadow-sm"
          />
        </svg>

        {/* 2.3 Canvas Node Cards */}
        {/* Node A: React Client */}
        <div 
          style={{ left: 54, top: 40, width: 90, height: 48 }}
          className="absolute bg-blue-50/95 border-2 border-blue-200 rounded-xl p-2 shadow-sm flex flex-col items-center justify-center text-center text-blue-700 z-10 transition-shadow hover:shadow-md"
        >
          <span className="text-[9px] font-black tracking-wide uppercase">React client</span>
          <span className="text-[6.5px] text-blue-500 font-semibold mt-0.5">Frontend App</span>
        </div>

        {/* Node B: API Gateway */}
        <div 
          style={{ left: 194, top: 40, width: 90, height: 48 }}
          className="absolute bg-purple-50/95 border-2 border-purple-200 rounded-xl p-2 shadow-sm flex flex-col items-center justify-center text-center text-purple-700 z-10 transition-shadow hover:shadow-md"
        >
          <span className="text-[9px] font-black tracking-wide uppercase">API Gateway</span>
          <span className="text-[6.5px] text-purple-500 font-semibold mt-0.5">Express Server</span>
        </div>

        {/* Node C: PostgreSQL */}
        <motion.div 
          variants={nodeCVariants}
          animate="animate"
          style={{ left: 324, top: 130, width: 90, height: 48 }}
          className="absolute bg-emerald-50/95 border-2 border-emerald-200 rounded-xl p-2 shadow-sm flex flex-col items-center justify-center text-center text-emerald-700 z-10 origin-center"
        >
          <span className="text-[9px] font-black tracking-wide uppercase">PostgreSQL</span>
          <span className="text-[6.5px] text-emerald-500 font-semibold mt-0.5">Database Cluster</span>
        </motion.div>

        {/* 2.4 Animated Cursors */}
        {/* Cursor A: Dhanush (Violet) */}
        <motion.div
          variants={cursorAVariants}
          animate="animate"
          className="absolute pointer-events-none z-30"
          style={{ top: 0, left: 0 }}
        >
          {/* Mouse pointer shape */}
          <MousePointer2 className="text-violet-600 fill-violet-600 w-4.5 h-4.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] -rotate-90" />
          
          {/* Label badge */}
          <div className="absolute flex items-center gap-1 bg-violet-600 text-white font-black text-[7.5px] tracking-wide px-1.5 py-0.5 rounded-full shadow-lg left-3 top-3 select-none whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Dhanush
          </div>

          {/* Click Ripple Indicator */}
          <motion.div
            animate={{
              scale: [1, 1, 2.5, 1, 1, 2.5, 1, 1],
              opacity: [0, 0, 0.75, 0, 0, 0.75, 0, 0],
            }}
            transition={{
              duration: 12,
              times: [0, 0.22, 0.25, 0.30, 0.40, 0.43, 0.48, 1],
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute border border-violet-500/80 rounded-full w-5 h-5 -left-0.5 -top-0.5 pointer-events-none"
          />
        </motion.div>

        {/* Cursor B: Sarah (Pink) */}
        <motion.div
          variants={cursorBVariants}
          animate="animate"
          className="absolute pointer-events-none z-30"
          style={{ top: 0, left: 0 }}
        >
          {/* Mouse pointer shape */}
          <MousePointer2 className="text-pink-500 fill-pink-500 w-4.5 h-4.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] -rotate-90" />
          
          {/* Label badge */}
          <div className="absolute flex items-center gap-1 bg-pink-500 text-white font-black text-[7.5px] tracking-wide px-1.5 py-0.5 rounded-full shadow-lg left-3 top-3 select-none whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Sarah
          </div>

          {/* Click Ripple Indicator */}
          <motion.div
            animate={{
              scale: [1, 1, 2.5, 1, 1, 2.5, 1, 1],
              opacity: [0, 0, 0.75, 0, 0, 0.75, 0, 0],
            }}
            transition={{
              duration: 12,
              times: [0, 0.60, 0.63, 0.68, 0.75, 0.78, 0.83, 1],
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute border border-pink-500/80 rounded-full w-5 h-5 -left-0.5 -top-0.5 pointer-events-none"
          />
        </motion.div>

      </div>
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');

  const [isWakingUp, setIsWakingUp] = useState(false);
  const wakeUpTimeout = useRef(null);

  const triggerWakeUp = (targetPath) => {
    setIsWakingUp(true);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

    const checkHealth = async () => {
      try {
        await axios.get(`${API_URL}/health`);
        setIsWakingUp(false);
        navigate(targetPath);
      } catch (err) {
        wakeUpTimeout.current = setTimeout(checkHealth, 2500);
      }
    };

    checkHealth();
  };

  const handleCancelWakeUp = () => {
    if (wakeUpTimeout.current) {
      clearTimeout(wakeUpTimeout.current);
    }
    setIsWakingUp(false);
  };

  useEffect(() => {
    // 1. Silent backend wake-up ping in background to start spin-up immediately
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    axios.get(`${API_URL}/health`).catch(() => {
      // Ignored: silent background ping to spin up Render free-tier
    });

    // 2. Initial loader display timer
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1800);

    return () => {
      clearTimeout(timer);
      if (wakeUpTimeout.current) {
        clearTimeout(wakeUpTimeout.current);
      }
    };
  }, []);

  const openComingSoon = (featureName) => {
    setComingSoonFeature(featureName);
    setShowComingSoon(true);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-white relative font-sans text-slate-900 overflow-hidden flex flex-col items-center justify-center select-none">
        {/* Background Grid Pattern matching the theme */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.3]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e2e8f0 1px, transparent 1px),
              linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        ></div>

        {/* Core Loader Content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo in Pulsing/Floating Container */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: 1,
              y: [-4, 4]
            }}
            transition={{ 
              scale: {
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              },
              y: {
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1.5,
                ease: "easeInOut"
              },
              opacity: { duration: 0.5 }
            }}
            className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center"
          >
            <img src="/logo.webp" alt="Rove Logo" className="h-16 w-16 object-contain" />
          </motion.div>

          {/* Title & Slogan */}
          <div className="text-center space-y-1.5 mt-2">
            <h1 className="font-black text-2xl tracking-widest text-[#1f1f1f] uppercase">
              ROVE
            </h1>
            <p className="text-xs text-slate-500 font-bold tracking-wide uppercase">
              Connect Ideas Forever
            </p>
          </div>

          {/* Minimalist Progress Bar */}
          <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50 mt-2">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-blue-600 rounded-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-white relative font-sans text-slate-900 selection:bg-blue-200 selection:text-black overflow-x-hidden"
    >
      
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.3]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e2e8f0 1px, transparent 1px),
            linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      ></div>

      {/* Navigation Bar */}
      <div className="relative z-50 pt-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-white/90 backdrop-blur-md border border-slate-200 rounded-full shadow-sm px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer animate-fade-in" onClick={() => navigate('/')}>
            <img src="/logo.webp" alt="Rove Logo" className="h-8 w-8 object-contain" />
            <span className="font-bold text-xl tracking-tight hidden sm:block">Rove</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-slate-500 font-semibold">
            <button onClick={() => openComingSoon('Features')} className="hover:text-black transition-colors">Features</button>
            <button onClick={() => openComingSoon('Solutions')} className="hover:text-black transition-colors">Solutions</button>
            <button onClick={() => openComingSoon('Pricing')} className="hover:text-black transition-colors">Pricing</button>
          </nav>

          <button 
            onClick={() => triggerWakeUp('/login')}
            className="bg-[#1f1f1f] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-black transition-all shadow-md active:scale-95"
          >
            Open Workspace
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left: Typography Content */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 space-y-4 sm:space-y-5"
          >
            <h1 className="text-4xl sm:text-[2.8rem] lg:text-[3.2rem] font-black leading-[1.1] tracking-tight text-[#2d2d2d] uppercase">
              <span className="block mb-1">LOST IN A</span>
              <span className="relative inline-block text-blue-500 px-4 py-1 mb-2 whitespace-nowrap">
                <span className="absolute inset-0 bg-blue-100 -rotate-2 rounded-md -z-10"></span>
                SEA OF TABS?
              </span>
              <br />
              <span className="flex items-center flex-wrap gap-2 mt-1 whitespace-nowrap">
                ROVE 
                <img src="/logo.webp" alt="Logo" className="inline-block h-8 w-8 object-contain shadow-sm border border-slate-200 rounded-lg bg-white p-1" /> 
                CONNECTS
              </span>
              <span className="relative inline-block text-[#10b981] mt-1">
                IDEAS FOREVER.
                {/* Custom Marker Underline */}
                <span className="absolute bottom-1 -left-1 -right-1 h-3 bg-[#a7f3d0] opacity-40 -z-10 rounded-sm"></span>
                <span className="absolute bottom-[-2px] -left-1 -right-1 h-1.5 bg-[#10b981] opacity-60 -z-10 rounded-sm"></span>
              </span>
            </h1>

            <p className="text-sm lg:text-base text-slate-600 max-w-md font-medium leading-relaxed">
               The infinite architecture canvas built for visual thinkers. Drag, drop, link with Cubic Bezier connectors, snap nodes, and co-work in real-time.
            </p>

            <div className="pt-2">
              <button 
                onClick={() => triggerWakeUp('/login')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-black flex items-center gap-2 transition-all shadow-md hover:-translate-y-1 active:translate-y-0 text-sm lg:text-base"
              >
                <PenTool size={18} />
                <span>Start Designing</span>
              </button>
            </div>
          </motion.div>

          {/* Right: Looping Whiteboard Simulator Mockup */}
          <div className="lg:col-span-5 w-full hidden lg:flex items-center justify-center relative h-[320px]">
            {/* Inline stylesheet for Bezier flowing particle effect */}
            <style>{`
              @keyframes flow {
                from { stroke-dashoffset: 20; }
                to { stroke-dashoffset: 0; }
              }
            `}</style>
            
            <MiniWhiteboardMockup />
          </div>

        </div>
      </main>

      {/* See how it works Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 lg:py-32 border-t border-slate-100">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            See <span className="text-slate-500">how it works</span>
          </h2>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Whiteboard Mockup Container */}
          <div className="relative bg-[#fafafa] rounded-3xl shadow-2xl border border-slate-200 aspect-video flex flex-col overflow-hidden z-20 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px]">
             {/* Mockup Top Bar */}
             <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl shadow-sm">
                <div className="flex gap-2">
                   <div className="w-3 h-3 rounded-full bg-red-400"></div>
                   <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                   <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="font-bold text-xs text-slate-700">Database Schema Design - Rove</div>
                
                {/* Visual stacked presence header indicator */}
                <div className="flex -space-x-1.5 overflow-hidden">
                   <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold border border-white">D</div>
                   <div className="w-5 h-5 rounded-full bg-pink-500 text-white text-[9px] flex items-center justify-center font-bold border border-white">A</div>
                </div>
             </div>

             {/* Toolbar Mockup */}
             <div className="absolute left-4 top-1/2 -translate-y-1/2 bg-white border border-slate-200 shadow-md rounded-xl p-2 flex flex-col gap-2 z-20">
                <div className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600"><MousePointer2 size={16} /></div>
                <div className="w-8 h-8 rounded hover:bg-slate-100 flex items-center justify-center text-slate-600"><PenTool size={16} /></div>
                <div className="w-8 h-8 rounded bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm"><Network size={16} /></div>
             </div>
             
             {/* Canvas Content */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                   {/* Cubic Bezier Connection Line */}
                   <svg className="absolute inset-0 w-full h-full z-0 text-indigo-400" viewBox="0 0 1000 500">
                     <path d="M 320,250 C 450,250 500,200 600,200" fill="none" stroke="currentColor" strokeWidth="3" />
                   </svg>
                   
                   {/* Node 1 */}
                   <div className="absolute top-[200px] left-[180px] bg-yellow-100 border border-yellow-200 p-4 rounded shadow-sm w-36 rotate-[-2deg] z-10">
                      <div className="font-bold text-xs mb-1">API gateway</div>
                      <div className="text-[10px] text-yellow-800">Manages authentications, route allocations, and limits.</div>
                   </div>

                   {/* Node 2 */}
                   <div className="absolute top-[150px] left-[600px] bg-white border-2 border-indigo-200 p-4 rounded-xl shadow-md w-48 rotate-[1deg] z-10 flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-indigo-600">
                         <FileText size={16} /> <span className="font-bold text-xs">AuthService.js</span>
                      </div>
                      <div className="h-12 bg-slate-50 border border-slate-100 rounded w-full flex items-center justify-center text-[10px] text-slate-400 font-semibold uppercase">Token Validation</div>
                   </div>

                   {/* Play Button Overlay */}
                   <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] flex items-center justify-center z-30">
                     <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-xl" onClick={() => triggerWakeUp('/login')}>
                        <Play size={32} className="text-white ml-2" fill="white" />
                     </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Floating Elements */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="absolute -bottom-10 -left-6 md:-left-12 z-30"
          >
            <div className="bg-white px-6 py-4 rounded-2xl shadow-xl border border-slate-200 rotate-[-5deg] flex items-center gap-3">
              <Network className="text-indigo-600" />
              <div className="font-bold text-slate-800 text-sm">Bezier Routing</div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="absolute top-12 -right-8 md:-right-16 z-30"
          >
             <div className="bg-white p-3 rounded-2xl shadow-xl border border-slate-200 rotate-[8deg]">
              <img src="/logo.webp" alt="Rove" className="w-16 h-16 object-contain" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Zig Zag */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 overflow-hidden">
        
        {/* Feature 1 */}
        <div className="flex flex-col md:flex-row items-center gap-16 py-16">
          <div className="flex-1 space-y-6">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Collaborate <br/>in real-time.
            </h2>
            <p className="text-lg text-slate-600 max-w-md font-medium leading-relaxed">
              Brainstorm together, no matter where you are. Track active team sessions with clean, stacked presence avatars in the header, keeping your whiteboard beautifully legible and clutter-free.
            </p>
          </div>
          <div className="flex-1 relative w-full">
             <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 rotate-[2deg] max-w-sm mx-auto relative z-10 h-64 flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-100 p-4 shadow-sm border border-yellow-200 w-40 h-40 rotate-[-4deg]">
                   <div className="w-full h-2 bg-yellow-200 rounded mb-2"></div>
                   <div className="w-3/4 h-2 bg-yellow-200 rounded mb-2"></div>
                   <div className="w-5/6 h-2 bg-yellow-200 rounded"></div>
                </div>

                {/* Simulated Stacked Avatars Visual presence overlay */}
                <div className="absolute top-4 right-4 bg-white border border-slate-200 p-2.5 rounded-full flex gap-1 shadow z-20">
                   <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center border border-white ring-2 ring-emerald-500">D</div>
                   <div className="w-6 h-6 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center border border-white">A</div>
                </div>

             </div>
             <div className="absolute inset-0 bg-indigo-50 rounded-2xl rotate-[-2deg] -z-10 scale-105 opacity-50 max-w-sm mx-auto"></div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-16 py-16">
          <div className="flex-1 space-y-6 md:pl-12">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Smart Guidelines <br/>& Snap Alignment.
            </h2>
            <p className="text-lg text-slate-600 max-w-md font-medium leading-relaxed">
              Align boxes flawlessly. Rove's Figma-style vertical and horizontal snapping guidelines keep your system diagrams, process flows, and architectural boards looking perfectly neat.
            </p>
          </div>
          <div className="flex-1 relative w-full">
             <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden rotate-[-2deg] relative z-10 w-[110%] -ml-[5%] h-72">
                <div className="absolute top-4 right-4 bg-black text-white px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 shadow-lg z-30">
                   <Network size={14} /> Smart Guides
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] flex items-center justify-center p-8">
                   <div className="relative w-full h-full max-w-sm">
                      {/* Core Node */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-lg font-black text-indigo-800 text-sm z-20 shadow-sm">
                         Core Node
                      </div>
                      
                      {/* Snapping guide line */}
                      <svg className="absolute inset-0 w-full h-full z-10 text-purple-400" viewBox="0 0 200 150" preserveAspectRatio="none">
                         <path d="M 100,20 L 100,100" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                      </svg>

                      <div className="absolute top-[80px] left-[10px] w-[60px] bg-white border border-slate-200 p-2 rounded-md shadow-sm text-center text-[10px] font-medium z-20">
                         System Node A
                      </div>
                      
                      <div className="absolute top-[80px] right-[10px] w-[60px] bg-white border border-slate-200 p-2 rounded-md shadow-sm text-center text-[10px] font-medium z-20">
                         System Node B
                      </div>
                   </div>
                </div>
             </div>
             <div className="absolute inset-0 bg-slate-100 rounded-xl rotate-[3deg] -z-10 scale-105 opacity-50 w-[110%] -ml-[5%]"></div>
          </div>
        </div>

        {/* Feature 3 */}
        <div className="flex flex-col md:flex-row items-center gap-16 py-16">
          <div className="flex-1 space-y-6">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Drop any file <br/>anywhere.
            </h2>
            <p className="text-lg text-slate-600 max-w-md font-medium leading-relaxed">
              PDFs, spreadsheets, images, or videos. Drag and drop any media format directly onto the infinite canvas to build rich visual context.
            </p>
          </div>
          <div className="flex-1 relative w-full">
             <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden rotate-[3deg] relative z-10 w-[110%] -ml-[5%] h-72">
                 
                <div className="absolute inset-0 bg-slate-50 flex items-center justify-center p-8">
                   
                   {/* File Cards Mockup (Halved Icons) */}
                   <div className="absolute top-10 left-10 bg-white p-2 rounded-lg border border-slate-200 shadow-md rotate-[-10deg] flex flex-col items-center gap-1.5 w-18 hover:-translate-y-2 transition-transform cursor-pointer">
                      <div className="w-7 h-7 bg-red-100 text-red-500 rounded flex items-center justify-center">
                         <FileText size={14} />
                      </div>
                      <div className="text-[8px] font-bold truncate w-full text-center">brief.pdf</div>
                   </div>

                   <div className="absolute top-24 right-12 bg-white p-2 rounded-lg border border-slate-200 shadow-md rotate-[15deg] flex flex-col items-center gap-1.5 w-18 hover:-translate-y-2 transition-transform cursor-pointer z-20">
                      <div className="w-7 h-7 bg-green-100 text-green-500 rounded flex items-center justify-center">
                         <FileSpreadsheet size={14} />
                      </div>
                      <div className="text-[8px] font-bold truncate w-full text-center">data.xlsx</div>
                   </div>

                   <div className="absolute bottom-12 left-24 bg-white p-2 rounded-lg border border-slate-200 shadow-xl rotate-[5deg] w-24 hover:-translate-y-2 transition-transform cursor-pointer z-30">
                      <div className="w-full h-12 bg-blue-100 rounded mb-1 flex items-center justify-center text-blue-400">
                         <ImageIcon size={18} />
                      </div>
                      <div className="text-[8px] font-bold text-center">mockup.png</div>
                   </div>

                   {/* Dotted target area */}
                   <div className="absolute inset-4 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50/50 flex flex-col items-center justify-center text-blue-400 -z-10">
                      <span className="font-bold text-xs">Drop files here</span>
                   </div>

                </div>
             </div>
             <div className="absolute inset-0 bg-blue-100 rounded-xl rotate-[-2deg] -z-10 scale-105 opacity-50 w-[110%] -ml-[5%]"></div>
          </div>
        </div>
      </section>

      {/* Problems we solve Section */}
      <section className="py-24 bg-slate-50/50 border-y border-slate-100 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
           <h2 className="text-4xl md:text-5xl font-black text-center text-slate-900 mb-20 tracking-tight">
             Why choose <span className="text-slate-500">Rove?</span>
           </h2>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8">
              
              {/* Before Column */}
              <div className="flex flex-col items-center">
                 <div className="bg-slate-100 text-slate-500 font-bold text-sm px-4 py-1 rounded-full mb-12">The Old Way</div>
                 
                 <div className="relative h-48 w-full max-w-[200px] mb-8">
                    {/* Fake icons cluster isolated */}
                    <div className="absolute top-0 left-0 bg-white border border-slate-200 p-3 rounded-lg shadow-sm rotate-[-15deg]"><FileText className="text-slate-400"/></div>
                    <div className="absolute top-8 right-0 bg-white border border-slate-200 p-3 rounded-lg shadow-sm rotate-[10deg]"><ImageIcon className="text-slate-400"/></div>
                    <div className="absolute bottom-4 left-4 bg-white border border-slate-200 p-3 rounded-lg shadow-sm rotate-[-5deg]"><FileSpreadsheet className="text-slate-400"/></div>
                    <div className="absolute bottom-0 right-10 bg-white border border-slate-200 p-3 rounded-lg shadow-sm rotate-[20deg]"><PenTool className="text-slate-400"/></div>
                 </div>

                 <ul className="space-y-4 text-slate-700 font-medium">
                    <li className="flex items-center gap-3"><X className="text-red-500 shrink-0" size={24} strokeWidth={3} /> Fragmented ideas</li>
                    <li className="flex items-center gap-3"><X className="text-red-500 shrink-0" size={24} strokeWidth={3} /> Files lost in chat history</li>
                    <li className="flex items-center gap-3"><X className="text-red-500 shrink-0" size={24} strokeWidth={3} /> Endless scrolling</li>
                 </ul>
              </div>

              {/* After Column */}
              <div className="flex flex-col items-center">
                 <div className="bg-blue-600 text-white font-bold text-sm px-5 py-1 rounded-full mb-12">With Rove</div>
                 
                 <div className="relative h-48 flex items-center justify-center mb-8 w-full max-w-[200px]">
                    <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-blue-500 w-20 h-20 relative z-20 flex items-center justify-center">
                       <img src="/logo.webp" alt="Rove" className="w-12 h-12 object-contain" />
                    </div>
                    
                    {/* Connected Nodes */}
                    <div className="absolute top-2 left-2 bg-white border-2 border-slate-200 p-2 rounded-full shadow-sm z-10"><FileText className="text-blue-500" size={16}/></div>
                    <div className="absolute top-6 right-2 bg-white border-2 border-slate-200 p-2 rounded-full shadow-sm z-10"><ImageIcon className="text-pink-500" size={16}/></div>
                    <div className="absolute bottom-6 left-4 bg-white border-2 border-slate-200 p-2 rounded-full shadow-sm z-10"><PenTool className="text-green-500" size={16}/></div>

                    <svg className="absolute inset-0 w-full h-full z-0 text-blue-200" viewBox="0 0 100 100">
                       <line x1="20" y1="20" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />
                       <line x1="80" y1="30" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />
                       <line x1="30" y1="80" x2="50" y2="50" stroke="currentColor" strokeWidth="2" />
                     </svg>
                  </div>

                  <ul className="space-y-4 text-slate-900 font-semibold">
                     <li className="flex items-center gap-3"><Check className="text-blue-500 shrink-0" size={28} strokeWidth={3} /> Unified visual workspace</li>
                     <li className="flex items-center gap-3"><Check className="text-blue-500 shrink-0" size={28} strokeWidth={3} /> Drag and drop media</li>
                     <li className="flex items-center gap-3"><Check className="text-blue-500 shrink-0" size={28} strokeWidth={3} /> Cubic Bezier mapping</li>
                  </ul>
              </div>

           </div>
        </div>
      </section>

      {/* CTA & Footer */}
      <footer className="relative z-10 pt-24 pb-12 px-6">
         <div className="max-w-4xl mx-auto text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Ready to collaborate?</h2>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto font-medium">
               Join teams building the future with Rove. Create your first infinite canvas and invite your team in seconds.
            </p>
            <button 
              onClick={() => triggerWakeUp('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold inline-flex items-center gap-3 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 text-lg border border-blue-700"
            >
               <Sparkles size={20} />
               Start your workspace
            </button>
         </div>

         <div className="max-w-6xl mx-auto bg-[#1a1a1a] rounded-[2.5rem] p-12 md:p-16 text-white grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1 space-y-6">
               <div className="bg-white rounded-xl w-12 h-12 flex items-center justify-center shadow-lg">
                  <img src="/logo.webp" alt="Logo" className="w-8 h-8 object-contain" />
               </div>
               <p className="font-bold text-lg text-slate-200">
                 Rove.<br/>Think visually.
               </p>
            </div>
            
            <div>
               <h4 className="font-bold text-lg mb-6 text-white">Product</h4>
               <ul className="space-y-4 text-slate-400 font-medium">
                  <li><button onClick={() => openComingSoon('Features')} className="hover:text-white transition-colors">Features</button></li>
                  <li><button onClick={() => openComingSoon('Integrations')} className="hover:text-white transition-colors">Integrations</button></li>
                  <li><button onClick={() => openComingSoon('Pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                  <li><button onClick={() => openComingSoon('Changelog')} className="hover:text-white transition-colors">Changelog</button></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-lg mb-6 text-white">Resources</h4>
               <ul className="space-y-4 text-slate-400 font-medium">
                  <li><button onClick={() => openComingSoon('Documentation')} className="hover:text-white transition-colors">Documentation</button></li>
                  <li><button onClick={() => openComingSoon('Help Center')} className="hover:text-white transition-colors">Help Center</button></li>
                  <li><button onClick={() => openComingSoon('Community')} className="hover:text-white transition-colors">Community</button></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-lg mb-6 text-white">Company</h4>
               <ul className="space-y-4 text-slate-400 font-medium">
                  <li><button onClick={() => openComingSoon('About Us')} className="hover:text-white transition-colors">About Us</button></li>
                  <li><button onClick={() => openComingSoon('Careers')} className="hover:text-white transition-colors">Careers</button></li>
                  <li><button onClick={() => openComingSoon('Contact')} className="hover:text-white transition-colors">Contact</button></li>
               </ul>
            </div>
         </div>
      </footer>

      {/* Coming Soon Glassmorphic Modal */}
      <AnimatePresence>
        {showComingSoon && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-2xl w-full max-w-md flex flex-col items-center text-center gap-6 relative"
            >
              <button 
                type="button"
                onClick={() => setShowComingSoon(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                <Sparkles size={32} className="animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {comingSoonFeature} Coming Soon
                </h3>
                <p className="text-sm text-slate-500 font-semibold leading-relaxed">
                  We are putting the final touches on our {comingSoonFeature.toLowerCase()} module. Leave your email to join the private beta waitlist and get early access!
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Thanks! We have added you to the waitlist.");
                  setShowComingSoon(false);
                }} 
                className="w-full space-y-3"
              >
                <input 
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-semibold text-sm text-center"
                />
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md text-sm active:scale-98"
                >
                  Join the Waitlist
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Wake Up Server Loader Overlay */}
      <AnimatePresence>
        {isWakingUp && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/90 border border-slate-200 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md flex flex-col items-center text-center gap-6 relative"
            >
              {/* Spinner & Pulsing Rings */}
              <div className="relative h-20 w-20 flex items-center justify-center">
                {/* Glowing Pulsing Aura */}
                <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-indigo-500/10 animate-pulse" />
                
                {/* Visual Rotating Spinner */}
                <svg className="animate-spin h-14 w-14 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                
                {/* Center Rocket icon */}
                <div className="absolute font-bold text-lg">🚀</div>
              </div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  Waking up Rove Workspace...
                </h3>
                <div className="text-sm text-slate-600 font-medium leading-relaxed space-y-2">
                  <p>
                    Rove is currently deploying onto its free-tier cloud host. To preserve resources, the backend goes to sleep after periods of inactivity.
                  </p>
                  <p className="text-indigo-600 font-semibold bg-indigo-50/50 py-2.5 px-4 rounded-xl border border-indigo-100/50">
                    💡 This spin-up can take up to <strong>30–60 seconds</strong> to wake up the database and dependencies. Please keep this tab open!
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleCancelWakeUp}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs active:scale-95 border border-slate-200"
              >
                Cancel and return
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Landing;
