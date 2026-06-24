import React from 'react';
import { News, Course, JobVacancy, SempsUnit } from '../types';
import { Calendar, Award, GraduationCap, Briefcase, ChevronRight, ArrowRight, Smartphone, Sparkles, MapPin, Phone, Clock, Bookmark } from 'lucide-react';

interface HomeViewProps {
  news: News[];
  courses: Course[];
  jobs: JobVacancy[];
  units: SempsUnit[];
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  userLoggedIn: boolean;
}

export default function HomeView({ news, courses, jobs, units, setActiveTab, onOpenAuth, userLoggedIn }: HomeViewProps) {
  // Take first 2 news, first 2 courses, and first 2 jobs for preview
  const featuredNews = news.slice(0, 3);
  const featuredCourses = courses.filter(c => c.availableSlots > 0).slice(0, 2);
  const featuredJobs = jobs.slice(0, 2);

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* 1. Main Banner (Mutirão Campanha) */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-green-dark text-white shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-green/30 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-yellow-400/10 blur-3xl"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 py-12 md:py-16 text-center md:text-left md:flex items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <span className="inline-flex items-center gap-1 bg-yellow-400 text-brand-green-dark text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3 fill-brand-green-dark" /> Campanha Ativa
            </span>
            <h1 className="font-display text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Mutirão CadÚnico Vera Cruz/BA: Evite Bloqueios!
            </h1>
            <p className="text-brand-cream-dark text-xs md:text-sm font-light leading-relaxed">
              Inicia nesta segunda-feira a força-tarefa de atualização de cadastros defasados há mais de 2 anos. Mantenha seu Bolsa Família e Tarifa Social ativos! Agende seu horário online e evite filas presenciais.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={() => setActiveTab('cadunico')}
                className="bg-brand-cream text-brand-green-dark hover:bg-brand-cream-dark text-xs font-bold px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2"
              >
                Agendar Atendimento <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('unidades')}
                className="bg-brand-green/40 hover:bg-brand-green/60 text-white text-xs font-semibold px-4 py-3 rounded-xl border border-white/20 transition"
              >
                Ver Unidades CRAS
              </button>
            </div>
          </div>

          <div className="hidden md:block shrink-0 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-xs max-w-[240px]">
            <p className="text-xs font-bold text-yellow-400 mb-1">📢 Documentos Obrigatórios</p>
            <ul className="text-[11px] text-brand-cream-dark space-y-1 font-light">
              <li>• RG e CPF de todos</li>
              <li>• Comprovante de Residência</li>
              <li>• Carteira de Trabalho</li>
              <li>• Histórico Escolar das crianças</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. Quick Action Buttons Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('cadunico')}
          className="flex flex-col items-center justify-center p-5 bg-white hover:bg-brand-green-light/20 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition text-center group"
        >
          <div className="bg-brand-green-light text-brand-green p-3 rounded-xl group-hover:scale-115 transition">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xs text-brand-green-dark mt-3 block">Agendar CadÚnico</span>
          <span className="text-[10px] text-slate-400 mt-1">Escolha data e local</span>
        </button>

        <button
          onClick={() => setActiveTab('beneficios')}
          className="flex flex-col items-center justify-center p-5 bg-white hover:bg-brand-green-light/20 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition text-center group"
        >
          <div className="bg-amber-100 text-amber-800 p-3 rounded-xl group-hover:scale-115 transition">
            <Award className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xs text-brand-green-dark mt-3 block">Consultar Benefício</span>
          <span className="text-[10px] text-slate-400 mt-1">Busque aprovação por CPF</span>
        </button>

        <button
          onClick={() => setActiveTab('cursos')}
          className="flex flex-col items-center justify-center p-5 bg-white hover:bg-brand-green-light/20 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition text-center group"
        >
          <div className="bg-emerald-100 text-emerald-800 p-3 rounded-xl group-hover:scale-115 transition">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xs text-brand-green-dark mt-3 block">Cursos e Oficinas</span>
          <span className="text-[10px] text-slate-400 mt-1">Capacitação profissional</span>
        </button>

        <button
          onClick={() => setActiveTab('contrata')}
          className="flex flex-col items-center justify-center p-5 bg-white hover:bg-brand-green-light/20 border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition text-center group"
        >
          <div className="bg-teal-100 text-teal-800 p-3 rounded-xl group-hover:scale-115 transition">
            <Briefcase className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xs text-brand-green-dark mt-3 block">Contrata Vera Cruz</span>
          <span className="text-[10px] text-slate-400 mt-1">Vagas de Emprego & Freelas</span>
        </button>
      </section>

      {/* 3. News Feed and Info (2 Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* News Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
            <h2 className="font-display text-lg font-bold text-brand-green-dark">Notícias e Comunicados Oficiais</h2>
            <button
              onClick={() => setActiveTab('news')}
              className="text-xs font-semibold text-brand-green hover:underline flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {featuredNews.map((item) => (
              <article key={item.id} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-sm transition space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full ${
                    item.category === 'campanha' ? 'bg-red-50 text-red-700 border border-red-100' :
                    item.category === 'comunicado' ? 'bg-brand-green-light text-brand-green-dark' :
                    item.category === 'evento' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                </div>
                <h3 className="font-display font-bold text-sm text-slate-900 hover:text-brand-green transition">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-light line-clamp-2">
                  {item.content}
                </p>
                <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 border-t border-slate-50">
                  <span>Por {item.author}</span>
                  <button onClick={() => setActiveTab('news')} className="font-semibold text-brand-green hover:underline">Ler notícia completa</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          {/* Courses preview */}
          <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="font-display font-bold text-xs text-brand-green-dark flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-brand-green" /> Cursos com Inscrições Abertas
              </h3>
              <button onClick={() => setActiveTab('cursos')} className="text-[10px] text-brand-green hover:underline font-bold">Ver todos</button>
            </div>
            <div className="space-y-3">
              {featuredCourses.map((c) => (
                <div key={c.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <p className="font-bold text-slate-900 line-clamp-1">{c.title}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">{c.schedule}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm font-semibold">
                      {c.availableSlots} vagas restantes
                    </span>
                    <button
                      onClick={() => setActiveTab('cursos')}
                      className="text-[10px] font-bold text-brand-green hover:underline"
                    >
                      Inscrever-se ➜
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Jobs preview */}
          <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h3 className="font-display font-bold text-xs text-brand-green-dark flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-brand-green" /> Contrata Vera Cruz: Vagas Recentes
              </h3>
              <button onClick={() => setActiveTab('contrata')} className="text-[10px] text-brand-green hover:underline font-bold">Ver todas</button>
            </div>
            <div className="space-y-3">
              {featuredJobs.map((j) => (
                <div key={j.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-bold text-slate-900 line-clamp-1">{j.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold bg-brand-green-light text-brand-green-dark">
                      {j.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{j.company}</p>
                  <p className="text-[10px] text-slate-600 font-mono mt-1.5 line-clamp-1">📍 {j.location}</p>
                  <button
                    onClick={() => setActiveTab('contrata')}
                    className="w-full mt-2.5 text-center bg-white hover:bg-slate-100 text-[10px] font-semibold text-slate-700 py-1.5 rounded-lg border border-slate-200 transition"
                  >
                    Ver detalhes e contato
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PWA Promotion installation Card */}
          <div className="p-5 bg-gradient-to-br from-brand-green-dark to-brand-green text-white rounded-2xl shadow-lg space-y-3 relative overflow-hidden">
            <Smartphone className="w-12 h-12 text-brand-green-light opacity-30 absolute right-4 bottom-4" />
            <h4 className="font-display font-bold text-xs text-white">📲 Experiência SEMPS PWA</h4>
            <p className="text-[11px] text-brand-cream-dark leading-relaxed font-light">
              Instale a plataforma da SEMPS na tela inicial do seu celular sem ocupar memória! Receba notificações de agendamento e novas vagas instantaneamente.
            </p>
            <button
              onClick={() => alert('📱 No iOS/Safari: toque no botão de compartilhar do navegador e depois selecione "Adicionar à Tela de Início".\n🤖 No Android/Chrome: toque nos 3 pontinhos no canto superior e selecione "Instalar Aplicativo".')}
              className="bg-white text-brand-green-dark text-[10px] font-bold px-3 py-2 rounded-lg transition hover:bg-brand-cream-dark shadow-sm inline-block"
            >
              Ver Tutorial de Instalação
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mini Units map teaser */}
      <section className="bg-brand-cream-dark/40 border border-brand-cream-dark p-6 rounded-3xl space-y-4">
        <div className="flex justify-between items-center border-b border-brand-cream-dark pb-2">
          <div>
            <h2 className="font-display text-lg font-bold text-brand-green-dark">Onde Encontrar a SEMPS?</h2>
            <p className="text-xs text-slate-500 font-light">Unidades físicas de atendimento social em Vera Cruz/BA</p>
          </div>
          <button onClick={() => setActiveTab('unidades')} className="text-xs font-semibold text-brand-green hover:underline">Ver mapa de unidades ➜</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {units.map((unit) => (
            <div key={unit.id} className="bg-white p-4 rounded-2xl shadow-xs border border-slate-100 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider">Unidade Física</span>
                <h3 className="font-display font-bold text-xs text-slate-900">{unit.name}</h3>
                <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{unit.address}</p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-50 space-y-1 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-brand-green" /> {unit.phone}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-brand-green" /> {unit.hours}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
