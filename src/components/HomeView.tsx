import React, { useState, useEffect } from 'react';
import { News, Course, JobVacancy, SempsUnit, Banner } from '../types';
import { Calendar, Award, GraduationCap, Briefcase, ChevronRight, ArrowRight, Smartphone, Sparkles, MapPin, Phone, Clock, Bookmark, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HomeViewProps {
  news: News[];
  courses: Course[];
  jobs: JobVacancy[];
  units: SempsUnit[];
  setActiveTab: (tab: string) => void;
  onOpenAuth: () => void;
  userLoggedIn: boolean;
  banners?: Banner[];
  onOpenPwa: () => void;
}

export default function HomeView({ news, courses, jobs, units, setActiveTab, onOpenAuth, userLoggedIn, banners = [], onOpenPwa }: HomeViewProps) {
  // Take first 2 news, first 2 courses, and first 2 jobs for preview
  const featuredNews = news.slice(0, 3);
  const featuredCourses = courses.filter(c => c.availableSlots > 0).slice(0, 2);
  const featuredJobs = jobs.slice(0, 2);

  const [currentSlide, setCurrentSlide] = useState(0);
  const activeBanners = banners.filter(b => b.ativo);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* 1. Main Banner Carousel */}
      <section className="relative overflow-hidden rounded-[32px] bg-brand-green-dark text-white shadow-xl h-[280px] md:h-[360px] lg:h-[400px] group/carousel">
        {activeBanners.length > 0 ? (
          <div className="relative w-full h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBanners[currentSlide].id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                {/* Background Image */}
                <img
                  src={activeBanners[currentSlide].imagem_url}
                  alt={activeBanners[currentSlide].titulo || "Banner SEMPS"}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-slate-900/10" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 space-y-3">
                  <span className="inline-flex items-center gap-1 bg-brand-green-light text-brand-green-dark text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full w-fit">
                    <Sparkles className="w-3 h-3 fill-brand-green-dark" /> SEMPS VC
                  </span>
                  {activeBanners[currentSlide].titulo && (
                    <h2 className="font-display text-2xl md:text-4xl font-normal italic tracking-tight leading-tight max-w-2xl drop-shadow-md">
                      {activeBanners[currentSlide].titulo}
                    </h2>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows (if more than 1 banner) */}
            {activeBanners.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition opacity-0 group-hover/carousel:opacity-100 flex items-center justify-center z-10 cursor-pointer"
                  aria-label="Slide anterior"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition opacity-0 group-hover/carousel:opacity-100 flex items-center justify-center z-10 cursor-pointer"
                  aria-label="Próximo slide"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </>
            )}

            {/* Indicators / Dots */}
            {activeBanners.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/10 px-3 py-1.5 rounded-full backdrop-blur-xs">
                {activeBanners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      currentSlide === idx ? "bg-white w-4" : "bg-white/40 hover:bg-white/70"
                    }`}
                    aria-label={`Ir para slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Empty / Fallback slide if no banners registered yet */
          <div className="w-full h-full flex flex-col justify-center items-center p-8 text-center bg-brand-green-dark relative">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-brand-green/30 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-brand-green-light/10 blur-3xl"></div>
            <div className="relative space-y-4 max-w-xl">
              <span className="inline-flex items-center gap-1 bg-brand-green-light text-brand-green-dark text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full mx-auto">
                <Sparkles className="w-3 h-3 fill-brand-green-dark" /> Bem-vindo
              </span>
              <h1 className="font-display text-2xl md:text-3xl font-light leading-tight text-white">
                Secretaria Municipal de Promoção Social de Vera Cruz/BA
              </h1>
              <p className="text-brand-cream-dark text-xs md:text-sm font-light leading-relaxed">
                Navegue pelas nossas opções abaixo para agendamentos do CadÚnico, consulta de benefícios sociais, capacitação profissional e vagas locais de trabalho.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 2. Quick Action Buttons Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('cadunico')}
          className="flex flex-col items-center justify-center p-5 bg-white hover:bg-brand-cream-dark/10 border border-brand-green-light rounded-2xl shadow-xs hover:shadow-sm transition text-center group"
        >
          <div className="bg-brand-green-light/50 text-brand-green-dark p-3 rounded-xl group-hover:scale-110 transition">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xs text-brand-green-dark mt-3 block uppercase tracking-wide">Agendar CadÚnico</span>
          <span className="text-[10px] text-brand-green-dark/60 mt-1 font-light">Escolha data e local</span>
        </button>

        <button
          onClick={() => setActiveTab('beneficios')}
          className="flex flex-col items-center justify-center p-5 bg-white hover:bg-brand-cream-dark/10 border border-brand-green-light rounded-2xl shadow-xs hover:shadow-sm transition text-center group"
        >
          <div className="bg-brand-green-light/50 text-brand-green-dark p-3 rounded-xl group-hover:scale-110 transition">
            <Award className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xs text-brand-green-dark mt-3 block uppercase tracking-wide">Consultar Benefício</span>
          <span className="text-[10px] text-brand-green-dark/60 mt-1 font-light">Busque aprovação por CPF</span>
        </button>

        <button
          onClick={() => setActiveTab('cursos')}
          className="flex flex-col items-center justify-center p-5 bg-white hover:bg-brand-cream-dark/10 border border-brand-green-light rounded-2xl shadow-xs hover:shadow-sm transition text-center group"
        >
          <div className="bg-brand-green-light/50 text-brand-green-dark p-3 rounded-xl group-hover:scale-110 transition">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xs text-brand-green-dark mt-3 block uppercase tracking-wide">Cursos e Oficinas</span>
          <span className="text-[10px] text-brand-green-dark/60 mt-1 font-light">Capacitação profissional</span>
        </button>

        <button
          onClick={() => setActiveTab('contrata')}
          className="flex flex-col items-center justify-center p-5 bg-white hover:bg-brand-cream-dark/10 border border-brand-green-light rounded-2xl shadow-xs hover:shadow-sm transition text-center group"
        >
          <div className="bg-brand-green-light/50 text-brand-green-dark p-3 rounded-xl group-hover:scale-110 transition">
            <Briefcase className="w-6 h-6" />
          </div>
          <span className="font-display font-bold text-xs text-brand-green-dark mt-3 block uppercase tracking-wide">Contrata Vera Cruz</span>
          <span className="text-[10px] text-brand-green-dark/60 mt-1 font-light">Vagas de Emprego & Freelas</span>
        </button>
      </section>

      {/* 3. News Feed and Info (2 Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* News Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-brand-green-light pb-2">
            <h2 className="font-display text-xl italic text-brand-green-dark">Notícias e Comunicados Oficiais</h2>
            <button
              onClick={() => setActiveTab('news')}
              className="text-xs font-bold text-brand-green hover:underline flex items-center gap-1"
            >
              Ver todas <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {featuredNews.map((item) => (
              <article key={item.id} className="p-5 bg-white border border-brand-green-light rounded-[24px] shadow-xs hover:shadow-sm transition space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full ${
                    item.category === 'campanha' ? 'bg-red-50 text-red-700 border border-red-100' :
                    item.category === 'comunicado' ? 'bg-brand-green-light text-brand-green-dark' :
                    item.category === 'evento' ? 'bg-blue-50 text-blue-700' : 'bg-brand-cream-dark/40 text-brand-green-dark/80'
                  }`}>
                    {item.category}
                  </span>
                  <span className="text-[10px] text-[#5a5a40] font-mono">{item.date}</span>
                </div>
                <h3 className="font-display font-bold text-base text-brand-green-dark hover:text-brand-green transition leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#5a5a40] leading-relaxed font-light line-clamp-2">
                  {item.content}
                </p>
                <div className="flex justify-between items-center pt-2 text-[10px] text-brand-green-dark/50 border-t border-brand-green-light/30">
                  <span>Por {item.author}</span>
                  <button onClick={() => setActiveTab('news')} className="font-bold text-brand-green hover:underline">Ler notícia completa</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-6">
          {/* Courses preview */}
          <div className="p-5 bg-white border border-brand-green-light rounded-[24px] shadow-xs space-y-4">
            <div className="border-b border-brand-green-light/60 pb-2 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm italic text-brand-green-dark flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-brand-green-dark" /> Inscrições Abertas
              </h3>
              <button onClick={() => setActiveTab('cursos')} className="text-[10px] text-brand-green hover:underline font-bold">Ver todos</button>
            </div>
            <div className="space-y-3">
              {featuredCourses.map((c) => (
                <div key={c.id} className="bg-brand-cream p-3.5 rounded-xl border border-brand-green-light/50 text-xs">
                  <p className="font-bold text-brand-green-dark line-clamp-1">{c.title}</p>
                  <p className="text-[10px] text-[#5a5a40] mt-1 font-mono">{c.schedule}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-brand-green-light/30">
                    <span className="text-[10px] text-brand-green-dark bg-brand-green-light/45 px-1.5 py-0.5 rounded-sm font-semibold">
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
          <div className="p-5 bg-white border border-brand-green-light rounded-[24px] shadow-xs space-y-4">
            <div className="border-b border-brand-green-light/60 pb-2 flex items-center justify-between">
              <h3 className="font-display font-bold text-sm italic text-brand-green-dark flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-brand-green-dark" /> Vagas Recentes
              </h3>
              <button onClick={() => setActiveTab('contrata')} className="text-[10px] text-brand-green hover:underline font-bold">Ver todas</button>
            </div>
            <div className="space-y-3">
              {featuredJobs.map((j) => (
                <div key={j.id} className="bg-brand-cream p-3.5 rounded-xl border border-brand-green-light/50 text-xs">
                  <div className="flex justify-between items-start gap-1">
                    <span className="font-bold text-brand-green-dark line-clamp-1">{j.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-sm font-bold bg-brand-green-light text-brand-green-dark">
                      {j.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#5a5a40] mt-0.5">{j.company}</p>
                  <p className="text-[10px] text-brand-green-dark/70 font-mono mt-1.5 line-clamp-1">📍 {j.location}</p>
                  <button
                    onClick={() => setActiveTab('contrata')}
                    className="w-full mt-2.5 text-center bg-white hover:bg-brand-cream text-[10px] font-bold text-brand-green-dark py-1.5 rounded-lg border border-brand-green-light transition"
                  >
                    Ver detalhes e contato
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PWA Promotion installation Card */}
          <div className="p-6 bg-brand-green-dark text-white rounded-[24px] shadow-lg space-y-3 relative overflow-hidden">
            <Smartphone className="w-12 h-12 text-brand-green-light opacity-15 absolute right-4 bottom-4" />
            <h4 className="font-display font-bold text-sm text-white">📲 Experiência SEMPS PWA</h4>
            <p className="text-[11px] text-brand-cream-dark leading-relaxed font-light">
              Instale a plataforma da SEMPS na tela inicial do seu celular sem ocupar memória! Receba notificações de agendamento e novas vagas instantaneamente.
            </p>
            <button
              onClick={onOpenPwa}
              className="bg-white text-brand-green-dark hover:bg-brand-cream text-[10px] font-bold px-4 py-2.5 rounded-full transition shadow-sm inline-block"
            >
              Instalar Aplicativo (PWA)
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mini Units map teaser */}
      <section className="bg-brand-green-light/15 border border-brand-green-light p-6 rounded-[32px] space-y-4">
        <div className="flex justify-between items-center border-b border-brand-green-light pb-2">
          <div>
            <h2 className="font-display text-xl italic text-brand-green-dark">Onde Encontrar a SEMPS?</h2>
            <p className="text-xs text-brand-green-dark/60 font-light">Unidades físicas de atendimento social em Vera Cruz/BA</p>
          </div>
          <button onClick={() => setActiveTab('unidades')} className="text-xs font-bold text-brand-green hover:underline">Ver mapa de unidades ➜</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {units.map((unit) => (
            <div key={unit.id} className="bg-white p-4 rounded-2xl shadow-xs border border-brand-green-light flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-brand-green uppercase tracking-wider">Unidade Física</span>
                <h3 className="font-display font-bold text-xs text-brand-green-dark">{unit.name}</h3>
                <p className="text-[10px] text-[#5a5a40] leading-normal line-clamp-2 font-light">{unit.address}</p>
              </div>
              <div className="pt-3 mt-3 border-t border-brand-green-light/30 space-y-1 text-[10px] text-[#5a5a40]">
                <div className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3 h-3 text-brand-green" /> {unit.phone}
                </div>
                <div className="flex items-center gap-1.5 font-light">
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
