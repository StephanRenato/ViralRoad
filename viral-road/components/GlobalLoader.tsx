import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Cpu } from 'lucide-react';

export const GlobalLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white overflow-hidden w-full absolute inset-0 z-[9999]">
    <div className="relative flex flex-col items-center">
      <motion.div 
        animate={{ 
          opacity: [0.8, 1, 0.8], 
          scale: [0.98, 1.02, 0.98],
          filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
        }} 
        transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
        className="text-yellow-400 relative z-10"
      >
        <Zap size={64} fill="currentColor" />
      </motion.div>
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-yellow-400/20 blur-[60px] rounded-full animate-pulse" />

      <div className="mt-12 space-y-4 text-center">
        <div className="flex items-center gap-2 justify-center">
          <Cpu size={14} className="text-zinc-600 animate-spin" style={{ animationDuration: '0.5s' }} />
          <p className="text-[10px] font-black text-white uppercase tracking-[0.5em] italic">ROAD ENGINE START</p>
        </div>
        
        <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden relative mx-auto">
          <motion.div 
            initial={{ left: "-100%" }}
            animate={{ left: "100%" }}
            transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 w-1/2 h-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,1)]"
          />
        </div>
      </div>
    </div>
  </div>
);

export default GlobalLoader;