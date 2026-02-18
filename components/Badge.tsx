
import React from 'react';

export const Badge = ({ label }: { label: string }) => (
  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[8px] font-black uppercase tracking-widest rounded border border-zinc-200 dark:border-zinc-700/50">
    {label}
  </span>
);
