
import React from 'react';
import { motion } from 'framer-motion';

const Shimmer = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
);

export const NarrativeSkeleton = () => (
  <div className="space-y-6">
    <div className="bg-zinc-100/50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl animate-pulse relative overflow-hidden">
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 mb-2" />
      <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
      <Shimmer />
    </div>
    {[1, 2, 3].map(i => (
      <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 rounded-[3rem] space-y-4 animate-pulse relative overflow-hidden">
        <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
        <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
        <Shimmer />
      </div>
    ))}
  </div>
);

export const FinalStrategySkeleton = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] overflow-hidden animate-pulse relative">
    <div className="p-10 border-b dark:border-zinc-800 flex justify-between">
      <div className="h-8 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
      <div className="h-12 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
    </div>
    <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="h-64 w-full bg-zinc-100 dark:bg-zinc-800 rounded-[2.5rem]" />
      <div className="h-64 w-full bg-zinc-100 dark:bg-zinc-800 rounded-[2.5rem]" />
    </div>
    <Shimmer />
  </div>
);

export const LibraryCardSkeleton = () => (
  <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800/50 rounded-[2.5rem] p-7 space-y-6 animate-pulse relative overflow-hidden">
    <div className="flex justify-between items-start">
      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
      <div className="w-20 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-md" />
    </div>
    <div className="space-y-3">
      <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
      <div className="h-5 bg-zinc-100 dark:bg-zinc-800 rounded w-4/5" />
    </div>
    <div className="flex gap-2 pt-4">
      <div className="flex-1 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
      <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
    </div>
    <Shimmer />
  </div>
);

export const RoadmapKanbanSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
    {[1, 2, 3, 4].map(col => (
      <div key={col} className="bg-zinc-100/40 dark:bg-zinc-900/40 rounded-[2.5rem] p-5 border dark:border-zinc-800/60 min-h-[500px] space-y-4">
        <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-full mx-2 mb-6" />
        {[1, 2].map(item => (
          <div key={item} className="bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border dark:border-zinc-800 h-32 relative overflow-hidden">
             <Shimmer />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const PlatformTab = ({ id, icon: Icon, label, isActive, onClick, hasData }: any) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-6 py-4 rounded-2xl transition-all ${
      isActive 
        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg shadow-zinc-500/10' 
        : 'bg-white dark:bg-zinc-900 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
    }`}
  >
    <Icon size={18} className={isActive ? (id === 'Instagram' ? 'text-[#E1306C]' : id === 'TikTok' ? 'text-[#00f2ea]' : id === 'YouTube' ? 'text-[#FF0000]' : 'text-yellow-400') : ''} />
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    {hasData && (
      <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-green-500 rounded-full" />
    )}
  </button>
);
