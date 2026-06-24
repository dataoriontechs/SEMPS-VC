import React, { useState, useEffect } from 'react';
import { User, News, Course, JobVacancy, SempsUnit } from './types';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import HomeView from './components/HomeView';
import CadUnicoView from './components/CadUnicoView';
import BenefitsView from './components/BenefitsView';
import CoursesView from './components/CoursesView';
import ContrataView from './components/ContrataView';
import UnitsView from './components/UnitsView';
import AiAssistant from './components/AiAssistant';
import AdminDashboard from './components/AdminDashboard';
import { Sparkles, MessageSquare, Phone, MapPin, Shield, Milestone, X, Heart } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Core municipal collections
  const [news, setNews] = useState<News[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [units, setUnits] = useState<SempsUnit[]>([]);

  // Floating AI Chat state
  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState<boolean>(false);

  // Initialize and load persistent session
  useEffect(() => {
    const savedUser = sessionStorage.getItem('semps_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      if (response.ok) setNews(data);
    } catch (err) {
      console.error('Erro ao buscar notícias:', err);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      if (response.ok) setCourses(data);
    } catch (err) {
      console.error('Erro ao buscar cursos:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      if (response.ok) setJobs(data);
    } catch (err) {
      console.error('Erro ao buscar vagas:', err);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/units');
      const data = await response.json();
      if (response.ok) setUnits(data);
    } catch (err) {
      console.error('Erro ao buscar unidades:', err);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchCourses();
    fetchJobs();
    fetchUnits();
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    sessionStorage.setItem('semps_user', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('semps_user');
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
        return <BenefitsView user={user} />;
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
        return <ContrataView jobs={jobs} />;
      case 'unidades':
        return <UnitsView units={units} />;
      case 'admin-dashboard':
        if (user?.role !== 'admin') {
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
      />

      {/* Main container with spacing */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {renderContent()}
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
            <div className="flex items-center gap-1.5 text-[10px] text-brand-green-light font-semibold pt-1">
              Feito com <Heart className="w-3 h-3 text-red-400 fill-red-400" /> para os cidadãos veracruzenses.
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
    </div>
  );
}
