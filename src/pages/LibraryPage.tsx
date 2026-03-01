// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, GeneratedContent, Platform } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, Instagram, Youtube, Music2, Zap, Globe, Search, Trash2, 
  RefreshCw, X, FileText, ExternalLink, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { supabase } from '../services/supabase';
import { LibraryCardSkeleton } from '../components/PerformancePlaceholders';

const PlatformIcon = ({ platform, size = 16 }: { platform: string, size?: number }) => {
  switch (platform) {
    case Platform.Instagram: return <Instagram size={size} />;
    case Platform.YouTube: return <Youtube size={size} />;
    case Platform.TikTok: return <Music2 size={size} />;
    case Platform.Kwai: return <Zap size={size} fill="currentColor" />;
    default: return <Globe size={size} />;
  }
};

const PAGE_SIZE = 12;

const LibraryPage: React.FC<{ user: User }> = ({ user }) => {
  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [blueprintToDelete, setBlueprintToDelete] = useState<GeneratedContent | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  const fetchLibrary = useCallback(async (page: number, searchTerm: string) => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('content_blueprints')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,niche.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      const mapped = (data || []).map(item => ({
        ...item,
        funnel: item.funnel_stage || 'Topo',
        hook: item.title, 
        title: item.title,
        date: item.created_at,
        userId: item.user_id,
        profileType: item.niche,
        specialization: item.sub_niche,
        script: item.script,
        caption: item.caption,
        hashtags: item.hashtags
      }));

      setContents(mapped);
      setTotalCount(count || 0);
    } catch (e) { 
      console.error("Erro ao carregar acervo:", e); 
    } finally { 
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchLibrary(1, search);
    }, 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [search, fetchLibrary]);

  useEffect(() => {
    fetchLibrary(currentPage, search);
  }, [currentPage, fetchLibrary]);

  const handleConfirmDelete = async () => {
    if (!blueprintToDelete || !user?.id) return;
    const blueprintId = blueprintToDelete.id;
    
    setDeletingId(blueprintId);
    setBlueprintToDelete(null);

    try {
      const { error } = await supabase
        .from("content_blueprints")
        .delete()
        .eq("id", blueprintId)
        .eq("user_id", user.id);

      if (error) throw error;

      setContents(prev => prev.filter(b => b.id !== blueprintId));
      setTotalCount(prev => Math.max(0, prev - 1));
      
      if (selectedContent?.id === blueprintId) {
        setSelectedContent(null);
      }
    } catch (err) {
      console.error("Erro na operação de deleção:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="p-4 md:p-10 space-y-12 animate-in fade-in duration-300 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter uppercase text-zinc-900 dark:text-white leading-none">Road <span className="text-yellow-400">Acervo</span></h2>
          <p className="text-zinc-500 font-bold text-sm italic mt-2">Repositório de {totalCount} estratégias virais geradas.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              placeholder="PESQUISAR BLUEPRINTS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl text-[11px] font-black uppercase italic outline-none focus:border-yellow-400 transition-all"
            />
          </div>
          <button 
            onClick={() => fetchLibrary(currentPage, search)} 
            className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-500 hover:text-yellow-400 transition-colors"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
        <AnimatePresence mode="popLayout">
          {loading ? (
             <motion.div key="skeletons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="contents">
                {Array.from({ length: 4 }).map((_, i) => <LibraryCardSkeleton key={i} />)}
             </motion.div>
          ) : contents.length > 0 ? (
            contents.map((blueprint) => (
              <motion.div 
                key={blueprint.id} 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800/50 rounded-[2.5rem] p-7 space-y-6 group hover:border-yellow-400 transition-all shadow-xl relative overflow-hidden"
              >
                {deletingId === blueprint.id && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-2 text-center p-4">
                    <Loader2 className="animate-spin text-red-500 mb-2" size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">Expurgando Dados...</span>
                  </div>
                )}
                
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-zinc-400 group-hover:text-yellow-400 transition-all">
                      <PlatformIcon platform={blueprint.platform} />
                   </div>
                   <Badge label={blueprint.funnel} />
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                     <span className="text-[8px] font-black uppercase bg-yellow-400/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-400/10 italic">{blueprint.profileType}</span>
                     {blueprint.specialization && (
                       <span className="text-[8px] font-black uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded italic">{blueprint.specialization}</span>
                     )}
                  </div>
                  <h3 className="text-[14px] font-black italic uppercase leading-tight line-clamp-3 text-zinc-900 dark:text-white group-hover:text-yellow-400 transition-colors">
                    "{blueprint.title}"
                  </h3>
                </div>

                <div className="pt-2 border-t dark:border-zinc-800 flex justify-between items-center text-[9px] font-black text-zinc-400 italic">
                   <div className="flex items-center gap-1">
                      <Zap size={10} fill="currentColor" className="text-yellow-400" /> ROADMAP BP
                   </div>
                   <span>{new Date(blueprint.date).toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="flex gap-2 pt-2">
                   <button 
                    onClick={() => setSelectedContent(blueprint)} 
                    className="flex-1 bg-zinc-900 dark:bg-zinc-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-black transition-all flex items-center justify-center gap-2 active:scale-95"
                   >
                     ABRIR <ExternalLink size={12} />
                   </button>
                   <button 
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setBlueprintToDelete(blueprint); 
                    }}
                    disabled={!!deletingId}
                    className="p-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-48 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[4rem] text-zinc-500 font-bold italic">
               <p className="text-xl font-black uppercase italic">Nenhum blueprint encontrado</p>
               <p className="text-xs uppercase tracking-widest mt-2">Gere novas roteiros para alimentar seu acervo.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-10">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => p - 1)} 
            className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl disabled:opacity-30 hover:border-yellow-400 transition-all text-zinc-500"
          >
            <ChevronLeft size={20}/>
          </button>
          <div className="bg-zinc-900 dark:bg-zinc-800 px-6 py-4 rounded-2xl text-[10px] font-black uppercase italic text-yellow-400 shadow-xl">
            {currentPage} / {totalPages}
          </div>
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(p => p + 1)} 
            className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl disabled:opacity-30 hover:border-yellow-400 transition-all text-zinc-500"
          >
            <ChevronRight size={20}/>
          </button>
        </div>
      )}

      <AnimatePresence>
        {blueprintToDelete && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] border border-zinc-200 dark:border-zinc-800 p-10 text-center space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500/20" />
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl shadow-red-500/10 border border-red-500/20">
                <AlertTriangle size={36} />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-tight text-zinc-900 dark:text-white">Eliminar <span className="text-red-500">Blueprint?</span></h3>
                <p className="text-zinc-500 font-bold text-sm italic leading-relaxed px-2">
                  Esta ação é irreversível. Você tem certeza que deseja remover <span className="text-zinc-900 dark:text-zinc-100 font-black">"{blueprintToDelete.title}"</span> da Viral Cloud?
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleConfirmDelete}
                  className="w-full bg-red-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                >
                  <Trash2 size={16} /> SIM, CONFIRMO EXCLUSÃO
                </button>
                <button 
                  onClick={() => setBlueprintToDelete(null)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-white transition-all active:scale-95 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
                >
                  CANCELAR OPERAÇÃO
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedContent && (
          <ContentModal content={selectedContent} onClose={() => { setSelectedContent(null); fetchLibrary(currentPage, search); }} onDelete={() => setBlueprintToDelete(selectedContent)} />
        )}
      </AnimatePresence>
    </div>
  );
};

