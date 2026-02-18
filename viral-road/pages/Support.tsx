import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix: Adicionando imports de React, useState e useEffect para resolver erros de nomes não encontrados e garantindo exportação padrão
const Support: React.FC = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Carregamento imediato
    setIsReady(true);
  }, []);

  if (!isReady) return null;

  return (
    <div className="bg-zinc-950 text-white min-h-screen font-sans selection:bg-yellow-400 selection:text-black py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-yellow-400 font-black uppercase tracking-widest text-[10px] italic transition-colors">
          <ChevronLeft size={16} /> Voltar para Início
        </Link>
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center text-yellow-400 mb-6">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase">Suporte <span className="text-yellow-400">Road</span></h1>
          <p className="text-zinc-500 font-bold italic">Como podemos acelerar sua jornada hoje?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] space-y-4 hover:border-yellow-400/30 transition-all">
            <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center text-yellow-400">
              <Mail size={20} />
            </div>
            <h3 className="text-xl font-black italic uppercase">E-mail de Suporte</h3>
            <p className="text-zinc-400 font-bold">suporte@viralroad.tech</p>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest italic">Tempo médio de resposta: 24h</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] space-y-4 hover:border-yellow-400/30 transition-all">
            <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center text-yellow-400">
              <Phone size={20} />
            </div>
            <h3 className="text-xl font-black italic uppercase">VIP WhatsApp</h3>
            <p className="text-zinc-400 font-bold">+55 (11) 99999-9999</p>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest italic">Exclusivo para assinantes PRO</p>
          </div>
        </div>
        
        <div className="pt-10 border-t border-zinc-900 text-[10px] font-black uppercase text-zinc-700 italic tracking-[0.3em]">
          © 2025 VIRAL ROAD TECH • ESTAMOS COM VOCÊ EM CADA QUILÔMETRO.
        </div>
      </div>
    </div>
  );
};

export default Support;