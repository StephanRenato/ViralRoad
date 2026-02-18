
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
  Trash2, 
  Plus, 
  ExternalLink, 
  MessageSquare, 
  Target, 
  Mic2, 
  Camera, 
  AlertTriangle, 
  Sparkles, 
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
  
  const [addingSocial, setAddingSocial] = useState(false);
  const [analyzingProfileIndex, setAnalyzingProfileIndex] = useState<number | null>(null);
  const [suggestedSpec, setSuggestedSpec] = useState<{ new: string, reason: string } | null>(null);
  const [auditingProfile, setAuditingProfile] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const persistSocialProfiles = async (profiles: SocialProfile[]) => {
    try {
      await supabase
        .from('profiles')
        .update({ social_profiles: profiles })
        .eq('id', user.id);
      
      if (onRefreshUser) onRefreshUser();
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

      setSuccessMsg('Sincronizado com Road Cloud!');
      if (onRefreshUser) onRefreshUser();
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
      setSuccessMsg('Avatar atualizado!');
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (error: any) {
      alert(`Erro upload: ${error.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRunAnalysis = async (index: number) => {
    const profile = localProfile.socialProfiles[index];
    if (!profile) return;
    
    setAnalyzingProfileIndex(index);
    try {
      const data: AnalysisResult = await analyzeSocialStrategy({
        profiles: [{ id: String(index), platform: profile.platform, url: profile.url, objective: profile.objective }],
        niche: user.profileType || 'Geral',
        specialization: localProfile.specialization || 'Geral',
        realMetrics: profile.normalized_metrics
      });

      const updated = [...localProfile.socialProfiles];
      if (data.results && data.results.length > 0) {
         updated[index] = { ...updated[index], analysis_ai: data.results[0].analysis };
      }
      
      setLocalProfile(prev => ({ ...prev, socialProfiles: updated }));
      await persistSocialProfiles(updated);

      if (data.detected_specialization && data.detected_specialization !== localProfile.specialization) {
         setSuggestedSpec({ new: data.detected_specialization, reason: data.suggestion_reason || 'Otimização de Autoridade.' });
      }
    } catch (e) {
      console.error("Erro na análise:", e);
    } finally {
      setAnalyzingProfileIndex(null);
    }
  };

  const handleAddSocial = async () => {
    let rawUrl = newSocial.url.trim();
    if (!rawUrl) return;

    if (rawUrl.startsWith('@')) {
       const handle = rawUrl.substring(1);
       if (newSocial.platform === 'Instagram') rawUrl = `https://instagram.com/${handle}`;
       else if (newSocial.platform === 'TikTok') rawUrl = `https://tiktok.com/@${handle}`;
    }

    if (!/^https?:\/\//i.test(rawUrl)) rawUrl = `https://${rawUrl}`;
    setUrlError('');
    setAddingSocial(true);

    try {
        let fetchedData = { raw: {}, normalized: null };
        if (newSocial.platform === 'Instagram') fetchedData = await fetchInstagramProfileData(rawUrl);
        else if (newSocial.platform === 'TikTok') fetchedData = await fetchTikTokProfileData(rawUrl);

        const newProfile: SocialProfile = {
            platform: newSocial.platform,
            url: rawUrl,
            username: fetchedData.normalized?.handle || 'usuario',
            objective: 'Aumentar Seguidores',
            last_sync: new Date().toISOString(),
            raw_apify_data: fetchedData.raw || {},
            normalized_metrics: fetchedData.normalized || { followers: 0, engagement_rate: 0, handle: 'usuario' },
            analysis_ai: null
        };

        const updated = [...localProfile.socialProfiles, newProfile];
        setLocalProfile(prev => ({ ...prev, socialProfiles: updated }));
        await persistSocialProfiles(updated);
        setNewSocial({ platform: 'Instagram', url: '' });
    } catch (error) {
        setUrlError("Falha ao conectar. Verifique o link.");
    } finally {
        setAddingSocial(false);
    }
  };

  const isPro = user.currentPlan === PlanType.Pro;

  return (
    <div className="p-4 md:p-10 space-y-8 animate-in fade-in duration-500 pb-32 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">Road <span className="text-yellow-400">Profile</span></h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] italic mt-2">Central de identidade e configurações.</p>
        </div>
        <button onClick={onLogout} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
          <LogOut size={14} /> Encerrar Sessão
        </button>
      </div>

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
              activeTab === tab.id ? 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <tab.icon size={14} className={activeTab === tab.id ? 'text-yellow-400' : ''} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'general' && (
          <motion.div key="general" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 md:p-10 space-y-8 shadow-xl">
              <div className="flex items-center gap-6">
                <div className="relative group w-24 h-24 rounded-[2rem] shadow-2xl shadow-yellow-400/20 cursor-pointer overflow-hidden" onClick={() => fileInputRef.current?.click()}>
                  {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-yellow-400 text-black flex items-center justify-center font-black text-2xl italic">{user.name?.[0] || 'U'}</div>}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingAvatar ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" size={24} />}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic uppercase text-zinc-900 dark:text-white">{user.name || 'Estrategista'}</h3>
                  <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest italic">{user.email}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic">Nome de Exibição</label>
                  <input type="text" value={localProfile.name} onChange={e => setLocalProfile({...localProfile, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl text-xs font-bold border border-zinc-100 dark:border-zinc-800 outline-none focus:border-yellow-400" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic">Especialização</label>
                  <input type="text" value={localProfile.specialization} onChange={e => setLocalProfile({...localProfile, specialization: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl text-xs font-bold border border-zinc-100 dark:border-zinc-800 outline-none focus:border-yellow-400" />
                </div>
              </div>

              <button onClick={handleRunProfileAudit} disabled={auditingProfile} className="w-full py-4 bg-yellow-400/10 text-yellow-500 border border-yellow-400/30 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95">
                {auditingProfile ? <Loader2 className="animate-spin" size={14} /> : <Stethoscope size={14} />}
                AUDITORIA DE POSICIONAMENTO
              </button>

              <div className="flex justify-end pt-4">
                <button onClick={handleSave} disabled={saving} className="px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  SALVAR DADOS
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                 <div className="absolute inset-0 bg-yellow-400/10 blur-[50px]" />
                 <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-start">
                       <div className="p-3 bg-zinc-800 rounded-2xl border border-zinc-700"><CreditCard className="text-yellow-400" size={20} /></div>
                       <span className="px-3 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase rounded-lg tracking-widest">{isPro ? 'Ativo' : 'Básico'}</span>
                    </div>
                    <div><h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">Plano Atual</h3><p className="text-3xl font-black italic uppercase mt-1">{isPro ? 'ROAD PRO' : 'CREATOR'}</p></div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase italic"><span className="text-zinc-400">Uso Mensal</span><span>{user.usedBlueprints} / {isPro ? '∞' : user.monthlyLimit}</span></div>
                       <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-yellow-400" style={{ width: `${Math.min(((user.usedBlueprints || 0) / (user.monthlyLimit || 1)) * 100, 100)}%` }} /></div>
                    </div>
                    {!isPro && <button onClick={onOpenUpgrade} className="w-full py-4 bg-yellow-400 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">UPGRADE ROAD <ExternalLink size={12} /></button>}
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'social' && (
          <motion.div key="social" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 md:p-10 shadow-xl">
                <div className="flex gap-2 items-start bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-800 mb-8">
                   <select value={newSocial.platform} onChange={e => setNewSocial({...newSocial, platform: e.target.value})} className="bg-transparent p-3 text-[10px] font-black uppercase border-none outline-none w-32">
                     <option value="Instagram">Instagram</option>
                     <option value="TikTok">TikTok</option>
                   </select>
                   <input type="text" placeholder="URL do perfil ou @usuario..." value={newSocial.url} onChange={e => setNewSocial({...newSocial, url: e.target.value})} className="flex-1 bg-transparent p-3 text-[10px] font-bold border-l border-zinc-200 dark:border-zinc-700 outline-none" />
                   <button onClick={handleAddSocial} disabled={addingSocial} className="p-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl disabled:opacity-50">
                      {addingSocial ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                   </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  {localProfile.socialProfiles.map((social, idx) => (
                    <div key={idx} className="p-6 bg-zinc-50 dark:bg-zinc-800/20 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800/50 space-y-5">
                       <div className="flex justify-between items-center">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-700 flex items-center justify-center text-zinc-500">
                                 {social.platform === 'Instagram' ? <Instagram size={20} /> : <Zap size={20} />}
                              </div>
                              <div>
                                 <p className="text-[12px] font-black uppercase italic text-zinc-900 dark:text-white">{social.platform}</p>
                                 <p className="text-[10px] font-bold text-yellow-500 truncate max-w-[200px]">{social.url}</p>
                              </div>
                           </div>
                           <button onClick={() => handleRunAnalysis(idx)} disabled={analyzingProfileIndex !== null} className="p-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black">
                              {analyzingProfileIndex === idx ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                           </button>
                       </div>
                    </div>
                  ))}
                </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 md:p-10 shadow-lg space-y-8">
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                     <div>
                        <span className="text-[11px] font-bold italic text-zinc-900 dark:text-white block">Resumo Diário da IA</span>
                        <span className="text-[9px] text-zinc-500 block">Insights baseados no seu nicho toda manhã.</span>
                     </div>
                     <button onClick={() => setLocalProfile({...localProfile, notificationsAiDaily: !localProfile.notificationsAiDaily})} className={`w-12 h-7 rounded-full p-1 transition-colors ${localProfile.notificationsAiDaily ? 'bg-yellow-400' : 'bg-zinc-200'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${localProfile.notificationsAiDaily ? 'translate-x-5' : ''}`} />
                     </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                     <div>
                        <span className="text-[11px] font-bold italic text-zinc-900 dark:text-white block">Dicas de Engajamento</span>
                        <span className="text-[9px] text-zinc-500 block">Alertas de áudios e trends em tempo real.</span>
                     </div>
                     <button onClick={() => setLocalProfile({...localProfile, notificationsEngagement: !localProfile.notificationsEngagement})} className={`w-12 h-7 rounded-full p-1 transition-colors ${localProfile.notificationsEngagement ? 'bg-yellow-400' : 'bg-zinc-200'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${localProfile.notificationsEngagement ? 'translate-x-5' : ''}`} />
                     </button>
                  </div>
               </div>

               <div className="flex justify-end pt-4">
                  <button onClick={handleSave} disabled={saving} className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3">
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? 'SALVANDO...' : 'SALVAR PREFERÊNCIAS'}
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
         {successMsg && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-10 right-10 bg-green-500 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 z-50">
              <CheckCircle2 size={18} /> {successMsg}
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
