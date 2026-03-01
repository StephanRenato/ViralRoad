
import React, { useState, useEffect } from 'react';
import { Key, AlertTriangle, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface GeminiKeyGuardProps {
  children: React.ReactNode;
}

const GeminiKeyGuard: React.FC<GeminiKeyGuardProps> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  const checkKey = async () => {
    try {
      // Primeiro, verifica se o servidor já tem uma chave válida
      const healthResponse = await fetch('/api/gemini-health');
      if (healthResponse.ok) {
        setHasKey(true);
        return;
      }

      // Se o servidor não tem chave, verifica se o usuário pode selecionar uma
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        // Se não estiver no ambiente do AI Studio e o health falhou, algo está errado
        setHasKey(false);
      }
    } catch (error) {
      console.error("Erro ao verificar chave Gemini:", error);
      setHasKey(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Após abrir o diálogo, assumimos sucesso para prosseguir, 
      // conforme as diretrizes para evitar race conditions.
      setHasKey(true);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-yellow-400"></div>
      </div>
    );
  }

  if (hasKey === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-400/10 text-yellow-400 mb-2">
            <Key size={32} />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Configuração Necessária</h1>
            <p className="text-zinc-400 text-sm">
              Para utilizar as funcionalidades de Inteligência Artificial do Viral Road, você precisa selecionar uma chave de API do Google Gemini.
            </p>
          </div>

          <div className="bg-zinc-800/50 rounded-xl p-4 text-left border border-zinc-700/50 flex gap-3">
            <AlertTriangle className="text-yellow-400 shrink-0" size={18} />
            <div className="text-xs text-zinc-300 space-y-2">
              <p>
                Acesse o <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline inline-flex items-center gap-1">documento de faturamento <ExternalLink size={10} /></a> para mais detalhes.
              </p>
              <p>
                Você deve selecionar uma chave de API de um projeto pago do Google Cloud para modelos avançados.
              </p>
            </div>
          </div>

          <button
            onClick={handleSelectKey}
            className="w-full py-4 px-6 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-yellow-400/20"
          >
            Selecionar Chave de API
          </button>
          
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
            Viral Road | AI Engine
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default GeminiKeyGuard;
