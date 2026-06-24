import React, { useState, useEffect } from 'react';
import { User, Schedule, Course, News, BenefitProgram, JobVacancy } from '../types';
import { Users, Calendar, GraduationCap, Briefcase, Plus, Trash2, CheckCircle2, XCircle, Search, Edit2, FileText, BarChart3, AlertCircle } from 'lucide-react';
import { maskCpf, maskNis, maskPhone } from './AuthModal';

interface AdminDashboardProps {
  user: User;
  courses: Course[];
  fetchCourses: () => void;
  fetchJobs: () => void;
  fetchNews: () => void;
}

export default function AdminDashboard({ user, courses, fetchCourses, fetchJobs, fetchNews }: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>('stats');
  const [stats, setStats] = useState<any>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Search citizen for updating benefits
  const [citizenSearchCpf, setCitizenSearchCpf] = useState<string>('');
  const [citizenBenefits, setCitizenBenefits] = useState<BenefitProgram[]>([]);
  const [benefitSearched, setBenefitSearched] = useState<boolean>(false);

  // Forms states
  // News Form
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsCategory, setNewsCategory] = useState<'campanha' | 'comunicado' | 'evento' | 'aviso'>('comunicado');
  const [newsIsImportant, setNewsIsImportant] = useState(false);

  // Course Form
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseRequirements, setCourseRequirements] = useState('');
  const [courseSlots, setCourseSlots] = useState<number>(20);
  const [courseCategory, setCourseCategory] = useState('');
  const [courseSchedule, setCourseSchedule] = useState('');

  // Job Form
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobRequirements, setJobRequirements] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState<'CLT' | 'Freelancer'>('CLT');
  const [jobContact, setJobContact] = useState('');

  const fetchAdminStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSchedules = async () => {
    try {
      const response = await fetch('/api/schedules?role=admin');
      const data = await response.json();
      if (response.ok) {
        setSchedules(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminStats();
    fetchAllSchedules();
  }, [activeSubTab]);

  const handleUpdateScheduleStatus = async (id: string, newStatus: 'completed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/schedules/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setSuccess('Status do agendamento atualizado com sucesso.');
        fetchAllSchedules();
        fetchAdminStats();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchBenefits = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBenefitSearched(false);

    if (!citizenSearchCpf) {
      setError('CPF do cidadão é obrigatório para pesquisar benefícios.');
      return;
    }

    try {
      const response = await fetch(`/api/benefits?cpf=${encodeURIComponent(citizenSearchCpf)}`);
      const data = await response.json();

      if (response.ok) {
        setCitizenBenefits(data.benefits || []);
        setBenefitSearched(true);
      } else {
        setError(data.error || 'Nenhum registro de benefício ativo encontrado.');
      }
    } catch (err) {
      setError('Erro de conexão ao buscar benefícios.');
    }
  };

  const handleSaveBenefits = async () => {
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/benefits/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: citizenSearchCpf,
          benefits: citizenBenefits
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Benefícios do cidadão atualizados e salvos com sucesso!');
      } else {
        setError(data.error || 'Erro ao salvar benefícios.');
      }
    } catch (err) {
      setError('Erro de conexão ao salvar.');
    }
  };

  const handleBenefitStatusChange = (benefitId: string, newStatus: any) => {
    setCitizenBenefits(prev =>
      prev.map(b => (b.id === benefitId ? { ...b, status: newStatus, lastUpdated: new Date().toISOString().split('T')[0] } : b))
    );
  };

  const handleBenefitObservationChange = (benefitId: string, newObs: string) => {
    setCitizenBenefits(prev =>
      prev.map(b => (b.id === benefitId ? { ...b, observations: newObs, lastUpdated: new Date().toISOString().split('T')[0] } : b))
    );
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newsTitle,
          content: newsContent,
          category: newsCategory,
          author: user.name,
          isImportant: newsIsImportant
        })
      });

      if (response.ok) {
        setSuccess('Notícia publicada com sucesso!');
        setNewsTitle('');
        setNewsContent('');
        setNewsCategory('comunicado');
        setNewsIsImportant(false);
        fetchNews();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao publicar notícia.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: courseTitle,
          description: courseDescription,
          requirements: courseRequirements,
          totalSlots: courseSlots,
          category: courseCategory,
          schedule: courseSchedule
        })
      });

      if (response.ok) {
        setSuccess('Curso/Oficina criado com sucesso!');
        setCourseTitle('');
        setCourseDescription('');
        setCourseRequirements('');
        setCourseCategory('');
        setCourseSchedule('');
        fetchCourses();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao criar curso.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobTitle,
          company: jobCompany,
          description: jobDescription,
          requirements: jobRequirements,
          salary: jobSalary,
          location: jobLocation,
          type: jobType,
          contact: jobContact
        })
      });

      if (response.ok) {
        setSuccess('Vaga / Oportunidade publicada no Contrata Vera Cruz!');
        setJobTitle('');
        setJobCompany('');
        setJobDescription('');
        setJobRequirements('');
        setJobSalary('');
        setJobLocation('');
        setJobContact('');
        fetchJobs();
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao publicar vaga.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="font-display text-2xl font-bold text-brand-green-dark">Painel Administrativo SEMPS</h1>
        <p className="text-xs text-slate-500 font-light">Controle completo da plataforma digital: gestão de notícias, cursos, agendamentos do CadÚnico, contratações e benefícios.</p>
      </div>

      {/* Admin subtabs navigation */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1 overflow-x-auto">
        <button
          onClick={() => { setActiveSubTab('stats'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[100px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'stats' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Relatórios & Estatísticas
        </button>

        <button
          onClick={() => { setActiveSubTab('benefits'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'benefits' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Atualizar Benefícios
        </button>

        <button
          onClick={() => { setActiveSubTab('schedules'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'schedules' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" /> Agendamentos CadÚnico
        </button>

        <button
          onClick={() => { setActiveSubTab('news'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'news' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" /> Postar Notícias
        </button>

        <button
          onClick={() => { setActiveSubTab('courses'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'courses' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Criar Cursos
        </button>

        <button
          onClick={() => { setActiveSubTab('jobs'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'jobs' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-slate-600 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Cadastrar Vagas
        </button>
      </div>

      {/* Global notifications alerts */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {/* 1. RELATÓRIOS & ESTATÍSTICAS SUBTAB */}
      {activeSubTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-brand-green-light text-brand-green-dark p-3 rounded-2xl shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Cidadãos Cadastrados</span>
                <span className="font-display font-extrabold text-lg text-slate-800">{stats.citizensCount}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-amber-100 text-amber-800 p-3 rounded-2xl shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Agendamentos Ativos</span>
                <span className="font-display font-extrabold text-lg text-slate-800">{stats.activeSchedules}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-emerald-100 text-emerald-800 p-3 rounded-2xl shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Inscrições em Cursos</span>
                <span className="font-display font-extrabold text-lg text-slate-800">{stats.totalInscriptions}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
              <div className="bg-teal-100 text-teal-800 p-3 rounded-2xl shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Vagas de Trabalho</span>
                <span className="font-display font-extrabold text-lg text-slate-800">{stats.jobsCount}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent schedules list */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-xs text-brand-green-dark border-b border-slate-50 pb-2">Solicitações Recentes de CadÚnico</h3>
              <div className="space-y-3">
                {stats.recentSchedules?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic font-light">Nenhum agendamento ativo.</p>
                ) : (
                  stats.recentSchedules?.map((s: Schedule) => (
                    <div key={s.id} className="text-xs flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-900">{s.userName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">CPF: {s.userCpf} • {s.unitName}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-brand-green block">{s.time}</span>
                        <span className="text-[9px] text-slate-400">{s.date.split('-').reverse().join('/')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Courses summary stats */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="font-display font-bold text-xs text-brand-green-dark border-b border-slate-50 pb-2">Inscrições por Curso</h3>
              <div className="space-y-3">
                {stats.coursesSummary?.map((c: any) => {
                  const percentage = Math.round((c.enrolled / c.total) * 100) || 0;
                  return (
                    <div key={c.id} className="space-y-1.5 text-xs font-light">
                      <div className="flex justify-between items-center font-bold text-slate-800">
                        <span className="truncate max-w-[200px]">{c.title}</span>
                        <span>{c.enrolled} / {c.total} Alunos ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-green h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ATUALIZAR BENEFÍCIOS DO CIDADÃO (REQUESTED COMPONENT) */}
      {activeSubTab === 'benefits' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div>
            <h2 className="font-display font-bold text-base text-brand-green-dark">Gestão e Atualização de Benefícios Sociais</h2>
            <p className="text-xs text-slate-500 font-light">Busque o cidadão por seu CPF para gerenciar aprovações de programas locais, Bolsa Família ou auxílios emergenciais.</p>
          </div>

          <form onSubmit={handleSearchBenefits} className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={citizenSearchCpf}
                onChange={(e) => setCitizenSearchCpf(maskCpf(e.target.value))}
                placeholder="Busque por CPF: 000.000.000-00"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
              />
            </div>
            <button
              type="submit"
              className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition shrink-0"
            >
              Pesquisar Cadastro
            </button>
          </form>

          {/* Results Editor */}
          {benefitSearched && (
            <div className="border-t border-slate-100 pt-6 space-y-6 animate-fade-in">
              <div className="flex items-center gap-1.5 bg-brand-green-light/20 text-brand-green-dark p-3.5 rounded-2xl text-xs font-semibold w-fit">
                <span>👤 Cidadão Encontrado • CPF {citizenSearchCpf}</span>
              </div>

              <div className="space-y-6">
                {citizenBenefits.map((b) => (
                  <div key={b.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex flex-col md:flex-row gap-4 justify-between md:items-center">
                    <div className="space-y-1 md:max-w-md">
                      <p className="font-bold text-slate-900">{b.name}</p>
                      <p className="text-slate-500 leading-normal font-light">{b.description}</p>
                    </div>

                    <div className="space-y-3 md:w-80 shrink-0">
                      {/* Status Selector */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status do Benefício</label>
                        <select
                          value={b.status}
                          onChange={(e) => handleBenefitStatusChange(b.id, e.target.value as any)}
                          className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold"
                        >
                          <option value="Aprovado">Aprovado / Ativo</option>
                          <option value="Em Análise">Em Análise</option>
                          <option value="Pendente">Pendente de Documento</option>
                          <option value="Não Cadastrado">Não Cadastrado</option>
                        </select>
                      </div>

                      {/* Observations / Orientations text */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Orientação / Observação</label>
                        <textarea
                          rows={2}
                          value={b.observations || ''}
                          onChange={(e) => handleBenefitObservationChange(b.id, e.target.value)}
                          placeholder="Informe documentos pendentes ou status de saques..."
                          className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs leading-normal focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveBenefits}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3.5 rounded-xl shadow-md transition"
              >
                Salvar Atualizações de Benefícios do Cidadão
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. AGENDAMENTOS CADÚNICO TAB */}
      {activeSubTab === 'schedules' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
          <h2 className="font-display font-bold text-base text-brand-green-dark border-b border-slate-50 pb-2">Controle de Atendimentos CadÚnico</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-light">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-3">Cidadão / CPF</th>
                  <th className="p-3">Unidade CRAS</th>
                  <th className="p-3">Data e Horário</th>
                  <th className="p-3">Telefone</th>
                  <th className="p-3 text-center">Status / Ações</th>
                </tr>
              </thead>
              <tbody>
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">Nenhum agendamento registrado.</td>
                  </tr>
                ) : (
                  schedules.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="p-3 font-semibold">
                        <div>{s.userName}</div>
                        <div className="text-[10px] text-slate-400 font-mono font-normal">CPF {s.userCpf}</div>
                      </td>
                      <td className="p-3 text-slate-700 font-bold">{s.unitName}</td>
                      <td className="p-3 text-slate-700">
                        <div>{s.date.split('-').reverse().join('/')}</div>
                        <div className="font-mono text-[10px] font-bold text-brand-green">{s.time} h</div>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{s.userPhone}</td>
                      <td className="p-3 flex items-center justify-center gap-1.5 pt-4">
                        {s.status === 'scheduled' ? (
                          <>
                            <button
                              onClick={() => handleUpdateScheduleStatus(s.id, 'completed')}
                              className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-1.5 rounded-lg hover:bg-emerald-100 transition"
                            >
                              ✓ Atendido
                            </button>
                            <button
                              onClick={() => handleUpdateScheduleStatus(s.id, 'cancelled')}
                              className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-1.5 rounded-lg hover:bg-red-100 transition"
                            >
                              ✕ Cancelar
                            </button>
                          </>
                        ) : (
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            s.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {s.status === 'completed' ? 'Atendido' : 'Cancelado'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. POSTAR NOTÍCIA TAB */}
      {activeSubTab === 'news' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm max-w-2xl space-y-6">
          <h2 className="font-display font-bold text-base text-brand-green-dark border-b border-slate-50 pb-2">Publicar Comunicado ou Notícia Social</h2>
          
          <form onSubmit={handleCreateNews} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Título do Comunicado *</label>
              <input
                type="text"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                placeholder="Ex: Novo mutirão de agendamento em Barra do Gil"
                required
                className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-brand-green text-xs bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria *</label>
                <select
                  value={newsCategory}
                  onChange={(e: any) => setNewsCategory(e.target.value)}
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
                >
                  <option value="campanha">Campanha Social</option>
                  <option value="comunicado">Comunicado Geral</option>
                  <option value="evento">Evento SEMPS</option>
                  <option value="aviso">Aviso Importante</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="news-important"
                  checked={newsIsImportant}
                  onChange={(e) => setNewsIsImportant(e.target.checked)}
                  className="h-4.5 w-4.5 text-brand-green rounded-sm border-slate-300"
                />
                <label htmlFor="news-important" className="text-xs text-slate-700 font-bold">Fixar como Destaque / Importante</label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Conteúdo da Notícia *</label>
              <textarea
                rows={5}
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                placeholder="Escreva as informações completas, datas, documentos e orientações da notícia..."
                required
                className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-brand-green text-xs bg-slate-50 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
            >
              Publicar Comunicado Oficial
            </button>
          </form>
        </div>
      )}

      {/* 5. CRIAR CURSOS TAB */}
      {activeSubTab === 'courses' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm max-w-2xl space-y-6">
          <h2 className="font-display font-bold text-base text-brand-green-dark border-b border-slate-50 pb-2">Cadastrar Novo Curso de Capacitação</h2>

          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Curso / Oficina *</label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Ex: Curso de Eletricista de Manutenção Comercial"
                required
                className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-brand-green text-xs bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria *</label>
                <input
                  type="text"
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  placeholder="Inclusão Digital, Geração de Renda..."
                  required
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total de Vagas *</label>
                <input
                  type="number"
                  value={courseSlots}
                  onChange={(e) => setCourseSlots(Number(e.target.value))}
                  required
                  min={1}
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cronograma / Dias e Horários *</label>
                <input
                  type="text"
                  value={courseSchedule}
                  onChange={(e) => setCourseSchedule(e.target.value)}
                  placeholder="Ex: Terças e Quintas, 14h às 16h"
                  required
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Curso *</label>
              <textarea
                rows={3}
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                placeholder="Descreva resumidamente o que o aluno aprenderá..."
                required
                className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Requisitos Mínimos *</label>
              <textarea
                rows={2}
                value={courseRequirements}
                onChange={(e) => setCourseRequirements(e.target.value)}
                placeholder="Ex: Estar inscrito no CadÚnico com NIS ativo, idade mínima 16 anos."
                required
                className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
            >
              Criar Curso / Oficina Gratuita
            </button>
          </form>
        </div>
      )}

      {/* 6. CADASTRAR VAGA CONTRATA VERA CRUZ TAB */}
      {activeSubTab === 'jobs' && (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm max-w-2xl space-y-6">
          <h2 className="font-display font-bold text-base text-brand-green-dark border-b border-slate-50 pb-2">Publicar Vaga no Contrata Vera Cruz</h2>

          <form onSubmit={handleCreateJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título da Vaga / Cargo *</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ex: Recepcionista de Pousada"
                  required
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Empresa / Contratante *</label>
                <input
                  type="text"
                  value={jobCompany}
                  onChange={(e) => setJobCompany(e.target.value)}
                  placeholder="Pousada Mar Azul"
                  required
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Local de Trabalho *</label>
                <input
                  type="text"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  placeholder="Mar Grande, Vera Cruz/BA"
                  required
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Vaga *</label>
                <select
                  value={jobType}
                  onChange={(e: any) => setJobType(e.target.value)}
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
                >
                  <option value="CLT">CLT / Carteira assinada</option>
                  <option value="Freelancer">Freelancer / Prestador de serviço</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Salário / Remuneração</label>
                <input
                  type="text"
                  value={jobSalary}
                  onChange={(e) => setJobSalary(e.target.value)}
                  placeholder="Ex: R$ 1.650,00"
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Descrição das Atividades *</label>
              <textarea
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Descreva as principais funções da vaga..."
                required
                className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Requisitos da Vaga *</label>
              <textarea
                rows={2}
                value={jobRequirements}
                onChange={(e) => setJobRequirements(e.target.value)}
                placeholder="Ex: Experiência prévia de 6 meses, ensino médio completo."
                required
                className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Instruções de Contato / Envio de Currículo *</label>
              <input
                type="text"
                value={jobContact}
                onChange={(e) => setJobContact(e.target.value)}
                placeholder="Ex: Enviar e-mail para: contato@marazul.com ou WhatsApp: (71) 99999-1234"
                required
                className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
            >
              Publicar Oportunidade de Trabalho
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
