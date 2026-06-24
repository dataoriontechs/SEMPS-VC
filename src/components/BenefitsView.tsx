import React, { useState, useEffect } from 'react';
import { User, BenefitProgram } from '../types';
import { Search, FileText, CheckCircle2, Clock, AlertTriangle, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { maskCpf } from './AuthModal';

interface BenefitsViewProps {
  user: User | null;
}

export default function BenefitsView({ user }: BenefitsViewProps) {
  const [cpfQuery, setCpfQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [benefits, setBenefits] = useState<BenefitProgram[]>([]);
  const [searched, setSearched] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

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
      const response = await fetch(`/api/benefits?cpf=${encodeURIComponent(cleanCpf)}`);
      const data = await response.json();

      if (response.ok) {
        setBenefits(data.benefits || []);
      } else {
        throw new Error(data.error || 'Erro ao realizar a busca de benefícios.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
      setBenefits([]);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="border-b border-slate-200 pb-4">
        <h1 className="font-display text-2xl font-bold text-brand-green-dark">Consulta de Benefícios Sociais</h1>
        <p className="text-xs text-slate-500 font-light">
          Verifique de forma rápida o status de homologação de auxílios municipais, Bolsa Família e programas sociais da Prefeitura de Vera Cruz/BA.
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 space-y-6">
        <div>
          <h2 className="font-display font-bold text-base text-brand-green-dark">Painel de Pesquisa por CPF</h2>
          <p className="text-xs text-slate-400 font-light">Informe o CPF cadastrado do responsável familiar para buscar todos os benefícios ativos e em análise.</p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={cpfQuery}
              onChange={handleCpfChange}
              placeholder="000.000.000-00"
              required
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-green text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-6 py-3.5 rounded-xl shadow-md transition shrink-0 disabled:opacity-50"
          >
            {loading ? 'Consultando...' : 'Pesquisar Benefícios'}
          </button>
        </form>

        {user && (
          <p className="text-[11px] text-brand-green font-mono flex items-center gap-1.5 bg-brand-green-light/20 px-3 py-1.5 rounded-lg w-fit">
            <ShieldCheck className="w-4 h-4 text-brand-green" /> Identificado: Exibindo dados de {user.name} (CPF {user.cpf})
          </p>
        )}
      </div>

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

          {benefits.length === 0 ? (
            <div className="p-8 bg-slate-50 rounded-3xl text-center text-slate-500 font-light text-xs border border-slate-100">
              Nenhum cadastro de benefício encontrado para o CPF informado. 
              <p className="text-[10px] text-slate-400 mt-2">Dica: Se você acabou de se cadastrar na plataforma, os benefícios padrões iniciam como "Não Cadastrado" ou "Em Análise".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((item) => (
                <div 
                  key={item.id} 
                  className={`bg-white rounded-3xl border border-slate-100 p-6 shadow-xs hover:shadow-sm transition flex flex-col justify-between space-y-4`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-1">
                      <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">
                        {item.name}
                      </h3>
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'Em Análise' ? 'bg-amber-100 text-amber-800' :
                        item.status === 'Pendente' ? 'bg-red-50 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-light leading-relaxed">
                      {item.description}
                    </p>

                    {item.observations && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px] text-slate-600 font-light">
                        <p className="font-bold text-slate-700 text-[10px] flex items-center gap-1.5 uppercase tracking-wide">
                          <FileText className="w-3.5 h-3.5 text-brand-green" /> Observação Social / Orientação:
                        </p>
                        <p className="leading-normal">{item.observations}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Última Atualização</span>
                    <span>{item.lastUpdated ? item.lastUpdated.split('-').reverse().join('/') : 'Recente'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Programs reference FAQ */}
      <section className="bg-brand-cream-dark/30 border border-brand-cream-dark p-6 rounded-3xl space-y-4">
        <h3 className="font-display font-bold text-sm text-brand-green-dark flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-brand-green" /> Guia de Dúvidas: O que significam os status?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-light">
          <div className="space-y-1">
            <p className="font-bold text-emerald-700">✔ Aprovado / Ativo</p>
            <p className="text-slate-600">Seu benefício foi homologado pela assistente social. O pagamento está liberado ou em cronograma normal de saques.</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-amber-700">⏳ Em Análise</p>
            <p className="text-slate-600">Suas informações de CadÚnico estão passando por triagem de vulnerabilidade para enquadramento nas regras do programa.</p>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-red-600">⚠️ Pendente de Documento</p>
            <p className="text-slate-600">Falta anexar ou apresentar comprovantes na sede do CRAS correspondente para dar seguimento ao seu processo.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
