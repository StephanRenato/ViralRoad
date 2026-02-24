
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
  generateNarratives, generateHeadlines, generateFinalStrategy
} from '../services/geminiService';
import { supabase } from '../services/supabase';
import { NarrativeSkeleton, FinalStrategySkeleton } from '../components/PerformancePlaceholders';

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
  
  const [params, setParams] = useState({
    segment: '',
    platform: Platform.Instagram,
    format: Format.Reels,
    funnel: FunnelStage.Top,
    targetAudience: TargetAudience.NewFollowers,
    communicationMode: CommunicationMode.Light,
    profileType: user.profileType || ProfileType.InfluencerGeneral,
    specialization: user.specialization || 'Geral'
  });

  // Restore state from LocalStorage on mount
  useEffect(() => {
    const savedParams = localStorage.getItem('road_generator_params');
    if (savedParams) {
      try {
        const parsed = JSON.parse(savedParams);
        setParams(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Erro ao restaurar rascunho:", e);
      }
    }
  }, []);

  // Sync with user profile changes
  useEffect(() => {
    if (user) {
      setParams(prev => ({
        ...prev,
        profileType: user.profileType || prev.profileType,
        specialization: user.specialization || prev.specialization
      }));
    }
  }, [user.profileType, user.specialization]);

  // Save state to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('road_generator_params', JSON.stringify(params));
  }, [params]);

  const [narratives, setNarratives] = useState<any>(null);
  const [headlines, setHeadlines] = useState<any>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<string>('');
  const [finalStrategy, setFinalStrategy] = useState<any>(null);

  const isAdmin = user.email?.toLowerCase() === 'stephan_renato@hotmail.com';
  const isUnlimited = isAdmin || (user.monthlyLimit || 0) >= 999999;
  const isLimitReached = !isUnlimited && (user.usedBlueprints || 0) >= (user.monthlyLimit || 5);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(String(text));
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleRandomize = () => {
    const types = Object.values(ProfileType);
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    const specs = SPECIALIZATION_SUGGESTIONS[randomType] || ['Geral'];
    const randomSpec = specs[Math.floor(Math.random() * specs.length)];
    
    const platforms = Object.values(Platform);
    const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
    
    const formats = Object.values(Format);
    const randomFormat = formats[Math.floor(Math.random() * formats.length)];

    const funnels = Object.values(FunnelStage);
    const randomFunnel = funnels[Math.floor(Math.random() * funnels.length)];

    const contextTopics: Record<string, string[]> = {
      [ProfileType.Lawyer]: ["Direitos do consumidor desconhecidos", "O que fazer em caso de prisão", "Como blindar patrimônio", "Erros em contratos", "Divórcio rápido"],
      [ProfileType.Fitness]: ["Perder gordura localizada", "Erro número 1 no treino", "Dieta flexível funciona?", "Suplementos inúteis", "Como ganhar massa rápido"],
      [ProfileType.Finance]: ["3 Ações baratas", "Viajar com milhas", "Onde investir 100 reais", "Day Trade x Buy and Hold", "Sair das dívidas"],
      [ProfileType.Beauty]: ["Rotina de skincare barata", "Make que dura o dia todo", "Tratamento para manchas", "Tendências de estética", "Cabelo saudável em casa"],
      [ProfileType.Tech]: ["Melhor celular custo benefício", "Inteligência Artificial no trabalho", "Dicas de segurança digital", "Como virar programador", "Setup gamer barato"],
      [ProfileType.Gastronomy]: ["Receita em 15 minutos", "Segredo do molho perfeito", "Como economizar no mercado", "Sobremesa fácil", "Técnica de corte profissional"],
      "default": ["3 Segredos que ninguém te conta", "Como ter resultados rápidos", "O maior erro dos iniciantes", "Guia definitivo para começar", "Verdade polêmica sobre o nicho"]
    };

    const specificTopics = contextTopics[randomType] || contextTopics["default"];
    const randomTopic = specificTopics[Math.floor(Math.random() * specificTopics.length)];

    setParams({
      profileType: randomType,
      specialization: randomSpec,
      platform: randomPlatform,
      format: randomFormat,
      funnel: randomFunnel,
      targetAudience: TargetAudience.NewFollowers,
      communicationMode: CommunicationMode.Provocative, 
      segment: randomTopic
    });
  };

  const handleGenerateNarratives = async () => {
    if (!params.segment) return;
    if (isLimitReached) {
      setSaveError("Você atingiu seu limite de blueprints mensais. Faça upgrade para continuar gerando.");
      return;
    }

    setLoading(true);
    setStep(2); 
    try {
      const res = await generateNarratives({ ...params });
      setNarratives(res);
    } catch (e: any) {
      console.error(e);
      setSaveError(e.message || "Falha na Engine Road.");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHeadlines = async (narrative: any) => {
    setLoading(true);
    setStep(3);
    try {
      const res = await generateHeadlines({ 
        narrative: String(narrative.description), 
        platform: params.platform, 
        targetAudience: params.targetAudience 
      });
      setHeadlines(res);
    } catch (e: any) {
      console.error(e);
      setSaveError(e.message || "Erro ao gerar ganchos.");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFinalStrategy = async (headline: string) => {
    setSelectedHeadline(String(headline));
    setLoading(true);
    setStep(4);
    try {
      const res = await generateFinalStrategy({ ...params, headline });
      setFinalStrategy(res);
    } catch (e: any) {
      console.error(e);
      setSaveError(e.message || "Erro ao gerar blueprint final.");
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToAcervo = async () => {
    if (isSaving || saveSuccess) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Sessão expirada. Faça login novamente.");

      if (!isUnlimited) {
        const { data: canGenerate } = await supabase.rpc("can_user_generate_blueprint", { p_user_id: authUser.id });
        if (canGenerate === false) throw new Error("Limite atingido. Faça upgrade para continuar.");
      }

      const { error: insertError } = await supabase.from("content_blueprints").insert({
        user_id: authUser.id,
        title: String(selectedHeadline || "Estratégia Viral Road"),
        blueprint_type: 'road',
        script: String(finalStrategy.script || ''),
        caption: String(finalStrategy.caption || ''),
        hashtags: String(finalStrategy.hashtags || ''),
        niche: String(params.profileType),
        sub_niche: String(params.specialization),
        funnel_stage: String(params.funnel),
        platform: String(params.platform),
        format: String(params.format),
        status: 'ideia',
        created_at: new Date().toISOString()
      });

      if (insertError) throw insertError;

      if (!isUnlimited) {
        const { data: usageData } = await supabase
          .from('usage_limits')
          .select('used_this_month')
          .eq('user_id', authUser.id)
          .single();
        
        const newUsedCount = (usageData?.used_this_month || 0) + 1;
        
        await supabase
          .from('usage_limits')
          .upsert({ 
            user_id: authUser.id, 
            used_this_month: newUsedCount
          }, { onConflict: 'id' });
      }

      if (onRefreshUser) await onRefreshUser();
      
      localStorage.removeItem('road_generator_params');
      setSaveSuccess(true);
      
      setTimeout(() => {
        navigate('/dashboard/library');
      }, 2000);

    } catch (e: any) {
      console.error("Erro no salvamento:", e);
      setSaveError(e.message || "Falha técnica ao salvar no acervo.");
    } finally {
      setIsSaving(false);
    }
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
                <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Blueprint <span className="text-green-500">Salvo!</span></h3>
                <p className="text-zinc-500 font-bold text-sm italic uppercase tracking-widest">Sincronizado com o seu Acervo Cloud...</p>
             </div>
             <div className="flex flex-col items-center gap-2 pt-4">
                <Loader2 className="animate-spin text-green-500" size={24} />
                <span className="text-[10px] font-black uppercase text-zinc-400 italic">Redirecionando para a biblioteca</span>
             </div>
          </motion.div>
        ) : step === 1 ? (
          <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10">
            
            {isLimitReached && (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-500" size={20} />
                  <p className="text-[10px] font-black uppercase text-red-500 tracking-widest italic">Limite mensal atingido ({user.usedBlueprints}/{user.monthlyLimit})</p>
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
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">O que você quer criar hoje?</label>
                <textarea 
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border-none p-8 rounded-[2.5rem] text-xl font-bold italic outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all min-h-[160px] resize-none" 
                  placeholder={getPlaceholder(params.profileType, params.specialization)} 
                  value={params.segment} 
                  onChange={e => setParams({...params, segment: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">Plataforma</label>
                  <select className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl border-none text-[11px] font-black uppercase italic outline-none" value={params.platform} onChange={e => setParams({...params, platform: e.target.value as Platform})}>
                    {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic flex items-center gap-1.5"><Clapperboard size={10} className="text-yellow-400" /> Formato</label>
                  <select className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl border-none text-[11px] font-black uppercase italic outline-none" value={params.format} onChange={e => setParams({...params, format: e.target.value as Format})}>
                    {Object.values(Format).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">Etapa do Funil</label>
                  <select className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl border-none text-[11px] font-black uppercase italic outline-none" value={params.funnel} onChange={e => setParams({...params, funnel: e.target.value as FunnelStage})}>
                    {Object.values(FunnelStage).map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleGenerateNarratives} 
                disabled={loading || !params.segment || isLimitReached} 
                className={`w-full py-7 rounded-[2.2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${isLimitReached ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-black shadow-yellow-400/20'}`}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {isLimitReached ? 'LIMITE ATINGIDO' : loading ? 'ROAD ANALISANDO...' : 'INICIAR ESTRATÉGIA ROAD'}
              </button>
            </div>
          </motion.div>
        ) : step === 2 ? (
          <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
            {loading || !narratives ? (
              <div className="animate-in fade-in duration-500">
                <LoadingStatus messages={["Mapeando tendências...", "Analisando retenção algorítmica...", "Estruturando roteiros magnéticos...", "Gerando neurônios digitais..."]} />
                <NarrativeSkeleton />
              </div>
            ) : (
              <>
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-zinc-900/40 p-6 rounded-3xl border border-yellow-400/20 flex items-start gap-4 shadow-xl">
                  <div className="p-3 bg-yellow-400/10 text-yellow-400 rounded-2xl shrink-0"><Target size={24} /></div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-yellow-400 tracking-widest italic leading-none mb-1">Visão Estratégica</h4>
                    <p className="text-zinc-400 text-sm font-bold italic mt-1 leading-relaxed">{String(narratives.analysis_insight)}</p>
                  </div>
                </motion.div>
                <div className="grid grid-cols-1 gap-6">
                  <AnimatePresence>
                    {(narratives.narratives || []).map((nar: any, i: number) => (
                      <motion.button 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        onClick={() => handleGenerateHeadlines(nar)} 
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-10 rounded-[3rem] text-left hover:border-yellow-400 transition-all group shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-zinc-200 dark:bg-zinc-800 group-hover:bg-yellow-400 transition-colors" />
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-yellow-400 transition-colors leading-tight">{String(nar.title)}</h3>
                        <p className="text-zinc-500 font-bold text-sm italic leading-relaxed mt-3">{String(nar.description)}</p>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
                <button onClick={() => setStep(1)} className="text-zinc-500 font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 hover:text-white transition-colors">← VOLTAR AO TEMA</button>
              </>
            )}
          </motion.div>
        ) : step === 3 ? (
          <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
            {loading || !headlines ? (
              <div className="animate-in fade-in duration-500">
                <LoadingStatus messages={["Criando hooks virais...", "Testando score de parada de scroll...", "Calibrando ganchos magnéticos..."]} />
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-24 w-full bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl animate-pulse" />)}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                  <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] italic">Escolha o seu Gancho (Hook) para iniciar:</h3>
                  <p className="text-zinc-400 text-[9px] font-bold italic">Os ganchos abaixo foram otimizados para retenção nos primeiros 3 segundos.</p>
                </motion.div>
                <div className="space-y-4">
                  {(headlines.headlines || []).map((h: string, i: number) => (
                    <motion.button 
                      key={i} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => handleGenerateFinalStrategy(h)} 
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[2rem] text-left hover:border-yellow-400 transition-all group flex justify-between items-center shadow-sm"
                    >
                      <p className="text-lg font-bold italic group-hover:text-yellow-400 transition-colors leading-snug pr-4">"{String(h)}"</p>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-300 group-hover:bg-yellow-400 group-hover:text-black transition-all shrink-0"><ArrowRight size={20} /></div>
                    </motion.button>
                  ))}
                </div>
                <button onClick={() => setStep(2)} className="text-zinc-500 font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 hover:text-white transition-colors">← VOLTAR ÀS NARRATIVAS</button>
              </div>
            )}
          </motion.div>
        ) : step === 4 ? (
          <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
            {loading || !finalStrategy ? (
              <div className="animate-in fade-in duration-500">
                <LoadingStatus messages={["Redigindo blueprint técnico...", "Sincronizando com Viral Road Cloud...", "Finalizando roteiro de alta performance..."]} />
                <FinalStrategySkeleton />
              </div>
            ) : (
              <div className="space-y-6">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[4rem] overflow-hidden shadow-2xl relative">
                  <AnimatePresence>
                    {saveError && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-red-500 text-white px-10 py-4 flex items-center justify-between gap-4 font-black text-[10px] uppercase tracking-widest">
                         <div className="flex items-center gap-2 max-w-[80%]">
                            <AlertTriangle size={16} className="shrink-0" />
                            <span className="truncate">{String(saveError)}</span>
                         </div>
                         <button onClick={() => setSaveError(null)} className="opacity-70 hover:opacity-100 shrink-0"><Check size={16} /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="p-10 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-1">Blueprint <span className="text-yellow-400">Final</span></h3>
                      <p className="text-[10px] font-black uppercase text-zinc-400 italic tracking-widest">Estratégia pronta para execução.</p>
                    </div>
                    <button 
                      onClick={handleSaveToAcervo} 
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
                      {isSaving ? 'SALVANDO...' : saveSuccess ? 'SALVO!' : 'SALVAR NO ACERVO'}
                    </button>
                  </div>

                  <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black uppercase text-yellow-400 tracking-[0.3em] italic flex items-center gap-2">
                           <Zap size={14} fill="currentColor" /> Roteiro Detalhado
                        </h4>
                        <button onClick={() => copyToClipboard(finalStrategy.script, 'script')} className="text-zinc-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest border dark:border-zinc-800 px-3 py-1 rounded-lg">
                          {copiedSection === 'script' ? 'COPIADO' : 'COPIAR'}
                        </button>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800/50 p-8 rounded-[2.5rem] text-sm font-bold italic leading-relaxed whitespace-pre-wrap border dark:border-zinc-800 shadow-inner">{String(finalStrategy.script)}</div>
                    </motion.div>

                    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-6">
                      
                      {/* Creative Direction Section */}
                      {finalStrategy.creativeDirection && (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.3em] italic flex items-center gap-2">
                                <Clapperboard size={14} fill="currentColor" /> Direção Criativa
                              </h4>
                              <button onClick={() => copyToClipboard(finalStrategy.creativeDirection, 'creative')} className="text-zinc-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest border dark:border-zinc-800 px-3 py-1 rounded-lg">
                                {copiedSection === 'creative' ? 'COPIADO' : 'COPIAR'}
                              </button>
                           </div>
                           <div className="bg-purple-500/5 text-purple-200 p-8 rounded-[2.5rem] border border-purple-500/20 shadow-lg relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[50px] pointer-events-none" />
                              <p className="text-[11px] font-bold italic leading-relaxed whitespace-pre-wrap relative z-10">
                                {String(finalStrategy.creativeDirection)}
                              </p>
                           </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em] italic">Legenda & Tags</h4>
                          <button onClick={() => copyToClipboard(`${finalStrategy.caption}\n\n${finalStrategy.hashtags}`, 'caption')} className="text-zinc-500 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest border dark:border-zinc-800 px-3 py-1 rounded-lg">
                            {copiedSection === 'caption' ? 'COPIADO' : 'COPIAR'}
                          </button>
                        </div>
                        <div className="bg-zinc-950 text-white p-8 rounded-[2.5rem] shadow-2xl border border-zinc-800">
                          <p className="text-[12px] font-medium italic leading-relaxed mb-6">{String(finalStrategy.caption)}</p>
                          <div className="pt-6 border-t border-zinc-800">
                             <div className="text-yellow-400 font-black tracking-widest text-[10px] uppercase leading-relaxed">{String(finalStrategy.hashtags)}</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
                <div className="flex justify-between items-center">
                   <button onClick={() => setStep(3)} className="text-zinc-500 font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 hover:text-white transition-colors">← REVISAR GANCHO</button>
                   <button onClick={() => setStep(1)} className="text-yellow-400 font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 hover:underline">GERAR NOVO BLUEPRINT</button>
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
