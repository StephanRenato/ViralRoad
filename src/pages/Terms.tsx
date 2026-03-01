
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <div className="bg-zinc-950 text-white min-h-screen font-sans selection:bg-yellow-400 selection:text-black py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-yellow-400 font-black uppercase tracking-widest text-[10px] italic transition-colors">
          <ChevronLeft size={16} /> Voltar para Início
        </Link>
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-yellow-400/10 rounded-2xl flex items-center justify-center text-yellow-400 mb-6">
            <FileText size={32} />
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase">Termos de <span className="text-yellow-400">Uso</span></h1>
          <p className="text-zinc-500 font-bold italic">Vigente a partir de: 01 de Janeiro de 2025</p>
        </div>

        <div className="space-y-8 text-zinc-400 leading-relaxed font-medium">
          <section className="space-y-4">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">1. Aceitação dos Termos</h2>
            <p>Ao acessar a Viral Road, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">2. Uso de Créditos</h2>
            <p>Os créditos de geração (Blueprints) são renovados mensalmente de acordo com seu plano. Créditos não utilizados não acumulam para o mês seguinte.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">3. Propriedade Intelectual</h2>
            <p>O conteúdo gerado pela IA é de sua propriedade para fins de publicação. No entanto, a engine e o algoritmo Viral Road são propriedade exclusiva da Viral Road Tech.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">4. Ética e Responsabilidade</h2>
            <p>Embora nossa IA possua filtros para o nicho jurídico e de saúde, o usuário é o único responsável pela revisão final do conteúdo e sua conformidade com os conselhos de classe (OAB, CRM, etc.).</p>
          </section>
        </div>

        <div className="pt-10 border-t border-zinc-900 text-[10px] font-black uppercase text-zinc-700 italic tracking-[0.3em]">
          © 2025 VIRAL ROAD TECH • COMPROMISSO COM A TRANSPARÊNCIA.
        </div>
      </div>
    </div>
  );
};

export default Terms;
