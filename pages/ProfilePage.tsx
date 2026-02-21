import React, { useState, useEffect } from 'react';
import { User, PlanType } from '../types';
import { supabase } from '../services/supabase';
import { 
  User as UserIcon, LogOut, Save, Loader2, 
  CheckCircle2, Bell, Zap, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  });

  useEffect(() => {
    setLocalProfile({
      name: user.name || '',
      specialization: user.specialization || '',
      notificationsAiDaily: user.notificationsAiDaily ?? true,
      notificationsEngagement: user.notificationsEngagement ?? true,
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
          settings: {
             notifications_ai_daily: localProfile.notificationsAiDaily,
             notifications_engagement: localProfile.notificationsEngagement
          }
        })
        .eq('id', user.id);

      if (error) throw error;
      setSuccessMsg('Perfil Sincronizado!');
      if (onRefreshUser) onRefreshUser();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      alert('Erro ao salvar.');
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