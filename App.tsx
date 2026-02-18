
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, PlanType, SubscriptionStatus, ProfileType } from './types';
import { supabase } from './services/supabase';
import GlobalLoader from './components/GlobalLoader';

// Lazy Loading - Rotas Públicas & Institucionais
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Support = lazy(() => import('./pages/Support'));
const SalesPage = lazy(() => import('./pages/SalesPage'));

// Lazy Loading - Autenticação
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));

// Lazy Loading - Aplicação
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const Sidebar = lazy(() => import('./components/Sidebar'));

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error("Erro ao encerrar sessão:", e);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setUser(null);
      setSession(null);
      window.location.hash = "/login";
    }
  }

  // Função auxiliar para processar dados brutos do banco ou fallback
  const processUserData = (authUser: any, profile: any, usage: any) => {
    const isSpecialUser = authUser.email?.toLowerCase() === 'stephan_renato@hotmail.com';
    
    // Fallbacks inteligentes se o banco falhar ou demorar
    const safeProfileType = (profile?.profile_type as ProfileType) || 
                            (authUser.user_metadata?.profile_type as ProfileType) || 
                            ProfileType.InfluencerGeneral;
                            
    const safeName = profile?.name || authUser.user_metadata?.name || 'Estrategista';
    const safeSpecialization = profile?.specialization || authUser.user_metadata?.specialization || 'Geral';

    // Lógica de Uso
    let finalUsage = usage;
    if (!usage) {
      const initialPlan = isSpecialUser ? PlanType.Pro : PlanType.Starter;
      const initialLimit = isSpecialUser ? 999999 : 5;
      
      finalUsage = {
        user_id: authUser.id,
        plan: initialPlan,
        monthly_limit: initialLimit,
        used_this_month: 0
      };
    }

    // Extração segura de configurações (suporte a JSON e colunas planas) + Fallback para metadata
    const settings = profile?.settings || authUser.user_metadata?.settings || {};
    const notifAi = settings.notifications_ai_daily ?? profile?.notifications_ai_daily ?? true;
    const notifEng = settings.notifications_engagement ?? profile?.notifications_engagement ?? true;
    
    // Fallback para social_profiles
    const safeSocialProfiles = profile?.social_profiles || authUser.user_metadata?.social_profiles || [];

    return {
      id: authUser.id,
      email: authUser.email!,
      name: safeName,
      profileType: safeProfileType,
      specialization: safeSpecialization,
      avatarUrl: profile?.avatar_url,
      currentPlan: isSpecialUser ? PlanType.Pro : (finalUsage?.plan as PlanType || PlanType.Starter),
      subscriptionStatus: isSpecialUser ? SubscriptionStatus.Active : ((profile?.subscription_status as SubscriptionStatus) || SubscriptionStatus.None),
      usedBlueprints: finalUsage?.used_this_month || 0,
      monthlyLimit: isSpecialUser ? 999999 : (finalUsage?.monthly_limit || 5),
      
      // Novos campos essenciais para o ProfilePage
      socialProfiles: safeSocialProfiles,
      notificationsAiDaily: notifAi,
      notificationsEngagement: notifEng
    };
  };

  const fetchUserData = async (authUser: any) => {
    if (!authUser) return;
    
    // TIME-TO-INTERACTIVE OTIMIZADO:
    const MAX_WAIT_TIME = 1500; 

    try {
      const fetchPromise = Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),
        supabase.from('usage_limits').select('*').eq('user_id', authUser.id).single()
      ]);

      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), MAX_WAIT_TIME));

      // Corrida: Banco vs Relógio
      const result: any = await Promise.race([fetchPromise, timeoutPromise]);

      if (result === 'TIMEOUT') {
        console.warn("⚡ Banco lento. Acesso liberado via Fast Track.");
        // Monta usuário com dados da sessão (rápido)
        const fastUser = processUserData(authUser, null, null);
        setUser(fastUser);
        setLoading(false); // Libera a UI imediatamente
        
        // Continua buscando em background para atualizar a UI depois
        fetchPromise.then((bgResults: any) => {
          const profile = bgResults[0].status === 'fulfilled' ? bgResults[0].value.data : null;
          const usage = bgResults[1].status === 'fulfilled' ? bgResults[1].value.data : null;
          const fullUser = processUserData(authUser, profile, usage);
          setUser(fullUser); // Atualização silenciosa
        });
      } else {
        // Banco respondeu rápido
        const profileResult = result[0];
        const usageResult = result[1];
        const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
        const usage = usageResult.status === 'fulfilled' ? usageResult.value.data : null;
        
        // Se não tiver usage, cria em background
        if (!usage) {
           const isSpecialUser = authUser.email?.toLowerCase() === 'stephan_renato@hotmail.com';
           const initialPlan = isSpecialUser ? PlanType.Pro : PlanType.Starter;
           const initialLimit = isSpecialUser ? 999999 : 5;
           supabase.from('usage_limits').insert([{
             user_id: authUser.id,
             plan: initialPlan,
             monthly_limit: initialLimit,
             used_this_month: 0
           }]).then(({ error }) => { if (error) console.warn("Background usage creation:", error); });
        }

        const fullUser = processUserData(authUser, profile, usage);
        setUser(fullUser);
        setLoading(false);
      }
      
      return true;
    } catch (e) {
      console.error("Erro crítico ao carregar dados:", e);
      // Fallback de segurança para não travar o app
      setUser(processUserData(authUser, null, null));
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    // Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        fetchUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (currentSession?.user) {
        setSession(currentSession);
        if (!user || user.id !== currentSession.user.id) {
          await fetchUserData(currentSession.user);
        }
      } else {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Loader inicial de verificação de sessão
  if (loading) return <GlobalLoader />;

  return (
    <HashRouter>
      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/support" element={<Support />} />
          <Route path="/sales" element={<SalesPage />} />
          
          {/* Rotas de Autenticação */}
          <Route path="/login" element={session && user ? <Navigate to="/dashboard" /> : <Login onLogin={() => {}} />} />
          <Route path="/register" element={session && user ? <Navigate to="/dashboard" /> : <Register onRegister={() => {}} />} />
          <Route path="/forgot-password" element={session && user ? <Navigate to="/dashboard" /> : <ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          
          {/* Rotas Protegidas */}
          <Route path="/success" element={session && user ? <SuccessPage user={user} onRefresh={async () => { await fetchUserData(session.user); }} /> : <Navigate to="/login" />} />
          
          <Route path="/dashboard/*" element={
            session && user ? (
              <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
                <Sidebar 
                  user={user} 
                  theme={theme} 
                  onToggleTheme={toggleTheme} 
                  onLogout={handleLogout} 
                  onUpgradeClick={() => setShowUpgradeModal(true)} 
                />
                <main className="flex-1 overflow-auto scroll-smooth-container relative">
                   <Dashboard 
                    user={user} 
                    onLogout={handleLogout} 
                    showUpgrade={showUpgradeModal} 
                    onCloseUpgrade={() => setShowUpgradeModal(false)} 
                    onOpenUpgrade={() => setShowUpgradeModal(true)} 
                    onRefreshUser={() => fetchUserData(session.user)}
                  />
                </main>
              </div>
            ) : <Navigate to="/login" />
          } />
          
          {/* Fallback 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

export default App;
