import React, { useState, useEffect } from 'react';
import { User, News, Course, JobVacancy, SempsUnit, Banner } from './types';
import { useAuth } from './context/AuthContext';
import { newsService, courseService, jobsService, unitsService, bannerService } from './services/firestoreService';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import HomeView from './components/HomeView';
import CadUnicoView from './components/CadUnicoView';
import BenefitsView from './components/BenefitsView';
import CoursesView from './components/CoursesView';
import ContrataView from './components/ContrataView';
import UnitsView from './components/UnitsView';
import NewsView from './components/NewsView';
import AiAssistant from './components/AiAssistant';
import AdminDashboard from './components/AdminDashboard';
import PwaInstallModal from './components/PwaInstallModal';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Sparkles, MessageSquare, Phone, MapPin, Shield, Milestone, X, Heart } from 'lucide-react';

export default function App() {
  const { user, logout, loading: authLoading, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);

  // Forced password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePwdError, setChangePwdError] = useState('');
  const [changePwdSuccess, setChangePwdSuccess] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handleForcePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwdError('');
    if (newPassword.length < 8) {
      setChangePwdError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePwdError('As senhas digitadas não coincidem.');
      return;
    }
    setIsChangingPwd(true);
    try {
      await changePassword(newPassword);
      setChangePwdSuccess(true);
    } catch (err: any) {
      setChangePwdError(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setIsChangingPwd(false);
    }
  };

  // Core municipal collections
  const [news, setNews] = useState<News[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [units, setUnits] = useState<SempsUnit[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Floating AI Chat state
  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState<boolean>(false);

  // Define compatible fetch functions to satisfy subview calls
  const fetchNews = async () => {};
  const fetchCourses = async () => {};
  const fetchJobs = async () => {};
  const fetchUnits = async () => {};

  useEffect(() => {
    // Real-time news subscription
    const unsubNews = newsService.subscribeNews((data) => {
      setNews(data);
    });

    // Real-time courses subscription
    const unsubCourses = courseService.subscribeCourses((data) => {
      setCourses(data);
    });

    // Real-time jobs subscription
    const unsubJobs = jobsService.subscribeJobs((data) => {
      setJobs(data);
    });

    // Real-time units subscription
    const unsubUnits = unitsService.subscribeUnits((data) => {
      setUnits(data);
    });

    // Real-time banners subscription
    const unsubBanners = bannerService.subscribeBanners((data) => {
      setBanners(data);
    });

    return () => {
      unsubNews();
      unsubCourses();
      unsubJobs();
      unsubUnits();
      unsubBanners();
    };
  }, []);

  // Sync activeTab with user role permissions
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      const isAdminOrColab = user.role === 'admin' || user.role === 'administrador' || user.role === 'colaborador';
      if (isAdminOrColab) {
        // Admins and collaborators only see their administrative workspace
        if (activeTab !== 'admin-dashboard') {
          setActiveTab('admin-dashboard');
        }
      } else {
        // Citizen accounts do not see the administrative workspace
        if (activeTab === 'admin-dashboard') {
          setActiveTab('home');
        }
      }
    } else {
      // Guests cannot access administrative pages
      if (activeTab === 'admin-dashboard') {
        setActiveTab('home');
      }
    }
  }, [user, authLoading, activeTab]);

  const handleLoginSuccess = (loggedInUser: User) => {
    // Handled by AuthContext automatically, but kept for signature compatibility
  };

  const handleLogout = async () => {
    await logout();
    setActiveTab('home');
  };

  // Render the currently active subview
  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            news={news}
            courses={courses}
            jobs={jobs}
            units={units}
            setActiveTab={setActiveTab}
            onOpenAuth={() => setIsAuthOpen(true)}
            userLoggedIn={!!user}
            banners={banners}
            onOpenPwa={() => setIsPwaModalOpen(true)}
          />
        );
      case 'cadunico':
        return (
          <CadUnicoView
            user={user}
            units={units}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        );
      case 'beneficios':
        return <BenefitsView user={user} onOpenAuth={() => setIsAuthOpen(true)} />;
      case 'cursos':
        return (
          <CoursesView
            user={user}
            courses={courses}
            fetchCourses={fetchCourses}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        );
      case 'contrata':
        return (
          <ContrataView 
            jobs={jobs} 
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        );
      case 'unidades':
        return <UnitsView units={units} />;
      case 'news':
        return <NewsView news={news} />;
      case 'admin-dashboard':
        if (user?.role !== 'admin' && user?.role !== 'administrador' && user?.role !== 'colaborador') {
          return (
            <div className="p-8 text-center bg-white border border-slate-100 rounded-3xl max-w-md mx-auto space-y-4">
              <Shield className="w-12 h-12 text-red-500 mx-auto" />
              <h2 className="font-display font-bold text-slate-800 text-sm">Acesso Restrito</h2>
              <p className="text-xs text-slate-500 leading-normal font-light">Este painel é restrito aos assistentes sociais e administradores municipais credenciados da SEMPS Vera Cruz.</p>
              <button onClick={() => setActiveTab('home')} className="bg-brand-green text-white text-xs px-4 py-2 rounded-xl">Voltar ao Início</button>
            </div>
          );
        }
        return (
          <AdminDashboard
            user={user}
            courses={courses}
            fetchCourses={fetchCourses}
            fetchJobs={fetchJobs}
            fetchNews={fetchNews}
            banners={banners}
          />
        );
      default:
        return <div className="text-center py-12 text-slate-400">Página em desenvolvimento...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col justify-between selection:bg-brand-green-light selection:text-brand-green-dark">
      {/* Sticky top navigation header */}
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPwa={() => setIsPwaModalOpen(true)}
      />

      {/* Main container with spacing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <ProtectedRoute activeTab={activeTab} setActiveTab={setActiveTab}>
          {renderContent()}
        </ProtectedRoute>
      </main>

      {/* Municipal Footer branding */}
      <footer className="bg-brand-green-dark text-white border-t border-brand-green py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="font-display font-bold text-sm text-yellow-300 flex items-center gap-2">
              <Milestone className="w-4 h-4" /> SEMPS Vera Cruz / BA
            </h3>
            <p className="text-[11px] text-brand-cream-dark leading-relaxed font-light">
              Secretaria Municipal de Promoção Social de Vera Cruz - Estado da Bahia. <br />
              Desenvolvido com foco na inclusão social, acessibilidade digital e respeito integral aos preceitos da Lei Geral de Proteção de Dados (LGPD).
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider">Canais de Contato</h4>
            <p className="text-[11px] text-brand-cream-dark flex items-center gap-2 font-mono">
              <Phone className="w-3.5 h-3.5 text-yellow-300" /> Ouvidoria Social: (71) 3633-1234
            </p>
            <p className="text-[11px] text-brand-cream-dark flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-yellow-300 shrink-0" /> Centro, Vera Cruz - BA, CEP 44470-000
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-display font-semibold text-xs text-white uppercase tracking-wider">Apoio Social</h4>
            <p className="text-[11px] text-brand-cream-dark leading-relaxed font-light">
              Vera Cruz crescendo de mãos dadas com quem mais precisa. Cadastre-se na plataforma para garantir facilidade em agendamentos presenciais e acompanhamento de direitos.
            </p>
            <div className="flex flex-col gap-1 text-[10px] text-brand-green-light font-semibold pt-1">
              <span className="flex items-center gap-1">Feito com <Heart className="w-3 h-3 text-red-400 fill-red-400" /> para os cidadãos veracruzenses.</span>
              <span className="text-yellow-300 font-mono text-[9px] font-normal">Desenvolvido por Abel Santos</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-brand-green/40 mt-8 pt-4 text-center text-[10px] text-brand-cream-dark/60 font-mono">
          © {new Date().getFullYear()} Prefeitura Municipal de Vera Cruz - BA. Todos os direitos reservados de acordo com a LGPD.
        </div>
      </footer>

      {/* Floating 24h AI Chatbot Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isAiWidgetOpen ? (
          <button
            onClick={() => setIsAiWidgetOpen(true)}
            className="bg-brand-green hover:bg-brand-green-dark text-white p-4 rounded-full shadow-2xl transition duration-300 flex items-center gap-2 group animate-bounce"
            title="Fale com nosso assistente de IA"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-xs font-bold font-display whitespace-nowrap">
              Dúvidas? Fale Conosco
            </span>
          </button>
        ) : (
          <div className="relative w-80 md:w-96 shadow-2xl rounded-3xl border border-slate-200 overflow-hidden bg-white animate-fade-in">
            {/* Close float widget */}
            <button
              onClick={() => setIsAiWidgetOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-yellow-300 z-50 p-1 bg-black/20 hover:bg-black/40 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="max-h-[500px] overflow-y-auto">
              <AiAssistant />
            </div>
          </div>
        )}
      </div>

      {/* Authentication Gateway Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Forced password change overlay */}
      {user?.needsPasswordChange && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="text-center space-y-2">
              <div className="bg-yellow-100 text-yellow-800 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="font-display font-bold text-slate-800 text-lg">Alteração de Senha Obrigatória</h2>
              <p className="text-xs text-slate-500 leading-normal font-light">
                Detectamos que este é o seu primeiro acesso com a conta de administrador padrão do SEMPS VC. 
                Por razões de segurança, você precisa definir uma nova senha forte (mínimo de 8 caracteres).
              </p>
            </div>

            {changePwdError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-100 font-light">
                {changePwdError}
              </div>
            )}

            {changePwdSuccess ? (
              <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-xl border border-emerald-100 text-center font-medium">
                Senha atualizada com sucesso! Acessando o sistema...
              </div>
            ) : (
              <form onSubmit={handleForcePasswordChange} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    placeholder="Mínimo de 8 caracteres"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Confirme a Nova Senha</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-green/30"
                    placeholder="Digite a senha novamente"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPwd}
                  className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-xs py-3 rounded-xl shadow-lg transition duration-200 disabled:opacity-50"
                >
                  {isChangingPwd ? "Atualizando..." : "Salvar Nova Senha"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PWA Installation Assistant Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
      />
    </div>
  );
}
