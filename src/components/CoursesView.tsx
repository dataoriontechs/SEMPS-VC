import React, { useState, useEffect } from 'react';
import { User, Course, CourseEnrollment } from '../types';
import { GraduationCap, FileText, CheckCircle2, Bookmark, Users, Clock, AlertTriangle, X, ShieldAlert, Heart, Calendar } from 'lucide-react';
import { courseEnrollmentsService } from '../services/firestoreService';

interface CoursesViewProps {
  user: User | null;
  courses: Course[];
  fetchCourses: () => void;
  onOpenAuth: () => void;
}

export default function CoursesView({ user, courses, onOpenAuth }: CoursesViewProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<CourseEnrollment[]>([]);

  useEffect(() => {
    if (!user) {
      setUserEnrollments([]);
      return;
    }

    const unsub = courseEnrollmentsService.subscribeEnrollments((allEnrollments) => {
      const filtered = allEnrollments.filter(e => e.userId === user.id);
      setUserEnrollments(filtered);
    });

    return () => unsub();
  }, [user]);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Enrollment Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    rg: '',
    orgExp: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    motherName: '',
    address: '',
    neighborhood: '',
    cep: '',
    city: 'Vera Cruz',
    phone: '',
    whatsApp: '',
    email: '',
    education: '',
    profession: '',
    employmentStatus: '',
    rendaPerCapita: '',
    hasNis: false,
    nisNumber: '',
    hasDisability: false,
    disabilityType: '',
    observations: '',
    termAccepted: false,
    lgpdAccepted: false
  });

  const openEnrollmentForm = (course: Course) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    const isAlreadyEnrolled = userEnrollments.some(e => e.courseId === course.id && e.status !== 'Cancelado') || course.registeredUsers?.includes(user.id);
    if (isAlreadyEnrolled) {
      alert('Atenção: Você já possui uma inscrição ativa para este curso ou oficina! Não é permitido realizar mais de uma inscrição.');
      return;
    }

    setSelectedCourse(course);
    setFormData({
      fullName: user.name || '',
      cpf: user.cpf || '',
      rg: '',
      orgExp: '',
      birthDate: '',
      gender: '',
      maritalStatus: '',
      motherName: '',
      address: '',
      neighborhood: '',
      cep: '',
      city: 'Vera Cruz',
      phone: user.phone || '',
      whatsApp: user.phone || '',
      email: user.email || '',
      education: '',
      profession: '',
      employmentStatus: '',
      rendaPerCapita: '',
      hasNis: false,
      nisNumber: '',
      hasDisability: false,
      disabilityType: '',
      observations: '',
      termAccepted: false,
      lgpdAccepted: false
    });
    setShowModal(true);
  };

  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCourse) return;

    if (userEnrollments.some(e => e.courseId === selectedCourse.id)) {
      setErrorMsg('Atenção: Você já está inscrito neste curso/oficina! Não é permitido realizar mais de uma inscrição.');
      return;
    }

    if (!formData.termAccepted) {
      alert('Você precisa aceitar os termos de compromisso e regras do curso.');
      return;
    }
    if (!formData.lgpdAccepted) {
      alert('Você precisa aceitar os termos da LGPD para fins de tratamento de dados.');
      return;
    }

    setLoadingId(selectedCourse.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const isWaitList = selectedCourse.availableSlots <= 0;
      const status: CourseEnrollment['status'] = isWaitList ? 'Lista de Espera' : 'Inscrito';

      const enrollmentData: Omit<CourseEnrollment, 'id' | 'createdAt'> = {
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        userId: user.id,
        fullName: formData.fullName,
        cpf: formData.cpf,
        rg: `${formData.rg} (${formData.orgExp})`,
        birthDate: formData.birthDate,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        motherName: formData.motherName,
        address: `${formData.address}, Bairro: ${formData.neighborhood}, CEP: ${formData.cep}, Cidade: ${formData.city}`,
        neighborhood: formData.neighborhood,
        cep: formData.cep,
        city: formData.city,
        phone: formData.phone,
        whatsApp: formData.whatsApp,
        email: formData.email,
        education: formData.education,
        profession: formData.profession,
        employmentStatus: formData.employmentStatus,
        hasNis: formData.hasNis,
        nisNumber: formData.hasNis ? formData.nisNumber : '',
        hasDisability: formData.hasDisability,
        disabilityType: formData.hasDisability ? formData.disabilityType : '',
        observations: `Renda Familiar Per Capita: R$ ${formData.rendaPerCapita || '0'}. Obs: ${formData.observations || ''}`,
        lgpdAccepted: formData.lgpdAccepted,
        status: status
      };

      const { courseEnrollmentsService } = await import('../services/firestoreService');
      await courseEnrollmentsService.enroll(enrollmentData);

      setSuccessMsg(
        isWaitList
          ? `Inscrição efetuada com sucesso! Você foi inserido na LISTA DE ESPERA para o curso "${selectedCourse.title}".`
          : `Inscrição confirmada com sucesso no curso "${selectedCourse.title}"! Bons estudos.`
      );
      setShowModal(false);
      setSelectedCourse(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar inscrição no curso.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="border-b border-brand-green-light pb-4">
        <h1 className="font-display text-2xl font-bold italic text-brand-green-dark flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-brand-green" /> Cursos & Oficinas Livres
        </h1>
        <p className="text-xs text-[#5a5a40] font-light mt-1">
          Programas gratuitos de qualificação profissional, inovação, capacitação técnica e inserção produtiva da Prefeitura Municipal de Vera Cruz/BA.
        </p>
      </div>

      {!user ? (
        <div className="bg-white border border-brand-green-light rounded-[32px] p-8 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="bg-brand-cream text-brand-green mx-auto p-4 rounded-full w-16 h-16 flex items-center justify-center border border-brand-green-light">
            <GraduationCap className="w-8 h-8 text-brand-green" />
          </div>
          <h2 className="font-display font-semibold italic text-base text-brand-green-dark">Cursos & Oficinas Livres</h2>
          <p className="text-xs text-[#5a5a40] leading-relaxed font-light">
            Para visualizar a lista completa de cursos e oficinas profissionais gratuitos oferecidos pela SEMPS Vera Cruz/BA e realizar sua inscrição, você precisa estar logado na plataforma.
          </p>
          <button
            onClick={onOpenAuth}
            className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-6 py-3.5 rounded-full shadow-md transition"
          >
            Fazer Login ou Cadastrar-se na Plataforma
          </button>
        </div>
      ) : (
        <>
          {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 max-w-2xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 max-w-2xl">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Enrolled Courses Section */}
      {user && userEnrollments.length > 0 && (
        <div className="bg-emerald-50/45 border border-brand-green-light rounded-[32px] p-6 space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-brand-green" />
            <h2 className="font-display font-bold text-base text-brand-green-dark">Suas Inscrições Realizadas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userEnrollments.map((enrollment) => {
              const course = courses.find(c => c.id === enrollment.courseId);
              return (
                <div key={`enrolled-${enrollment.id}`} className="bg-white border border-brand-green-light p-4 rounded-2xl flex items-center gap-4 shadow-2xs hover:shadow-xs transition">
                  {course?.imagem_url && (
                    <img src={course.imagem_url} alt={enrollment.courseTitle} className="w-12 h-12 object-cover rounded-xl border border-slate-100" referrerPolicy="no-referrer" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-brand-green-dark truncate">{enrollment.courseTitle}</h3>
                    <p className="text-[10px] text-[#5a5a40] mt-0.5">{course?.category || 'Geral'}</p>
                    <p className="text-[9px] text-[#5a5a40]/70 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-brand-green" /> {course?.schedule || 'Consultar cronograma'}
                    </p>
                  </div>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${
                    enrollment.status === 'Lista de Espera' 
                      ? 'text-amber-800 bg-amber-50 border-amber-200' 
                      : enrollment.status === 'Cancelado'
                      ? 'text-red-800 bg-red-50 border-red-200'
                      : enrollment.status === 'Finalizado'
                      ? 'text-blue-800 bg-blue-50 border-blue-200'
                      : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                  }`}>
                    ✔ {enrollment.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Course List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => {
          const enrollment = user ? userEnrollments.find(e => e.courseId === course.id) : null;
          const isEnrolled = !!enrollment;
          const isFull = course.availableSlots <= 0;

          return (
            <div 
              key={course.id} 
              className={`bg-white rounded-[32px] border ${isEnrolled ? 'border-brand-green bg-gradient-to-br from-brand-green-light/20 to-white shadow-sm' : 'border-brand-green-light shadow-xs'} p-6 flex flex-col justify-between space-y-6 hover:shadow-md transition duration-300`}
            >
              <div className="space-y-3">
                {course.imagem_url && (
                  <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                    <img src={course.imagem_url} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="flex justify-between items-start gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green bg-brand-green-light/60 px-2.5 py-1 rounded-full">
                    {course.category}
                  </span>
                  
                  {isEnrolled && enrollment && (
                    <span className={`text-[10px] font-bold bg-white border px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse ${
                      enrollment.status === 'Lista de Espera'
                        ? 'text-amber-700 border-amber-300'
                        : enrollment.status === 'Cancelado'
                        ? 'text-red-700 border-red-300'
                        : enrollment.status === 'Finalizado'
                        ? 'text-blue-700 border-blue-300'
                        : 'text-brand-green border-brand-green/30'
                    }`}>
                      ✔ {enrollment.status === 'Lista de Espera' ? 'Fila de Espera' : enrollment.status}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-base text-brand-green-dark leading-snug">
                  {course.title}
                </h3>

                <p className="text-xs text-[#5a5a40] font-light leading-relaxed">
                  {course.description}
                </p>

                {/* Requirements details */}
                <div className="bg-brand-cream/60 p-3.5 rounded-xl border border-brand-green-light/50 text-xs space-y-1.5 font-light">
                  <p className="font-bold text-brand-green-dark text-[11px] flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-brand-green" /> Requisitos e Documentação:
                  </p>
                  <p className="text-brand-green-dark/80 leading-normal">{course.requirements}</p>
                </div>
              </div>

              {/* Course specs & Actions */}
              <div className="pt-4 border-t border-brand-green-light/40 space-y-4">
                <div className="flex justify-between text-xs text-[#5a5a40] font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-green" /> {course.schedule}
                  </span>
                  <span className="flex items-center gap-1.5 font-bold">
                    <Users className="w-3.5 h-3.5 text-brand-green" /> {course.availableSlots} / {course.totalSlots} Vagas
                  </span>
                </div>

                {user ? (
                  isEnrolled && enrollment ? (
                    <div className={`w-full text-xs font-bold text-center py-3.5 rounded-full border ${
                      enrollment.status === 'Lista de Espera'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : enrollment.status === 'Cancelado'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : enrollment.status === 'Finalizado'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {enrollment.status === 'Lista de Espera'
                        ? 'Você está na lista de espera deste curso ⏳'
                        : enrollment.status === 'Cancelado'
                        ? 'Sua inscrição foi cancelada.'
                        : enrollment.status === 'Finalizado'
                        ? 'Você concluiu este curso! 🎓'
                        : 'Sua inscrição foi confirmada neste curso!'}
                    </div>
                  ) : (
                    <button
                      onClick={() => openEnrollmentForm(course)}
                      disabled={loadingId === course.id}
                      className={`w-full text-xs font-bold py-3.5 rounded-full shadow-md transition ${
                        isFull 
                          ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                          : 'bg-brand-green hover:bg-brand-green-dark text-white'
                      }`}
                    >
                      {loadingId === course.id ? 'Aguarde...' : isFull ? 'Entrar na Lista de Espera ⏳' : 'Realizar Inscrição Gratuita'}
                    </button>
                  )
                ) : (
                  <button
                    onClick={onOpenAuth}
                    className="w-full bg-brand-cream hover:bg-brand-cream-dark/30 text-brand-green-dark border border-brand-green-light text-xs font-bold py-3.5 rounded-full transition text-center"
                  >
                    Identifique-se para Realizar Inscrição
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* FULL ENROLLMENT FORM MODAL */}
      {showModal && selectedCourse && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] border border-brand-green-light shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-brand-green-dark p-6 text-white flex justify-between items-center shrink-0">
              <div>
                <span className="text-[9px] uppercase tracking-wider bg-white/20 text-brand-cream px-2 py-0.5 rounded-full font-bold">
                  {selectedCourse.availableSlots <= 0 ? 'Lista de Espera' : 'Inscrição Regular'}
                </span>
                <h2 className="font-display font-bold text-base mt-1 text-white">Ficha de Inscrição: {selectedCourse.title}</h2>
              </div>
              <button 
                onClick={() => { setShowModal(false); setSelectedCourse(null); }}
                className="p-1.5 hover:bg-white/10 rounded-full text-brand-cream transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Scrollable Area */}
            <form onSubmit={handleSubmitEnrollment} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              
              {/* Alert Warning if full */}
              {selectedCourse.availableSlots <= 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs font-bold">Inscrições para Lista de Espera</strong>
                    <span className="text-[11px] leading-relaxed block mt-0.5 font-light">
                      Todas as vagas regulares já foram preenchidas. Ao enviar este formulário completo, você ocupará um lugar na fila de espera. Entraremos em contato se houver alguma desistência!
                    </span>
                  </div>
                </div>
              )}

              {/* 1. Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-brand-green-dark border-b border-brand-green-light pb-1 text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> 1. Identificação Geral (Preenchimento Obrigatório)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-brand-green-dark mb-1">Nome Completo *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">CPF *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">RG *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.rg}
                      onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Órgão Expedidor *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: SSP/BA"
                      value={formData.orgExp}
                      onChange={(e) => setFormData({ ...formData, orgExp: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Data de Nascimento *</label>
                    <input 
                      type="date" 
                      required
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Sexo *</label>
                    <select 
                      required
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    >
                      <option value="">-- Escolha --</option>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Outro">Prefiro não responder</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Estado Civil *</label>
                    <select 
                      required
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    >
                      <option value="">-- Escolha --</option>
                      <option value="Solteiro">Solteiro(a)</option>
                      <option value="Casado">Casado(a)</option>
                      <option value="Divorciado">Divorciado(a)</option>
                      <option value="Viúvo">Viúvo(a)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Nome da Mãe *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Endereço e Contato */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-brand-green-dark border-b border-brand-green-light pb-1 text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> 2. Endereço e Contatos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-brand-green-dark mb-1">Logradouro (Rua, nº, Complemento) *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Bairro *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">CEP *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="44470-000"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Cidade *</label>
                    <input 
                      type="text" 
                      required
                      disabled
                      value={formData.city}
                      className="w-full border border-brand-green-light/40 p-2.5 rounded-xl bg-slate-50 text-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Telefone de Contato *</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">WhatsApp *</label>
                    <input 
                      type="tel" 
                      required
                      value={formData.whatsApp}
                      onChange={(e) => setFormData({ ...formData, whatsApp: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">E-mail *</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Escolaridade e Perfil Socioeconômico */}
              <div className="space-y-4">
                <h3 className="font-display font-bold text-brand-green-dark border-b border-brand-green-light pb-1 text-sm flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4" /> 3. Escolaridade e Perfil Socioeconômico
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Nível de Escolaridade *</label>
                    <select 
                      required
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    >
                      <option value="">-- Escolha --</option>
                      <option value="Fundamental Incompleto">Ensino Fundamental Incompleto</option>
                      <option value="Fundamental Completo">Ensino Fundamental Completo</option>
                      <option value="Médio Incompleto">Ensino Médio Incompleto</option>
                      <option value="Médio Completo">Ensino Médio Completo</option>
                      <option value="Superior">Ensino Superior Completo ou Superior em andamento</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Profissão Atual *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Desempregado, Autônomo, Estudante"
                      value={formData.profession}
                      onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Situação Ocupacional *</label>
                    <select 
                      required
                      value={formData.employmentStatus}
                      onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    >
                      <option value="">-- Escolha --</option>
                      <option value="Desempregado">Desempregado(a)</option>
                      <option value="Trabalhador Autônomo">Trabalhador Autônomo / Informal</option>
                      <option value="Empregado CLT">Empregado Privado (CLT)</option>
                      <option value="Servidor Público">Servidor Público</option>
                      <option value="Aposentado">Aposentado(a) / Pensionista</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-brand-green-dark mb-1">Renda familiar Per Capita *</label>
                    <input 
                      type="number" 
                      required
                      placeholder="R$ por pessoa do lar"
                      value={formData.rendaPerCapita}
                      onChange={(e) => setFormData({ ...formData, rendaPerCapita: e.target.value })}
                      className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {/* CadÚnico & NIS */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id="hasNis"
                        checked={formData.hasNis}
                        onChange={(e) => setFormData({ ...formData, hasNis: e.target.checked })}
                        className="w-4 h-4 rounded-md border-slate-300 text-brand-green focus:ring-brand-green"
                      />
                      <label htmlFor="hasNis" className="font-bold text-brand-green-dark cursor-pointer select-none">
                        Possuo inscrição no CadÚnico (Bolsa Família, etc)
                      </label>
                    </div>
                    {formData.hasNis && (
                      <div>
                        <label className="block font-medium text-slate-500 mb-0.5">Informe seu Número do NIS *</label>
                        <input 
                          type="text"
                          required={formData.hasNis}
                          placeholder="000.00000.00-0"
                          value={formData.nisNumber}
                          onChange={(e) => setFormData({ ...formData, nisNumber: e.target.value })}
                          className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none font-mono"
                        />
                      </div>
                    )}
                  </div>

                  {/* Disability */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id="hasDisability"
                        checked={formData.hasDisability}
                        onChange={(e) => setFormData({ ...formData, hasDisability: e.target.checked })}
                        className="w-4 h-4 rounded-md border-slate-300 text-brand-green focus:ring-brand-green"
                      />
                      <label htmlFor="hasDisability" className="font-bold text-brand-green-dark cursor-pointer select-none">
                        Possuo alguma deficiência (PcD)
                      </label>
                    </div>
                    {formData.hasDisability && (
                      <div>
                        <label className="block font-medium text-slate-500 mb-0.5">Especifique a deficiência *</label>
                        <input 
                          type="text"
                          required={formData.hasDisability}
                          placeholder="Ex: Visual, Auditiva, Física"
                          value={formData.disabilityType}
                          onChange={(e) => setFormData({ ...formData, disabilityType: e.target.value })}
                          className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-brand-green-dark mb-1">Observações Gerais / Motivação para o curso</label>
                  <textarea 
                    rows={2}
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    placeholder="Deixe algum detalhe importante se necessário..."
                    className="w-full border border-brand-green-light/80 p-2.5 rounded-xl focus:border-brand-green focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* 4. Termos, Compromissos e LGPD */}
              <div className="space-y-3 bg-brand-cream/40 p-4 rounded-2xl border border-brand-green-light/50">
                <h4 className="font-bold text-brand-green-dark flex items-center gap-1">
                  <Heart className="w-4 h-4 text-brand-green" /> Termo de Responsabilidade e LGPD
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <input 
                      type="checkbox"
                      id="termAccepted"
                      required
                      checked={formData.termAccepted}
                      onChange={(e) => setFormData({ ...formData, termAccepted: e.target.checked })}
                      className="w-4 h-4 rounded-md border-slate-300 text-brand-green focus:ring-brand-green mt-0.5"
                    />
                    <label htmlFor="termAccepted" className="text-[11px] leading-relaxed text-slate-600 cursor-pointer select-none font-light">
                      <strong>Compromisso:</strong> Declaro que tenho disponibilidade de horário para frequentar as aulas e cumprir as normas internas e diretrizes éticas estabelecidas pela coordenação do curso livre.
                    </label>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <input 
                      type="checkbox"
                      id="lgpdAccepted"
                      required
                      checked={formData.lgpdAccepted}
                      onChange={(e) => setFormData({ ...formData, lgpdAccepted: e.target.checked })}
                      className="w-4 h-4 rounded-md border-slate-300 text-brand-green focus:ring-brand-green mt-0.5"
                    />
                    <label htmlFor="lgpdAccepted" className="text-[11px] leading-relaxed text-slate-600 cursor-pointer select-none font-light">
                      <strong>Consentimento de Dados (LGPD):</strong> Autorizo a Secretaria Municipal de Promoção Social de Vera Cruz a realizar o tratamento das informações fornecidas nesta ficha, exclusivamente para fins educacionais, controle de frequência pedagógica e emissão futura de certificados, em respeito à Lei nº 13.709/2018.
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setSelectedCourse(null); }}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold transition text-xs"
                >
                  Cancelar Inscrição
                </button>
                <button
                  type="submit"
                  disabled={loadingId === selectedCourse.id}
                  className="px-8 py-2.5 rounded-full bg-brand-green hover:bg-brand-green-dark text-white font-bold transition text-xs shadow-md disabled:opacity-50"
                >
                  {loadingId === selectedCourse.id ? 'Aguarde, processando...' : selectedCourse.availableSlots <= 0 ? 'Confirmar Fila de Espera' : 'Confirmar Inscrição Gratuita'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      </>
      )}

    </div>
  );
}