const ContentModal = ({ content, onClose, onDelete }: any) => {
  const [edited, setEdited] = useState(content);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load content initially
  useEffect(() => { setEdited({ ...content }); }, []);

  // Auto-Save Logic
  useEffect(() => {
    if (JSON.stringify(edited) === JSON.stringify(content)) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('content_blueprints')
          .update({
            script: edited.script,
            caption: edited.caption,
            hashtags: edited.hashtags
          })
          .eq('id', content.id);

        if (error) throw error;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [edited]);

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[3rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-2xl">
        <div className="p-8 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <div className="space-y-1">
             <div className="flex items-center gap-2 mb-1">
                <PlatformIcon platform={content.platform} size={14} className="text-yellow-400" />
                <span className="text-[10px] font-black uppercase text-zinc-500 italic tracking-widest">{content.platform} • {content.funnel}</span>
             </div>
             <h2 className="text-xl font-black italic uppercase tracking-tighter">"{content.title}"</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="mr-4">
               <AnimatePresence mode="wait">
                 {saveStatus === 'saving' && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                      <Loader2 className="animate-spin" size={10} /> Salvando...
                   </motion.div>
                 )}
                 {saveStatus === 'saved' && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-[10px] text-green-500 font-bold uppercase tracking-widest">
                      <CheckCircle2 size={10} /> Salvo
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>
            <button 
              onClick={onDelete} 
              className="p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/10"
              title="Excluir Blueprint"
            >
              <Trash2 size={20} />
            </button>
            <button onClick={onClose} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-yellow-400 tracking-[0.3em] italic flex items-center gap-2"><Zap size={14} fill="currentColor" /> Roteiro Estratégico</h4>
                <textarea 
                  className="w-full h-[400px] bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-[2.5rem] text-sm font-bold italic leading-relaxed whitespace-pre-wrap border dark:border-zinc-800 shadow-inner outline-none focus:ring-2 focus:ring-yellow-400/20"
                  value={edited.script}
                  onChange={(e) => setEdited({...edited, script: e.target.value})}
                />
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em] italic flex items-center gap-2"><FileText size={14} /> Legenda & Tags</h4>
                <div className="bg-zinc-950 text-white p-8 rounded-[2.5rem] shadow-2xl border border-zinc-800 space-y-4">
                  <textarea 
                    className="w-full h-[150px] bg-transparent text-[12px] font-medium italic leading-relaxed border-none outline-none resize-none"
                    value={edited.caption}
                    onChange={(e) => setEdited({...edited, caption: e.target.value})}
                  />
                  <div className="pt-6 border-t border-zinc-800">
                     <textarea 
                        className="w-full h-[50px] bg-transparent text-yellow-400 font-black tracking-widest text-[10px] uppercase border-none outline-none resize-none"
                        value={edited.hashtags}
                        onChange={(e) => setEdited({...edited, hashtags: e.target.value})}
                     />
                  </div>
                </div>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LibraryPage;