
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { User, GeneratedContent, ContentStatus, Platform } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Instagram,
  Youtube,
  Music2,
  Zap,
  Globe,
  Edit3,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { supabase } from '../services/supabase';

interface CalendarPageProps {
  user: User;
}

const PlatformIcon = ({ platform, size = 10 }: { platform: string, size?: number }) => {
  switch (platform) {
    case Platform.Instagram: return <Instagram size={size} />;
    case Platform.YouTube: return <Youtube size={size} />;
    case Platform.TikTok: return <Music2 size={size} />;
    case Platform.Kwai: return <Zap size={size} fill="currentColor" />;
    default: return <Globe size={size} />;
  }
};

const CalendarPage: React.FC<CalendarPageProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);

  const fetchBoardData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_blueprints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mapped: GeneratedContent[] = (data || []).map(item => ({
        ...item,
        funnel: item.funnel_stage,
        hook: item.hook,
        title: item.title,
        date: item.scheduled_date || item.created_at,
        userId: item.user_id,
        profileType: item.niche,
        specialization: item.sub_niche
      }));

      setContents(mapped);
    } catch (e) {
      console.error('Erro ao ler Calendário:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [user.id]);

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const year = currentDate.getFullYear();
  const daysInMonth = new Date(year, currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, currentDate.getMonth(), 1).getDay();
  const prevMonthDays = new Date(year, currentDate.getMonth(), 0).getDate();
  const days = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, month: 'prev', date: new Date(year, currentDate.getMonth() - 1, prevMonthDays - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, month: 'current', date: new Date(year, currentDate.getMonth(), i) });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, month: 'next', date: new Date(year, currentDate.getMonth() + 1, i) });
  }

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + offset)));
  };

  const getContentsForDay = (date: Date) => {
    return contents.filter(c => {
      const cDate = new Date(c.date);
      return cDate.getDate() === date.getDate() && 
             cDate.getMonth() === date.getMonth() && 
             cDate.getFullYear() === date.getFullYear();
    });
  };

  return (
    <div className="p-4 md:p-10 space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase italic text-zinc-900 dark:text-white tracking-tighter">Road <span className="text-yellow-400">Calendário</span></h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] italic mt-1">Sua visão estratégica temporal.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentDate(new Date())} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-all shadow-sm">HOJE</button>
          <div className="flex bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-yellow-400 transition-all border-r dark:border-zinc-700"><ChevronLeft size={20} /></button>
            <button onClick={() => changeMonth(1)} className="p-4 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-yellow-400 transition-all"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-48 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-yellow-400" size={48} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Mapeando Linha do Tempo...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
          <div className="p-8 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
             <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">{monthName} <span className="text-yellow-400">{year}</span></h3>
          </div>
          <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
              <div key={d} className="bg-zinc-50 dark:bg-zinc-900 p-4 text-center">
                <span className="text-[10px] font-black text-zinc-400 tracking-widest">{d}</span>
              </div>
            ))}
            {days.map((d, i) => {
              const dayContents = getContentsForDay(d.date);
              const isToday = new Date().toDateString() === d.date.toDateString();
              
              return (
                <div 
                  key={i} 
                  className={`min-h-[140px] md:min-h-[180px] p-4 transition-colors relative ${
                    d.month === 'current' 
                    ? 'bg-white dark:bg-zinc-900/50' 
                    : 'bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-300 dark:text-zinc-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className={`text-sm font-black italic ${isToday ? 'text-yellow-400 scale-125' : ''}`}>
                      {d.day}
                    </span>
                  </div>
                  
                  <div className="space-y-2 overflow-y-auto max-h-[100px] no-scrollbar">
                    {d.month === 'current' && dayContents.map(content => (
                      <button
                        key={content.id}
                        onClick={() => setSelectedContent(content)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700 hover:border-yellow-400 transition-all text-left group relative"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <PlatformIcon platform={content.platform} size={10} className="text-zinc-400 group-hover:text-yellow-400" />
                          <span className="text-[7px] font-black uppercase text-zinc-500 tracking-widest">{content.platform}</span>
                        </div>
                        <p className="text-[9px] font-bold italic text-zinc-900 dark:text-white line-clamp-2 leading-tight">"{content.title || content.hook}"</p>
                      </button>
                    ))}
                  </div>
                  {isToday && <div className="absolute inset-0 border-2 border-yellow-400/20 pointer-events-none" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedContent && (
          <ContentModal 
            content={selectedContent} 
            onClose={() => setSelectedContent(null)} 
            onUpdate={() => fetchBoardData()}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ContentModal = ({ content, onClose, onUpdate }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [edited, setEdited] = useState({ ...content });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('content_blueprints')
        .update({
          script: edited.script,
          caption: edited.caption,
          status: edited.status,
          scheduled_date: edited.date
        })
        .eq('id', content.id);

      if (error) throw error;
      onUpdate();
      setIsEditing(false);
    } catch (e) {
      alert("Erro ao sincronizar alterações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <div className="space-y-1">
            <div className="flex gap-2 mb-1">
              <Badge label={content.platform} />
              <div className="px-3 py-1 bg-yellow-400/10 text-yellow-500 text-[10px] font-black uppercase rounded-lg border border-yellow-400/20 italic">{content.status.toUpperCase()}</div>
            </div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter">"{content.title || content.hook}"</h2>
          </div>
          <button onClick={onClose} className="p-3 text-zinc-400 hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-800 rounded-full"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-yellow-400 italic tracking-[0.3em] flex items-center gap-2">
                   <FileText size={12} /> Roteiro de Produção
                </h4>
                {isEditing ? (
                  <textarea 
                    value={edited.script} 
                    onChange={e => setEdited({...edited, script: e.target.value})}
                    className="w-full h-[400px] bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl text-sm font-bold italic border dark:border-zinc-700 outline-none focus:ring-2 focus:ring-yellow-400/20"
                  />
                ) : (
                  <div className="bg-zinc-50 dark:bg-zinc-800 p-8 rounded-[2.5rem] text-sm font-bold italic leading-relaxed whitespace-pre-wrap border dark:border-zinc-700 shadow-inner">
                    {content.script}
                  </div>
                )}
              </div>
              <div className="space-y-6">
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-yellow-400 italic tracking-[0.3em]">Legenda & Metadados</h4>
                    {isEditing ? (
                      <textarea 
                        value={edited.caption} 
                        onChange={e => setEdited({...edited, caption: e.target.value})}
                        className="w-full h-[200px] bg-zinc-900 text-white p-6 rounded-3xl text-[12px] font-medium italic border border-zinc-800 outline-none focus:ring-2 focus:ring-yellow-400/20 shadow-2xl"
                      />
                    ) : (
                      <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] text-[12px] font-medium italic border border-zinc-800 shadow-2xl">
                        {content.caption}
                        <div className="mt-6 pt-4 border-t border-zinc-800 text-yellow-400 font-black tracking-widest">{content.hashtags}</div>
                      </div>
                    )}
                 </div>
                 <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl border dark:border-zinc-700 space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-zinc-400 italic tracking-[0.2em]">Configurações ROAD</h4>
                    <div className="space-y-4">
                       <div>
                          <label className="text-[8px] font-black uppercase text-zinc-500 mb-1 block">Data de Publicação</label>
                          <input 
                            type="datetime-local" 
                            disabled={!isEditing}
                            value={new Date(edited.date).toISOString().slice(0, 16)}
                            onChange={e => setEdited({...edited, date: e.target.value})}
                            className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl border dark:border-zinc-600 text-[11px] font-black text-zinc-900 dark:text-white outline-none"
                          />
                       </div>
                       <div>
                          <label className="text-[8px] font-black uppercase text-zinc-500 mb-1 block">Status do Pipeline</label>
                          <select 
                            disabled={!isEditing}
                            value={edited.status}
                            onChange={e => setEdited({...edited, status: e.target.value as ContentStatus})}
                            className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl border dark:border-zinc-600 text-[11px] font-black text-zinc-900 dark:text-white outline-none uppercase"
                          >
                            {Object.values(ContentStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                          </select>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-8 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end gap-3">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="px-8 py-4 text-[10px] font-black uppercase text-zinc-400">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="bg-green-500 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-green-600 transition-all flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />} Sincronizar Agora
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} className="bg-yellow-400 text-black px-10 py-4 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-yellow-400/20 hover:bg-yellow-500 transition-all flex items-center gap-2">
              <Edit3 size={14} /> Editar Estratégia
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CalendarPage;
