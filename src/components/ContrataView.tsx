import React, { useState } from 'react';
import { JobVacancy, JobType, User } from '../types';
import { Briefcase, Search, Phone, Mail, FileText, DollarSign, MapPin, CheckCircle, ExternalLink, Calendar, X, Copy, MessageSquare } from 'lucide-react';
import { jobsService } from '../services/firestoreService';

interface ContrataViewProps {
  jobs: JobVacancy[];
  user: User | null;
  onOpenAuth: () => void;
}

export default function ContrataView({ jobs, user, onOpenAuth }: ContrataViewProps) {
  const [activeType, setActiveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContactJob, setSelectedContactJob] = useState<JobVacancy | null>(null);

  const handleRegisterCandidacy = async (job: JobVacancy) => {
    if (user) {
      try {
        await jobsService.applyToJob(
          job.id,
          job.title,
          job.company,
          user.id,
          user.name || 'Cidadão Autenticado'
        );
      } catch (err) {
        console.warn('Erro ao registrar candidatura:', err);
      }
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesType = activeType === 'all' || job.type === activeType;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.requirements.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleContact = (job: JobVacancy) => {
    setSelectedContactJob(job);
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header banner */}
      <div className="relative overflow-hidden bg-brand-green-dark text-white rounded-[32px] p-8 shadow-md">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-60 h-60 rounded-full bg-brand-green/30 blur-2xl"></div>
        <div className="relative max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1 bg-brand-green-light text-brand-green-dark text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
            💼 Empregabilidade Local
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-normal italic tracking-tight">Contrata Vera Cruz</h1>
          <p className="text-xs text-brand-cream-dark font-light leading-relaxed">
            O canal municipal oficial para conectar cidadãos de Vera Cruz/BA a vagas de emprego formal (CLT) e oportunidades para prestadores de serviços freelancers locais. Apoie o comércio e a renda de nossa ilha!
          </p>
        </div>
      </div>

      {!user ? (
        <div className="bg-white border border-brand-green-light rounded-[32px] p-8 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="bg-brand-cream text-brand-green mx-auto p-4 rounded-full w-16 h-16 flex items-center justify-center border border-brand-green-light">
            <Briefcase className="w-8 h-8 text-brand-green" />
          </div>
          <h2 className="font-display font-semibold italic text-base text-brand-green-dark">Painel de Oportunidades & Emprego</h2>
          <p className="text-xs text-[#5a5a40] leading-relaxed font-light">
            Para visualizar a listagem completa de vagas de emprego do Contrata Vera Cruz, candidatar-se ou fazer contato com os recrutadores locais, você precisa estar logado no sistema de forma segura.
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
          {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-brand-green-light pb-4">
        {/* Toggle Types */}
        <div className="flex bg-brand-cream border border-brand-green-light p-1 rounded-xl w-full md:w-auto">
          {['all', 'CLT', 'Freelancer'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeType === type
                  ? 'bg-white text-brand-green-dark shadow-sm'
                  : 'text-brand-green-dark/70 hover:text-brand-green-dark'
              }`}
            >
              {type === 'all' ? 'Ver Todas' : type}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#5a5a40]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cargo, empresa, requisito..."
            className="w-full pl-10 pr-4 py-2.5 border border-brand-green-light rounded-xl focus:outline-none focus:border-brand-green text-xs bg-white"
          />
        </div>
      </div>

      {/* Vacancy Listings */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[32px] border border-brand-green-light p-8">
          <Briefcase className="w-12 h-12 text-[#5a5a40]/40 mx-auto mb-3" />
          <p className="text-[#5a5a40]/70 text-xs font-light">Nenhuma oportunidade publicada no momento correspondente aos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-white rounded-[32px] border border-brand-green-light p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Job Info Header */}
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <span className="text-[9px] font-bold text-brand-green bg-brand-green-light/40 px-2 py-0.5 rounded-sm uppercase">
                      {job.company}
                    </span>
                    <h3 className="font-display font-bold text-base text-brand-green-dark mt-1 leading-snug">{job.title}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    job.type === 'CLT' ? 'bg-brand-green-light/30 text-brand-green-dark border border-brand-green-light/60' : 'bg-brand-cream text-[#5a5a40] border border-[#d5d1b7]'
                  }`}>
                    {job.type}
                  </span>
                </div>

                {job.imagem_url && (
                  <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0">
                    <img src={job.imagem_url} alt={job.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}

                <p className="text-xs text-[#5a5a40] font-light leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>

                {/* Specs block */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-brand-green-dark">
                  <div className="flex items-center gap-1.5 bg-brand-cream/55 p-2.5 rounded-xl border border-brand-green-light/20">
                    <DollarSign className="w-4 h-4 text-brand-green" />
                    <span className="font-semibold">{job.salary || 'A combinar'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-brand-cream/55 p-2.5 rounded-xl truncate border border-brand-green-light/20">
                    <MapPin className="w-4 h-4 text-[#5a5a40]" />
                    <span className="truncate">{job.location}</span>
                  </div>
                </div>

                {/* Requirements details */}
                <div className="bg-brand-cream/50 p-3.5 rounded-xl border border-brand-green-light/45 space-y-1.5 text-xs font-light">
                  <p className="font-bold text-brand-green-dark text-[10px] flex items-center gap-1.5 uppercase tracking-wide">
                    <FileText className="w-3.5 h-3.5 text-brand-green" /> Requisitos da Oportunidade:
                  </p>
                  <p className="text-brand-green-dark/80 leading-normal">{job.requirements}</p>
                </div>
              </div>

              {/* Action Contact */}
              <div className="pt-4 border-t border-brand-green-light/30 flex items-center justify-between">
                <span className="text-[9px] text-[#5a5a40]/70 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" /> Postado em {job.createdAt.split('-').reverse().join('/')}
                </span>

                <button
                  onClick={() => handleContact(job)}
                  className="bg-brand-green hover:bg-brand-green-dark text-white text-[11px] font-bold px-4 py-2.5 rounded-full shadow-sm transition flex items-center gap-1.5"
                >
                  Candidatar-se / Contato <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Contact Modal */}
      {selectedContactJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="contact-modal">
          <div className="bg-white rounded-[32px] border border-brand-green-light max-w-md w-full overflow-hidden shadow-xl animate-scale-up">
            {/* Header */}
            <div className="p-6 bg-brand-green-dark text-white relative">
              <button 
                onClick={() => setSelectedContactJob(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition p-1.5 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="text-[10px] font-bold text-brand-green-light bg-brand-green/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {selectedContactJob.company}
              </span>
              <h3 className="font-display font-bold text-lg mt-2 text-white">
                Candidatar-se à Vaga
              </h3>
              <p className="text-xs text-brand-cream-dark mt-1 font-light">
                {selectedContactJob.title}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-[#5a5a40] font-light leading-relaxed">
                Para se candidatar a esta vaga, envie o seu currículo atualizado diretamente para a empresa utilizando os canais de contato cadastrados abaixo:
              </p>

              {/* Contact info display box */}
              <div className="bg-brand-cream border border-brand-green-light p-4 rounded-2xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <Briefcase className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-brand-green-dark uppercase tracking-wider">Como entrar em contato:</p>
                    <p className="text-xs font-semibold text-[#5a5a40] mt-1 whitespace-pre-wrap">{selectedContactJob.contact}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Action Buttons */}
              <div className="space-y-2 pt-2">
                {/* Email button if detected */}
                {(() => {
                  const emailMatch = selectedContactJob.contact.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                  if (emailMatch) {
                    const emailAddress = emailMatch[0];
                    const mailtoUrl = `mailto:${emailAddress}?subject=Vaga: ${encodeURIComponent(selectedContactJob.title)} - Contrata Vera Cruz&body=${encodeURIComponent(`Olá! Vi a vaga de ${selectedContactJob.title} no portal Contrata Vera Cruz da SEMPS e gostaria de me candidatar. Segue anexo meu currículo.`)}`;
                    return (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            
                            // Register candidacy
                            handleRegisterCandidacy(selectedContactJob);
                            
                            // 1. Copy the email to clipboard to ensure the user has it
                            navigator.clipboard.writeText(emailAddress);
                            
                            // 2. Open mailto via a temporary hidden iframe so it NEVER triggers window/iframe navigation in the sandbox
                            const iframe = document.createElement('iframe');
                            iframe.style.display = 'none';
                            iframe.src = mailtoUrl;
                            document.body.appendChild(iframe);
                            setTimeout(() => {
                              if (iframe.parentNode) {
                                document.body.removeChild(iframe);
                              }
                            }, 1000);

                            alert(`E-mail (${emailAddress}) copiado! Abrindo o seu aplicativo de e-mail padrão...`);
                          }}
                          className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition duration-200 flex items-center justify-center gap-2 text-center"
                        >
                          <Mail className="w-4 h-4" /> Enviar E-mail Direto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(emailAddress);
                            alert('E-mail copiado para a área de transferência!');
                          }}
                          title="Copiar E-mail"
                          className="bg-brand-cream hover:bg-brand-green-light/20 border border-brand-green-light text-brand-green-dark p-3 rounded-xl transition"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* WhatsApp button if detected */}
                {(() => {
                  const hasPhone = selectedContactJob.contact.includes('WhatsApp') || selectedContactJob.contact.includes('(71) 9') || /\d{8,}/.test(selectedContactJob.contact);
                  if (hasPhone) {
                    const cleanPhone = selectedContactJob.contact.replace(/\D/g, '');
                    const phoneMatch = selectedContactJob.contact.match(/(\d[\s-]?){8,}/g);
                    const extractedPhone = phoneMatch ? phoneMatch[0].replace(/\D/g, '') : cleanPhone;
                    
                    if (extractedPhone && extractedPhone.length >= 8) {
                      const formattedPhone = extractedPhone.startsWith('55') ? extractedPhone : `55${extractedPhone}`;
                      const whatsappUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(`Olá! Vi a vaga de "${selectedContactJob.title}" no portal Contrata Vera Cruz da SEMPS e tenho interesse. Gostaria de enviar meu currículo.`)}`;
                      
                      return (
                        <div className="flex gap-2">
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleRegisterCandidacy(selectedContactJob)}
                            className="flex-1 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition duration-200 flex items-center justify-center gap-2 text-center"
                          >
                            <MessageSquare className="w-4 h-4" /> Enviar WhatsApp
                          </a>
                          <button
                            onClick={() => {
                              const userFriendlyPhone = phoneMatch ? phoneMatch[0].trim() : extractedPhone;
                              navigator.clipboard.writeText(userFriendlyPhone);
                              alert('Telefone copiado para a área de transferência!');
                            }}
                            title="Copiar Telefone"
                            className="bg-brand-cream hover:bg-brand-green-light/20 border border-brand-green-light text-brand-green-dark p-3 rounded-xl transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}
              </div>

              {/* Tip */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-250/30 text-[10px] text-amber-900 leading-normal font-light">
                💡 <strong>Dica importante:</strong> Ao entrar em contato por WhatsApp ou E-mail, informe que você viu a vaga no portal <strong>Contrata Vera Cruz (SEMPS)</strong> para ter prioridade no atendimento local.
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedContactJob(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
