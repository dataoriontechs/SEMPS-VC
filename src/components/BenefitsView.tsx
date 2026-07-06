import React, { useState, useEffect } from 'react';
import { User, BenefitProgram, BenefitType } from '../types';
import { Search, FileText, CheckCircle2, Clock, AlertTriangle, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { maskCpf } from './AuthModal';
import { benefitsService, benefitTypesService } from '../services/firestoreService';

interface BenefitsViewProps {
  user: User | null;
  onOpenAuth: () => void;
}

export default function BenefitsView({ user, onOpenAuth }: BenefitsViewProps) {
  const [cpfQuery, setCpfQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [benefits, setBenefits] = useState<BenefitProgram[]>([]);
  const [masterTypes, setMasterTypes] = useState<BenefitType[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [expandedBenefitId, setExpandedBenefitId] = useState<string | null>(null);

  // Subscribe to all master benefit types
  useEffect(() => {
    return benefitTypesService.subscribeBenefitTypes((types) => {
      setMasterTypes(types);
    });
  }, []);

  // Automatically load benefits if user is logged in
  useEffect(() => {
    if (user) {
      setCpfQuery(user.cpf);
      handleQuery(user.cpf);
    }
  }, [user]);

  const handleQuery = async (cpfToQuery: string) => {
    const cleanCpf = cpfToQuery.trim();
    if (!cleanCpf) {
      setError('Por favor, informe um CPF válido.');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const list = await benefitsService.getBenefitsByCpf(cleanCpf);
      setBenefits(list || []);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar a busca de benefícios.');
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  };

  // Combine query results with active master benefit types
  const displayedBenefits = masterTypes.map(m => {
    const userBenefit = benefits.find(b => b.name.toLowerCase() === m.name.toLowerCase());
    return {
      id: userBenefit?.id || m.id,
      name: m.name,
      description: m.description,
      status: userBenefit?.status || 'Não Cadastrado',
      observations: userBenefit?.observations || '',
      lastUpdated: userBenefit?.lastUpdated || ''
    };
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery(cpfQuery);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpfQuery(maskCpf(e.target.value));
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="border-b border-brand-green-light pb-4">
        <h1 className="font-display text-2xl font-bold italic text-brand-green-dark">Consulta de Benefícios Sociais</h1>
        <p className="text-xs text-[#5a5a40] font-light mt-1">
          Verifique de forma rápida o status de homologação de auxílios municipais, Bolsa Família e programas sociais da Prefeitura de Vera Cruz/BA.
        </p>
      </div>

      {/* Main Search Panel */}
      {!user ? (
        <div className="bg-white rounded-[32px] border border-brand-green-light shadow-sm p-8 text-center space-y-5 max-w-xl mx-auto">
          <div className="bg-brand-cream text-brand-green mx-auto p-4 rounded-full w-16 h-16 flex items-center justify-center border border-brand-green-light">
            <ShieldCheck className="w-8 h-8 text-brand-green" />
          </div>
          <div className="space-y-2">
            <h2 className="font-display font-semibold italic text-base text-brand-green-dark">Consulta Segura de Benefícios</h2>
            <p className="text-xs text-[#5a5a40] leading-relaxed font-light">
              Em total conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD)</strong>, a consulta de benefícios sociais é individual e restrita ao titular da conta. Cada cidadão só pode visualizar os seus próprios dados.
            </p>
          </div>
          <button
            onClick={onOpenAuth}
            className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-6 py-3.5 rounded-full shadow-md transition"
          >
            Acessar Minha Conta para Consultar Benefícios
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-brand-green-light shadow-sm p-6 md:p-8 space-y-6">
          <div>
            <h2 className="font-display font-bold text-base text-brand-green-dark">Consulta de Benefícios Sociais</h2>
            {user.role === 'admin' || user.role === 'administrador' || user.role === 'colaborador' ? (
              <p className="text-xs text-[#5a5a40] font-light">Você possui privilégios de gestão. Digite o CPF do cidadão para consultar o status dos benefícios municipais e federais.</p>
            ) : (
              <p className="text-xs text-[#5a5a40] font-light">Para proteger sua privacidade, seus benefícios foram carregados de forma automatizada com base no CPF vinculado à sua conta.</p>
            )}
          </div>

          {(user.role === 'admin' || user.role === 'administrador' || user.role === 'colaborador') ? (
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-[#5a5a40]/60" />
                <input
                  type="text"
                  value={cpfQuery}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-brand-green-light focus:outline-none focus:border-brand-green text-sm bg-brand-cream/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-6 py-3.5 rounded-full shadow-md transition shrink-0 disabled:opacity-50"
              >
                {loading ? 'Consultando...' : 'Pesquisar Benefícios'}
              </button>
            </form>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <p className="text-[11px] text-brand-green-dark font-semibold font-mono flex items-center gap-1.5 bg-brand-cream border border-brand-green-light/40 px-3 py-1.5 rounded-full w-fit">
              <ShieldCheck className="w-4 h-4 text-brand-green" /> Identificado: Exibindo dados de {user.name} (CPF {user.cpf})
            </p>
            {(user.role === 'admin' || user.role === 'administrador' || user.role === 'colaborador') && (
              <p className="text-[11px] text-[#5a5a40] font-semibold font-mono flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full w-fit">
                🛡️ Credencial de Servidor / Gestão Ativa
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {searched && (
        <div className="space-y-6 animate-fade-in">
          <h2 className="font-display text-base font-bold text-brand-green-dark">Resultados da Consulta para o CPF {cpfQuery}</h2>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {displayedBenefits.length === 0 ? (
            <div className="p-8 bg-brand-cream/30 rounded-[32px] text-center text-[#5a5a40]/90 font-light text-xs border border-brand-green-light/60">
              Nenhum cadastro de benefício encontrado para o CPF informado. 
              <p className="text-[10px] text-[#5a5a40]/60 mt-2">Dica: Se você acabou de se cadastrar na plataforma, os benefícios padrões iniciam como "Não Cadastrado" ou "Em Análise".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayedBenefits.map((item) => {
                const isExpanded = expandedBenefitId === item.id;
                return (
                  <div 
                    key={item.id} 
                    onClick={() => setExpandedBenefitId(isExpanded ? null : item.id)}
                    className={`bg-white rounded-[32px] border ${isExpanded ? 'border-brand-green ring-2 ring-brand-green/20' : 'border-brand-green-light'} p-6 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-1">
                        <h3 className="font-display font-bold text-base text-brand-green-dark leading-snug">
                          {item.name}
                        </h3>
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                          item.status === 'Aprovado' ? 'bg-emerald-50 text-emerald-850 border border-emerald-200' :
                          item.status === 'Em Análise' ? 'bg-amber-50 text-amber-850 border border-amber-250 animate-pulse' :
                          item.status === 'Pendente' ? 'bg-red-50 text-red-700 border border-red-100' :
                          'bg-slate-100 text-[#5a5a40] border border-slate-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-[#5a5a40] font-light leading-relaxed">
                        {item.description}
                      </p>

                      {item.observations ? (
                        <div className="p-3.5 bg-brand-cream/50 rounded-xl border border-brand-green-light/40 space-y-1 text-[11px] text-[#5a5a40] font-light">
                          <p className="font-bold text-brand-green-dark text-[10px] flex items-center gap-1.5 uppercase tracking-wide">
                            <FileText className="w-3.5 h-3.5 text-brand-green" /> Observação Social / Orientação:
                          </p>
                          <p className="leading-normal">{item.observations}</p>
                        </div>
                      ) : (
                        item.status === 'Não Cadastrado' && (
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                            💡 Clique neste benefício para ver como se inscrever presencialmente
                          </div>
                        )
                      )}

                      {/* Expanded Section showing Documents and Unit */}
                      {isExpanded && (
                        <div 
                          className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl space-y-3 mt-3 animate-fade-in text-[11px] text-[#5a5a40]"
                          onClick={(e) => e.stopPropagation()} // stop click bubbling
                        >
                          <p className="font-bold text-amber-900 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                            📋 Instruções para Inscrição Presencial:
                          </p>
                          <div className="space-y-2 leading-relaxed">
                            <p>
                              <strong>Onde Ir:</strong> Compareça presencialmente a uma unidade correspondente ao seu bairro: <strong>CRAS Central</strong> (Rua São Bento, Centro) ou <strong>CRAS Mar Grande</strong> (Av. Beira Mar, Mar Grande), de segunda a sexta, das 08h às 16h.
                            </p>
                            <div className="space-y-1">
                              <p className="font-semibold text-brand-green-dark text-[10px]">Leve os seguintes documentos obrigatórios:</p>
                              <ul className="list-disc list-inside pl-1 space-y-1 text-[10px]">
                                <li>RG e CPF (original e cópia) de todos os membros que moram na casa</li>
                                <li>Comprovante de Residência atual (água, luz ou telefone)</li>
                                <li>Carteira de Trabalho (CTPS) e Holerite recente (se houver emprego formal)</li>
                                <li>Folha de Resumo do Cadastro Único (CadÚnico) com NIS</li>
                                <li>Certidão de Nascimento de filhos menores</li>
                              </ul>
                            </div>
                            <p className="text-[9px] text-amber-850 font-medium italic bg-white/50 p-2 rounded-lg border border-amber-250/30">
                              * Após comparecer e entregar os documentos, o colaborador da SEMPS ativará o benefício no sistema e ele aparecerá aqui com o status <strong>"Em Análise"</strong>.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-brand-green-light/30 flex justify-between items-center text-[10px] text-[#5a5a40]/70">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-brand-green" /> {item.status === 'Não Cadastrado' ? 'Cadastro Disponível' : 'Última Atualização'}</span>
                      <span>{item.lastUpdated ? item.lastUpdated.split('-').reverse().join('/') : 'Presencial'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Programs reference FAQ */}
      <section className="bg-brand-cream/65 border border-brand-green-light p-6 rounded-[32px] space-y-4">
        <h3 className="font-display font-semibold italic text-base text-brand-green-dark flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-brand-green" /> Guia de Dúvidas: O que significam os status?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-light">
          <div className="space-y-1">
            <p className="font-bold text-emerald-800">✔ Aprovado / Ativo</p>
            <p className="text-[#5a5a40] leading-relaxed">Seu benefício foi homologado pela assistente social. O pagamento está liberado ou em cronograma normal de saques.</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-amber-800">⏳ Em Análise</p>
            <p className="text-[#5a5a40] leading-relaxed">Suas informações de CadÚnico estão passando por triagem de vulnerabilidade para enquadramento nas regras do programa.</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-red-750">⚠️ Pendente de Documento</p>
            <p className="text-[#5a5a40] leading-relaxed">Falta anexar ou apresentar comprovantes na sede do CRAS correspondente para dar seguimento ao seu processo.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
