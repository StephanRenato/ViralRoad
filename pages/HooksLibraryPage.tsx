import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { User } from '../types';
import { Anchor, Loader2, Copy, CheckCircle2, Sparkles, X, Save, Trash2, Wand2, AlertTriangle, ArrowRight, Zap, Trophy, Target, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateHookSeedIdeas, generateHooksFromTopic } from '../services/geminiService';

interface HooksLibraryPageProps {
  user: User;
}

const HookSkeleton = () => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] space-y-6 animate-pulse">
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="w-16 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
        <div className="w-10 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
      </div>
      <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded w-full" />
      <div className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded w-4/5" />
    </div>
    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
      <div className="w-24 h-3 bg-zinc-50 dark:bg-zinc-800 rounded" />
      <div className="w-8 h-3 bg-zinc-50 dark:bg-zinc-800 rounded" />
    </div>
  </div>
);

const HooksLibraryPage: React.FC<HooksLibraryPageProps> = ({ user }) => {
  const [hooks, setHooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingSeeds, setGeneratingSeeds] = useState(false);
  const [generatingHooks, setGeneratingHooks] = useState(false);
  const [hookTopics, setHookTopics] = useState<string[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  
  // Estados de salvamento
  const [savingHooks, setSavingHooks] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  
  // Estado para armazenar hooks gerados antes de salvar
  const [previewHooks, setPreviewHooks] = useState<any[]>([]);
  const [viewState, setViewState] = useState<'topics' | 'preview'>('topics');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hookToDelete, setHookToDelete] = useState<any | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Carrega hooks do Supabase. Se silent=true, não mostra spinner de loading.
  async function loadHooks(silent = false) {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hooks_library")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Parse niche encoded score if present
      const processedHooks = (data || []).map(hook => {
        let niche = hook.niche || hook.category || 'Geral';
        let score = hook.viral_score || 85;

        // Fallback for schema without viral_score column: parse from niche string
        // Format: "NicheTag:::Score"
        if (typeof niche === 'string' && niche.includes(':::')) {
          const parts = niche.split(':::');
          niche = parts[0];
          score = parseInt(parts[1]) || 85;
        }

        return {
          ...hook,
          nicheDisplay: niche,
          calculatedScore: score
        };
      });

      setHooks(processedHooks);
    } catch (e) {
      console.error('Erro ao carregar hooks:', e);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadHooks();
    }
  }, [user.id]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAiSuggestions = async () => {
    setShowAiModal(true);
    setGeneratingSeeds(true);
    setHookTopics([]);
    setPreviewHooks([]);
    setViewState('topics');
    setSelectedTopic(null);
    setImportSuccess(false);
    try {
      const result = await generateHookSeedIdeas({
        profileType: user.profileType || 'Geral',
        specialization: user.specialization || 'Geral'
      });
      setHookTopics(result.topics || []);
    } catch (e) {
      console.error("Erro ao gerar temas:", e);
    } finally {
      setGeneratingSeeds(false);
    }
  };

  const handleSelectTopic = async (topic: string) => {
    setSelectedTopic(topic);
    setGeneratingHooks(true);
    try {
      const result = await generateHooksFromTopic({
        profileType: user.profileType || 'Geral',
        specialization: user.specialization || 'Geral',
        topic: topic
      });
      
      const generated = result.hooks || [];
      generated.sort((a: any, b: any) => b.viral_percentage - a.viral_percentage);
      
      setPreviewHooks(generated);
      setViewState('preview');

    } catch (e) {
      console.error("Erro ao gerar ganchos detalhados:", e);
    } finally {
      setGeneratingHooks(false);
    }
  };

  const handleSaveHooks = async () => {
    if (previewHooks.length === 0 || savingHooks || importSuccess) return;
    
    setSavingHooks(true);
    const { data: auth } = await supabase.auth.getUser();
    
    if (auth?.user) {
      // Encode score into niche field to avoid schema errors if column missing
      const payload = previewHooks.map(h => {
        // Sanitiza a tag para remover o delimitador se ele existir por acaso
        const rawNiche = h.niche_tag || user.profileType || 'Geral';
        const cleanNiche = rawNiche.replace(/:::/g, ' - ');
        const score = Math.round(Number(h.viral_percentage || 85));

        return {
          user_id: auth.user.id,
          content: h.content,
          // Format: "NicheTag:::Score"
          niche: `${cleanNiche}:::${score}`
        };
      });

      try {
        const { error: insertError } = await supabase.from("hooks_library").insert(payload);
        
        if (insertError) {
          console.error("Erro Supabase:", insertError);
          
          let errorMsg = "Falha desconhecida ao salvar.";
          if (typeof insertError === 'object' && insertError !== null) {
             // @ts-ignore
             errorMsg = insertError.message || insertError.details || JSON.stringify(insertError);
          } else {
             errorMsg = String(insertError);
          }

          if (errorMsg.includes('viral_score')) {
             alert("Atenção: Erro de estrutura no banco de dados (coluna viral_score). Contate o suporte.");
          } else {
             alert(`Erro ao salvar ganchos: ${errorMsg}`);
          }
          return;
        }

        // UPDATE OPTIMISTA: Adiciona imediatamente à lista local para feedback visual instantâneo
        const newOptimisticHooks = previewHooks.map((h, i) => ({
          id: `temp-${Date.now()}-${i}`,
          user_id: auth.user.id,
          content: h.content,
          nicheDisplay: h.niche_tag || user.profileType || 'Geral',
          calculatedScore: Math.round(Number(h.viral_percentage || 85)),
          created_at: new Date().toISOString()
        }));

        setHooks(prev => [...newOptimisticHooks, ...prev]);
        
        // Sucesso visual antes de fechar
        setImportSuccess(true);
        
        // Pequeno delay para mostrar o sucesso e fechar
        setTimeout(() => {
          setShowAiModal(false);
          setPreviewHooks([]);
          setImportSuccess(false);
          setViewState('topics'); // Reset view state
          
          // Opcional: Rola para o topo para mostrar os novos itens
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1500);
        
      } catch (err: any) {
        console.error("Erro inesperado:", err);
        const errMsg = err.message || JSON.stringify(err) || "Erro desconhecido";
        alert(`Erro inesperado: ${errMsg}`);
      } finally {
        setSavingHooks(false);
      }
    } else {
        alert("Usuário não autenticado. Faça login novamente.");
        setSavingHooks(false);
    }
  };

  async function handleConfirmDelete() {
    if (!hookToDelete) return;
    const hookId = hookToDelete.id;
    
    // Fecha o modal e inicia o loading no card
    setHookToDelete(null);
    setDeletingId(hookId);

    try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth?.user) {
            throw new Error("Usuário não autenticado.");
        }

        const { error } = await supabase
            .from("hooks_library")
            .delete()
            .eq("id", hookId)
            .eq("user_id", auth.user.id);

        if (error) {
            throw error;
        }

        // Sucesso: Remove o item da lista local
        setHooks((prev) => prev.filter((item) => item.id !== hookId));
    } catch (err: any) {
        console.error("Erro na deleção:", err);
        
        let errorMsg = "Não foi possível excluir o item.";
        if (typeof err === 'object' && err !== null) {
            errorMsg = err.message || err.details || JSON.stringify(err);
        } else {
            errorMsg = String(err);
        }
        alert(`Erro ao excluir: ${errorMsg}`);
    } finally {
        setDeletingId(null);
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700 max-w-[1200px] mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <motion.h1 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase text-zinc-900 dark:text-white flex items-center gap-4"
          >
            Road <span className="text-yellow-400">Hooks</span>
          </motion.h1>
          <p className="text-zinc-500 font-bold text-sm italic">Sua biblioteca de ganchos virais sincronizada com a Road Cloud.</p>
        </div>

        <button 
          onClick={handleOpenAiSuggestions}
          disabled={generatingSeeds || generatingHooks}
          className="bg-yellow-400 text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-yellow-400/20 hover:scale-105 transition-all flex items-center gap-2 group disabled:opacity-50"
        >
          {generatingSeeds || generatingHooks ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />} 
          Gerar Sugestões IA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <HookSkeleton key={i} />)
        ) : (
          <AnimatePresence mode="popLayout">
            {hooks.length > 0 ? hooks.map((hook) => {
              const score = hook.calculatedScore || 85;
              const isHighViral = score >= 90;

              return (
                <motion.div 
                  key={hook.id} 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, x: -20 }}
                  className={`bg-white dark:bg-zinc-900 border p-8 rounded-[2.5rem] space-y-6 relative group transition-all shadow-sm flex flex-col justify-between overflow-hidden ${isHighViral ? 'border-yellow-400/50 dark:border-yellow-400/30' : 'border-zinc-200 dark:border-zinc-800 hover:border-yellow-400/30'}`}
                >
                  {isHighViral && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-black px-4 py-1.5 rounded-bl-2xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg z-10">
                      <Trophy size={10} /> BEST PICK
                    </div>
                  )}

                  {deletingId === hook.id && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-2 text-center p-4">
                      <Loader2 className="animate-spin text-red-500 mb-2" size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500 italic">Expurgando Gancho...</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-zinc-200 dark:border-zinc-700 italic max-w-[70%] truncate">
                        {hook.nicheDisplay}
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => copyToClipboard(hook.content, hook.id)}
                          className="p-2 text-zinc-400 hover:text-yellow-400 transition-colors"
                        >
                          {copiedId === hook.id ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                        </button>
                        <button 
                          onClick={() => setHookToDelete(hook)}
                          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xl font-bold italic text-zinc-900 dark:text-white leading-tight">"{hook.content}"</p>
                  </div>
                  
                  {/* Footer com Barra de Viralização Visual */}
                  <div className="pt-4 mt-auto border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-zinc-400 italic">
                      <span className="flex items-center gap-1.5"><Anchor size={10} className={isHighViral ? "text-yellow-400" : "text-zinc-400"} /> Potencial Viral</span>
                      <span className={isHighViral ? "text-yellow-400" : "text-zinc-500"}>{score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`h-full rounded-full ${isHighViral ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="col-span-full py-32 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
                 <Wand2 size={32} className="mx-auto text-zinc-300 mb-4" />
                 <p className="text-zinc-500 font-black italic uppercase tracking-tighter text-xl">Sua biblioteca de ganchos está vazia</p>
                 <p className="text-xs font-bold text-zinc-600 mt-2 italic">Gere novas sugestões com IA para começar sua lista.</p>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {hookToDelete && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 w-full max-md rounded-[3rem] border border-zinc-200 dark:border-zinc-800 p-10 text-center space-y-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500/20" />
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl shadow-red-500/10 border border-red-500/20">
                <AlertTriangle size={36} />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-tight text-zinc-900 dark:text-white">Eliminar <span className="text-red-500">Gancho?</span></h3>
                <p className="text-zinc-500 font-bold text-sm italic leading-relaxed px-2">Remover este gancho da sua biblioteca pessoal?</p>
              </div>
              <div className="flex flex-col gap-3">
                <button onClick={handleConfirmDelete} className="w-full bg-red-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3"><Trash2 size={16} /> CONFIRMAR EXCLUSÃO</button>
                <button onClick={() => setHookToDelete(null)} className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]">CANCELAR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Geração IA */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 w-full max-w-4xl h-[85vh] rounded-[3rem] border border-zinc-800 shadow-2xl flex flex-col overflow-hidden relative"
            >
              <div className="p-8 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-400 text-black rounded-xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
                    <Sparkles size={20} className={generatingSeeds || generatingHooks ? "animate-spin" : ""} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase text-white italic tracking-tighter">Hook <span className="text-yellow-400">Generator</span></h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">Inteligência Road ativa para {user.profileType}</p>
                  </div>
                </div>
                <button onClick={() => setShowAiModal(false)} className="p-3 bg-zinc-800 text-zinc-400 rounded-full hover:text-white hover:bg-zinc-700 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 relative">
                 <AnimatePresence mode="wait">
                    {generatingSeeds ? (
                       <motion.div key="loading-seeds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center space-y-6">
                          <Loader2 size={48} className="text-yellow-400 animate-spin" />
                          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs italic">Analisando tendências virais...</p>
                       </motion.div>
                    ) : viewState === 'topics' ? (
                       <motion.div key="topics" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                          <div className="text-center space-y-2">
                             <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">Escolha um Tema Viral</h2>
                             <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Identificamos estes padrões de alta retenção para seu nicho hoje.</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {hookTopics.map((topic, i) => (
                                <button 
                                  key={i} 
                                  onClick={() => handleSelectTopic(topic)}
                                  className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-3xl text-left hover:border-yellow-400 hover:bg-zinc-800 transition-all group relative overflow-hidden"
                                >
                                   <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ArrowRight className="text-yellow-400" />
                                   </div>
                                   <span className="text-sm font-bold italic text-zinc-300 group-hover:text-white block pr-8">{topic}</span>
                                </button>
                             ))}
                          </div>
                       </motion.div>
                    ) : generatingHooks ? (
                        <motion.div key="loading-hooks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center space-y-6">
                          <Loader2 size={48} className="text-yellow-400 animate-spin" />
                          <p className="text-zinc-500 font-black uppercase tracking-[0.3em] text-xs italic">Calibrando ganchos magnéticos...</p>
                       </motion.div>
                    ) : (
                       <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                          <div className="flex items-center justify-between">
                             <button onClick={() => setViewState('topics')} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-2 transition-colors">
                                <ArrowRight size={14} className="rotate-180" /> Voltar aos Temas
                             </button>
                             <div className="px-4 py-1.5 bg-yellow-400/10 text-yellow-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-yellow-400/20 italic">
                                Tema: {selectedTopic}
                             </div>
                          </div>

                          <div className="space-y-4">
                             {previewHooks.map((hook, i) => (
                                <div key={i} className="bg-zinc-800/50 border border-zinc-700 p-6 rounded-3xl space-y-4">
                                   <div className="flex justify-between items-start">
                                      <p className="text-lg font-bold italic text-white pr-4">"{hook.content}"</p>
                                      <div className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${Number(hook.viral_percentage) >= 90 ? 'bg-green-500/20 text-green-500' : 'bg-zinc-700 text-zinc-400'}`}>
                                         {hook.viral_percentage}% Viral
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                                      <Zap size={12} className="text-yellow-400" />
                                      <span className="italic">{hook.explanation}</span>
                                   </div>
                                </div>
                             ))}
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              {viewState === 'preview' && !generatingHooks && (
                <div className="p-8 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur relative z-10 flex justify-between items-center">
                   <div className="text-zinc-500 text-[10px] font-bold italic uppercase tracking-widest hidden md:block">
                      {previewHooks.length} Ganchos gerados para importação
                   </div>
                   <button 
                      onClick={handleSaveHooks}
                      disabled={savingHooks || importSuccess}
                      className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all active:scale-95 ${
                        importSuccess 
                          ? 'bg-green-500 text-white cursor-default' 
                          : 'bg-yellow-400 text-black hover:bg-yellow-500 shadow-yellow-400/20'
                      }`}
                   >
                      {savingHooks ? <Loader2 className="animate-spin" size={16} /> : importSuccess ? <Check size={16} /> : <Save size={16} />}
                      {savingHooks ? 'IMPORTANDO...' : importSuccess ? 'IMPORTADO COM SUCESSO!' : 'IMPORTAR PARA BIBLIOTECA'}
                   </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HooksLibraryPage;