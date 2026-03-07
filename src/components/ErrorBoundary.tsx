import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
    console.log("🛡️ ErrorBoundary: Ativado.");
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-3xl flex items-center justify-center mx-auto">
              <AlertTriangle size={40} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-white italic">
                Ops! Algo deu errado
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                A Engine Road encontrou um erro inesperado. Isso pode ser causado por uma falha de conexão ou um módulo que não carregou corretamente.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl text-left overflow-hidden">
                <p className="text-[10px] font-mono text-zinc-400 uppercase mb-1">Detalhes do Erro:</p>
                <p className="text-[11px] font-mono text-red-500 dark:text-red-400 break-all line-clamp-3">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 p-4 bg-yellow-400 hover:bg-yellow-500 text-black rounded-2xl font-black uppercase text-[11px] transition-all active:scale-95 shadow-lg shadow-yellow-400/20"
              >
                <RefreshCw size={16} />
                Recarregar
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 p-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-black uppercase text-[11px] transition-all active:scale-95"
              >
                <Home size={16} />
                Início
              </button>
            </div>
            
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic">
              Viral Road • Recovery Mode
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
