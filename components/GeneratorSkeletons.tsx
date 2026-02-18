
import React from 'react';

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
