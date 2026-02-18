
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Library, 
  Anchor, 
  Calendar, 
  User as UserIcon, 
  LogOut, 
  Zap,
  Moon,
  Sun,
  ShieldCheck,
  BarChart3,
  KanbanSquare
} from 'lucide-react';
import { User, PlanType } from '../types';
import { supabase } from '../services/supabase';
import { motion } from 'framer-motion';

interface SidebarProps {
  user: User;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogout: () => void;
  onUpgradeClick: () => void;
}

const UserAvatar = ({ user, size = 'md' }: { user: User, size?: 'sm' | 'md' }) => {
  const [imgError, setImgError] = useState(false);
  
  const initials = user.name
    ? user.name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'UR';

  const sizeClasses = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
  const textClasses = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <div className={`${sizeClasses} overflow-hidden bg-yellow-400 flex items-center justify-center text-black font-black italic ${textClasses} shadow-lg shadow-yellow-400/20 shrink-0 border-2 border-zinc-100 dark:border-zinc-800`}>
      {user.avatarUrl && !imgError ? (
        <img 
          src={user.avatarUrl} 
          alt={user.name} 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ user, theme, onToggleTheme, onLogout, onUpgradeClick }) => {
  const navigate = useNavigate();
  
  const menuItems = [
    { name: 'GERADOR', path: '/dashboard', icon: Sparkles },
    { name: 'PERFORMANCE', path: '/dashboard/performance', icon: BarChart3 },
    { name: 'ACERVO', path: '/dashboard/library', icon: Library },
    { name: 'CALENDÁRIO', path: '/dashboard/calendar', icon: Calendar },
    { name: 'HOOKS', path: '/dashboard/hooks', icon: Anchor },
    { name: 'PERFIL', path: '/dashboard/profile', icon: UserIcon },
  ];

  const isPro = user.currentPlan === PlanType.Pro;
  const used = user.usedBlueprints || 0;
  const limit = user.monthlyLimit || 5;
  const progress = Math.min((used / limit) * 100, 100);

  const prefetchRoute = (path: string) => {
    try {
      switch (path) {
        case '/dashboard':
          import('../pages/GeneratorPage');
          break;
        case '/dashboard/performance':
          import('../pages/PerformancePage');
          break;
        case '/dashboard/library':
          import('../pages/LibraryPage');
          break;
        case '/dashboard/calendar':
          import('../pages/RoadmapPage');
          break;
        case '/dashboard/hooks':
          import('../pages/HooksLibraryPage');
          break;
        case '/dashboard/profile':
          import('../pages/ProfilePage');
          break;
      }
    } catch (e) {}
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Erro ao invalidar sessão:", error.message);
      
      localStorage.clear();
      sessionStorage.clear();
      onLogout();
      navigate('/login');
    } catch (err) {
      console.error("Falha no logout:", err);
      window.location.hash = "/login";
    }
  };

  return (
    <>
      <aside className="hidden lg:flex w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex-col h-screen sticky top-0 z-40 transition-all duration-300">
        <div className="p-8 mb-6">
          <div className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter italic flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" fill="currentColor" />
            <span>VIRAL <span className="text-yellow-400">ROAD</span></span>
          </div>
          
          <div className="mt-6 space-y-6">
            <div>
              {isPro ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 text-yellow-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-yellow-400/20 shadow-sm">
                  <ShieldCheck size={10} fill="currentColor" /> PRO UNLIMITED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-700/50">
                  PLATAFORMA: {user.currentPlan?.toUpperCase() || 'STARTER'}
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-widest italic leading-none">
                <span className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                  <Zap size={11} className="text-yellow-400" fill="currentColor" />
                  CRÉDITOS DE GERAÇÃO
                </span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {used}<span className="text-zinc-400 dark:text-zinc-600 font-bold mx-0.5">/</span>{limit >= 999999 ? '∞' : limit}
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-[2px] border border-zinc-200 dark:border-zinc-700/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(250,204,21,0.3)] ${progress > 90 ? 'bg-red-500' : 'bg-yellow-400'}`}
                />
              </div>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onMouseEnter={() => prefetchRoute(item.path)}
              className={({ isActive }) => 
                `flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  isActive 
                  ? 'bg-yellow-400 text-black shadow-xl shadow-yellow-400/20 translate-x-1' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`
              }
            >
              <item.icon size={18} strokeWidth={2.5} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-3 px-2 mb-2">
            <UserAvatar user={user} />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase italic truncate text-zinc-900 dark:text-white">{user.name || 'Estrategista'}</p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest truncate">{user.email}</p>
            </div>
          </div>

          <button 
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 hover:border-yellow-400 transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-zinc-900" />}
              <span className="font-black italic">{theme === 'dark' ? 'MODO DIA' : 'MODO NOITE'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full p-1 transition-colors duration-300 ${theme === 'dark' ? 'bg-yellow-400' : 'bg-zinc-300'}`}>
               <div className={`w-2 h-2 rounded-full bg-white transition-transform duration-300 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-4 text-[9px] text-zinc-400 hover:text-red-500 font-black uppercase tracking-[0.3em] transition-colors active:scale-95"
          >
            <LogOut size={14} /> ENCERAR ROAD SESSÃO
          </button>
        </div>
      </aside>

      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-lg z-50">
        <nav className="bg-zinc-900/95 backdrop-blur-2xl border border-zinc-800/50 rounded-[2.5rem] p-1.5 flex items-center justify-evenly shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              onMouseEnter={() => prefetchRoute(item.path)}
              className={({ isActive }) => 
                `flex flex-col items-center justify-center py-2.5 px-1.5 transition-all duration-300 min-w-[50px] ${
                  isActive ? 'text-yellow-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`mb-1 transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : ''}`}>
                    {item.name === 'PERFIL' ? (
                      <div className={`transition-transform duration-300 ${isActive ? 'scale-110 ring-2 ring-yellow-400' : ''} rounded-full overflow-hidden`}>
                        <UserAvatar user={user} size="sm" />
                      </div>
                    ) : (
                      <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    )}
                  </div>
                  <span className={`text-[6px] md:text-[7px] font-black uppercase tracking-widest italic ${isActive ? 'opacity-100' : 'opacity-40 text-zinc-600'}`}>
                    {item.name.slice(0, 4)}
                  </span>
                  {isActive && item.name !== 'PERFIL' && (
                    <div className="absolute -bottom-1 w-1 h-1 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,1)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
