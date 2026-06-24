import React, { useState } from 'react';
import { JobVacancy, JobType } from '../types';
import { Briefcase, Search, Phone, Mail, FileText, DollarSign, MapPin, CheckCircle, ExternalLink, Calendar } from 'lucide-react';

interface ContrataViewProps {
  jobs: JobVacancy[];
}

export default function ContrataView({ jobs }: ContrataViewProps) {
  const [activeType, setActiveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredJobs = jobs.filter((job) => {
    const matchesType = activeType === 'all' || job.type === activeType;
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.requirements.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleContact = (job: JobVacancy) => {
    const contactInfo = job.contact;
    
    if (contactInfo.includes('WhatsApp') || contactInfo.includes('(71) 9')) {
      const cleanPhone = contactInfo.replace(/\D/g, '');
      const whatsappUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=Olá! Vi a vaga de "${job.title}" no portal Contrata Vera Cruz da SEMPS e tenho interesse. Segue meu perfil cadastrado.`;
      window.open(whatsappUrl, '_blank');
    } else if (contactInfo.includes('@') || contactInfo.includes('e-mail')) {
      // Find email inside text
      const emailMatch = contactInfo.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const emailAddress = emailMatch ? emailMatch[0] : '';
      const mailtoUrl = `mailto:${emailAddress}?subject=Vaga: ${job.title} - Contrata Vera Cruz&body=Olá! Vi a vaga de ${job.title} no portal Contrata Vera Cruz da SEMPS e gostaria de me candidatar. Segue anexo meu currículo.`;
      window.open(mailtoUrl, '_blank');
    } else {
      alert(`📞 Detalhes de contato para a vaga:\n\n${contactInfo}\n\n(Dica: Entre em contato diretamente citando que viu no portal Contrata Vera Cruz)`);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-800 to-emerald-800 text-white rounded-3xl p-8 shadow-md">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-60 h-60 rounded-full bg-white/5 blur-2xl"></div>
        <div className="relative max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1 bg-teal-400 text-teal-900 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
            💼 Empregabilidade Local
          </span>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Contrata Vera Cruz</h1>
          <p className="text-xs text-brand-cream-dark font-light leading-relaxed">
            O canal municipal oficial para conectar cidadãos de Vera Cruz/BA a vagas de emprego formal (CLT) e oportunidades para prestadores de serviços freelancers locais. Apoie o comércio e a renda de nossa ilha!
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-200 pb-4">
        {/* Toggle Types */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          {['all', 'CLT', 'Freelancer'].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeType === type
                  ? 'bg-white text-teal-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {type === 'all' ? 'Ver Todas' : type}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cargo, empresa, requisito..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-green text-xs bg-white"
          />
        </div>
      </div>

      {/* Vacancy Listings */}
      {filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-xs font-light">Nenhuma oportunidade publicada no momento correspondente aos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition duration-300 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                {/* Job Info Header */}
                <div className="flex justify-between items-start gap-1">
                  <div>
                    <span className="text-[9px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-sm uppercase">
                      {job.company}
                    </span>
                    <h3 className="font-display font-bold text-sm text-slate-900 mt-1 leading-snug">{job.title}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    job.type === 'CLT' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                  }`}>
                    {job.type}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-light leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>

                {/* Specs block */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>{job.salary || 'A combinar'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl truncate">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="truncate">{job.location}</span>
                  </div>
                </div>

                {/* Requirements details */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs font-light">
                  <p className="font-bold text-slate-700 text-[10px] flex items-center gap-1.5 uppercase tracking-wide">
                    <FileText className="w-3.5 h-3.5 text-teal-700" /> Requisitos da Oportunidade:
                  </p>
                  <p className="text-slate-600 leading-normal">{job.requirements}</p>
                </div>
              </div>

              {/* Action Contact */}
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" /> Postado em {job.createdAt.split('-').reverse().join('/')}
                </span>

                <button
                  onClick={() => handleContact(job)}
                  className="bg-teal-700 hover:bg-teal-800 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  Candidatar-se / Contato <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
