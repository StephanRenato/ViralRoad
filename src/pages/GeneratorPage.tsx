
// @ts-nocheck
import React, { useState, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, ArrowRight, Save, Target, Loader2, Sparkles, Briefcase, CheckCircle2, AlertTriangle, Check, ExternalLink, Clapperboard, Shuffle, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, ProfileType, Platform, Format, FunnelStage, TargetAudience, CommunicationMode
} from '../types';
import { 
  generateRoadStrategy
} from '../services/aiService';
import { supabase } from '../services/supabase';
import { FinalStrategySkeleton } from '../components/PerformancePlaceholders';

const SPECIALIZATION_SUGGESTIONS: Record<string, string[]> = {
  [ProfileType.Lawyer]: ['Civil', 'Imobiliário', 'Digital', 'Empresarial', 'Família', 'Trabalhista', 'Criminalista'],
  [ProfileType.Finance]: ['Investimentos', 'Milhas', 'Educação Financeira', 'Cripto', 'Day Trade'],
  [ProfileType.Fitness]: ['Musculação', 'Nutrição', 'Crossfit', 'Yoga', 'Emagrecimento'],
  [ProfileType.Beauty]: ['Skincare', 'Maquiagem', 'Estética', 'Sobrancelhas'],
  [ProfileType.Tech]: ['Dev Fullstack', 'IA', 'Cybersecurity', 'Gadgets'],
  [ProfileType.Sales]: ['Marketing de Afiliados', 'Dropshipping', 'Copywriting', 'Tráfego Pago'],
  [ProfileType.InfluencerGeneral]: ['Lifestyle', 'Produtividade', 'Vlog', 'UGC'],
};

const LoadingStatus = ({ messages }: { messages: string[] }) => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setIndex(prev => (prev + 1) % messages.length), 2500);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-10">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center text-yellow-400"
      >
        <Zap fill="currentColor" size={32} />
      </motion.div>
      <motion.p 
        key={index}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400 italic text-center"
      >
        {messages[index]}
      </motion.p>
    </div>
  );
};

const getPlaceholder = (profileType: ProfileType, specialization: string) => {
  const suggestions: Record<string, string> = {
    [ProfileType.Lawyer]: "Ex: 3 segredos jurídicos que ninguém te conta sobre...",
    [ProfileType.Finance]: "Ex: Como investir R$ 100 e ter retorno em...",
    [ProfileType.Fitness]: "Ex: O treino definitivo para secar em 30 dias...",
    [ProfileType.Beauty]: "Ex: Minha rotina matinal de skincare para pele...",
    [ProfileType.Tech]: "Ex: Como automatizar seu trabalho usando IA...",
    [ProfileType.Sales]: "Ex: O script de vendas que converte 80% dos...",
    [ProfileType.InfluencerGeneral]: "Ex: Um dia na minha vida como criador de...",
    [ProfileType.Comedy]: "Ex: Aquela situação engraçada que todo mundo...",
    [ProfileType.Fashion]: "Ex: 5 looks essenciais para o verão que...",
    [ProfileType.Travel]: "Ex: O destino secreto que você precisa visitar...",
    [ProfileType.Education]: "Ex: Aprenda inglês em 5 minutos por dia...",
    [ProfileType.Gastronomy]: "Ex: A receita de bolo de chocolate mais fácil...",
    [ProfileType.Gamer]: "Ex: Review sincero do novo jogo do ano...",
    [ProfileType.Parenting]: "Ex: Como lidar com a birra dos 2 anos...",
  };

  if (specialization && specialization !== 'Geral' && specialization !== 'Outro') {
    return `Ex: Como criar conteúdo viral de ${specialization} para ${profileType}...`;
  }

  return suggestions[profileType] || "Ex: 3 segredos para viralizar com reels...";
};

