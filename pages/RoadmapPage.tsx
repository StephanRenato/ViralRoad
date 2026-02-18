
// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { User, GeneratedContent, ContentStatus, Platform, RoadLabel, RoadSubtask } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, X, FileText, Instagram, Youtube, Music2, Zap, Globe, Layout, Calendar, Edit3, CheckCircle2, ChevronLeft, ChevronRight, Trash2, Tag, CheckSquare, Clock, Plus, Circle, CalendarDays, AlertTriangle, AlignLeft, Hash
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { supabase } from '../services/supabase';
import { RoadmapKanbanSkeleton } from '../components/PerformancePlaceholders';

interface RoadmapPageProps {
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

const LABEL_COLORS = {
  yellow: 'bg-yellow-400 text-black border border-yellow-500/20',
  red: 'bg-red-500 text-white border border-red-600/20',
  blue: 'bg-blue-500 text-white border border-blue-600/20',
  green: 'bg-green-500 text-white border border-green-600/20',
  purple: 'bg-purple-500 text-white border border-purple-600/20',
};

const RoadmapPage: React.FC<RoadmapPageProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Estado para Tooltip
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: GeneratedContent } | null>(null);

  const fetchData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('content_blueprints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContents(data.map(item => ({
        ...item,
        id: item.id,
        funnel: item.funnel_stage,
        hook: item.hook,
        title: item.title,
        date: item.scheduled_date || item.created_at,
        startDate: item.start_date || item.created_at, 
        endDate: item.end_date,
        labels: item.labels || [],
        subtasks: item.subtasks || [],
        userId: item.user_id
      })));
    } catch (e) { console.error(e); } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [user.id]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    if (source.droppableId.startsWith('calendar-') && destination.droppableId.startsWith('calendar-')) {
       const dateString = destination.droppableId.replace('calendar-', '');
       const parts = dateString.split('-').map(Number);
       const newDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0); 
       const newDateIso = newDate.toISOString();

       setContents(prev => prev.map(c => {
         if (c.id === draggableId) {
           return { ...c, date: newDateIso, endDate: newDateIso };
         }
         return c;
       }));

       try {
         await supabase
           .from('content_blueprints')
           .update({ scheduled_date: newDateIso, end_date: newDateIso })
           .eq('id', draggableId);
       } catch (error) {
         fetchData(); 
       }
       return;
    }

    if (!source.droppableId.startsWith('calendar-') && !destination.droppableId.startsWith('calendar-')) {
        const newStatus = destination.droppableId as ContentStatus;
        setContents(prev => prev.map(c => c.id === draggableId ? { ...c, status: newStatus } : c));
        try {
          await supabase.from('content_blueprints').update({ status: newStatus }).eq('id', draggableId);
        } catch (error) {
          fetchData();
        }
    }
  };

  async function handleDelete(blueprintId: string) {
    if (!window.confirm("Deseja excluir este card permanentemente?")) return;
    setDeletingId(blueprintId);
    try {
      await supabase.from("content_blueprints").delete().eq("id", blueprintId).eq("user_id", user.id);
      setContents((prev) => prev.filter((item) => item.id !== blueprintId));
      if (selectedContent?.id === blueprintId) setSelectedContent(null);
    } catch (e) {
      alert("Erro ao excluir.");
    } finally {
      setDeletingId(null);
    }
  }

  const kanbanColumns = useMemo(() => {
    const cols = {
      [ContentStatus.Idea]: { title: 'Ideia Bruta', items: [] },
      [ContentStatus.Approved]: { title: 'Aprovado', items: [] },
      [ContentStatus.Planned]: { title: 'Agendado', items: [] },
      [ContentStatus.Published]: { title: 'Publicado', items: [] },
    };
    contents.forEach(item => { if (cols[item.status]) cols[item.status].items.push(item); });
    return cols;
  }, [contents]);

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const res = [];
    for (let i = 0; i < firstDay; i++) res.push({ day: null, dateStr: `empty-${i}` });
    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        const dateStr = date.toLocaleDateString('en-CA'); 
        res.push({ day: i, date: date, dateStr: dateStr });
    }
    return res;
  }, [currentDate]);

  return (
    <div className="p-4 md:p-10 space-y-8 pb-20 animate-in fade-in h-full flex flex-col relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">Calendário <span className="text-yellow-400">Viral</span></h2>
          <p className="text-zinc-500 font-bold text-xs uppercase italic mt-1">Sua central de execução estratégica.</p>
        </div>

        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl border dark:border-zinc-800">
           <button onClick={() => setView('kanban')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'kanban' ? 'bg-white dark:bg-zinc-800 text-yellow-400 shadow-sm' : 'text-zinc-500'}`}><Layout size={14} /> Kanban</button>
           <button onClick={() => setView('calendar')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${view === 'calendar' ? 'bg-white dark:bg-zinc-800 text-yellow-400 shadow-sm' : 'text-zinc-500'}`}><Calendar size={14} /> Calendário</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? ( <RoadmapKanbanSkeleton /> ) : view === 'kanban' ? (
          <motion.div key="kanban" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 overflow-hidden">
             <div className="h-full overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar-horizontal">
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="flex h-full gap-6 px-2 min-w-max">
                    {Object.entries(kanbanColumns).map(([id, col]) => (
                      <Droppable key={id} droppableId={id}>
                        {(provided, snapshot) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className={`w-[320px] rounded-[2.5rem] p-4 flex flex-col h-full border transition-colors shrink-0 ${snapshot.isDraggingOver ? 'bg-zinc-200/50 dark:bg-zinc-800/50 border-yellow-400/30' : 'bg-zinc-100/40 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-800/60'}`}>
                            <div className="flex justify-between items-center mb-4 px-3 pt-2">
                                <h3 className="text-[10px] font-black uppercase italic text-zinc-400 tracking-[0.2em]">{col.title}</h3>
                                <span className="text-[9px] font-bold text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{col.items.length}</span>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-3">
                              <AnimatePresence>
                                {col.items.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => setSelectedContent(item)} style={{ ...provided.draggableProps.style }} className="mb-3">
                                        <div 
                                          onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = rect.right > window.innerWidth - 350 ? rect.left - 340 : rect.right + 20;
                                            setTooltip({ x, y: rect.top, item });
                                          }}
                                          onMouseLeave={() => setTooltip(null)}
                                          className={`bg-white dark:bg-zinc-950 p-5 rounded-[1.8rem] border hover:border-yellow-400 transition-all cursor-pointer group shadow-sm relative overflow-hidden ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-yellow-400 rotate-2 z-50 scale-105' : 'border-zinc-100 dark:border-zinc-800'}`}
                                        >
                                          <div className="flex justify-between items-start mb-3">
                                            <div className="p-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-zinc-400 group-hover:text-yellow-400 transition-colors"><PlatformIcon platform={item.platform} /></div>
                                            <div className="flex gap-2 items-center">
                                              <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} disabled={deletingId === item.id} className="p-1 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-100 disabled:cursor-wait" title="Excluir Card">{deletingId === item.id ? <Loader2 size={10} className="animate-spin text-red-500" /> : <Trash2 size={10} />}</button>
                                            </div>
                                          </div>
                                          <p className="text-xs font-black italic uppercase leading-tight line-clamp-3 mb-3 text-zinc-800 dark:text-zinc-100">"{item.title || item.hook}"</p>
                                          {item.labels && item.labels.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                              {item.labels.map(label => (
                                                <div key={label.id} className={`h-1.5 w-6 rounded-full ${LABEL_COLORS[label.color as keyof typeof LABEL_COLORS]?.split(' ')[0]}`} title={label.text} />
                                              ))}
                                            </div>
                                          )}
                                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                                              <Badge label={item.funnel} />
                                              {item.subtasks && item.subtasks.length > 0 && (
                                                <div className="flex items-center gap-1 text-[8px] text-zinc-400 font-bold uppercase"><CheckSquare size={8} /><span>{item.subtasks.filter(t => t.completed).length}/{item.subtasks.length}</span></div>
                                              )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              </AnimatePresence>
                              {provided.placeholder}
                            </div>
                          </div>
                        )}
                      </Droppable>
                    ))}
                  </div>
                </DragDropContext>
             </div>
          </motion.div>
        ) : (
          <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-between items-center px-4">
              <h3 className="text-xl font-black uppercase italic text-zinc-900 dark:text-white leading-none">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
              <div className="flex gap-2">
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-yellow-400 hover:text-black transition-all"><ChevronLeft size={20} /></button>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-yellow-400 hover:text-black transition-all"><ChevronRight size={20} /></button>
              </div>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border dark:border-zinc-800 overflow-hidden shadow-2xl">
                <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-800">
                  {['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map(d => <div key={d} className="bg-zinc-50 dark:bg-zinc-950 p-4 text-center text-[10px] font-black text-zinc-500">{d}</div>)}
                  
                  {days.map((d, i) => {
                    const dayContents = d.day ? contents.filter(c => {
                        if (!c.date) return false;
                        const cDate = new Date(c.date);
                        return cDate.getDate() === d.date?.getDate() && cDate.getMonth() === d.date?.getMonth() && cDate.getFullYear() === d.date?.getFullYear();
                    }) : [];
                    
                    if (!d.day) return <div key={i} className="bg-zinc-50/30 dark:bg-zinc-950/20 p-3 min-h-[140px]" />;

                    return (
                      <Droppable key={d.dateStr} droppableId={`calendar-${d.dateStr}`}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[140px] p-3 transition-colors flex flex-col ${snapshot.isDraggingOver ? 'bg-yellow-400/10 dark:bg-yellow-400/5 ring-inset ring-2 ring-yellow-400/20' : 'bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}>
                            <span className={`text-xs font-black italic mb-2 ${d.day ? 'text-zinc-400' : 'opacity-10'}`}>{d.day}</span>
                            <div className="space-y-1.5 flex-1">
                              {dayContents.map((c, idx) => (
                                <Draggable key={c.id} draggableId={c.id} index={idx}>
                                  {(provided, snapshot) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => setSelectedContent(c)} style={{ ...provided.draggableProps.style }} className={`w-full text-[8px] font-black uppercase truncate p-2 rounded-lg border transition-all text-left flex flex-col gap-1 cursor-grab active:cursor-grabbing shadow-sm ${snapshot.isDragging ? 'bg-yellow-400 text-black border-yellow-500 shadow-xl z-50 scale-105' : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-yellow-400 text-zinc-700 dark:text-zinc-300'}`}>
                                      <div
                                        className="w-full"
                                        onMouseEnter={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            // Lógica simplificada para calendário
                                            const x = rect.right > window.innerWidth - 320 ? rect.left - 320 : rect.right + 10;
                                            setTooltip({ x, y: rect.top, item: c });
                                        }}
                                        onMouseLeave={() => setTooltip(null)}
                                      >
                                        <span className="truncate">"{c.title || c.hook}"</span>
                                        {c.labels && c.labels.length > 0 && (
                                            <div className="flex gap-1 flex-wrap mt-1">
                                            {c.labels.map(l => (
                                                <div key={l.id} className={`w-1.5 h-1.5 rounded-full ${LABEL_COLORS[l.color as keyof typeof LABEL_COLORS]?.split(' ')[0]}`} />
                                            ))}
                                            </div>
                                        )}
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
                    );
                  })}
                </div>
              </div>
            </DragDropContext>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedContent && (
          <ContentModal content={selectedContent} onClose={() => { setSelectedContent(null); fetchData(); }} onDelete={() => handleDelete(selectedContent.id)} />
        )}
      </AnimatePresence>

      {/* TOOLTIP FLUTUANTE */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-[9999] w-[300px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-5 shadow-2xl pointer-events-none"
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
    </div>
  );
};

const ContentModal = ({ content, onClose, onDelete }: any) => {
  const [edited, setEdited] = useState<GeneratedContent>({ ...content });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [newLabelText, setNewLabelText] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('yellow');
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Initial load
  useEffect(() => { setEdited({ ...content }); }, []);

  // Auto-Save Logic with Debounce
  useEffect(() => {
    // Avoid saving on initial mount if data matches
    if (JSON.stringify(edited) === JSON.stringify(content)) return;

    setSaveStatus('saving');
    const timer = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('content_blueprints')
          .update({
            script: edited.script,
            caption: edited.caption,
            status: edited.status,
            scheduled_date: edited.date,
            end_date: edited.endDate,
            start_date: edited.startDate,
            labels: edited.labels || [],
            subtasks: edited.subtasks || []
          })
          .eq('id', content.id);

        if (error) throw error;
        setSaveStatus('saved');
        
        // Hide saved status after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error("Auto-save failed", e);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [edited]);

  const handleAddLabel = () => {
    if (!newLabelText) return;
    const label: RoadLabel = { id: Date.now().toString(), text: newLabelText, color: newLabelColor };
    setEdited(prev => ({ ...prev, labels: [...(prev.labels || []), label] }));
    setNewLabelText('');
  };

  const handleRemoveLabel = (id: string) => {
    setEdited(prev => ({ ...prev, labels: (prev.labels || []).filter(l => l.id !== id) }));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText) return;
    const subtask: RoadSubtask = { id: Date.now().toString(), text: newSubtaskText, completed: false };
    setEdited(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), subtask] }));
    setNewSubtaskText('');
  };

  const handleToggleSubtask = (id: string) => {
    setEdited(prev => ({ ...prev, subtasks: (prev.subtasks || []).map(t => t.id === id ? { ...t, completed: !t.completed } : t) }));
  };

  const handleDeleteSubtask = (id: string) => {
    setEdited(prev => ({ ...prev, subtasks: (prev.subtasks || []).filter(t => t.id !== id) }));
  };

  const safeDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toISOString().split('T')[0]; } catch { return ''; }
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 w-full max-w-5xl max-h-[90vh] rounded-[3rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl flex flex-col">
        <div className="p-8 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <div className="space-y-1">
            <div className="flex gap-2 mb-1">
              <Badge label={content.platform} />
              <div className="px-3 py-1 bg-yellow-400/10 text-yellow-500 text-[10px] font-black uppercase rounded-lg border border-yellow-400/20 italic">{(content.status || '').toUpperCase()}</div>
            </div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter">"{content.title || content.hook}"</h2>
          </div>
          <div className="flex items-center gap-2">
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
            <button onClick={onDelete} className="p-3 text-zinc-400 hover:text-red-500 transition-colors bg-zinc-100 dark:bg-zinc-800 rounded-full"><Trash2 size={20} /></button>
            <button onClick={onClose} className="p-3 text-zinc-400 hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-800 rounded-full"><X size={20} /></button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-yellow-400 italic tracking-[0.3em] flex items-center gap-2"><FileText size={12} /> Roteiro</h4>
                  <textarea value={edited.script || ''} onChange={e => setEdited({...edited, script: e.target.value})} className="w-full h-[300px] bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl text-sm font-bold italic border dark:border-zinc-700 outline-none focus:ring-2 focus:ring-yellow-400/20" />
                </div>
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-zinc-400 italic tracking-[0.3em]">Legenda</h4>
                    <textarea value={edited.caption || ''} onChange={e => setEdited({...edited, caption: e.target.value})} className="w-full h-[150px] bg-zinc-900 text-white p-6 rounded-3xl text-[12px] font-medium italic border border-zinc-800 outline-none focus:ring-2 focus:ring-yellow-400/20 shadow-2xl" />
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2.5rem] border dark:border-zinc-800 space-y-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-yellow-400" />
                      <h4 className="text-[10px] font-black uppercase text-zinc-900 dark:text-white italic tracking-[0.2em]">Datas & Prazo</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-zinc-500 block flex items-center gap-1"><CalendarDays size={10} /> Início</label>
                          <input type="date" value={safeDate(edited.startDate)} onChange={e => setEdited({...edited, startDate: e.target.value})} className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-700 text-[11px] font-black outline-none focus:border-yellow-400 transition-colors" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-yellow-500 block flex items-center gap-1"><Zap size={10} fill="currentColor" /> Publicação</label>
                          <input 
                            type="date" 
                            value={safeDate(edited.date)}
                            onChange={e => {
                                const newDateStr = e.target.value;
                                const newDateIso = newDateStr ? new Date(`${newDateStr}T12:00:00`).toISOString() : edited.date;
                                setEdited({...edited, date: newDateIso, endDate: newDateIso});
                            }}
                            className="w-full bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-700 text-[11px] font-black outline-none focus:border-yellow-400 transition-colors border-l-4 border-l-yellow-400"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2.5rem] border dark:border-zinc-800 space-y-4">
                    <div className="flex items-center gap-2 mb-2"><Tag size={16} className="text-yellow-400" /><h4 className="text-[10px] font-black uppercase text-zinc-900 dark:text-white italic tracking-[0.2em]">Etiquetas</h4></div>
                    <div className="flex flex-wrap gap-2">
                      {edited.labels && edited.labels.length > 0 ? edited.labels.map(label => (
                          <span key={label.id} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${LABEL_COLORS[label.color as keyof typeof LABEL_COLORS] || LABEL_COLORS.yellow}`}>
                            {label.text}
                            <button onClick={() => handleRemoveLabel(label.id)} className="hover:text-black/50 p-0.5 rounded-full"><X size={10} /></button>
                          </span>
                        )) : <span className="text-[9px] text-zinc-400 italic">Nenhuma etiqueta.</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 flex bg-white dark:bg-zinc-900 rounded-xl border dark:border-zinc-700 overflow-hidden">
                          <input type="text" placeholder="Nova etiqueta..." value={newLabelText} onChange={e => setNewLabelText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddLabel()} className="flex-1 bg-transparent p-3 text-[10px] font-bold outline-none" />
                          <select value={newLabelColor} onChange={e => setNewLabelColor(e.target.value)} className="bg-zinc-900 text-white border-l border-zinc-700 text-[9px] font-black uppercase px-2 outline-none cursor-pointer h-full">
                            <option value="yellow">Amarelo</option><option value="red">Vermelho</option><option value="blue">Azul</option><option value="green">Verde</option><option value="purple">Roxo</option>
                          </select>
                      </div>
                      <button onClick={handleAddLabel} disabled={!newLabelText} className="p-3 bg-zinc-200 dark:bg-zinc-700 rounded-xl hover:bg-yellow-400 hover:text-black transition-colors disabled:opacity-50"><Plus size={14} /></button>
                    </div>
                 </div>

                 <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2.5rem] border dark:border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><CheckSquare size={16} className="text-yellow-400" /><h4 className="text-[10px] font-black uppercase text-zinc-900 dark:text-white italic tracking-[0.2em]">Subtarefas</h4></div>
                      {edited.subtasks && edited.subtasks.length > 0 && <span className="text-[9px] font-bold text-zinc-500">{Math.round((edited.subtasks.filter(t => t.completed).length / edited.subtasks.length) * 100)}%</span>}
                    </div>
                    {edited.subtasks && edited.subtasks.length > 0 && <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${(edited.subtasks.filter(t => t.completed).length / edited.subtasks.length) * 100}%` }} /></div>}
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                      {edited.subtasks && edited.subtasks.map(task => (
                        <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-lg transition-colors group">
                           <button onClick={() => handleToggleSubtask(task.id)} className={`shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-zinc-300'}`}>{task.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}</button>
                           <span className={`flex-1 text-[11px] font-medium italic ${task.completed ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>{task.text}</span>
                           <button onClick={() => handleDeleteSubtask(task.id)} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="text" placeholder="Adicionar subtarefa..." value={newSubtaskText} onChange={e => setNewSubtaskText(e.target.value)} className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border dark:border-zinc-700 text-[10px] font-bold outline-none" onKeyPress={e => e.key === 'Enter' && handleAddSubtask()} />
                      <button onClick={handleAddSubtask} className="p-3 bg-zinc-200 dark:bg-zinc-700 rounded-xl hover:bg-yellow-400 hover:text-black transition-colors"><Plus size={14} /></button>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-8 border-t dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end gap-3">
            <button onClick={onClose} className="px-8 py-4 bg-zinc-200 dark:bg-zinc-800 text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">Fechar</button>
        </div>
      </motion.div>
    </div>
  );
};

export default RoadmapPage;
