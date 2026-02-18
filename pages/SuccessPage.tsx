
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, Rocket, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

interface SuccessPageProps {
  user: User;
  onRefresh: () => Promise<void>;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ user, onRefresh }) => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initSync = async () => {
      // Sincronização imediata sem timeouts artificiais
      try {
        await onRefresh();
      } finally {
        setLoading(false);
      }
    };
    initSync();
  }, [onRefresh]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-yellow-400/5 blur-[150px] animate-pulse -z-0" />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-[3.5rem] p-12 text-center space-y-10 relative z-10 shadow-2xl"
      >
        {loading ? (
          <div className="space-y-8 py-10">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-20 h-20 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto text-yellow-400 border border-yellow-400/20">
              <Loader2 size={40} />
            </motion.div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">SINCRONIZANDO ACESSO</h2>
              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest italic">Atualizando sua jornada na Viral Cloud...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative inline-block">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-24 h-24 bg-yellow-400 text-black rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-yellow-400/20"
              >
                <Trophy size={48} />
              </motion.div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-4 -right-4 text-yellow-400"
              >
                <Sparkles size={32} />
              </motion.div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">SEJA BEM-VINDO <br /><span className="text-yellow-400">À ELITE ROAD</span></h1>
              <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest italic leading-relaxed">Sua conta foi atualizada com sucesso. Prepare-se para dominar o algoritmo com força total.</p>
            </div>

            <div className="bg-zinc-800/40 p-6 rounded-2xl border border-zinc-700 flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-white tracking-widest italic">Acesso Ilimitado Ativado</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase italic">Blueprints e Acervo Cloud Liberados.</p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full bg-yellow-400 text-black py-6 rounded-2xl font-black uppercase tracking-[0.3em] shadow-xl shadow-yellow-400/20 hover:bg-yellow-500 transition-all flex items-center justify-center gap-4 text-[10px] active:scale-95"
            >
              ACESSAR MEU PAINEL <ArrowRight size={20} />
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default SuccessPage;
