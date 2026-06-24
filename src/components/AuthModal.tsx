import React, { useState } from 'react';
import { User } from '../types';
import { Shield, Key, Mail, User as UserIcon, Phone, FileText, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

// Complete Client-side CPF Validator
export function validateCpfClient(cpf: string): boolean {
  const cleanCpf = cpf.replace(/\D/g, '');
  if (cleanCpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCpf.substring(10, 11))) return false;

  return true;
}

// CPF Input Mask (###.###.###-##)
export function maskCpf(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
}

// Phone Input Mask ((##) #####-####)
export function maskPhone(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
}

// NIS Input Mask (###.#####.##-#)
export function maskNis(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{5})(\d)/, '$1.$2')
    .replace(/(\d{2})(\d)/, '$1-$2')
    .replace(/(-\d{1})\d+?$/, '$1');
}

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isRecovery, setIsRecovery] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [nis, setNis] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  if (!isOpen) return null;

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCpf(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(maskPhone(e.target.value));
  };

  const handleNisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNis(maskNis(e.target.value));
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
    setCpf('');
    setAddress('');
    setPhone('');
    setNis('');
    setMotherName('');
    setFatherName('');
    setAcceptTerms(false);
    setError('');
    setSuccess('');
    setIsRecovery(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar login.');
      }

      onLoginSuccess(data.user);
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Field Validation
    if (!email || !password || !confirmPassword || !name || !cpf || !address || !phone || !nis) {
      setError('Todos os campos obrigatórios (*) devem ser preenchidos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (!validateCpfClient(cpf)) {
      setError('CPF inválido. Por favor, verifique os dígitos digitados.');
      return;
    }

    if (!acceptTerms) {
      setError('Você deve concordar com as regras de processamento de dados em conformidade com a LGPD.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
          cpf,
          address,
          phone,
          nis,
          motherName: motherName || undefined,
          fatherName: fatherName || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar cadastro.');
      }

      setSuccess('Cadastro realizado com sucesso! Faça login agora.');
      setIsLogin(true);
      // keep email filled, clear passwords
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/recover-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro na recuperação.');
      }

      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div 
        id="auth-modal-container"
        className="relative w-full max-w-lg md:max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-brand-green-dark text-white p-6 rounded-t-2xl flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-brand-green-light" />
            <div>
              <h2 className="font-display text-lg font-bold">
                {isRecovery ? 'Recuperar Senha' : isLogin ? 'Acesso ao Portal SEMPS' : 'Cadastro de Cidadão'}
              </h2>
              <p className="text-xs text-brand-green-light font-light">
                {isRecovery ? 'Insira seu e-mail para receber as instruções' : isLogin ? 'Entre com seu e-mail e senha institucional' : 'Preencha seus dados com segurança (LGPD)'}
              </p>
            </div>
          </div>
          <button 
            id="btn-close-auth"
            onClick={onClose} 
            className="text-white/80 hover:text-white transition bg-black/10 hover:bg-black/20 p-2 rounded-full text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1">
          {/* Alerts */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2 animate-pulse">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {isRecovery ? (
            /* Recovery View */
            <form id="form-recovery" onSubmit={handleRecovery} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">E-mail Cadastrado *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-sm font-medium py-3 rounded-lg shadow-md transition disabled:opacity-50"
              >
                {loading ? 'Processando...' : 'Enviar Link de Recuperação'}
              </button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => { setIsRecovery(false); setIsLogin(true); setError(''); setSuccess(''); }}
                  className="text-xs text-brand-green hover:underline font-medium"
                >
                  Voltar para o Login
                </button>
              </div>
            </form>
          ) : isLogin ? (
            /* Login View */
            <form id="form-login" onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">E-mail *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Senha *</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => { setIsRecovery(true); setError(''); setSuccess(''); }}
                  className="text-brand-green hover:underline font-medium"
                >
                  Esqueceu sua senha?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-sm font-medium py-3 rounded-lg shadow-md transition disabled:opacity-50 mt-2"
              >
                {loading ? 'Acessando...' : 'Entrar no Sistema'}
              </button>

              <div className="text-center pt-3 text-xs text-slate-500">
                Não possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
                  className="text-brand-green hover:underline font-bold"
                >
                  Cadastre-se aqui
                </button>
              </div>
            </form>
          ) : (
            /* Complete Register View (LGPD Compliant) */
            <form id="form-register" onSubmit={handleRegister} className="space-y-4">
              <p className="text-xs text-slate-500 italic mb-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                🛡️ <strong>LGPD Compliance:</strong> Seus dados pessoais serão armazenados e processados de forma estritamente segura e sigilosa, servindo apenas para os agendamentos e acompanhamento de benefícios sociais pela equipe social da SEMPS Vera Cruz.
              </p>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nome Completo *</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome completo do cidadão"
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">CPF (Dará acesso à consulta) *</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={cpf}
                      onChange={handleCpfChange}
                      placeholder="000.000.000-00"
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">E-mail *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@gmail.com"
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="(71) 99999-9999"
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">NIS (Número de Identificação Social) *</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={nis}
                      onChange={handleNisChange}
                      placeholder="000.00000.00-0"
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Endereço Residencial Completo *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, nº, Bairro, Vera Cruz/BA"
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
                    />
                  </div>
                </div>

                {/* Optional Names */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nome da Mãe (Opcional)</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      value={motherName}
                      onChange={(e) => setMotherName(e.target.value)}
                      placeholder="Nome da mãe completo"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Pai (Opcional)</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      value={fatherName}
                      onChange={(e) => setFatherName(e.target.value)}
                      placeholder="Nome do pai completo"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
                    />
                  </div>
                </div>

                {/* Password Grid */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Senha de Acesso *</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Repita a Senha *</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha de acesso"
                      required
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-brand-green text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* LGPD Consent Checkbox */}
              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="consent-lgpd"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded-sm border-slate-300 text-brand-green focus:ring-brand-green"
                />
                <label htmlFor="consent-lgpd" className="text-xs text-slate-600 leading-tight">
                  Aceito os termos de processamento de dados e confirmo que moro em Vera Cruz/BA. Declaro em total veracidade os meus dados cadastrados em conformidade com a LGPD.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-sm font-medium py-3 rounded-lg shadow-md transition disabled:opacity-50 mt-3"
              >
                {loading ? 'Cadastrando...' : 'Concluir Cadastro'}
              </button>

              <div className="text-center pt-2 text-xs text-slate-500">
                Já possui cadastro?{' '}
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
                  className="text-brand-green hover:underline font-bold"
                >
                  Acesse sua conta
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
