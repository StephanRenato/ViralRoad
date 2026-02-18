
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  ArrowRight, 
  Target, 
  Wand2, 
  TrendingUp,
  Menu,
  X,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Layout,
  Anchor,
  Cloud,
  ShieldCheck,
  Rocket,
  Trophy,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileType, UserLevel } from '../types';

const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    profileType: ProfileType.InfluencerGeneral,
    level: UserLevel.Beginner
  });

  const navigate = useNavigate();

  // Scroll Detection & Active Section Spy
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Section Spy Logic
      const sections = ['metodo', 'funcionalidades', 'planos'];
      let current = '';
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Se o topo da seção está na metade superior da tela ou visível
          if (rect.top <= 300 && rect.bottom >= 300) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloqueia o scroll do body quando o menu mobile está aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  // Smooth Scroll Function
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement | HTMLButtonElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.history.pushState(null, '', window.location.pathname);
      setActiveSection('');
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update Hash without jumping
      window.history.pushState(null, '', `#${id}`);
    }
  };

  const navLinks = [
    { name: 'O MÉTODO', id: 'metodo' },
    { name: 'FUNCIONALIDADES', id: 'funcionalidades' },
    { name: 'PLANOS E PREÇOS', id: 'planos' },
  ];

  const handleStartOnboarding = () => {
    setMobileMenuOpen(false);
    setShowOnboarding(true);
    setOnboardingStep(1);
  };

  const nextStep = () => setOnboardingStep(prev => prev + 1);
  const prevStep = () => setOnboardingStep(prev => prev - 1);

  const finishOnboarding = () => {
    navigate('/register', { state: onboardingData });
  };

  return (
    <div className="bg-[#0B0B0B] text-white min-h-screen font-sans selection:bg-[#FFC700] selection:text-black overflow-x-hidden">
      {/* Premium Navbar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 ${
          scrolled || mobileMenuOpen
            ? 'bg-[#0B0B0B]/90 backdrop-blur-xl border-b border-white/5 py-4 shadow-lg' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-12 relative z-[110]">
            <a 
              href="#"
              className="text-2xl font-black italic tracking-tighter flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform" 
              onClick={(e) => scrollToSection(e, 'top')}
            >
              <Zap size={24} className="text-[#FFC700]" fill="currentColor" />
              <span>VIRAL <span className="text-[#FFC700]">ROAD</span></span>
            </a>

            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <a 
                  key={link.id} 
                  href={`#${link.id}`}
                  onClick={(e) => scrollToSection(e, link.id)} 
                  className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative group py-2 ${
                    activeSection === link.id ? 'text-[#FFC700]' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {link.name}
                  <span className={`absolute bottom-0 left-0 h-[2px] bg-[#FFC700] transition-all duration-300 ${activeSection === link.id ? 'w-full' : 'w-0 group-hover:w-full'}`} />
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 relative z-[110]">
            <Link to="/login" className="hidden sm:block text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer">
              LOGIN
            </Link>
            <button 
              onClick={handleStartOnboarding} 
              className="hidden sm:block bg-[#FFC700] text-black px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(255,199,0,0.3)] hover:shadow-[0_0_30px_rgba(255,199,0,0.5)] active:scale-95 cursor-pointer"
            >
              ACESSAR AGORA
            </button>
            
            {/* Hamburger Button (High Z-Index to be clickable over overlay) */}
            <button 
              className="lg:hidden p-2 text-white cursor-pointer hover:text-[#FFC700] transition-colors relative z-[120]" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Full Screen Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden fixed inset-0 z-[100] bg-[#0B0B0B] flex flex-col pt-24 pb-10 px-6 overflow-y-auto"
            >
              {/* Background Effect */}
              <div className="absolute inset-0 bg-[#FFC700]/5 blur-[100px] pointer-events-none" />
              
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 relative z-10">
                {navLinks.map((link, i) => (
                  <motion.a 
                    key={link.id} 
                    href={`#${link.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={(e) => scrollToSection(e, link.id)} 
                    className={`text-3xl font-black uppercase tracking-tighter italic transition-all cursor-pointer py-2 ${
                      activeSection === link.id ? 'text-[#FFC700] scale-110' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </motion.a>
                ))}
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-full max-w-xs space-y-4 pt-8 border-t border-white/10 mt-4"
                >
                  <Link 
                    to="/login" 
                    className="block w-full text-center py-4 rounded-2xl border border-zinc-800 text-zinc-400 font-black uppercase tracking-widest hover:border-white hover:text-white transition-all text-xs"
                  >
                    LOGIN DE MEMBRO
                  </Link>
                  <button 
                    onClick={handleStartOnboarding}
                    className="block w-full bg-[#FFC700] text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-white transition-all active:scale-95"
                  >
                    COMEÇAR AGORA
                  </button>
                </motion.div>
              </div>

              <div className="text-center text-[9px] font-bold text-zinc-700 uppercase tracking-widest mt-auto">
                Viral Road Tech © 2025
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex flex-col justify-center pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] bg-[#FFC700]/10 blur-[140px] rounded-full -z-10" />
        <div className="max-w-5xl mx-auto text-center space-y-12 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-[#FFC700] italic">
            <Sparkles size={16} className="animate-pulse" /> INTELIGÊNCIA DE ELITE PARA ESCALA DIGITAL
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-6xl md:text-9xl font-black italic tracking-tighter uppercase leading-[0.85]">
            DOMINE O <br /><span className="text-[#FFC700] relative drop-shadow-[0_0_30px_rgba(255,199,0,0.3)]">ALGORITMO</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-zinc-400 font-bold text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed italic">
            Nossa IA sênior constrói seu plano de conteúdo, roteiros e ganchos magnéticos em segundos. Pare de postar por sorte.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex justify-center">
            <button onClick={handleStartOnboarding} className="w-full sm:w-auto bg-[#FFC700] text-black px-12 py-7 rounded-[2rem] font-black text-lg uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,199,0,0.3)] flex items-center justify-center gap-4 group italic cursor-pointer">
              COMEÇAR AGORA <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Método Section */}
      <section id="metodo" className="py-32 px-6 bg-[#0B0B0B] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-none">O MÉTODO <br /><span className="text-[#FFC700]">VIRAL ROAD</span></h2>
            <div className="space-y-4">
              {[
                { id: 0, num: '01', title: 'Engenharia de Ganchos', desc: 'Capture a atenção imediata com ganchos magnéticos otimizados para cada nicho.' },
                { id: 1, num: '02', title: 'Narrativas ROAD', desc: 'Envolva o público com roteiros estruturados baseados em gatilhos mentais de retenção.' },
                { id: 2, num: '03', title: 'SEO de Retenção', desc: 'Garanta a descoberta e o engajamento com legendas e hashtags estrategicamente selecionadas.' }
              ].map((step) => (
                <div key={step.id} onMouseEnter={() => setActiveStep(step.id)} className={`flex gap-6 p-6 rounded-[2rem] transition-all cursor-default border ${activeStep === step.id ? 'bg-white/5 border-[#FFC700]/30' : 'bg-transparent border-transparent'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black italic shrink-0 transition-all ${activeStep === step.id ? 'bg-[#FFC700] text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    {step.num}
                  </div>
                  <div>
                    <h4 className={`text-xl font-black italic uppercase transition-colors ${activeStep === step.id ? 'text-[#FFC700]' : 'text-white'}`}>{step.title}</h4>
                    <p className="text-zinc-500 font-medium leading-relaxed text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute inset-0 bg-zinc-900 rounded-[4rem] border border-white/10 p-8 flex flex-col shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-[#FFC700]/5 blur-[80px] -z-0" />
                {activeStep === 0 && (
                  <div className="h-full flex flex-col space-y-6 relative z-10">
                    <div className="flex items-center gap-3"><Target size={24} className="text-[#FFC700]" /><span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">ACERVO DE GANCHOS</span></div>
                    <div className="space-y-4">
                      {['"O segredo que ninguém te contou sobre..."', '"Pare de cometer esse erro agora se você quer..."', '"Como eu saí do zero usando apenas..."'].map((hook, i) => (
                        <div key={i} className="bg-black/40 p-6 rounded-2xl border border-white/5 text-sm font-bold italic text-zinc-300">"{hook}"</div>
                      ))}
                    </div>
                  </div>
                )}
                {activeStep === 1 && (
                  <div className="h-full flex flex-col space-y-6 relative z-10">
                    <div className="flex items-center gap-3"><Wand2 size={24} className="text-[#FFC700]" /><span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">ESTRUTURA DE ROTEIRO</span></div>
                    <div className="space-y-4 bg-black/40 p-8 rounded-3xl border border-white/5 h-full">
                      <div className="h-3 w-1/3 bg-[#FFC700]/20 rounded mb-4" />
                      <div className="h-4 w-full bg-zinc-800 rounded mb-2" />
                      <div className="h-4 w-full bg-zinc-800 rounded mb-2" />
                      <div className="h-4 w-5/6 bg-zinc-800 rounded mb-2" />
                      <div className="mt-auto pt-8">
                         <div className="h-12 w-full bg-[#FFC700] rounded-xl flex items-center justify-center font-black text-black uppercase text-[10px] tracking-widest">NARRATIVA GERADA</div>
                      </div>
                    </div>
                  </div>
                )}
                {activeStep === 2 && (
                  <div className="h-full flex flex-col space-y-6 relative z-10">
                    <div className="flex items-center gap-3"><TrendingUp size={24} className="text-[#FFC700]" /><span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">SEO & LEGENDAS</span></div>
                    <div className="space-y-4">
                      <div className="bg-black/40 p-8 rounded-3xl border border-white/5">
                        <div className="space-y-3">
                          <div className="h-3 w-full bg-zinc-800 rounded-full" />
                          <div className="h-3 w-4/5 bg-zinc-800 rounded-full" />
                        </div>
                        <div className="flex gap-2 mt-6 flex-wrap">
                          {['#viral', '#growth', '#estrategia', '#marketing', '#sucesso'].map(t => <span key={t} className="text-[9px] font-black text-[#FFC700] bg-[#FFC700]/10 px-2 py-1 rounded">{t}</span>)}
                        </div>
                      </div>
                      <div className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20 text-center"><span className="text-[10px] font-black uppercase text-green-500 tracking-widest">SCORE DE RETENÇÃO: 9.8/10</span></div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Funcionalidades Section */}
      <section id="funcionalidades" className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase">PODER TOTAL NA <br/><span className="text-[#FFC700]">SUA MÃO</span></h2>
            <p className="text-zinc-500 font-bold text-lg max-w-xl mx-auto italic">Ferramentas de elite para quem não aceita o anonimato.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Wand2, title: 'IA Gerador', desc: 'Roteiros técnicos e ganchos em segundos para Reels, TikTok e YouTube.' },
              { icon: Cloud, title: 'Acervo Cloud', desc: 'Salve e organize sua biblioteca de conteúdo estrategicamente.' },
              { icon: Layout, title: 'Road Workflow', desc: 'Gerencie o status de cada postagem do rascunho à publicação.' },
              { icon: Anchor, title: 'Hook Library', desc: 'Banco de ganchos virais testados e aprovados pelo algoritmo.' },
            ].map((f, i) => (
              <div key={i} className="bg-[#111] border border-white/5 p-8 rounded-[2.5rem] hover:border-[#FFC700]/30 transition-all group hover:-translate-y-1">
                <div className="w-14 h-14 bg-[#FFC700]/10 rounded-2xl flex items-center justify-center text-[#FFC700] mb-6 group-hover:scale-110 transition-transform">
                  <f.icon size={28} />
                </div>
                <h4 className="text-xl font-black italic uppercase mb-2 text-white group-hover:text-[#FFC700] transition-colors">{f.title}</h4>
                <p className="text-zinc-500 text-sm font-bold italic leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos e Preços Section */}
      <section id="planos" className="py-32 px-6 relative bg-white/5">
        <div className="max-w-7xl mx-auto space-y-20 relative z-10">
          <div className="text-center space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFC700]/10 border border-[#FFC700]/20 rounded-full"
            >
              <Zap size={14} className="text-[#FFC700]" fill="currentColor" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#FFC700] italic">Investimento em Escala</span>
            </motion.div>
            <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none">
              PLANOS E <br /><span className="text-[#FFC700]">ESTRATÉGIA</span>
            </h2>
            <p className="text-zinc-500 font-bold text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed italic">
              Selecione o motor que vai impulsionar sua autoridade digital.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan (Free) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="bg-[#0B0B0B] border border-zinc-800 p-10 rounded-[3rem] space-y-8 flex flex-col hover:border-zinc-600 transition-all"
            >
              <div className="space-y-4">
                <h4 className="text-lg font-black italic uppercase tracking-tighter text-zinc-500">STARTER ROAD</h4>
                <div className="text-5xl font-black italic tracking-tighter uppercase">R$ 0<span className="text-xs font-bold text-zinc-500">/mês</span></div>
                <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest italic">Ideal para experimentar o motor IA.</p>
              </div>
              <ul className="space-y-4 text-xs italic font-black text-zinc-400 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#FFC700]" /> 5 Blueprints /mês</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#FFC700]" /> IA de Base</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#FFC700]" /> Roadmap Básico</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#FFC700]" /> Banco de Ganchos Comuns</li>
              </ul>
              <button 
                onClick={handleStartOnboarding}
                className="w-full text-center py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                CRIAR CONTA GRÁTIS <ArrowRight size={14} />
              </button>
            </motion.div>

            {/* Creator Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0B0B0B] border-2 border-[#FFC700]/30 p-10 rounded-[3.5rem] space-y-8 flex flex-col relative shadow-[0_0_30px_rgba(255,199,0,0.1)] hover:border-[#FFC700] transition-all"
            >
              <div className="absolute top-8 right-8 px-3 py-1 bg-[#FFC700]/10 text-[#FFC700] text-[7px] font-black uppercase tracking-widest rounded-full italic border border-[#FFC700]/20">
                POPULAR
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-black italic uppercase tracking-tighter text-[#FFC700]">CREATOR ROAD</h4>
                <div className="text-5xl font-black italic tracking-tighter uppercase">R$ 97<span className="text-xs font-bold text-zinc-500">/mês</span></div>
                <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest italic">Para quem busca frequência e tração.</p>
              </div>
              <ul className="space-y-4 text-xs italic font-black text-zinc-300 flex-1">
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#FFC700]" /> 500 Blueprints /mês</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#FFC700]" /> IA Prioritária de Elite</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#FFC700]" /> Roadmap Completo</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={14} className="text-[#FFC700]" /> Banco de Ganchos Pro</li>
              </ul>
              <button 
                onClick={handleStartOnboarding}
                className="w-full text-center py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all bg-white text-black hover:bg-[#FFC700] shadow-2xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                ASSINAR CREATOR <ArrowRight size={14} />
              </button>
            </motion.div>

            {/* Pro Plan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#FFC700] text-black p-10 rounded-[3rem] space-y-8 flex flex-col relative group hover:scale-[1.02] transition-all shadow-[0_0_50px_rgba(255,199,0,0.3)]"
            >
              <div className="absolute top-8 right-8 px-3 py-1 bg-black text-[#FFC700] text-[7px] font-black uppercase tracking-widest rounded-full italic animate-pulse border border-[#FFC700]/20">
                ELITE
              </div>
              <div className="space-y-4">
                <h4 className="text-lg font-black italic uppercase tracking-tighter">PRO ROAD</h4>
                <div className="text-5xl font-black italic tracking-tighter uppercase">R$ 197<span className="text-xs font-bold">/mês</span></div>
                <p className="text-[9px] font-black uppercase text-black/60 tracking-widest italic">Dominação total sem barreiras.</p>
              </div>
              <ul className="space-y-4 text-xs italic font-black flex-1">
                <li className="flex items-center gap-3"><Zap size={14} fill="currentColor" /> Blueprints Ilimitados</li>
                <li className="flex items-center gap-3"><Zap size={14} fill="currentColor" /> Prioridade Máxima Cloud</li>
                <li className="flex items-center gap-3"><Zap size={14} fill="currentColor" /> Suporte VIP WhatsApp</li>
                <li className="flex items-center gap-3"><Zap size={14} fill="currentColor" /> Planejamento IA Avançado</li>
              </ul>
              <button 
                onClick={handleStartOnboarding}
                className="w-full text-center py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all bg-black text-white hover:bg-zinc-800 shadow-2xl flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
              >
                LIBERAR ACESSO PRO <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>
          
          <div className="max-w-xl mx-auto text-center mt-12">
             <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] italic">
               <ShieldCheck size={14} className="inline mr-2" /> Pagamento Seguro via Stripe & Road Cloud
             </p>
          </div>
        </div>
      </section>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-[#0B0B0B] w-full max-w-md md:max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#FFC700] text-black rounded-lg flex items-center justify-center font-black italic text-xs shrink-0">
                    {onboardingStep}
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-none mb-1">Passo {onboardingStep} de 3</h3>
                    <p className="text-xs font-bold italic text-white leading-none">Road Onboarding</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowOnboarding(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-8 no-scrollbar scroll-smooth">
                <AnimatePresence mode="wait">
                  {onboardingStep === 1 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-tight">Qual seu <br /><span className="text-[#FFC700]">Nicho?</span></h2>
                        <p className="text-zinc-500 text-[10px] md:text-xs font-bold italic">IA calibrada para o seu mercado.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {Object.values(ProfileType).map((type) => (
                          <button
                            key={type}
                            onClick={() => setOnboardingData({ ...onboardingData, profileType: type })}
                            className={`p-4 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-1 group min-h-[50px] md:min-h-[64px] cursor-pointer ${
                              onboardingData.profileType === type 
                              ? 'bg-[#FFC700] border-[#FFC700] text-black shadow-lg shadow-[#FFC700]/10' 
                              : 'bg-zinc-800/30 border-zinc-700 text-zinc-400 hover:border-[#FFC700]/30 hover:bg-zinc-800'
                            }`}
                          >
                            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter italic leading-tight">{type}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {onboardingStep === 2 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-tight">Nível de <br /><span className="text-[#FFC700]">Escala?</span></h2>
                        <p className="text-zinc-500 text-[10px] md:text-xs font-bold italic">Define a complexidade técnica dos roteiros.</p>
                      </div>

                      <div className="space-y-3">
                        {[
                          { id: UserLevel.Beginner, title: 'INICIANTE', desc: 'Começando a produzir agora.', icon: Rocket },
                          { id: UserLevel.Intermediate, title: 'INTERMEDIÁRIO', desc: 'Já possuo frequência de postagem.', icon: Trophy },
                          { id: UserLevel.Advanced, title: 'AVANÇADO', desc: 'Foco total em autoridade técnica.', icon: Star },
                        ].map((level) => (
                          <button
                            key={level.id}
                            onClick={() => setOnboardingData({ ...onboardingData, level: level.id })}
                            className={`w-full p-5 rounded-xl border transition-all text-left flex items-center gap-5 group cursor-pointer ${
                              onboardingData.level === level.id 
                              ? 'bg-[#FFC700] border-[#FFC700] text-black shadow-lg shadow-[#FFC700]/10' 
                              : 'bg-zinc-800/30 border-zinc-700 text-zinc-400 hover:border-[#FFC700]/30'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${onboardingData.level === level.id ? 'bg-black text-[#FFC700]' : 'bg-zinc-700 text-zinc-500'}`}>
                              <level.icon size={20} />
                            </div>
                            <div>
                              <h4 className="text-base font-black italic uppercase leading-none mb-1">{level.title}</h4>
                              <p className={`text-[10px] font-bold italic ${onboardingData.level === level.id ? 'text-black/60' : 'text-zinc-500'}`}>{level.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {onboardingStep === 3 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center space-y-8 py-10"
                    >
                      <div className="w-20 h-20 bg-[#FFC700]/10 rounded-3xl flex items-center justify-center mx-auto text-[#FFC700]">
                        <Zap size={40} fill="currentColor" />
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-tight">ROAD <br /><span className="text-[#FFC700]">READY</span></h2>
                        <p className="text-zinc-500 text-[10px] md:text-xs font-bold italic max-w-xs mx-auto">
                          Sua estratégia para <span className="text-white">"{onboardingData.profileType}"</span> foi gerada na cloud.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-5 md:p-8 border-t border-white/10 bg-zinc-900/95 flex gap-3 shrink-0">
                {onboardingStep > 1 && (
                  <button onClick={prevStep} className="flex-1 py-5 rounded-xl font-black uppercase tracking-widest text-[10px] text-zinc-500 hover:text-white transition-all border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer">
                    <ChevronLeft size={16} /> VOLTAR
                  </button>
                )}
                <button onClick={onboardingStep === 3 ? finishOnboarding : nextStep} className="flex-[2] bg-[#FFC700] text-black py-5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
                  {onboardingStep === 3 ? 'FINALIZAR ACESSO' : 'PRÓXIMO PASSO'} <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="py-24 px-6 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-2xl font-black italic tracking-tighter flex items-center gap-2 cursor-pointer" onClick={(e) => scrollToSection(e, 'top')}>
            <Zap size={24} className="text-[#FFC700]" fill="currentColor" />
            <span>VIRAL <span className="text-[#FFC700]">ROAD</span></span>
          </div>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <Link to="/privacy" className="hover:text-white transition-colors cursor-pointer">PRIVACIDADE</Link>
            <Link to="/terms" className="hover:text-white transition-colors cursor-pointer">TERMOS</Link>
            <Link to="/support" className="hover:text-white transition-colors cursor-pointer">SUPORTE</Link>
          </div>
          <div className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.3em] italic">
            © 2025 VIRAL ROAD TECH. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
