
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ProfileType } from '../types';
import { ChevronDown, User as UserIcon, Mail, Lock, Plus, CheckCircle2, Circle, XCircle, Sparkles, Loader2, ArrowRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const SPECIALIZATION_SUGGESTIONS: Record<string, string[]> = {
  [ProfileType.Lawyer]: ['Civil', 'Imobiliário', 'Digital', 'Ambiental', 'Consumidor', 'Empresarial', 'Previdenciário', 'Trabalhista', 'Tributário', 'Criminalista', 'Família', 'Direito Médico', 'Propriedade Intelectual', 'Direito Agrário'],
  [ProfileType.Finance]: ['Investimentos', 'Milhas e Viagens', 'Planejamento Financeiro', 'Day Trade', 'Criptomoedas', 'Educação Financeira', 'Contabilidade para PJs', 'Finanças para Casais', 'Independência Financeira', 'Tesouro Direto', 'Renda Extra com Cartões'],
  [ProfileType.Fitness]: ['Musculação e Hipertrofia', 'Nutrição Esportiva', 'Crossfit', 'Corrida de Rua', 'Maratonista', 'Yoga e Flexibilidade', 'Fisioterapia Esportiva', 'Atleta de Musculação', 'Calistenia', 'Emagrecimento Feminino', 'Treino em Casa', 'Biohacking'],
  [ProfileType.Beauty]: ['Skincare Avançado', 'Maquiagem Profissional', 'Estética Facial', 'Design de Sobrancelhas', 'Unhas de Gel', 'Colorimetria Capilar', 'Tatuagem', 'Dermatologia Estética', 'Hair Therapy', 'Micropigmentação'],
  [ProfileType.Tech]: ['Desenvolvimento Fullstack', 'Inteligência Artificial', 'Segurança da Informação', 'Gadgets e Hardware', 'Data Science', 'Carreira em Tech', 'Mobile Development', 'DevOps', 'Cybersecurity para Leigos', 'Domótica'],
  [ProfileType.Sales]: ['Marketing de Afiliados', 'Dropshipping', 'Lançamentos de Infoprodutos', 'E-commerce', 'Copywriting de Alta Conversão', 'Tráfego Pago', 'Gestão de Redes Sociais', 'Venda High Ticket', 'Social Selling'],
  [ProfileType.Gastronomy]: ['Confeitaria Gourmet', 'Churrasco e Defumação', 'Culinária Vegana', 'Marmitas Fitness', 'Panificação Artesanal', 'Cozinha Italiana', 'Vinhos e Harmonização', 'Mestre Cervejeiro', 'Sushiman em Casa'],
  [ProfileType.Education]: ['Ensino de Idiomas', 'Preparação para Concursos', 'Desenvolvimento Pessoal', 'Metodologias Ativas', 'Alfabetização', 'Matemática Descomplicada', 'Oratória e Comunicação', 'Aprendizado Acelerado', 'Estratégias para ENEM'],
  [ProfileType.Gamer]: ['Jogos FPS', 'RPG e Lore', 'Streaming e Setup', 'Hardware Gamer', 'eSports Competitive', 'Simuladores', 'Retro Gaming', 'Análise de Patch Notes', 'Lore de RPG'],
  [ProfileType.Travel]: ['Viagens de Luxo', 'Nômade Digital', 'Ecoturismo e Aventura', 'Turismo Gastronômico', 'Viagens Econômicas', 'Destinos Exóticos', 'Acampamento Selvagem', 'Cruzeiros de Luxo'],
  [ProfileType.Fashion]: ['Streetwear', 'Consultoria de Imagem', 'Moda Sustentável', 'Acessórios e Joias', 'Moda Minimalista', 'Alta Costura', 'Moda Plus Size', 'Sneakerhead Culture'],
  [ProfileType.InfluencerGeneral]: ['Lifestyle', 'Vlog Diário', 'Dicas de Produtividade', 'Motivacional', 'Curadoria de Conteúdo', 'Reviews de Produtos', 'UGC (User Generated Content)', 'Edição de Vídeo Viral'],
  [ProfileType.Comedy]: ['Stand-up', 'Sátira Política', 'Sketches', 'Memes', 'Imitações', 'Pranks Saudáveis', 'Crítica Social Ácida', 'Humor Corporativo'],
  [ProfileType.Parenting]: ['Maternidade Real', 'Educação Montessoriana', 'Recém-nascidos', 'Paternidade Ativa', 'Psicologia Infantil', 'Rotina de Sono Infantil', 'Alimentação Complementar (BLW)'],
};

const Register: React.FC<{ onRegister: any }> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profileType, setProfileType] = useState<ProfileType>(ProfileType.InfluencerGeneral);
  const [specialization, setSpecialization] = useState('Geral');

  // Recupera dados do onboarding se existirem
  useEffect(() => {
    if (location.state) {
      const { profileType: onboardingType, level } = location.state;
      if (onboardingType) setProfileType(onboardingType);
      // Se tivermos uma lógica para mapear 'level' para 'specialization' ou apenas usar o nicho
      // O usuário pediu para os inputs de "nicho" e "area" estarem de acordo.
      // Como o onboarding não tem "area" explícita (apenas nicho e nível), 
      // vou tentar inferir ou apenas deixar o nicho correto.
    }
  }, [location.state]);
  const [customSpecialization, setCustomSpecialization] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const suggestions = useMemo(() => {
    return SPECIALIZATION_SUGGESTIONS[profileType] || ['Geral'];
  }, [profileType]);

  const passwordCriteria = useMemo(() => {
    return [
      { label: '8+ caracteres', met: password.length >= 8 },
      { label: 'Uma letra maiúscula', met: /[A-Z]/.test(password) },
      { label: 'Um número', met: /[0-9]/.test(password) },
      { label: 'Um caractere especial', met: /[^A-Za-z0-9]/.test(password) },
    ];
  }, [password]);

  const passwordStrength = useMemo(() => {
    const metCount = passwordCriteria.filter(c => c.met).length;
    if (password.length === 0) return 0;
    return metCount;
  }, [passwordCriteria, password]);

  const isPasswordStrong = passwordStrength === passwordCriteria.length;

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) return false;
    
    const disposableDomains = [
      'tempmail.com', 'throwawaymail.com', 'mailinator.com', 'yopmail.com', 
      'guerrillamail.com', '10minutemail.com', 'temp-mail.org', 'temp-mail.com',
      'dispostable.com', 'getnada.com', 'maildrop.cc'
    ];
    const domain = email.split('@')[1]?.toLowerCase();
    return !disposableDomains.includes(domain);
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordStrong) {
      setError('Sua senha não atende aos critérios de segurança.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, use um endereço de e-mail real e válido. E-mails temporários não são permitidos.');
      return;
    }
    
    setLoading(true);
    setError('');

    const finalSpecialization = specialization === 'Outro' ? customSpecialization : specialization;

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            profile_type: profileType,
            specialization: finalSpecialization || 'Geral'
          },
          emailRedirectTo: `${window.location.origin}/#/dashboard`
        }
      });

      if (authError) throw authError;
      
      if (data.user) {
        if (data.session) {
          navigate('/dashboard');
        } else {
          setNeedsConfirmation(true);
        }
      }

    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-yellow-400/5 blur-[120px] pointer-events-none" />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-[3rem] p-12 text-center space-y-8 relative overflow-hidden z-10">
          <div className="absolute inset-0 bg-yellow-400/5 blur-[100px] pointer-events-none" />
          <div className="w-24 h-24 bg-yellow-400/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-yellow-400 animate-pulse relative z-10">
            <Mail size={48} />
          </div>
          <div className="space-y-4 relative z-10">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Confirme seu <br /><span className="text-yellow-400">Road E-mail</span></h2>
            <p className="text-zinc-500 font-bold text-sm italic leading-relaxed">Enviamos um link de ativação para <span className="text-white">{email}</span>. Clique no link para liberar seu acesso à Viral Road.</p>
          </div>
          <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-yellow-400 hover:underline relative z-10 italic tracking-widest">
            JÁ CONFIRMEI, IR PARA LOGIN <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-8 transition-colors relative overflow-hidden">
      <div className="absolute inset-0 bg-yellow-400/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-sm w-full relative z-10">
        <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
          <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-yellow-400 transition-colors italic group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Início
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-1 italic">
            VIRAL <span className="text-yellow-400">ROAD</span>
          </h1>
          <p className="text-zinc-500 font-bold text-xs italic">O início da sua escala começou</p>
        </div>
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 md:p-8 shadow-2xl">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-xl uppercase">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1 italic">Nome / Marca</label>
              <div className="relative">
                <UserIcon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all placeholder:text-zinc-400 text-xs font-bold"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome ou marca"
                />
              </div>
            </div>

            <div>
              <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1 italic">E-mail</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all placeholder:text-zinc-400 text-xs font-bold"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1 italic">Nicho</label>
                <div className="relative group">
                  <select
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all appearance-none text-[10px] font-black cursor-pointer uppercase tracking-tighter"
                    value={profileType}
                    onChange={(e) => {
                      setProfileType(e.target.value as ProfileType);
                      setSpecialization('Geral'); 
                    }}
                  >
                    {Object.values(ProfileType).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1 italic">Área</label>
                <div className="relative group">
                  <select
                    required
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl py-2.5 px-3 focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all appearance-none text-[10px] font-black cursor-pointer uppercase tracking-tighter"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                  >
                    {suggestions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="Outro">Outro (Personalizar)</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {specialization === 'Outro' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-1.5 ml-1 italic">Qual sua especialidade?</label>
                <div className="relative">
                  <Plus size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-yellow-500" />
                  <input
                    type="text"
                    required
                    className="w-full bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 text-zinc-900 dark:text-white rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all placeholder:text-zinc-400 text-xs font-bold"
                    value={customSpecialization}
                    onChange={(e) => setCustomSpecialization(e.target.value)}
                    placeholder="Ex: Direito Espacial"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-1.5 ml-1 italic">Sua Senha</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white rounded-xl py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-yellow-400/50 outline-none transition-all placeholder:text-zinc-400 text-xs font-bold"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-yellow-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {password.length > 0 && (
                <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div 
                        key={step} 
                        className={`flex-1 rounded-full transition-all duration-500 ${step <= passwordStrength ? getStrengthColor() : 'bg-zinc-200 dark:bg-zinc-800'}`}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-y-1 gap-x-2">
                    {passwordCriteria.map((criterion, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        {criterion.met ? (
                          <CheckCircle2 size={10} className="text-green-500" />
                        ) : (
                          <Circle size={10} className="text-zinc-300 dark:text-zinc-700" />
                        )}
                        <span className={`text-[8px] font-black uppercase tracking-tighter italic ${criterion.met ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}`}>
                          {criterion.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !isPasswordStrong}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-black py-3.5 mt-2 rounded-xl transition-all shadow-lg shadow-yellow-400/10 active:scale-95 text-[10px] uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {loading ? 'PREPARANDO ACESSO...' : 'GARANTIR MEU ACESSO'}
            </button>
          </form>
          
          <div className="mt-6 text-center text-[10px]">
            <span className="text-zinc-400 dark:text-zinc-500 font-bold italic uppercase tracking-tighter">Membro da Road? </span>
            <Link to="/login" className="text-yellow-600 dark:text-yellow-400 font-black hover:underline underline-offset-4 ml-1 uppercase tracking-widest italic">Acessar agora</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