const GeneratorPage: React.FC<{ user: User, onRefreshUser: () => void }> = ({ user, onRefreshUser }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [roadStrategy, setRoadStrategy] = useState<any>(null);
  
  const [params, setParams] = useState({
    segment: '', // Objective
    platform: Platform.Instagram,
    profileType: user.profileType || ProfileType.InfluencerGeneral, // Niche
    specialization: user.specialization || 'Geral'
  });

  const isLimitReached = !user.isUnlimited && (user.usedBlueprints || 0) >= (user.monthlyLimit || 5);

  const handleRandomize = () => {
    const types = Object.values(ProfileType);
    const randomType = types[Math.floor(Math.random() * types.length)];
    const suggestions = SPECIALIZATION_SUGGESTIONS[randomType] || ['Geral'];
    const randomSpec = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    setParams({
      ...params,
      profileType: randomType,
      specialization: randomSpec,
      segment: getPlaceholder(randomType, randomSpec).replace('Ex: ', '')
    });
  };

  const handleGenerateRoadStrategy = async () => {
    if (!params.segment || !params.profileType) {
      setSaveError("Por favor, preencha o nicho e o objetivo antes de continuar.");
      return;
    }

    setLoading(true);
    setSaveError(null);
    
    try {
      const res = await generateRoadStrategy({
        niche: `${params.profileType} ${params.specialization}`,
        objective: params.segment,
        platform: params.platform
      });
      
      setRoadStrategy(res);
      setStep(4); // Go straight to result view
    } catch (e: any) {
      console.error("Erro na geração da estratégia:", e);
      setSaveError(e.message || "Falha na Engine Road. Tente novamente em instantes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoadStrategy = async () => {
    if (isSaving || saveSuccess) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sessão expirada. Faça login novamente.");

      const payload = {
        niche: `${params.profileType} ${params.specialization}`,
        objective: params.segment,
        platform: params.platform,
        strategy_json: roadStrategy
      };

      const response = await fetch('/api/db/road-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, payload })
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar estratégia no Supabase.");
      }

      setSaveSuccess(true);
      if (onRefreshUser) onRefreshUser();
      
      setTimeout(() => {
        navigate('/dashboard/library');
      }, 2000);

    } catch (e: any) {
      console.error("Erro no salvamento:", e);
      setSaveError(e.message || "Falha técnica ao salvar estratégia.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(String(text));
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const currentSuggestions = SPECIALIZATION_SUGGESTIONS[params.profileType] || ['Geral'];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-12 animate-in fade-in duration-300">
      <div className="space-y-2 text-center md:text-left flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h2 className="text-5xl font-black italic tracking-tighter uppercase text-zinc-900 dark:text-white">Road <span className="text-yellow-400">Gerador</span></h2>
           <p className="text-zinc-500 font-bold text-sm italic">Sua fábrica de conteúdo de alta performance.</p>
        </div>
        
        {step === 1 && (
          <button 
            onClick={handleRandomize}
            className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 text-black transition-all rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-yellow-400/20 group"
          >
            <Shuffle size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            Modo Explorador
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {saveSuccess ? (
          <motion.div 
            key="success" 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-12 rounded-[3.5rem] shadow-2xl text-center space-y-8 py-24 relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-green-500/5 blur-3xl pointer-events-none" />
             <div className="w-24 h-24 bg-green-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20 relative z-10">
                <Check size={48} strokeWidth={3} />
             </div>
             <div className="space-y-3 relative z-10">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Estratégia <span className="text-green-500">Salva!</span></h3>
                <p className="text-zinc-500 font-bold text-sm italic uppercase tracking-widest">Sincronizado com o seu Acervo Cloud...</p>
             </div>
             <div className="flex flex-col items-center gap-2 pt-4">
                <Loader2 className="animate-spin text-green-500" size={24} />
                <span className="text-[10px] font-black uppercase text-zinc-400 italic">Redirecionando para a biblioteca</span>
             </div>
          </motion.div>
        ) : step === 1 ? (
          <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10">
            
            {saveError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex items-center gap-3">
                <AlertTriangle className="text-red-500" size={20} />
                <p className="text-[10px] font-black uppercase text-red-500 tracking-widest italic">{String(saveError)}</p>
              </motion.div>
            )}

            {isLimitReached && (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-500" size={20} />
                  <p className="text-[10px] font-black uppercase text-red-500 tracking-widest italic">Limite mensal atingido ({user.usedBlueprints || 0}/{user.monthlyLimit || 5})</p>
                </div>
                <button 
                  onClick={() => navigate('/dashboard/profile')}
                  className="bg-red-500 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-all flex items-center gap-2"
                >
                  UPGRADE AGORA <ExternalLink size={12} />
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 rounded-[3.5rem] shadow-2xl space-y-10">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic flex items-center gap-2"><Briefcase size={12} className="text-yellow-400" /> Nicho</label>
                  <select className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl border-none text-[11px] font-black uppercase italic outline-none" value={params.profileType} onChange={e => setParams({...params, profileType: e.target.value as ProfileType, specialization: 'Geral'})}>
                    {Object.values(ProfileType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic flex items-center gap-2"><Target size={12} className="text-yellow-400" /> Especialidade</label>
                  <select className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl border-none text-[11px] font-black uppercase italic outline-none" value={params.specialization} onChange={e => setParams({...params, specialization: e.target.value})}>
                    {currentSuggestions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4 animate-in fade-in">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Qual seu objetivo principal?</label>
                <textarea 
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-none p-8 rounded-[2.5rem] text-xl font-bold italic outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all min-h-[120px] resize-none" 
                  placeholder="Ex: Aumentar seguidores com conteúdo de valor..." 
                  value={params.segment} 
                  onChange={e => setParams({...params, segment: e.target.value})} 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">Plataforma</label>
                <select className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl border-none text-[11px] font-black uppercase italic outline-none" value={params.platform} onChange={e => setParams({...params, platform: e.target.value as Platform})}>
                  {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <button 
                onClick={handleGenerateRoadStrategy} 
                disabled={loading || !params.segment || isLimitReached} 
                className={`w-full py-7 rounded-[2.2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${isLimitReached ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-black shadow-yellow-400/20'}`}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {isLimitReached ? 'LIMITE ATINGIDO' : loading ? 'ROAD ANALISANDO...' : 'INICIAR ESTRATÉGIA ROAD'}
              </button>
            </div>
          </motion.div>
        ) : step === 4 ? (
          <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            {loading || !roadStrategy ? (
              <div className="animate-in fade-in duration-500">
                <LoadingStatus messages={["Mapeando pilares estratégicos...", "Criando hooks magnéticos...", "Redigindo roteiro de alta performance..."]} />
                <FinalStrategySkeleton />
              </div>
            ) : (
              <div className="space-y-6">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[4rem] overflow-hidden shadow-2xl relative">
                  <div className="p-10 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-1">Estratégia <span className="text-yellow-400">Road</span></h3>
                      <p className="text-[10px] font-black uppercase text-zinc-400 italic tracking-widest">Estratégia completa gerada por IA.</p>
                    </div>
                    <button 
                      onClick={handleSaveRoadStrategy} 
                      disabled={isSaving || saveSuccess} 
                      className={`min-w-[200px] px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
                        isSaving 
                        ? 'bg-zinc-800 text-yellow-400 cursor-wait' 
                        : saveSuccess 
                          ? 'bg-green-500 text-white' 
                          : 'bg-yellow-400 text-black hover:bg-yellow-500'
                      }`}
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={16} /> : saveSuccess ? <CheckCircle2 size={16} /> : <Save size={16} />}
                      {isSaving ? 'SALVANDO...' : saveSuccess ? 'SALVO!' : 'SALVAR ESTRATÉGIA'}
                    </button>
                  </div>

                  <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-yellow-400 tracking-[0.3em] italic">Pilares de Conteúdo</h4>
                        <div className="space-y-2">
                          {roadStrategy.content_pillars?.map((p: string, i: number) => (
                            <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl text-sm font-bold italic border dark:border-zinc-800">
                              {p}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-yellow-400 tracking-[0.3em] italic">Hooks Virais</h4>
                        <div className="space-y-2">
                          {roadStrategy.viral_hooks?.map((h: string, i: number) => (
                            <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl text-sm font-bold italic border dark:border-zinc-800 flex justify-between items-center group">
                              <span>"{h}"</span>
                              <button onClick={() => copyToClipboard(h, `hook-${i}`)} className="text-zinc-500 hover:text-yellow-400 transition-colors">
                                {copiedSection === `hook-${i}` ? <Check size={14} /> : <Sparkles size={14} />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-yellow-400 tracking-[0.3em] italic">Ideias de Posts</h4>
                        <div className="space-y-2">
                          {roadStrategy.post_ideas?.map((idea: string, i: number) => (
                            <div key={i} className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl text-sm font-bold italic border dark:border-zinc-800">
                              {idea}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-yellow-400 tracking-[0.3em] italic">Configurações Ideais</h4>
                        <div className="bg-zinc-950 text-white p-6 rounded-2xl space-y-4">
                          <div>
                            <span className="text-[9px] font-black uppercase text-zinc-500 block">Frequência</span>
                            <span className="text-sm font-bold italic text-yellow-400">{roadStrategy.posting_frequency}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-zinc-500 block">Melhor Formato</span>
                            <span className="text-sm font-bold italic text-yellow-400">{roadStrategy.best_format}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase text-yellow-400 tracking-[0.3em] italic">Roteiro de Vídeo</h4>
                        <button onClick={() => copyToClipboard(roadStrategy.video_script, 'script')} className="text-zinc-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest border dark:border-zinc-800 px-3 py-1 rounded-lg">
                          {copiedSection === 'script' ? 'COPIADO' : 'COPIAR'}
                        </button>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-[2.5rem] text-sm font-bold italic leading-relaxed whitespace-pre-wrap border dark:border-zinc-800 shadow-inner">
                        {roadStrategy.video_script}
                      </div>
                    </div>
                  </div>
                </motion.div>
                <div className="flex justify-center">
                   <button onClick={() => setStep(1)} className="text-yellow-400 font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 hover:underline">GERAR NOVA ESTRATÉGIA</button>
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default GeneratorPage;
