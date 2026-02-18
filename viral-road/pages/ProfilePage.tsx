
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, 
  CreditCard, 
  Zap, 
  Globe, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Bell, 
  LogOut, 
  Instagram, 
  Youtube, 
  Linkedin, 
  Twitter, 
  Trash2, 
  Plus, 
  ExternalLink, 
  MessageSquare, 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Hash, 
  Target, 
  Mic2, 
  Camera, 
  AlertTriangle, 
  Sparkles, 
  Crosshair,
  Settings,
  Layout,
  Share2,
  RefreshCw,
  Lightbulb,
  BrainCircuit,
  Megaphone,
  Stethoscope,
  Fingerprint
} from 'lucide-react';
import { User, PlanType, SocialProfile, AnalysisResult } from '../types';
import { supabase } from '../services/supabase';
import { analyzeSocialStrategy, auditUserProfile } from '../services/geminiService';
import { fetchInstagramProfileData, fetchTikTokProfileData, fetchYouTubeProfileData, fetchKwaiProfileData } from '../services/apifyService';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onOpenUpgrade: () => void;
  onRefreshUser?: () => void;
}

type TabType = 'general' | 'social' | 'settings';

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onOpenUpgrade, onRefreshUser }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Estado para Loading na adição de rede social
  const [addingSocial, setAddingSocial] = useState(false);

  // Estados para Análise de IA (Individual)
  const [analyzingProfileIndex, setAnalyzingProfileIndex] = useState<number | null>(null);
  
  // Estado para Sugestão de Especialização
  const [suggestedSpec, setSuggestedSpec] = useState<{ new: string, reason: string } | null>(null);

  // Estado para Diagnóstico Geral do Perfil
  const [auditingProfile, setAuditingProfile] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // Estados para Upload de Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Deletar Conta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [localProfile, setLocalProfile] = useState({
    name: user.name || '',
    specialization: user.specialization || '',
    notificationsAiDaily: user.notificationsAiDaily ?? true,
    notificationsEngagement: user.notificationsEngagement ?? true,
    socialProfiles: (user.socialProfiles || []) as SocialProfile[]
  });

  const [newSocial, setNewSocial] = useState({ platform: 'Instagram', url: '' });
  const [urlError, setUrlError] = useState('');

  useEffect(() => {
    setLocalProfile({
      name: user.name || '',
      specialization: user.specialization || '',
      notificationsAiDaily: user.notificationsAiDaily ?? true,
      notificationsEngagement: user.notificationsEngagement ?? true,
      socialProfiles: user.socialProfiles || []
    });
  }, [user]);

  // Função auxiliar para persistir perfis sociais em background
  const persistSocialProfiles = async (profiles: SocialProfile[]) => {
    try {
      await supabase
        .from('profiles')
        .update({ social_profiles: profiles })
        .eq('id', user.id);
      
      if (onRefreshUser) await onRefreshUser();
    } catch (e) {
      console.error("Erro ao persistir perfis sociais:", e);
    }
  };

  const handleRunProfileAudit = async () => {
    if (!localProfile.specialization) {
      alert("Defina uma especialização para auditar.");
      return;
    }
    setAuditingProfile(true);
    setAuditResult(null);
    try {
      const result = await auditUserProfile({
        name: localProfile.name,
        niche: user.profileType || 'Geral',
        specialization: localProfile.specialization
      });
      setAuditResult(result);
    } catch (e) {
      console.error("Erro no diagnóstico:", e);
      alert("Erro ao gerar diagnóstico. Tente novamente.");
    } finally {
      setAuditingProfile(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: localProfile.name,
          specialization: localProfile.specialization,
          social_profiles: localProfile.socialProfiles,
          settings: {
             notifications_ai_daily: localProfile.notificationsAiDaily,
             notifications_engagement: localProfile.notificationsEngagement
          }
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccessMsg('Perfil atualizado com sucesso!');
      if (onRefreshUser) await onRefreshUser();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      console.error('Erro ao atualizar perfil:', e);
      alert(`Erro ao salvar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      if (file.size > 2 * 1024 * 1024) throw new Error('A imagem deve ser menor que 2MB.');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      if (onRefreshUser) onRefreshUser();
      setSuccessMsg('Foto de perfil atualizada!');
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (error: any) {
      console.error('Erro upload avatar:', error);
      alert(`Erro upload avatar: ${error.message}`);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
        await supabase.from('content_blueprints').delete().eq('user_id', user.id);
        await supabase.from('hooks_library').delete().eq('user_id', user.id);
        await supabase.from('usage_limits').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('id', user.id);
        await onLogout(); 
    } catch (e: any) {
        console.error("Erro ao excluir conta:", e);
        alert(`Erro ao processar exclusão: ${e.message}`);
        setIsDeleting(false);
        setShowDeleteModal(false);
    }
  };

  const handleRunAnalysis = async (index: number) => {
    const profile = localProfile.socialProfiles[index];
    if (!profile) return;
    
    setAnalyzingProfileIndex(index);
    setSuggestedSpec(null); 
    
    try {
      const data: AnalysisResult = await analyzeSocialStrategy({
        profiles: [{ 
            id: String(index), 
            platform: profile.platform, 
            url: profile.url,
            objective: profile.objective 
        }],
        niche: user.profileType || 'Geral',
        specialization: localProfile.specialization || 'Geral',
        realMetrics: profile.normalized_metrics
      });

      const updated = [...localProfile.socialProfiles];
      
      if (data.results && data.results.length > 0) {
         updated[index] = {
             ...updated[index],
             analysis_ai: data.results[0].analysis
         };
      }
      
      setLocalProfile(prev => ({ ...prev, socialProfiles: updated }));
      
      await persistSocialProfiles(updated);

      if (data.detected_specialization && data.detected_specialization !== localProfile.specialization) {
         setSuggestedSpec({
            new: data.detected_specialization,
            reason: data.suggestion_reason || 'Para aumentar sua autoridade.'
         });
      }
      
    } catch (e) {
      console.error("Erro na análise de perfil:", e);
      alert("Não foi possível realizar a análise no momento.");
    } finally {
      setAnalyzingProfileIndex(null);
    }
  };

  const acceptSpecSuggestion = () => {
    if (!suggestedSpec) return;
    setLocalProfile(prev => ({ ...prev, specialization: suggestedSpec.new }));
    setSuggestedSpec(null);
    setSuccessMsg('Especialização otimizada pela IA!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAddSocial = async () => {
    let rawUrl = newSocial.url.trim();
    if (!rawUrl) {
      setUrlError('Digite a URL do perfil.');
      return;
    }

    rawUrl = rawUrl.replace(/\s/g, '');
    if (rawUrl.startsWith('@')) {
       const handle = rawUrl.substring(1);
       switch(newSocial.platform) {
          case 'Instagram': rawUrl = `https://instagram.com/${handle}`; break;
          case 'Twitter': rawUrl = `https://twitter.com/${handle}`; break;
          case 'TikTok': rawUrl = `https://tiktok.com/@${handle}`; break;
          case 'YouTube': rawUrl = `https://youtube.com/@${handle}`; break;
       }
    }

    if (!/^https?:\/\//i.test(rawUrl)) rawUrl = `https://${rawUrl}`;

    try {
      const urlObj = new URL(rawUrl);
      if (urlObj.hostname.split('.').length < 2) throw new Error("Domínio incompleto");
    } catch (e) {
      setUrlError('URL inválida. Ex: instagram.com/seu_perfil');
      return;
    }

    setUrlError('');
    setAddingSocial(true);

    try {
        let fetchedData = { raw: {}, normalized: null };
        
        // Tenta extrair dados reais se suportado
        if (newSocial.platform === 'Instagram') fetchedData = await fetchInstagramProfileData(rawUrl);
        else if (newSocial.platform === 'TikTok') fetchedData = await fetchTikTokProfileData(rawUrl);
        else if (newSocial.platform === 'YouTube') fetchedData = await fetchYouTubeProfileData(rawUrl);
        else if (newSocial.platform === 'Kwai') fetchedData = await fetchKwaiProfileData(rawUrl);

        let username = 'usuario';
        try {
            const urlParts = rawUrl.split('/').filter(Boolean);
            username = urlParts[urlParts.length - 1].replace('@', '') || 'usuario';
        } catch(e) {}

        const normalizedMetrics = fetchedData.normalized || {
            followers: null,
            following: null,
            likes: null,
            posts: null,
            views: null,
            engagement_rate: null,
            bio: null,
            avatar_url: null,
            external_link: null,
            verified: null,
            is_private: null,
            handle: username
        };

        const newProfile: SocialProfile = {
            platform: newSocial.platform,
            url: rawUrl,
            username: normalizedMetrics.handle || username,
            objective: 'Aumentar Seguidores',
            last_sync: new Date().toISOString(),
            raw_apify_data: fetchedData.raw || {},
            normalized_metrics: normalizedMetrics,
            analysis_ai: null,
            // @ts-ignore
            notes: ''
        };

        const updated = [...localProfile.socialProfiles, newProfile];
        setLocalProfile(prev => ({ ...prev, socialProfiles: updated }));
        
        await persistSocialProfiles(updated);
        setNewSocial({ platform: 'Instagram', url: '' });
        setSuccessMsg('Rede social conectada e dados sincronizados!');
        setTimeout(() => setSuccessMsg(''), 3000);

    } catch (error) {
        console.error("Erro ao adicionar rede:", error);
        setUrlError("Falha ao conectar perfil. Verifique a URL.");
    } finally {
        setAddingSocial(false);
    }
  };

  const handleRemoveSocial = async (index: number) => {
    const updated = [...localProfile.socialProfiles];
    updated.splice(index, 1);
    setLocalProfile(prev => ({ ...prev, socialProfiles: updated }));
    await persistSocialProfiles(updated);
  };

  const handleUpdateSocialNote = (index: number, note: string) => {
    const updated = [...localProfile.socialProfiles];
    updated[index] = { ...updated[index], notes: note };
    setLocalProfile(prev => ({ ...prev, socialProfiles: updated }));
  };

  const handleUpdateSocialObjective = async (index: number, objective: string) => {
    const updated = [...localProfile.socialProfiles];
    updated[index] = { ...updated[index], objective: objective };
    setLocalProfile(prev => ({ ...prev, socialProfiles: updated }));
    await persistSocialProfiles(updated);
  };

  const isPro = user.currentPlan === PlanType.Pro;

  const getPlatformIcon = (platform: string) => {
      switch(platform) {
          case 'Instagram': return <Instagram size={16} />;
          case 'YouTube': return <Youtube size={16} />;
          case 'LinkedIn': return <Linkedin size={16} />;
          case 'Twitter': return <Twitter size={16} />;
          default: return <Globe size={16} />;
      }
  };

  const AnalysisSkeleton = () => (
    <div className="mt-4 p-5 bg-zinc-100/50 dark:bg-zinc-800/30 rounded-2xl animate-pulse space-y-4 border border-zinc-200 dark:border-zinc-700/50">
       <div className="flex justify-between items-center">
          <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-3 w-10 bg-zinc-200 dark:bg-zinc-700 rounded" />
       </div>
       <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full" />
       <div className="grid grid-cols-3 gap-3 mt-2">
          <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
          <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
          <div className="h-12 bg-zinc-200 dark:bg-zinc-700 rounded-xl" />
       </div>
    </div>
  );

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-500 pb-32 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">Road <span className="text-yellow-400">Profile</span></h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] italic mt-2">Gerencie sua identidade e assinatura.</p>
        </div>
        <button onClick={onLogout} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2">
          <LogOut size={14} /> Encerrar Sessão
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border dark:border-zinc-800 w-full md:w-fit overflow-x-auto">
        {[
          { id: 'general', label: 'Geral & Plano', icon: Layout },
          { id: 'social', label: 'Redes & Estratégia', icon: Share2 },
          { id: 'settings', label: 'Preferências', icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id 
              ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' 
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
            }`}
          >
            <tab.icon size={14} className={activeTab === tab.id ? 'text-yellow-400' : ''} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
          <motion.div 
            key="general"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* Identity Card */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 md:p-10 space-y-8 shadow-xl h-fit relative overflow-hidden">
              <div className="flex items-center gap-6 relative z-10">
                <div className="relative group w-24 h-24 rounded-[2rem] shadow-2xl shadow-yellow-400/20 cursor-pointer overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-yellow-400 text-black flex items-center justify-center font-black text-2xl italic">{user.name?.[0] || user.email[0].toUpperCase()}</div>}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" size={24} />}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/png, image/jpeg, image/jpg" className="hidden" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase text-zinc-900 dark:text-white">{user.name || 'Estrategista'}</h3>
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest italic">{user.email}</p>
                  <div className="mt-2 flex gap-2"><span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[9px] font-black uppercase rounded-lg border border-zinc-200 dark:border-zinc-700 italic">{user.profileType}</span></div>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic ml-2">Nome de Exibição</label>
                  <div className="relative">
                     <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                     <input type="text" value={localProfile.name} onChange={e => setLocalProfile({...localProfile, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 pl-12 rounded-2xl text-xs font-bold border border-zinc-100 dark:border-zinc-800 outline-none focus:border-yellow-400 transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic ml-2">Especialização</label>
                  <div className="relative">
                     <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                     <input type="text" value={localProfile.specialization} onChange={e => setLocalProfile({...localProfile, specialization: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 pl-12 rounded-2xl text-xs font-bold border border-zinc-100 dark:border-zinc-800 outline-none focus:border-yellow-400 transition-all" />
                  </div>
                </div>
              </div>

              {/* Botão de Diagnóstico Rápido */}
              <div className="relative z-10">
                 <button 
                    onClick={handleRunProfileAudit}
                    disabled={auditingProfile}
                    className="w-full py-4 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-500 border border-yellow-400/30 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-50"
                 >
                    {auditingProfile ? <Loader2 className="animate-spin" size={14} /> : <Stethoscope size={14} className="group-hover:rotate-12 transition-transform" />}
                    {auditingProfile ? "AUDITANDO MERCADO..." : "AUDITORIA DE POSICIONAMENTO"}
                 </button>
              </div>

              {/* Resultado do Diagnóstico */}
              <AnimatePresence>
                {auditResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-700 space-y-4 overflow-hidden relative"
                  >
                     <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700 pb-3">
                        <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1"><Target size={10} /> Market Fit</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${auditResult.score > 70 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>Opportunity Score: {auditResult.score}/100</span>
                     </div>
                     <div>
                        <span className="text-[10px] font-bold italic text-zinc-500 block mb-1">Status: {auditResult.market_status}</span>
                        <p className="text-xs font-bold italic text-zinc-800 dark:text-zinc-200">"{auditResult.verdict}"</p>
                     </div>
                     <div className="bg-gradient-to-r from-yellow-400/10 to-transparent p-4 rounded-xl border border-yellow-400/20">
                        <div className="flex items-center gap-2 mb-1">
                           <Fingerprint size={12} className="text-yellow-500" />
                           <strong className="text-yellow-500 uppercase tracking-widest text-[9px]">Tática de Diferenciação:</strong>
                        </div>
                        <p className="text-[10px] italic text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">{auditResult.tip}</p>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-end pt-4 relative z-10">
                <button onClick={handleSave} disabled={saving} className="px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {saving ? 'SALVANDO...' : 'SALVAR DADOS'}
                </button>
              </div>
            </div>

            {/* Plan & Danger Zone */}
            <div className="space-y-6">
              <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 bg-yellow-400/10 blur-[50px] group-hover:bg-yellow-400/20 transition-all duration-700" />
                 <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="p-3 bg-zinc-800 rounded-2xl border border-zinc-700"><CreditCard className="text-yellow-400" size={20} /></div>
                       {isPro ? (<span className="px-3 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase rounded-lg tracking-widest">Ativo</span>) : (<span className="px-3 py-1 bg-zinc-700 text-zinc-400 text-[9px] font-black uppercase rounded-lg tracking-widest">Básico</span>)}
                    </div>
                    <div><h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">Plano Atual</h3><p className="text-3xl font-black italic uppercase mt-1">{isPro ? 'ROAD PRO' : 'CREATOR'}</p></div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase italic"><span className="text-zinc-400">Uso Mensal</span><span>{user.usedBlueprints} / {isPro ? '∞' : user.monthlyLimit}</span></div>
                       <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(((user.usedBlueprints || 0) / (user.monthlyLimit || 1)) * 100, 100)}%` }} /></div>
                    </div>
                    {!isPro && (<button onClick={onOpenUpgrade} className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2">FAZER UPGRADE <ExternalLink size={12} /></button>)}
                 </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 rounded-[2.5rem] p-8 shadow-lg">
                 <h4 className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em] italic mb-4 flex items-center gap-2"><AlertTriangle size={14} /> Zona de Perigo</h4>
                 <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 italic mb-6">Ao excluir sua conta, todos os seus dados, blueprints e acessos serão removidos permanentemente.</p>
                 <button onClick={() => setShowDeleteModal(true)} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg flex items-center justify-center gap-2"><Trash2 size={12} /> EXCLUIR MINHA CONTA</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: SOCIAL */}
        {activeTab === 'social' && (
          <motion.div 
            key="social"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 md:p-10 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-8 border-b border-zinc-100 dark:border-zinc-800">
                   <div className="space-y-1">
                      <h3 className="text-2xl font-black italic uppercase text-zinc-900 dark:text-white">Redes Conectadas</h3>
                      <p className="text-zinc-500 text-xs font-bold italic">Gerencie os perfis que a IA utilizará para gerar estratégias.</p>
                   </div>
                </div>

                {/* Add New Social */}
                <div className="flex gap-2 items-start bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800 mb-8">
                   <select value={newSocial.platform} onChange={e => setNewSocial({...newSocial, platform: e.target.value})} className="bg-transparent p-3 rounded-xl text-[10px] font-black uppercase border-none outline-none w-32 text-zinc-700 dark:text-zinc-300 cursor-pointer">
                     <option value="Instagram">Instagram</option>
                     <option value="TikTok">TikTok</option>
                     <option value="YouTube">YouTube</option>
                     <option value="LinkedIn">LinkedIn</option>
                     <option value="Twitter">Twitter</option>
                     <option value="Website">Website</option>
                   </select>
                   <div className="flex-1 space-y-1">
                      <input type="text" placeholder="URL do perfil ou @usuario..." value={newSocial.url} onChange={e => setNewSocial({...newSocial, url: e.target.value})} className="w-full bg-transparent p-3 text-[10px] font-bold border-l border-zinc-200 dark:border-zinc-700 outline-none text-zinc-700 dark:text-zinc-300" />
                      {urlError && <p className="text-[9px] text-red-500 font-bold ml-2 pb-1">{urlError}</p>}
                   </div>
                   <button onClick={handleAddSocial} disabled={addingSocial} className="p-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-90 transition-colors shadow-lg disabled:opacity-50">
                      {addingSocial ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                   </button>
                </div>
                
                {/* Social List */}
                <div className="grid grid-cols-1 gap-6">
                  {localProfile.socialProfiles.map((social: any, idx: number) => (
                    <div key={idx} className="p-6 bg-zinc-50 dark:bg-zinc-800/20 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800/50 space-y-5 hover:border-yellow-400/30 transition-all group relative overflow-hidden">
                       <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center relative z-10">
                           <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-500 shadow-sm group-hover:text-yellow-400 transition-colors overflow-hidden border border-zinc-200 dark:border-zinc-600">
                                 {social.normalized_metrics?.avatar_url ? (
                                     <img src={social.normalized_metrics.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                 ) : (
                                     getPlatformIcon(social.platform)
                                 )}
                              </div>
                              <div>
                                 <p className="text-[12px] font-black uppercase text-zinc-900 dark:text-white italic flex items-center gap-2">
                                    {social.platform}
                                    {social.normalized_metrics?.followers && (
                                        <span className="text-[9px] font-bold bg-green-500/10 text-green-500 px-2 py-0.5 rounded-lg border border-green-500/20 not-italic">
                                            {(social.normalized_metrics.followers / 1000).toFixed(1)}k Segs
                                        </span>
                                    )}
                                 </p>
                                 <a href={social.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-yellow-500 hover:underline truncate max-w-[200px] block">{social.url}</a>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-3 w-full md:w-auto">
                              <select 
                                value={social.objective || 'Aumentar Seguidores'}
                                onChange={(e) => handleUpdateSocialObjective(idx, e.target.value)}
                                className="flex-1 md:w-64 bg-white dark:bg-zinc-900 p-3 rounded-xl text-[10px] font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50 outline-none focus:border-yellow-400 cursor-pointer appearance-none"
                              >
                                <option value="Aumentar Seguidores">Aumentar Seguidores (Topo)</option>
                                <option value="Gerar Leads">Gerar Leads/Vendas (Fundo)</option>
                                <option value="Branding">Fortalecer Autoridade</option>
                                <option value="Engajamento">Engajamento (Meio)</option>
                              </select>
                              <button 
                                onClick={() => handleRunAnalysis(idx)} 
                                disabled={analyzingProfileIndex !== null}
                                className={`p-3 rounded-xl shadow-sm border transition-all flex items-center gap-2 ${
                                    analyzingProfileIndex === idx 
                                    ? 'bg-yellow-400 text-black border-yellow-500' 
                                    : 'bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700 text-zinc-400 hover:text-yellow-400 hover:border-yellow-400/50'
                                }`}
                                title="Analisar Estratégia IA"
                              >
                                {analyzingProfileIndex === idx ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                              </button>
                              <button onClick={() => handleRemoveSocial(idx)} className="p-3 text-zinc-400 hover:text-red-500 transition-colors bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
                                  <Trash2 size={14} />
                              </button>
                           </div>
                       </div>

                       {analyzingProfileIndex === idx ? (
                          <AnalysisSkeleton />
                       ) : social.analysis_ai ? (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }} 
                            className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 space-y-8 shadow-sm overflow-hidden"
                          >
                             <div className="flex flex-col lg:flex-row gap-8 items-center">
                                {/* Visual Score Gauge */}
                                <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
                                   <svg className="w-full h-full transform -rotate-90">
                                      <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-100 dark:text-zinc-800" />
                                      <motion.circle 
                                        cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                        strokeDasharray={439.8} 
                                        strokeDashoffset={439.8 - (439.8 * (social.analysis_ai.viral_score || 0)) / 100}
                                        initial={{ strokeDashoffset: 439.8 }}
                                        animate={{ strokeDashoffset: 439.8 - (439.8 * (social.analysis_ai.viral_score || 0)) / 100 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className={`${social.analysis_ai.viral_score > 80 ? 'text-green-500' : social.analysis_ai.viral_score > 50 ? 'text-yellow-400' : 'text-red-500'}`}
                                      />
                                   </svg>
                                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      <span className="text-4xl font-black italic text-zinc-900 dark:text-white leading-none">{social.analysis_ai.viral_score}</span>
                                      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest mt-1">Viral Score</span>
                                   </div>
                                </div>

                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                   <div className="bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-yellow-400/30 transition-colors">
                                      <div className="p-2 bg-yellow-400/10 text-yellow-500 rounded-xl w-fit mb-3"><Target size={16} /></div>
                                      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Formato Campeão</span>
                                      <div className="text-sm font-bold text-zinc-900 dark:text-white italic">{social.analysis_ai.best_format}</div>
                                   </div>
                                   <div className="bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-blue-400/30 transition-colors">
                                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl w-fit mb-3"><Clock size={16} /></div>
                                      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Frequência Ideal</span>
                                      <div className="text-sm font-bold text-zinc-900 dark:text-white italic">{social.analysis_ai.frequency_suggestion}</div>
                                   </div>
                                   <div className="bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-purple-400/30 transition-colors">
                                      <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl w-fit mb-3"><Mic2 size={16} /></div>
                                      <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block mb-1">Tom de Voz</span>
                                      <div className="text-sm font-bold text-zinc-900 dark:text-white italic">{social.analysis_ai.tone_recommendation || 'Autêntico'}</div>
                                   </div>
                                </div>
                             </div>
                             
                             {/* Diagnostic Cards */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-3">
                                   <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] italic flex items-center gap-2"><Lightbulb size={12} className="text-yellow-400" /> Ação Imediata</h4>
                                   <div className="bg-gradient-to-br from-yellow-400/10 to-transparent p-5 rounded-2xl border border-yellow-400/20">
                                      <p className="text-sm font-bold italic text-zinc-800 dark:text-zinc-200 leading-relaxed">"{social.analysis_ai.diagnostic?.key_action_item || 'Analisando...'}"</p>
                                   </div>
                                </div>
                                <div className="space-y-3">
                                   <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] italic flex items-center gap-2"><BrainCircuit size={12} className="text-blue-400" /> Estratégia de Conteúdo</h4>
                                   <div className="bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                      <p className="text-[11px] font-medium italic text-zinc-600 dark:text-zinc-400 leading-relaxed">"{social.analysis_ai.diagnostic?.content_strategy_advice || 'Aguardando dados...'}"</p>
                                   </div>
                                </div>
                             </div>

                             {/* Tone & Pillars */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                   <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] italic flex items-center gap-2"><Megaphone size={12} className="text-purple-400" /> Auditoria de Tom</h4>
                                   <p className="text-[11px] italic text-zinc-500 leading-relaxed bg-zinc-50 dark:bg-zinc-800/20 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                                      {social.analysis_ai.diagnostic?.tone_audit || 'Neutro'}
                                   </p>
                                </div>
                                <div className="space-y-3">
                                   <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] italic flex items-center gap-2"><Hash size={12} /> Pilares de Conteúdo</h4>
                                   <div className="flex flex-wrap gap-2">
                                       {social.analysis_ai.content_pillars?.map((pillar: string, i: number) => (
                                         <span key={i} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-sm">{pillar}</span>
                                       ))}
                                   </div>
                                </div>
                             </div>
                          </motion.div>
                       ) : null}
                       
                       <div className="space-y-2 pt-2">
                          <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1 ml-1"><MessageSquare size={10} /> Notas de Estratégia</label>
                          <textarea value={social.notes || ''} onChange={(e) => handleUpdateSocialNote(idx, e.target.value)} placeholder="Ex: Focar em Reels de 7s, postar às 18h..." className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl text-[10px] font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50 outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 min-h-[60px] resize-y" />
                       </div>
                    </div>
                  ))}
                  
                  {localProfile.socialProfiles.length === 0 && (
                    <div className="text-center py-10 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                       <p className="text-zinc-400 text-xs font-bold italic">Nenhuma rede conectada. Adicione acima para começar.</p>
                    </div>
                  )}
                </div>
            </div>
          </motion.div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 md:p-10 shadow-lg space-y-8">
               <div>
                  <h4 className="text-xl font-black uppercase italic text-zinc-900 dark:text-white">Preferências de Notificação</h4>
                  <p className="text-zinc-500 text-xs font-bold mt-1">Controle como a Road AI se comunica com você.</p>
               </div>
               
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                     <div className="space-y-1">
                        <span className="text-[11px] font-bold italic text-zinc-900 dark:text-white block">Resumo Diário da IA</span>
                        <span className="text-[9px] text-zinc-500 block max-w-[200px]">Receba insights estratégicos toda manhã baseados no seu nicho.</span>
                     </div>
                     <button onClick={() => setLocalProfile({...localProfile, notificationsAiDaily: !localProfile.notificationsAiDaily})} className={`w-12 h-7 rounded-full p-1 transition-colors ${localProfile.notificationsAiDaily ? 'bg-yellow-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${localProfile.notificationsAiDaily ? 'translate-x-5' : ''}`} />
                     </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                     <div className="space-y-1">
                        <span className="text-[11px] font-bold italic text-zinc-900 dark:text-white block">Dicas de Engajamento</span>
                        <span className="text-[9px] text-zinc-500 block max-w-[200px]">Alertas sobre tendências e áudios virais em tempo real.</span>
                     </div>
                     <button onClick={() => setLocalProfile({...localProfile, notificationsEngagement: !localProfile.notificationsEngagement})} className={`w-12 h-7 rounded-full p-1 transition-colors ${localProfile.notificationsEngagement ? 'bg-yellow-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${localProfile.notificationsEngagement ? 'translate-x-5' : ''}`} />
                     </button>
                  </div>
               </div>

               <div className="flex justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <button onClick={handleSave} disabled={saving} className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? 'SALVANDO...' : 'SALVAR PREFERÊNCIAS'}
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Success Toast */}
      <AnimatePresence>
         {successMsg && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-10 right-10 bg-green-500 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 z-50">
              <CheckCircle2 size={18} /> {successMsg}
           </motion.div>
         )}
      </AnimatePresence>

      {/* Suggestion Modal */}
      <AnimatePresence>
        {suggestedSpec && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-zinc-900 border border-yellow-400/30 rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-400" />
                <div className="flex flex-col items-center text-center space-y-6">
                   <div className="w-16 h-16 bg-yellow-400/10 text-yellow-400 rounded-2xl flex items-center justify-center animate-pulse"><Sparkles size={32} /></div>
                   <div><h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-white">Road <span className="text-yellow-400">Inteligência</span></h3><p className="text-zinc-500 font-bold text-xs mt-2 italic px-4">Detectamos uma oportunidade para viralizar mais.</p></div>
                   <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-700 w-full text-left space-y-3">
                      <div><span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest block">Especialização Atual</span><span className="text-sm font-bold italic line-through text-zinc-500">{localProfile.specialization}</span></div>
                      <div className="flex justify-center"><div className="h-4 w-0.5 bg-zinc-300 dark:bg-zinc-700" /></div>
                      <div><span className="text-[9px] font-black uppercase text-yellow-500 tracking-widest block">Sugestão Viral</span><span className="text-lg font-black italic text-zinc-900 dark:text-white">{suggestedSpec.new}</span></div>
                      <p className="text-[10px] text-zinc-500 italic border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-2 leading-relaxed">"{suggestedSpec.reason}"</p>
                   </div>
                   <div className="flex gap-3 w-full">
                      <button onClick={acceptSpecSuggestion} className="flex-1 py-4 bg-yellow-400 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-colors shadow-lg">ACEITAR MUDANÇA</button>
                      <button onClick={() => setSuggestedSpec(null)} className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-zinc-900 dark:hover:text-white transition-colors">MANTER ATUAL</button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] border border-zinc-200 dark:border-zinc-800 p-10 text-center space-y-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500" />
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl shadow-red-500/10 border border-red-500/20"><AlertTriangle size={36} /></div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-zinc-900 dark:text-white">Excluir <span className="text-red-500">Road Account?</span></h3>
                <p className="text-zinc-500 font-bold text-xs italic leading-relaxed px-2">Esta ação é irreversível. Você perderá acesso imediato a todos os seus roteiros, ganchos e histórico de uso.</p>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button onClick={handleDeleteAccount} disabled={isDeleting} className="w-full bg-red-500 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-red-600 transition-all disabled:opacity-50 active:scale-95">
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  {isDeleting ? 'EXCLUINDO...' : 'SIM, EXCLUIR TUDO'}
                </button>
                <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-zinc-900 dark:hover:text-white transition-all active:scale-95">CANCELAR</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
