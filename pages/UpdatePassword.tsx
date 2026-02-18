
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Lock, ShieldCheck, Loader2, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Sessão expirada ou link inválido. Solicite uma nova recuperação na tela de login.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres para sua segurança.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-yellow-400/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="mb-10 text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full">
            <ShieldCheck size={14} className="text-green-500" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Ambiente Seguro Road</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">
            NOVA <span className="text-yellow-400">SENHA</span>
          </h1>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest italic text-center">A escala não pode parar por falta de acesso</p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400/20" />
          
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6 space-y-8"
              >
                <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-green-500/10 animate-bounce">
                  <CheckCircle2 size={48} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter">ACESSO RESTAURADO</h3>
                  <p className="text-zinc-400 text-[10px] font-black italic uppercase tracking-[0.2em] leading-relaxed">
                    Sua nova credencial foi sincronizada com a Road Cloud. Redirecionando...
                  </p>
                </div>
                <div className="flex justify-center">
                  <Loader2 className="animate-spin text-yellow-400" size={28} />
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-2xl"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-2 italic">Nova Senha</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input
                        type="password"
                        required
                        className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-2xl p-4.5 pl-12 focus:border-yellow-400 outline-none transition-all placeholder:text-zinc-700 text-sm font-bold italic"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-2 italic">Confirme sua Senha</label>
                    <div className="relative">
                      <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input
                        type="password"
                        required
                        className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-2xl p-4.5 pl-12 focus:border-yellow-400 outline-none transition-all placeholder:text-zinc-700 text-sm font-bold italic"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 text-black font-black py-5 rounded-2xl transition-all shadow-xl shadow-yellow-400/20 active:scale-95 text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} fill="currentColor" />}
                  {loading ? 'SINCRONIZANDO...' : 'ATUALIZAR CREDENCIAIS'}
                </button>
                
                <p className="text-[9px] text-zinc-600 font-bold italic text-center uppercase tracking-widest">
                  Esta ação encerrará outras sessões ativas por segurança.
                </p>
              </form>
            )}
          </AnimatePresence>
        </motion.div>
        
        {!success && (
          <div className="mt-10 text-center animate-in fade-in duration-1000 delay-500">
            <Link to="/login" className="text-[9px] font-black text-zinc-600 hover:text-white uppercase tracking-[0.4em] italic transition-colors">
              ABORTAR E VOLTAR
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdatePassword;
