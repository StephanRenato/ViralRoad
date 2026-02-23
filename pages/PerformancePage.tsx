
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Platform, AnalysisResult, SocialProfile, NormalizedMetrics } from '../types';
import { 
  Instagram, Youtube, Music2, Zap, BarChart3, TrendingUp, RefreshCw, Plus, 
  Clock, Target, Hash, Loader2, CheckCircle2, ExternalLink, Sparkles, 
  Crosshair, Users, Heart, Search, ChevronDown, 
  AlertCircle, BrainCircuit, Megaphone, Lightbulb, Stethoscope, Clapperboard, Lock,
  WifiOff, Eye, Trophy, UserPlus, AlertTriangle, Layers, FileText, Calendar, Check, Wand2, Microscope, Terminal, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeSocialStrategy, auditUserProfile } from '../services/geminiService';
import { 
  fetchTikTokProfileData, 
  fetchInstagramProfileData, 
  fetchYouTubeProfileData, 
  fetchKwaiProfileData,
  getMockProfileData
} from '../services/apifyService';
import { normalizeProfile } from '../services/normalize';
import { roadScore } from '../services/roadScore';
import { supabase } from '../services/supabase';
import { PlatformTab } from '../components/PerformancePlaceholders';

const LOADING_TIPS = [
  "⚡ Modo Ultra Speed Ativado: Servidores dedicados alocados.",
  "🚀 Conexão direta com APIs de dados em alta velocidade...",
  "💡 O algoritmo prioriza 'Save' e 'Share' mais do que 'Likes'.",
  "💡 Reels com 7 segundos tendem a ter 20% mais retenção.",
  "⚡ Cruzando métricas de engajamento com padrões neurais..."
];

async function analisarPerfil({ platform, url }: { platform: string, url: string }) {
  const platformId = platform.toLowerCase();
  try {
      if (platformId === 'instagram') return (await fetchInstagramProfileData(url)).raw;
      if (platformId === 'tiktok') return (await fetchTikTokProfileData(url)).raw;
      if (platformId === 'youtube') return (await fetchYouTubeProfileData(url)).raw;
      if (platformId === 'kwai') return (await fetchKwaiProfileData(url)).raw;
      return getMockProfileData(platformId, { url });
  } catch (error) {
      return getMockProfileData(platformId, { url });
  }
}

const parseFrequencyPattern = (text: string | undefined): boolean[] => {
    if (!text) return [true, false, true, false, true, false, false];
    const t = text.toLowerCase();
    if (t.includes('diari') || t.includes('todo dia')) return [true, true, true, true, true, true, true];
    if (t.includes('util') || t.includes('semana')) return [true, true, true, true, true, false, false];
    return [true, false, true, false, true, false, false];
};

