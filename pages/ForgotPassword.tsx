
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { ChevronLeft, Mail, CheckCircle2, Zap, Loader2, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/update-password`,
      });

      if (resetError) throw resetError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError('');
    if (success) setSuccess(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 transition-colors duration-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-yellow-400/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-md w-full relative z-10">
        <div className="mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full mb-6">
            <Zap size={14} className="text-yellow-400" fill="currentColor" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 italic">Central de Segurança Road</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2 italic uppercase">
            RESGATE <span className="text-yellow-400">ROAD</span>
          </h1>
          <p className="text-zinc-500 font-bold text-xs italic uppercase tracking-widest">Recupere o acesso à sua estratégia de escala</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400/20" />
          
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div 
                  key="success-preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8"
                >
                  <div className="p-6 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-3">
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>Link enviado com sucesso!</span>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center italic">Pré-visualização do e-mail enviado:</p>
                    
                    {/* MOCK EMAIL PREVIEW - DARK THEME AS REQUESTED */}
                    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6 text-left">
                      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
                        <Zap size={18} className="text-yellow-400" fill="currentColor" />
                        <span className="text-[10px] font-black text-white italic tracking-tighter">VIRAL ROAD <span className="text-yellow-400">SECURITY</span></span>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-sm font-black text-white italic uppercase tracking-tight">Redefinição de Senha</h4>
                        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                          Recebemos uma solicitação para redefinir sua senha na Viral Road. Clique no botão abaixo para prosseguir com a escala:
                        </p>
                        
                        <div className="py-4">
                          <div className="bg-yellow-400 text-black py-3 px-6 rounded-xl text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-lg shadow-yellow-400/20">
                            REDEFINIR SENHA AGORA <ArrowUpRight size={14} />
                          </div>
                        </div>
                        
                        <p className="text-[8px] text-zinc-600 italic">Se você não solicitou isso, ignore este e-mail.</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-zinc-500 font-bold text-xs italic text-center leading-relaxed">
                    Verifique sua caixa de entrada e SPAM. <br />
                    O e-mail possui <span className="text-white">fundo escuro</span> para sua segurança.
                  </p>

                  <div className="pt-4 text-center border-t border-zinc-800">
                    <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all italic group">
                      <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> VOLTAR AO LOGIN
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="overflow-hidden"
                    >
                      <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-3">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{error}</span>
                      </div>
                    </motion.div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block ml-2 italic">Seu E-mail de Cadastro</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input
                        type="email"
                        required
                        className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-2xl p-4.5 pl-12 focus:border-yellow-400 outline-none transition-all placeholder:text-zinc-700 text-sm font-bold italic"
                        value={email}
                        onChange={handleInputChange}
                        placeholder="exemplo@email.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-5 rounded-2xl transition-all shadow-xl shadow-yellow-400/20 active:scale-95 text-[10px] uppercase tracking-[0.3em] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} fill="currentColor" />}
                    {loading ? 'PROCESSANDO...' : 'ENVIAR LINK DE RESGATE'}
                  </button>

                  <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-800 flex items-start gap-3 text-left">
                    <Sparkles size={16} className="text-yellow-400 shrink-0 mt-1" />
                    <p className="text-[10px] text-zinc-400 font-bold italic leading-tight">Dica: Nosso e-mail de segurança tem fundo escuro. Verifique se o remetente é @viralroad.tech.</p>
                  </div>

                  <div className="mt-4 text-center border-t border-zinc-800 pt-8">
                    <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all italic group">
                      <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> VOLTAR AO LOGIN
                    </Link>
                  </div>
                </form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
