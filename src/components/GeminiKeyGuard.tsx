
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const checkKey = async () => {
    try {
      setChecking(true);
      setErrorMsg(null);
      // Primeiro, verifica se o servidor já tem uma chave válida
      const healthResponse = await fetch('/api/gemini-health');
      const data = await healthResponse.json();

      if (healthResponse.ok && data.status === 'ok') {
        setHasKey(true);
        return;
      }

      // Se o servidor retornou erro de chave inválida, forçamos a seleção
      if (data.code === 'GEMINI_KEY_INVALID') {
        setErrorMsg("A chave selecionada anteriormente é inválida ou expirou.");
        setHasKey(false);
        return;
      }

      if (data.code === 'GEMINI_KEY_MISSING') {
        setHasKey(false);
        return;
      }

      // Se o servidor não tem chave, verifica se o usuário pode selecionar uma
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
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
      try {
        await window.aistudio.openSelectKey();
        // Conforme as diretrizes, assumimos sucesso após abrir o diálogo
        // para evitar bloqueios por race conditions.
        setHasKey(true);
        
        // No entanto, agendamos uma verificação silenciosa em breve
        setTimeout(() => {
          checkKey();
        }, 2000);
      } catch (e) {
        console.error("Erro ao abrir seletor de chave:", e);
      }
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
            {errorMsg && (
              <p className="text-red-400 text-xs font-medium bg-red-400/10 py-2 px-3 rounded-lg border border-red-400/20">
                {errorMsg}
              </p>
            )}
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

          <div className="flex flex-col gap-3">
            <button
              onClick={handleSelectKey}
              className="w-full py-4 px-6 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-xl transition-all transform active:scale-95 shadow-lg shadow-yellow-400/20"
            >
              Selecionar Chave de API
            </button>
            
            <button
              onClick={checkKey}
              className="w-full py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl transition-all text-sm"
            >
              Já selecionei, verificar novamente
            </button>
          </div>
          
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
