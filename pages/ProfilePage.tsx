import React, { useState, useEffect } from 'react';
import { User, PlanType } from '../types';
import { supabase } from '../services/supabase';
import { 
  User as UserIcon, LogOut, Save, Loader2, 
  CheckCircle2, Bell, Zap, Camera, Instagram, Youtube, Music2, Trash2, Plus, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Platform } from '../types';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  onOpenUpgrade: () => void;
  onRefreshUser?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, onOpenUpgrade, onRefreshUser }) => {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [localProfile, setLocalProfile] = useState({
    name: user.name || '',
    specialization: user.specialization || '',
    notificationsAiDaily: user.notificationsAiDaily ?? true,
    notificationsEngagement: user.notificationsEngagement ?? true,
    socialProfiles: user.socialProfiles || []
  });

  const [newSocial, setNewSocial] = useState({ platform: Platform.Instagram, url: '' });

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
    setSuccessMsg('');
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Sessão expirada");

      // 1. Tenta o salvamento completo no banco de dados
      const fullPayload = {
        id: user.id,
        name: localProfile.name,
        specialization: localProfile.specialization,
        social_profiles: localProfile.socialProfiles,
        settings: {
           notifications_ai_daily: localProfile.notificationsAiDaily,
           notifications_engagement: localProfile.notificationsEngagement
        }
      };

      const { error: fullError } = await supabase
        .from('profiles')
        .upsert(fullPayload, { onConflict: 'id' });

      if (fullError) {
        console.warn("Falha no salvamento completo, tentando modo de compatibilidade...", fullError);
        
        // 2. Se falhar por coluna ausente, tenta salvar apenas o básico
        const basicPayload = {
          id: user.id,
          name: localProfile.name,
          specialization: localProfile.specialization
        };

        const { error: basicError } = await supabase
          .from('profiles')
          .upsert(basicPayload, { onConflict: 'id' });

        if (basicError) {
          console.error("Falha no salvamento básico:", basicError);
          // 3. Se tudo falhar no banco, salva no Metadata do Auth (Garante que não perca os dados)
          const { error: authError } = await supabase.auth.updateUser({
            data: {
              name: localProfile.name,
              specialization: localProfile.specialization,
              social_profiles: localProfile.socialProfiles,
              settings: {
                notifications_ai_daily: localProfile.notificationsAiDaily,
                notifications_engagement: localProfile.notificationsEngagement
              }
            }
          });
          
          if (authError) throw authError;
          setSuccessMsg('Perfil Salvo (Modo de Segurança)');
        } else {
          // Salvou o básico, agora tenta salvar o resto no metadata para não perder
          await supabase.auth.updateUser({
            data: {
              social_profiles: localProfile.socialProfiles,
              settings: {
                notifications_ai_daily: localProfile.notificationsAiDaily,
                notifications_engagement: localProfile.notificationsEngagement
              }
            }
          });
          setSuccessMsg('Perfil Sincronizado!');
        }
      } else {
        setSuccessMsg('Perfil Sincronizado!');
      }

      if (onRefreshUser) onRefreshUser();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      console.error("Erro crítico ao salvar perfil:", e);
      alert(`Erro ao salvar: ${e.message || 'Verifique sua conexão'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-10 animate-in fade-in duration-500 pb-32 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-white">Road <span className="text-yellow-400">Profile</span></h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em] italic mt-2">Central de identidade Viral Road.</p>
        </div>
        <button onClick={onLogout} className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
          <LogOut size={14} /> Encerrar Sessão
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] p-8 md:p-10 space-y-8 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-zinc-400 italic flex items-center gap-2">
                 <UserIcon size={14} className="text-yellow-400" /> Identidade
              </h4>
              <div className="space-y-4">
                 <input type="text" placeholder="Nome" value={localProfile.name} onChange={e => setLocalProfile({...localProfile, name: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl text-xs font-bold border dark:border-zinc-800 outline-none focus:border-yellow-400" />
                 <input type="text" placeholder="Especialidade" value={localProfile.specialization} onChange={e => setLocalProfile({...localProfile, specialization: e.target.value})} className="w-full bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl text-xs font-bold border dark:border-zinc-800 outline-none focus:border-yellow-400" />
              </div>
           </div>

           <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase text-zinc-400 italic flex items-center gap-2">
                 <Bell size={14} className="text-yellow-400" /> Preferências
              </h4>
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl">
                    <span className="text-[11px] font-bold italic">Resumo Diário</span>
                    <button onClick={() => setLocalProfile({...localProfile, notificationsAiDaily: !localProfile.notificationsAiDaily})} className={`w-10 h-6 rounded-full p-1 transition-colors ${localProfile.notificationsAiDaily ? 'bg-yellow-400' : 'bg-zinc-300'}`}>
                       <div className={`w-4 h-4 bg-white rounded-full transition-transform ${localProfile.notificationsAiDaily ? 'translate-x-4' : ''}`} />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-6 pt-8 border-t dark:border-zinc-800">
            <h4 className="text-[10px] font-black uppercase text-zinc-400 italic flex items-center gap-2">
               <Globe size={14} className="text-yellow-400" /> Contas Conectadas
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {localProfile.socialProfiles.map((profile, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl border dark:border-zinc-800/50">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-zinc-800 rounded-xl">
                           {profile.platform === Platform.Instagram && <Instagram size={16} className="text-pink-500" />}
                           {profile.platform === Platform.TikTok && <Music2 size={16} className="text-cyan-400" />}
                           {profile.platform === Platform.YouTube && <Youtube size={16} className="text-red-500" />}
                           {profile.platform === Platform.Kwai && <Zap size={16} className="text-yellow-400" />}
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase italic">{profile.platform}</p>
                           <p className="text-[9px] font-bold text-zinc-500 truncate max-w-[150px]">{profile.username || profile.url}</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => {
                           const updated = localProfile.socialProfiles.filter((_, i) => i !== idx);
                           setLocalProfile({...localProfile, socialProfiles: updated});
                        }}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                     >
                        <Trash2 size={14} />
                     </button>
                  </div>
               ))}

               <div className="p-4 bg-zinc-50 dark:bg-zinc-800/10 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
                  <div className="flex gap-2">
                     <select 
                        value={newSocial.platform} 
                        onChange={e => setNewSocial({...newSocial, platform: e.target.value as Platform})}
                        className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl px-2 py-2 text-[10px] font-black uppercase outline-none focus:border-yellow-400"
                     >
                        <option value={Platform.Instagram}>Instagram</option>
                        <option value={Platform.TikTok}>TikTok</option>
                        <option value={Platform.YouTube}>YouTube</option>
                        <option value={Platform.Kwai}>Kwai</option>
                     </select>
                     <input 
                        type="text" 
                        placeholder="URL do Perfil" 
                        value={newSocial.url}
                        onChange={e => setNewSocial({...newSocial, url: e.target.value})}
                        className="flex-1 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl px-3 py-2 text-[10px] font-bold outline-none focus:border-yellow-400"
                     />
                  </div>
                  <button 
                     onClick={() => {
                        if (!newSocial.url) return;
                        const exists = localProfile.socialProfiles.some(p => p.platform === newSocial.platform);
                        if (exists) {
                           alert(`Você já tem um perfil de ${newSocial.platform} conectado.`);
                           return;
                        }
                        const newEntry = {
                           platform: newSocial.platform,
                           url: newSocial.url,
                           username: newSocial.url.split('/').pop() || '',
                           normalized_metrics: { followers: 0, following: 0, likes: 0, posts: 0, views: 0, engagement_rate: 0, bio: '', avatar_url: '', external_link: '', verified: false, is_private: false },
                           analysis_ai: null,
                           raw_apify_data: null,
                           last_sync: new Date().toISOString()
                        };
                        setLocalProfile({...localProfile, socialProfiles: [...localProfile.socialProfiles, newEntry]});
                        setNewSocial({ platform: Platform.Instagram, url: '' });
                     }}
                     className="w-full py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                     <Plus size={12} /> Adicionar Conta
                  </button>
               </div>
            </div>
        </div>

        <div className="flex justify-end pt-8">
           <button onClick={handleSave} disabled={saving} className="px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3">
             {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
             SALVAR ALTERAÇÕES
           </button>
        </div>
      </div>

      <AnimatePresence>
         {successMsg && (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-10 right-10 bg-green-500 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase shadow-2xl z-50">
              <CheckCircle2 size={18} /> {successMsg}
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;