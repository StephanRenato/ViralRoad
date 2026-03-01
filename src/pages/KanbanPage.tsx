
// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { User, GeneratedContent, ContentStatus, Platform } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2,
  Trash2,
  X,
  FileText,
  Instagram,
  Youtube,
  Music2,
  Zap,
  Globe,
  Plus,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  AlignLeft,
  Hash
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { supabase } from '../services/supabase';

interface KanbanPageProps {
  user: User;
}

interface Column {
  id: ContentStatus;
  title: string;
  items: GeneratedContent[];
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

const WorkflowPage: React.FC<KanbanPageProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  
  // Estado para controlar o modal de exclusão
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado para Tooltip
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: GeneratedContent } | null>(null);

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
      console.error('Erro ao ler Workflow:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardData();
  }, [user.id]);

  const handleUpdateStatus = async (id: string, newStatus: ContentStatus) => {
    try {
      const { error } = await supabase
        .from('content_blueprints')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setContents(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (e) {
      console.error('Erro ao atualizar status:', e);
    }
  };

  const confirmDelete = (blueprintId: string) => {
    setItemToDelete(blueprintId);
  };

  const handleExecuteDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("content_blueprints")
        .delete()
        .eq("id", itemToDelete)
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setContents((prev) => prev.filter((item) => item.id !== itemToDelete));
      
      if (selectedContent?.id === itemToDelete) {
        setSelectedContent(null);
      }
      setItemToDelete(null);
    } catch (e: any) {
      console.error("Erro ao excluir:", e);
      alert(e.message || "Erro ao excluir");
    } finally {
      setIsDeleting(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    handleUpdateStatus(draggableId, destination.droppableId as ContentStatus);
  };

  const kanbanColumns = useMemo(() => {
    const cols: Record<string, Column> = {
      [ContentStatus.Idea]: { id: ContentStatus.Idea, title: 'Ideia Bruta', items: [] },
      [ContentStatus.Approved]: { id: ContentStatus.Approved, title: 'Aprovado', items: [] },
      [ContentStatus.Planned]: { id: ContentStatus.Planned, title: 'Agendado', items: [] },
      [ContentStatus.Published]: { id: ContentStatus.Published, title: 'Publicado', items: [] },
    };
    contents.forEach(item => {
      if (cols[item.status]) cols[item.status].items.push(item);
    });
    return cols;
  }, [contents]);

  return (
    <div className="p-4 md:p-10 space-y-8 pb-20 animate-in fade-in duration-700 relative">
      <div>
        <h2 className="text-4xl font-black uppercase italic text-zinc-900 dark:text-white tracking-tighter">Road <span className="text-yellow-400">Workflow</span></h2>
        <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] italic mt-1">Gestão tática do seu ecossistema de Blueprints.</p>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <div key="loader" className="py-48 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-yellow-400" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 italic">Sincronizando Workflow...</p>
          </div>
        ) : (
          <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.values(kanbanColumns).map(col => (
                  <Droppable key={col.id} droppableId={col.id}>
                    {(provided) => (
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="bg-zinc-100/50 dark:bg-zinc-900/40 rounded-[2.5rem] p-5 border border-zinc-200 dark:border-zinc-800/60 min-h-[600px] flex flex-col"
                      >
                        <div className="flex justify-between items-center px-4 mb-6">
                          <h3 className="text-[10px] font-black uppercase italic text-zinc-400 tracking-[0.2em]">{col.title}</h3>
                          <span className="text-[10px] font-black text-zinc-500 bg-zinc-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-full">{col.items.length}</span>
                        </div>
                        <div className="flex-1 space-y-4">
                          {col.items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setSelectedContent(item)}
                                  onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    // Calcula se deve mostrar à direita ou à esquerda baseado na posição da tela
                                    const x = rect.right > window.innerWidth - 350 ? rect.left - 340 : rect.right + 20;
                                    setTooltip({ x, y: rect.top, item });
                                  }}
                                  onMouseLeave={() => setTooltip(null)}
                                  className={`bg-white dark:bg-zinc-950 p-6 rounded-[2rem] border transition-all cursor-pointer group hover:border-yellow-400 ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-yellow-400/50 rotate-2' : 'border-zinc-100 dark:border-zinc-800 shadow-sm'}`}
                                >
                                  <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-yellow-400 transition-colors">
                                      <PlatformIcon platform={item.platform} />
                                    </div>
                                    <div className="flex gap-1.5">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); confirmDelete(item.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 transition-all"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                      <Badge label={item.funnel} />
                                    </div>
                                  </div>
                                  <p className="text-xs font-black italic uppercase text-zinc-900 dark:text-white leading-snug line-clamp-3">"{item.title || item.hook}"</p>
                                  <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[8px] font-black uppercase text-zinc-400 italic">Ver Detalhes</span>
                                    <Edit3 size={12} className="text-zinc-400" />
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedContent && (
          <ContentModal 
            content={selectedContent} 
            onClose={() => setSelectedContent(null)} 
            onDelete={() => confirmDelete(selectedContent.id)}
            onUpdate={(updates: any) => {
              setContents(prev => prev.map(c => c.id === selectedContent.id ? { ...c, ...updates } : c));
            }}
          />
        )}
      </AnimatePresence>

      {/* TOOLTIP FLUTUANTE */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[9999] w-[320px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-5 shadow-2xl pointer-events-none"
            style={{ top: tooltip.y, left: tooltip.x }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 mb-2">
                <FileText size={12} className="text-yellow-400" />
                <span className="text-[10px] font-black uppercase text-yellow-400 tracking-widest italic">Preview do Roteiro</span>
              </div>
              <div>
                <p className="text-[10px] text-zinc-300 font-medium italic leading-relaxed line-clamp-6 whitespace-pre-wrap">
                  {tooltip.item.script || "Sem roteiro definido..."}
                </p>
              </div>
              {(tooltip.item.caption || tooltip.item.hashtags) && (
                <div className="pt-2 border-t border-zinc-800 space-y-2">
                   {tooltip.item.caption && (
                     <div className="flex gap-2">
                        <AlignLeft size={10} className="text-zinc-500 mt-0.5 shrink-0" />
                        <p className="text-[9px] text-zinc-400 italic line-clamp-2 leading-tight">{tooltip.item.caption}</p>
                     </div>
                   )}
                   {tooltip.item.hashtags && (
                     <div className="flex gap-2">
                        <Hash size={10} className="text-zinc-500 mt-0.5 shrink-0" />
                        <p className="text-[8px] font-black text-blue-400/80 uppercase line-clamp-1">{tooltip.item.hashtags}</p>
                     </div>
                   )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <AnimatePresence>
        {itemToDelete && (
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
                <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-tight text-zinc-900 dark:text-white">Excluir <span className="text-red-500">Roteiro?</span></h3>
                <p className="text-zinc-500 font-bold text-sm italic leading-relaxed px-2">
                  Tem certeza que deseja excluir? Esta ação removerá o card da página e do banco de dados permanentemente.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleExecuteDelete} 
                  disabled={isDeleting}
                  className="w-full bg-red-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 hover:bg-red-600 transition-all active:scale-95"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  {isDeleting ? 'EXCLUINDO...' : 'EXCLUIR'}
                </button>
                <button 
                  onClick={() => setItemToDelete(null)} 
                  disabled={isDeleting}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContentModal = ({ content, onClose, onDelete, onUpdate }: any) => {
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
      onUpdate(edited);
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
          <div className="flex items-center gap-2">
            <button 
              onClick={onDelete}
              className="p-3 text-zinc-400 hover:text-red-500 transition-colors bg-zinc-100 dark:bg-zinc-800 rounded-full"
            >
              <Trash2 size={20} />
            </button>
            <button onClick={onClose} className="p-3 text-zinc-400 hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-800 rounded-full"><X size={20} /></button>
          </div>
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

export default WorkflowPage;
