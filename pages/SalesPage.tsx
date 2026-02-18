
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Rocket, Trophy, Star, ArrowRight, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const SalesPage: React.FC = () => {
  const plans = [
    {
      name: "CREATOR ROAD",
      price: "97",
      features: ["500 Blueprints mensais", "IA Prioritária", "Workflow Completo", "Banco de Ganchos Completo"],
      highlight: false,
      cta: "ASSINAR AGORA"
    },
    {
      name: "PRO ROAD",
      price: "197",
      features: ["Blueprints Ilimitados", "Prioridade Máxima IA", "Suporte VIP WhatsApp", "Planejamento Avançado"],
      highlight: true,
      cta: "LIBERAR ACESSO ILIMITADO"
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-20 overflow-hidden relative">
      <div className="absolute inset-0 bg-yellow-400/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-20 relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-yellow-400 font-black uppercase tracking-widest text-[10px] italic transition-colors">
          <ChevronLeft size={16} /> VOLTAR AO INÍCIO
        </Link>

        <div className="text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full"
          >
            <Zap size={14} className="text-yellow-400" fill="currentColor" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-yellow-400 italic">Oferta de Upgrade Road</span>
          </motion.div>
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">
            ESCALE SUA <br /><span className="text-yellow-400">AUTORIDADE</span>
          </h1>
          <p className="text-zinc-500 font-bold text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed italic">
            Saia do limite gratuito e libere o poder total da nossa IA estrategista.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, idx) => (
            <motion.div 
              key={plan.name}
              initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`${plan.highlight ? 'bg-yellow-400 text-black p-12' : 'bg-zinc-900 border border-zinc-800 p-10 opacity-80'} rounded-[3rem] space-y-10 relative overflow-hidden group hover:scale-[1.02] transition-all`}
            >
              {plan.highlight && (
                <div className="absolute top-6 right-6 px-3 py-1 bg-black text-yellow-400 text-[8px] font-black uppercase tracking-widest rounded-full italic animate-pulse">
                  MAIS VENDIDO
                </div>
              )}
              <div className="space-y-4">
                <h4 className={`text-xl font-black italic uppercase tracking-tighter ${plan.highlight ? 'text-black' : 'text-zinc-500'}`}>{plan.name}</h4>
                <div className="text-6xl font-black italic tracking-tighter uppercase">R$ {plan.price}<span className="text-xs font-bold">/mês</span></div>
              </div>
              <ul className={`space-y-6 text-sm italic font-black ${plan.highlight ? 'text-black' : 'text-zinc-400'}`}>
                {plan.features.map((f: string) => <li key={f} className="flex items-center gap-3"><CheckCircle2 size={16} /> {f}</li>)}
              </ul>
              <button className={`w-full text-center py-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-2 ${plan.highlight ? 'bg-black text-white hover:scale-105' : 'bg-white text-black hover:bg-yellow-400'}`}>
                {plan.cta} <ArrowRight size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
