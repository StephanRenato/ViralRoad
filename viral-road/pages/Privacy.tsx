
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Shield } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <div className="bg-zinc-950 text-white min-h-screen font-sans selection:bg-yellow-400 selection:text-black py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-yellow-400 font-black uppercase tracking-widest text-[10px] italic transition-colors">
          <ChevronLeft size={16} /> Voltar para Início
        </Link>
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center text-yellow-400 mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase">Política de <span className="text-yellow-400">Privacidade</span></h1>
          <p className="text-zinc-500 font-bold italic">Última atualização: Janeiro de 2025</p>
        </div>

        <div className="space-y-8 text-zinc-400 leading-relaxed font-medium">
          <section className="space-y-4">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">1. Coleta de Dados</h2>
            <p>Coletamos informações essenciais para o funcionamento da plataforma, como nome, e-mail e preferências de nicho de conteúdo, para personalizar sua experiência com nossa inteligência artificial.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">2. Uso da Inteligência Artificial</h2>
            <p>Os briefings e temas inseridos por você são processados via API do Google Gemini para a geração de roteiros. Não compartilhamos seus dados brutos com terceiros para fins publicitários.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">3. Segurança Cloud</h2>
            <p>Utilizamos infraestrutura Supabase com Row Level Security (RLS) para garantir que apenas você tenha acesso aos seus blueprints e acervo pessoal de ganchos.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">4. Cookies</h2>
            <p>Utilizamos cookies apenas para manter sua sessão ativa e salvar suas preferências de tema (Claro/Escuro).</p>
          </section>
        </div>
        
        <div className="pt-10 border-t border-zinc-900 text-[10px] font-black uppercase text-zinc-700 italic tracking-[0.3em]">
          © 2025 VIRAL ROAD TECH • SEGURANÇA EM PRIMEIRO LUGAR.
        </div>
      </div>
    </div>
  );
};

export default Privacy;
