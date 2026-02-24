
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Mail, Lock, Sparkles, ArrowRight, Loader2, Zap, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Login: React.FC<{ onLogin: any }> = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Lógica de conta DEMO
      if (email === 'admin@admin' && password === '12345678') {
        // Simula login bem sucedido para o admin
        // No App.tsx trataremos o status PRO
        const { data, error: demoError } = await supabase.auth.signInWithPassword({
          email: 'admin@admin',
          password: '12345678',
        });
        
        if (demoError) {
          // Se não existir, tentamos criar ou apenas falhamos se o Supabase não permitir
          // Mas para o teste, vamos assumir que o usuário pode ser "fake" se o Supabase falhar
          // No entanto, o melhor é tentar o login real primeiro.
          // Se falhar, podemos tentar um "bypass" se o ambiente permitir, 
          // mas o Supabase Auth precisa de um usuário real.
          // Vou assumir que o admin@admin existe ou será criado.
          throw demoError;
        }
        if (data?.session) navigate('/dashboard');
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (data?.session) navigate('/dashboard');
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 transition-colors duration-500 overflow-hidden relative">
      <div className="absolute inset-0 bg-yellow-400/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-yellow-400 transition-colors italic group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Início
          </Link>
        </div>

        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2 italic">
            VIRAL <span className="text-yellow-400">ROAD</span>
          </h1>
          <p className="text-zinc-500 font-bold text-sm italic">Onde a estratégia encontra a escala</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden relative">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded-2xl">
                {error}
              </motion.div>
            )}
            {message && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2">
                <Sparkles size={14} /> {message}
              </motion.div>
            )}
          </AnimatePresence>
          
          <form onSubmit={handlePasswordLogin} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-2 ml-2 italic">Seu E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-2xl p-4 pl-12 focus:border-yellow-400 outline-none transition-all placeholder:text-zinc-400 text-sm font-bold italic"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-2">
                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest italic">Senha Secreta</label>
                <Link to="/forgot-password" className="text-[9px] font-black text-yellow-600 dark:text-yellow-400 uppercase tracking-widest hover:underline italic">Esqueci a senha</Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-2xl p-4 pl-12 focus:border-yellow-400 outline-none transition-all placeholder:text-zinc-400 text-sm font-bold italic"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-yellow-400/20 active:scale-95 text-[10px] uppercase tracking-widest disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} fill="currentColor" />}
              {loading ? 'CONECTANDO...' : 'ENTRAR NA ESTRADA'}
            </button>
          </form>
          
          <div className="mt-8 text-center text-xs border-t dark:border-zinc-800 pt-8">
            <span className="text-zinc-400 dark:text-zinc-500 font-bold italic">Ainda não é membro? </span>
            <Link to="/register" className="text-yellow-600 dark:text-yellow-400 font-black hover:underline underline-offset-4 uppercase tracking-widest text-[10px] ml-1">Criar conta grátis</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