const PerformancePage: React.FC<{ user: User, onRefreshUser: () => void }> = ({ user, onRefreshUser }) => {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState<string>(Platform.Instagram);
  const [analyzingPlatform, setAnalyzingPlatform] = useState<string | null>(null);
  const [addingUrl, setAddingUrl] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [objective, setObjective] = useState('Aumentar Seguidores');
  const [auditResult, setAuditResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [localProfiles, setLocalProfiles] = useState<SocialProfile[]>(user.socialProfiles || []);

  useEffect(() => {
    if (analyzingPlatform) {
        const interval = setInterval(() => setCurrentTip(prev => (prev + 1) % LOADING_TIPS.length), 3000);
        return () => clearInterval(interval);
    }
  }, [analyzingPlatform]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `> ${new Date().toLocaleTimeString()} | ${msg}`]);
  };

  const handleConnect = async (urlOverride?: string) => {
    const urlToUse = urlOverride || newUrl;
    if (!urlToUse) return;

    setAddingUrl(true);
    setAnalyzingPlatform(activePlatform);
    setLogs([]);
    setProgress(0);
    setAuditResult(null);

    addLog(`Iniciando Road Performance Engine v3.0...`);
    setProgress(10);

    try {
      const platformKey = activePlatform.toLowerCase();
      addLog(`Conectando ao gateway social: ${activePlatform}...`);
      
      const rawResponse = await analisarPerfil({ platform: activePlatform, url: urlToUse });
      setProgress(40);
      addLog(`Dados brutos extraídos. Normalizando métricas...`);

      const normalized = normalizeProfile(rawResponse, platformKey);
      const score = roadScore(normalized);
      setProgress(70);
      addLog(`Enviando contexto neural para Gemini AI...`);

      const aiRes = await analyzeSocialStrategy({
        profiles: [{ id: activePlatform }],
        niche: user.profileType,
        specialization: user.specialization,
        realMetrics: { ...normalized, engagement_rate: normalized.engagement, handle: normalized.username },
        objective,
        recentPosts: "Análise de perfil em tempo real."
      });

      const auditRes = await auditUserProfile({
        name: normalized.username,
        niche: user.profileType,
        specialization: user.specialization
      });
      setAuditResult(auditRes);

      setProgress(100);
      addLog(`Relatório gerado com sucesso.`);

      const analysisRaw = aiRes.results?.[0]?.analysis || {};
      const newProfile: SocialProfile = {
        platform: activePlatform,
        url: urlToUse,
        username: normalized.username,
        objective,
        normalized_metrics: { ...normalized, engagement_rate: normalized.engagement, handle: normalized.username },
        analysis_ai: {
          ...analysisRaw,
          viral_score: analysisRaw.viral_score || score.score,
          diagnostic: { ...analysisRaw.diagnostic, status_label: score.insight }
        },
        raw_apify_data: rawResponse,
        last_sync: new Date().toISOString()
      };

      const updated = [...localProfiles.filter(p => p.platform !== activePlatform), newProfile];
      setLocalProfiles(updated);
      
      // 1. Tenta salvar no banco de dados
      const { error: dbError } = await supabase.from('profiles').upsert({ 
        id: user.id,
        social_profiles: updated
      }, { onConflict: 'id' });
      
      if (dbError) {
        console.warn("Falha ao salvar performance no banco, usando metadata...", dbError);
        // 2. Fallback para Metadata do Auth
        const { error: authError } = await supabase.auth.updateUser({
          data: { social_profiles: updated }
        });
        if (authError) throw authError;
      }
      
      onRefreshUser();

    } catch (e: any) {
      setUrlError(e.message || "Erro na análise.");
    } finally {
      setAddingUrl(false);
      setAnalyzingPlatform(null);
    }
  };

  const currentProfile = localProfiles.find(p => p.platform === activePlatform);
  const analysis = currentProfile?.analysis_ai;
  const stats = currentProfile?.normalized_metrics;

  return (
    <div className="p-4 md:p-10 space-y-10 animate-in fade-in duration-500 pb-32 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white leading-none">Road <span className="text-yellow-400">Performance</span></h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] italic mt-2">Diagnóstico tático baseado em dados reais.</p>
        </div>
        {currentProfile && (
            <button onClick={() => handleConnect(currentProfile.url)} disabled={!!analyzingPlatform} className="px-6 py-3 bg-yellow-400 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 group">
                <RefreshCw size={14} className={analyzingPlatform === activePlatform ? "animate-spin" : "group-hover:rotate-180 transition-transform"} /> ATUALIZAR AUDITORIA
            </button>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {[Platform.Instagram, Platform.TikTok, Platform.YouTube, Platform.Kwai].map(p => (
            <PlatformTab key={p} id={p} label={p} icon={p === Platform.Instagram ? Instagram : p === Platform.TikTok ? Music2 : p === Platform.YouTube ? Youtube : Zap} isActive={activePlatform === p} onClick={() => setActivePlatform(p)} hasData={localProfiles.some(lp => lp.platform === p)} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {analyzingPlatform === activePlatform ? (
            <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[500px] flex flex-col justify-center bg-zinc-950 rounded-[3rem] border border-zinc-800 p-8 md:p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-yellow-400/5 blur-[120px] pointer-events-none" />
                <div className="relative z-10 max-w-2xl mx-auto w-full space-y-10">
                   <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
                         <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400 italic">Road Engine v3.0 Active</span>
                      </div>
                      <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">Analisando <span className="text-yellow-400">{activePlatform}</span></h3>
                   </div>
                   <div className="bg-black/60 border border-zinc-800 rounded-2xl p-6 font-mono text-[10px] text-green-500 h-48 overflow-y-auto custom-scrollbar flex flex-col-reverse shadow-inner">
                      {logs.slice().reverse().map((log, i) => <div key={i} className="opacity-80">{log}</div>)}
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest"><span>Extraindo Inteligência...</span><span>{progress}%</span></div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden"><motion.div className="h-full bg-yellow-400" initial={{ width: 0 }} animate={{ width: `${progress}%` }} /></div>
                   </div>
                   <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl text-center"><p className="text-[11px] font-bold text-zinc-400 italic">"{LOADING_TIPS[currentTip]}"</p></div>
                </div>
            </motion.div>
        ) : !currentProfile ? (
          <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
             <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-[2.5rem] flex items-center justify-center mx-auto text-zinc-400"><BarChart3 size={40} /></div>
             <div className="space-y-4 max-w-md mx-auto">
                <h3 className="text-3xl font-black italic uppercase text-zinc-900 dark:text-white">Relatório <span className="text-yellow-400">Social</span></h3>
                <p className="text-zinc-500 text-xs font-bold italic uppercase tracking-widest">Conecte seu link para desbloquear a auditoria neural da Viral Road.</p>
                <div className="space-y-4 pt-4">
                    <input type="text" placeholder="Cole seu link (ex: instagram.com/usuario)" value={newUrl} onChange={e => setNewUrl(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl text-center text-sm font-bold italic outline-none focus:border-yellow-400 transition-all" />
                    <button onClick={() => handleConnect()} disabled={!newUrl || addingUrl} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                        {addingUrl ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />} INICIAR ANÁLISE DE PERFORMANCE
                    </button>
                </div>
             </div>
          </motion.div>
        ) : !analysis ? (
          <motion.div key="needs-analysis" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
             <div className="w-24 h-24 bg-yellow-400/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-yellow-400"><Microscope size={40} /></div>
             <div className="space-y-4 max-w-md mx-auto">
                <h3 className="text-3xl font-black italic uppercase text-zinc-900 dark:text-white">Perfil <span className="text-yellow-400">Conectado</span></h3>
                <p className="text-zinc-500 text-xs font-bold italic uppercase tracking-widest">Seu perfil @{currentProfile.username} foi vinculado, mas ainda não foi auditado pela IA.</p>
                <div className="pt-4">
                    <button onClick={() => handleConnect(currentProfile.url)} disabled={addingUrl} className="w-full bg-yellow-400 text-black py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-2">
                        {addingUrl ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />} EXECUTAR AUDITORIA NEURAL
                    </button>
                </div>
             </div>
          </motion.div>
        ) : (
          <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
             {/* Bento Grid Performance */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
                   <div className="w-40 h-40 relative flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                         <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                         <motion.circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={439.8} strokeDashoffset={439.8 - (439.8 * (analysis?.viral_score || 0)) / 100} initial={{ strokeDashoffset: 439.8 }} animate={{ strokeDashoffset: 439.8 - (439.8 * (analysis?.viral_score || 0)) / 100 }} transition={{ duration: 1.5 }} className="text-yellow-400" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-4xl font-black italic text-zinc-900 dark:text-white leading-none">{analysis?.viral_score}</span>
                         <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mt-1">Score Viral</span>
                      </div>
                   </div>
                   <div className="flex-1 space-y-6 text-center md:text-left">
                      <div>
                         <h3 className="text-2xl font-black italic uppercase text-zinc-900 dark:text-white">Status: <span className="text-yellow-400">{analysis?.diagnostic?.status_label}</span></h3>
                         <p className="text-zinc-500 font-bold text-xs italic mt-1 leading-relaxed">Seu perfil está sendo processado em tempo real pelo algoritmo ROAD.</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-t dark:border-zinc-800 pt-6">
                         <div><span className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Seguidores</span><span className="text-lg font-black italic text-zinc-900 dark:text-white">{(stats?.followers || 0).toLocaleString()}</span></div>
                         <div><span className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Engajamento</span><span className="text-lg font-black italic text-green-500">{stats?.engagement_rate}%</span></div>
                         <div><span className="text-[8px] font-black uppercase text-zinc-400 block mb-1">Posts</span><span className="text-lg font-black italic text-zinc-900 dark:text-white">{stats?.posts}</span></div>
                      </div>
                   </div>
                </div>

                <div className="bg-zinc-900 text-white p-8 rounded-[3rem] shadow-xl border border-zinc-800 space-y-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3"><div className="p-2 bg-yellow-400 rounded-xl text-black"><Target size={18} /></div><h4 className="text-sm font-black uppercase italic tracking-widest">Estratégia Neural</h4></div>
                    <div className="space-y-4">
                        <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50"><span className="text-[8px] font-black uppercase text-yellow-500 block mb-1">Melhor Formato</span><p className="text-xs font-bold italic text-white uppercase">{analysis?.best_format}</p></div>
                        <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50"><span className="text-[8px] font-black uppercase text-blue-400 block mb-1">Frequência Recomendada</span><p className="text-xs font-bold italic text-white uppercase">{analysis?.frequency_suggestion}</p></div>
                    </div>
                </div>
             </div>

             {/* Tactical Diagnostic Section */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 bg-gradient-to-br from-yellow-400 to-yellow-500 p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-black relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-[60px] pointer-events-none" />
                   <div className="flex items-center gap-3"><div className="p-2 bg-black text-yellow-400 rounded-xl"><Lightbulb size={20} /></div><h3 className="text-xl font-black italic uppercase tracking-tighter">Ação Imediata (Tático)</h3></div>
                   <p className="text-2xl font-black italic uppercase leading-tight drop-shadow-sm">"{analysis?.diagnostic?.key_action_item}"</p>
                   <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl flex items-center gap-2">EXECUTAR AGORA <ArrowRight size={14} /></button>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-lg space-y-4">
                   <div className="flex items-center gap-2 text-purple-500 mb-2"><Megaphone size={18} /><h4 className="text-[10px] font-black uppercase tracking-[0.2em] italic">Auditoria de Tom</h4></div>
                   <p className="text-xs font-bold italic text-zinc-700 dark:text-zinc-300 leading-relaxed">"{analysis?.diagnostic?.tone_audit}"</p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-lg space-y-4">
                   <div className="flex items-center gap-2 text-blue-500 mb-2"><BrainCircuit size={18} /><h4 className="text-[10px] font-black uppercase tracking-[0.2em] italic">Linha Editorial</h4></div>
                   <p className="text-xs font-bold italic text-zinc-700 dark:text-zinc-300 leading-relaxed">"{analysis?.diagnostic?.content_strategy_advice}"</p>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {auditResult && (
                  <div className="bg-zinc-100/50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] space-y-6">
                     <div className="flex items-center gap-3"><div className="p-2 bg-yellow-400/10 text-yellow-500 rounded-xl"><Stethoscope size={18} /></div><h4 className="text-sm font-black uppercase italic tracking-widest">Market Fit Analysis</h4></div>
                     <div><span className="text-[10px] font-bold italic text-zinc-500">Veredito: {auditResult.market_status}</span><p className="text-sm font-bold italic text-zinc-800 dark:text-zinc-200 mt-2">"{auditResult.verdict}"</p></div>
                     <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border dark:border-zinc-700"><span className="text-[9px] font-black uppercase text-yellow-500 block mb-2">Tática de Diferenciação</span><p className="text-[11px] font-medium italic text-zinc-600 dark:text-zinc-400">{auditResult.tip}</p></div>
                  </div>
                )}

                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2.5rem] shadow-lg space-y-6">
                   <div className="flex items-center gap-3"><div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl"><Hash size={18} /></div><h4 className="text-sm font-black uppercase italic tracking-widest">Pilares de Conteúdo</h4></div>
                   <div className="flex flex-wrap gap-2">
                       {analysis?.content_pillars?.map((p, i) => <span key={i} className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest italic">{p}</span>)}
                   </div>
                </div>
             </div>

             {analysis?.next_post_recommendation && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-950 border border-zinc-800 rounded-[3.5rem] p-10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 blur-[100px] pointer-events-none" />
                  <div className="flex flex-col lg:flex-row gap-10 items-center">
                     <div className="w-24 h-24 bg-yellow-400 rounded-[2rem] flex items-center justify-center text-black shrink-0 shadow-2xl shadow-yellow-400/20"><Clapperboard size={48} fill="currentColor" /></div>
                     <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2"><Sparkles size={14} className="text-yellow-400 animate-pulse" /><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400 italic">RECOMENDAÇÃO DE ALTA PERFORMANCE</h4></div>
                        <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">Próximo Conteúdo: <span className="text-yellow-400">{analysis.next_post_recommendation.format}</span></h3>
                        <p className="text-lg font-bold italic text-zinc-400 leading-tight">"{analysis.next_post_recommendation.topic}"</p>
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl"><span className="text-[9px] font-black uppercase text-zinc-500 block mb-1">Por que postar isso agora?</span><p className="text-xs font-bold italic text-zinc-300">{analysis.next_post_recommendation.reason}</p></div>
                     </div>
                     <button onClick={() => {
                        localStorage.setItem('road_generator_params', JSON.stringify({ segment: analysis.next_post_recommendation.topic, format: analysis.next_post_recommendation.format }));
                        navigate('/dashboard');
                     }} className="px-10 py-6 bg-yellow-400 text-black rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95 flex items-center gap-3">GERAR ROTEIRO AGORA <Wand2 size={16} /></button>
                  </div>
               </motion.div>
             )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PerformancePage;
