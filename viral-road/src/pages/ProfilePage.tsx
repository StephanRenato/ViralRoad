import React, { useState, useEffect } from 'react';
import { User, ProfileType, SubscriptionStatus, PlanType } from '../types';
import { supabase } from '../services/supabase';
import { 
  User as UserIcon, Mail, Shield, CreditCard, LogOut, 
  Save, Loader2, Plus, Trash2, ExternalLink, AlertTriangle, 
  CheckCircle2, Bell, Instagram, Youtube, Twitter, Globe, Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onOpenUpgrade: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onOpenUpgrade }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [localProfile, setLocalProfile] = useState({
    name: user.name || '',
    specialization: user.specialization || '',
    notificationsAiDaily: user.notificationsAiDaily ?? true,
    notificationsEngagement: user.notificationsEngagement ?? true,
    socialProfiles: user.socialProfiles || []
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
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Erro ao atualizar perfil:', e);
      alert('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  // Gestão de Redes Sociais
  const handleAddSocial = () => {
    let rawUrl = newSocial.url.trim();
    if (!rawUrl) return;

    // Normalização Inteligente de URL
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = `https://${rawUrl}`;
    }

    try {
      const urlObj = new URL(rawUrl);
      if (urlObj.hostname.split('.').length < 2) {
        throw new Error("Domínio inválido");
      }
    } catch (e) {
      setUrlError('URL inválida. Tente o formato: instagram.com/seu_usuario');
      return;
    }

    setUrlError('');
    const updated = [...localProfile.socialProfiles, { ...newSocial, url: rawUrl }];
    setLocalProfile(prev => ({ ...prev, socialProfiles: updated }));
    setNewSocial({ platform: 'Instagram', url: '' });
  };

  const handleRemoveSocial = (index: number) => {
    const updated = [...localProfile.socialProfiles];
    updated.splice(index, 1);
    setLocalProfile(prev => ({ ...prev, socialProfiles: updated }));
  };

  const isPro = user.currentPlan === PlanType.Pro;

  return (
    <div className="p-4 md:p-10 space-y-10 animate-in fade-in duration-500 pb-32 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">Road <span className="text-yellow-400">Profile</span></h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] italic mt-2">Gerencie sua identidade e assinatura.</p>
        </div>
        <button 
          onClick={onLogout}
          className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
        >
          <LogOut size={14} /> Encerrar Sessão
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal - Dados do Perfil */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 md:p-10 space-y-8 shadow-xl">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-yellow-400 text-black rounded-[2rem] flex items-center justify-center font-black text-2xl italic shadow-2xl shadow-yellow-400/20">
                {user.name?.[0] || user.email[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase text-zinc-900 dark:text-white">{user.name || 'Estrategista'}</h3>
                <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest italic">{user.email}</p>
                <div className="mt-2 flex gap-2">
                  <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[9px] font-black uppercase rounded-lg border border-zinc-200 dark:border-zinc-700 italic">{user.profileType}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic ml-2">Nome de Exibição</label>
                  <div className="relative">
                     <UserIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                     <input 
                      type="text" 
                      value={localProfile.name}
                      onChange={e => setLocalProfile({...localProfile, name: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 pl-12 rounded-2xl text-xs font-bold border border-zinc-100 dark:border-zinc-800 outline-none focus:border-yellow-400 transition-all"
                     />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic ml-2">Especialização</label>
                  <div className="relative">
                     <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                     <input 
                      type="text" 
                      value={localProfile.specialization}
                      onChange={e => setLocalProfile({...localProfile, specialization: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 pl-12 rounded-2xl text-xs font-bold border border-zinc-100 dark:border-zinc-800 outline-none focus:border-yellow-400 transition-all"
                     />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white italic flex items-center gap-2">
                  <Globe size={14} className="text-yellow-400" /> Redes Conectadas
                </h4>
                
                <div className="space-y-3">
                  {localProfile.socialProfiles.map((social: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500">
                             {social.platform === 'Instagram' ? <Instagram size={14} /> : social.platform === 'YouTube' ? <Youtube size={14} /> : <Globe size={14} />}
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase text-zinc-700 dark:text-zinc-300 italic">{social.platform}</p>
                             <p className="text-[9px] font-medium text-zinc-400 truncate max-w-[200px]">{social.url}</p>
                          </div>
                       </div>
                       <button onClick={() => handleRemoveSocial(idx)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                       </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 items-start">
                   <select 
                    value={newSocial.platform}
                    onChange={e => setNewSocial({...newSocial, platform: e.target.value})}
                    className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl text-[10px] font-bold uppercase border-none outline-none w-32"
                   >
                     <option value="Instagram">Instagram</option>
                     <option value="TikTok">TikTok</option>
                     <option value="YouTube">YouTube</option>
                     <option value="LinkedIn">LinkedIn</option>
                     <option value="Website">Website</option>
                   </select>
                   <div className="flex-1 space-y-1">
                      <input 
                        type="text" 
                        placeholder="Cole a URL do perfil..."
                        value={newSocial.url}
                        onChange={e => setNewSocial({...newSocial, url: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl text-[10px] font-bold border-none outline-none focus:ring-1 focus:ring-yellow-400"
                      />
                      {urlError && <p className="text-[9px] text-red-500 font-bold ml-2">{urlError}</p>}
                   </div>
                   <button 
                    onClick={handleAddSocial}
                    className="p-3 bg-yellow-400 text-black rounded-xl hover:bg-yellow-500 transition-colors"
                   >
                     <Plus size={16} />
                   </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave} 
                disabled={saving}
                className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>
            
            <AnimatePresence>
               {successMsg && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <CheckCircle2 size={14} /> {successMsg}
                 </motion.div>
               )}
            </AnimatePresence>
          </div>
        </div>

        {/* Coluna Lateral - Plano e Configurações */}
        <div className="space-y-6">
          <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-yellow-400/10 blur-[50px] group-hover:bg-yellow-400/20 transition-all duration-700" />
             
             <div className="relative z-10 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="p-3 bg-zinc-800 rounded-2xl border border-zinc-700">
                      <CreditCard className="text-yellow-400" size={20} />
                   </div>
                   {isPro ? (
                     <span className="px-3 py-1 bg-yellow-400 text-black text-[9px] font-black uppercase rounded-lg tracking-widest">Ativo</span>
                   ) : (
                     <span className="px-3 py-1 bg-zinc-700 text-zinc-400 text-[9px] font-black uppercase rounded-lg tracking-widest">Básico</span>
                   )}
                </div>

                <div>
                   <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">Plano Atual</h3>
                   <p className="text-3xl font-black italic uppercase mt-1">{isPro ? 'ROAD PRO' : 'CREATOR'}</p>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] font-black uppercase italic">
                      <span className="text-zinc-400">Uso Mensal</span>
                      <span>{user.usedBlueprints} / {isPro ? '∞' : user.monthlyLimit}</span>
                   </div>
                   <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(((user.usedBlueprints || 0) / (user.monthlyLimit || 1)) * 100, 100)}%` }} 
                      />
                   </div>
                </div>

                {!isPro && (
                   <button 
                    onClick={onOpenUpgrade}
                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-black rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2"
                   >
                     FAZER UPGRADE <ExternalLink size={12} />
                   </button>
                )}
             </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-lg">
             <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] italic mb-6 flex items-center gap-2">
                <Bell size={14} className="text-yellow-400" /> Notificações
             </h4>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-[11px] font-bold italic text-zinc-700 dark:text-zinc-300">Resumo Diário da IA</span>
                   <button 
                    onClick={() => setLocalProfile({...localProfile, notificationsAiDaily: !localProfile.notificationsAiDaily})}
                    className={`w-10 h-6 rounded-full p-1 transition-colors ${localProfile.notificationsAiDaily ? 'bg-yellow-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                   >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${localProfile.notificationsAiDaily ? 'translate-x-4' : ''}`} />
                   </button>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[11px] font-bold italic text-zinc-700 dark:text-zinc-300">Dicas de Engajamento</span>
                   <button 
                    onClick={() => setLocalProfile({...localProfile, notificationsEngagement: !localProfile.notificationsEngagement})}
                    className={`w-10 h-6 rounded-full p-1 transition-colors ${localProfile.notificationsEngagement ? 'bg-yellow-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}
                   >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${localProfile.notificationsEngagement ? 'translate-x-4' : ''}`} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;