
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
    const isSpecialUser = authUser.email?.toLowerCase() === 'stephan_renato@hotmail.com' || authUser.email?.toLowerCase() === 'admin@admin';
    
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
    const dbSettings = profile?.settings;
    const metaSettings = authUser.user_metadata?.settings;
    const settings = (dbSettings !== undefined && dbSettings !== null) ? dbSettings : (metaSettings || {});
    
    const notifAi = settings.notifications_ai_daily ?? profile?.notifications_ai_daily ?? authUser.user_metadata?.notifications_ai_daily ?? true;
    const notifEng = settings.notifications_engagement ?? profile?.notifications_engagement ?? authUser.user_metadata?.notifications_engagement ?? true;
    
    // Fallback inteligente para social_profiles: confia no banco se existir (mesmo vazio), senão usa metadata
    const dbSocial = profile?.social_profiles;
    const metaSocial = authUser.user_metadata?.social_profiles;
    const localSocialStr = localStorage.getItem(`road_perf_${authUser.id}`);
    let localSocial = [];
    try { if (localSocialStr) localSocial = JSON.parse(localSocialStr); } catch(e) {}

    const safeSocialProfiles = (dbSocial !== undefined && dbSocial !== null) 
      ? dbSocial 
      : (Array.isArray(metaSocial) && metaSocial.length > 0 ? metaSocial : (Array.isArray(localSocial) ? localSocial : []));

    return {
      id: authUser.id,
      email: authUser.email!,
      name: safeName,
      profileType: safeProfileType,
      specialization: safeSpecialization,
      avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url,
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

  const CACHE_KEY = 'viral_road_user_cache';

  const fetchUserData = async (authUser: any, forceRefresh = false) => {
    if (!authUser) return;
    
    let currentUser = authUser;

    // Se for um refresh forçado, buscamos a sessão mais recente para garantir os metadados atualizados
    if (forceRefresh) {
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      if (freshUser) currentUser = freshUser;
      localStorage.removeItem(CACHE_KEY); // Limpa cache para forçar reconstrução
    } else {
      // Tenta carregar do cache primeiro (Instantâneo)
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed.id === currentUser.id) {
            setUser(parsed);
            setLoading(false);
            // Mesmo com cache, buscamos no banco em background para atualizar
          }
        } catch (e) {
          console.warn("Erro ao ler cache:", e);
        }
      }
    }
    
    // TIME-TO-INTERACTIVE OTIMIZADO:
    const MAX_WAIT_TIME = 2500; 

    try {
      const fetchPromise = Promise.allSettled([
        supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
        supabase.from('usage_limits').select('*').eq('user_id', currentUser.id).single()
      ]);

      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve('TIMEOUT'), MAX_WAIT_TIME));

      const result: any = await Promise.race([fetchPromise, timeoutPromise]);

      if (result === 'TIMEOUT') {
        console.warn("⚡ Banco lento. Usando metadados da sessão.");
        const fastUser = processUserData(currentUser, null, null);
        setUser(fastUser);
        setLoading(false);
        
        fetchPromise.then((bgResults: any) => {
          const profile = bgResults[0].status === 'fulfilled' ? bgResults[0].value.data : null;
          const usage = bgResults[1].status === 'fulfilled' ? bgResults[1].value.data : null;
          const fullUser = processUserData(currentUser, profile, usage);
          setUser(fullUser);
          localStorage.setItem(CACHE_KEY, JSON.stringify(fullUser));
        });
      } else {
        const profileResult = result[0];
        const usageResult = result[1];
        const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
        const usage = usageResult.status === 'fulfilled' ? usageResult.value.data : null;
        
        const fullUser = processUserData(currentUser, profile, usage);
        setUser(fullUser);
        localStorage.setItem(CACHE_KEY, JSON.stringify(fullUser));
        setLoading(false);
      }
      return true;
    } catch (e) {
      setUser(processUserData(currentUser, null, null));
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
                    onRefreshUser={() => fetchUserData(session.user, true)}
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
