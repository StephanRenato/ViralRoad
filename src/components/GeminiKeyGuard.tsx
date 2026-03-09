
import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';

interface GeminiKeyGuardProps {
  children: React.ReactNode;
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const GeminiKeyGuard: React.FC<GeminiKeyGuardProps> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const checkKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      try {
        const result = await window.aistudio.hasSelectedApiKey();
        setHasKey(result);
      } catch (e) {
        console.error("Erro ao verificar chave:", e);
        setHasKey(false);
      }
    } else {
      // Se não estiver no ambiente que suporta a seleção de chave, assume que está tudo bem
      // (usará a chave do ambiente)
      setHasKey(true);
    }
    setChecking(false);
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume sucesso e prossegue para evitar race conditions
      setHasKey(true);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-yellow-400" size={32} />
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl text-center space-y-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-yellow-400/5 blur-3xl pointer-events-none" />
          
          <div className="w-20 h-20 bg-yellow-400/10 text-yellow-400 rounded-3xl flex items-center justify-center mx-auto relative z-10">
            <Key size={40} />
          </div>
          
          <div className="space-y-3 relative z-10">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-white italic">
              Acesso <span className="text-yellow-400">Road AI</span>
            </h1>
            <p className="text-sm text-zinc-400 font-bold leading-relaxed italic">
              Para utilizar os modelos avançados da Engine Road, você precisa selecionar uma chave de API válida.
            </p>
          </div>

          <div className="bg-zinc-800/50 p-6 rounded-2xl text-left border border-zinc-700/50 space-y-4 relative z-10">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
              <p className="text-[11px] text-zinc-300 font-medium">Sua chave é processada de forma segura e nunca é armazenada em nossos servidores.</p>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="text-yellow-500 shrink-0" size={18} />
              <p className="text-[11px] text-zinc-300 font-medium">Certifique-se de usar uma chave de um projeto com faturamento ativado.</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <button
              onClick={handleSelectKey}
              className="w-full py-5 bg-yellow-400 hover:bg-yellow-500 text-black rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-xl shadow-yellow-400/20"
            >
              Selecionar Chave de API
            </button>
            
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
            >
              Documentação de Faturamento <ExternalLink size={12} />
            </a>
          </div>
          
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 italic">
            Viral Road • Security Layer
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default GeminiKeyGuard;
