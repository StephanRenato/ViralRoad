
// @ts-nocheck
import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { User } from '../types';
import { Loader2 } from 'lucide-react';

// Code Splitting - Sub-páginas do Dashboard
// Mantemos o lazy loading para não pesar o bundle inicial, mas a UX será otimizada pelo Sidebar prefetch
const GeneratorPage = lazy(() => import('./GeneratorPage'));
const RoadmapPage = lazy(() => import('./RoadmapPage'));
const LibraryPage = lazy(() => import('./LibraryPage'));
const HooksLibraryPage = lazy(() => import('./HooksLibraryPage'));
const ProfilePage = lazy(() => import('./ProfilePage'));
const PerformancePage = lazy(() => import('./PerformancePage'));

// Componentes pesados carregados sob demanda
const ChatWidget = lazy(() => import('../components/ChatWidget').then(module => ({ default: module.ChatWidget })));

// Loader leve e local para transições internas (não cobre a sidebar)
const DashboardContentLoader = () => (
  <div className="h-full w-full min-h-[500px] flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-300">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-[3px] border-zinc-200 dark:border-zinc-800 border-t-yellow-400 animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
      </div>
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Carregando...</p>
  </div>
);

const Dashboard: React.FC<{ 
  user: User, 
  onLogout: () => void, 
  showUpgrade: boolean, 
  onCloseUpgrade: () => void, 
  onOpenUpgrade: () => void,
  onRefreshUser: () => void
}> = ({ user, onLogout, onOpenUpgrade, onRefreshUser }) => {
  return (
    <div className="relative min-h-screen w-full">
      {/* 
        Otimização: Substituído GlobalLoader por DashboardContentLoader.
        Isso mantém a Sidebar visível durante a navegação, aumentando a percepção de velocidade.
      */}
      <Suspense fallback={<DashboardContentLoader />}>
        <Routes>
          <Route path="/" element={<GeneratorPage user={user} onRefreshUser={onRefreshUser} />} />
          <Route path="/library" element={<LibraryPage user={user} />} />
          <Route path="/calendar" element={<RoadmapPage user={user} />} />
          <Route path="/hooks" element={<HooksLibraryPage user={user} />} />
          <Route path="/performance" element={<PerformancePage user={user} onRefreshUser={onRefreshUser} />} />
          <Route path="/profile" element={<ProfilePage user={user} onLogout={onLogout} onOpenUpgrade={onOpenUpgrade} onRefreshUser={onRefreshUser} />} />
        </Routes>
      </Suspense>
      
      {/* ChatWidget carregado com baixa prioridade */}
      <Suspense fallback={null}>
        <ChatWidget user={user} />
      </Suspense>
    </div>
  );
};

export default Dashboard;
