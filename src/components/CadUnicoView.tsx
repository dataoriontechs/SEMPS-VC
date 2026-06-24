import React, { useState, useEffect } from 'react';
import { User, Schedule, SempsUnit } from '../types';
import { Calendar, Clock, MapPin, CheckCircle, AlertTriangle, FileText, QrCode, Search, Trash2 } from 'lucide-react';

interface CadUnicoViewProps {
  user: User | null;
  units: SempsUnit[];
  onOpenAuth: () => void;
}

export default function CadUnicoView({ user, units, onOpenAuth }: CadUnicoViewProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form states
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  
  // Modal for showing QR receipt
  const [receiptSchedule, setReceiptSchedule] = useState<Schedule | null>(null);

  // Available times list
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  // Fetch schedules for logged in user
  const fetchSchedules = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/schedules?userId=${user.id}`);
      const data = await response.json();
      if (response.ok) {
        setSchedules(data);
      }
    } catch (err) {
      console.error('Erro ao buscar agendamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [user]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) {
      setError('Você precisa estar logado para realizar um agendamento.');
      return;
    }

    if (!selectedUnit || !selectedDate || !selectedTime) {
      setError('Por favor, selecione a unidade, data e horário.');
      return;
    }

    // Block past dates
    const selectedDateTime = new Date(selectedDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (selectedDateTime < today) {
      setError('Você não pode escolher uma data passada.');
      return;
    }

    // Block weekends (Saturday = 5, Sunday = 6 in UTC/GMT sometimes, let's do native JS day checking)
    const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setError('Atendimento indisponível nos finais de semana. Por favor, escolha de segunda a sexta-feira.');
      return;
    }

    setBookingLoading(true);

    const unit = units.find(u => u.id === selectedUnit);

    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userCpf: user.cpf,
          userPhone: user.phone,
          date: selectedDate,
          time: selectedTime,
          unitId: selectedUnit,
          unitName: unit ? unit.name : 'Unidade SEMPS',
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar agendamento.');
      }

      setSuccess('Agendamento realizado com sucesso!');
      setSelectedUnit('');
      setSelectedDate('');
      setSelectedTime('');
      setReceiptSchedule(data); // Open receipt
      fetchSchedules(); // refresh list
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelSchedule = async (id: string) => {
    if (!confirm('Deseja realmente cancelar este agendamento de CadÚnico?')) return;

    try {
      const response = await fetch(`/api/schedules/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        setSuccess('Agendamento cancelado com sucesso.');
        fetchSchedules();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao cancelar agendamento.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao cancelar.');
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="font-display text-2xl font-bold text-brand-green-dark">Agendamento do CadÚnico</h1>
        <p className="text-xs text-slate-500 font-light">Evite filas! Agende seu atendimento presencial nos CRAS de Vera Cruz/BA com rapidez.</p>
      </div>

      {!user ? (
        /* Citizen is logged out warning */
        <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="bg-amber-50 text-brand-green mx-auto p-4 rounded-full w-16 h-16 flex items-center justify-center border border-amber-100">
            <Calendar className="w-8 h-8 text-brand-green" />
          </div>
          <h2 className="font-display font-bold text-base text-brand-green-dark">Agendamento de Serviços Sociais</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-light">
            Para realizar e consultar seus agendamentos presenciais para o CadÚnico (Bolsa Família, Tarifa Social, BPC), você precisa estar identificado em nossa plataforma de forma segura de acordo com a LGPD.
          </p>
          <button
            onClick={onOpenAuth}
            className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md transition"
          >
            Fazer Login ou Cadastrar-se Gratuitamente
          </button>
        </div>
      ) : (
        /* Main Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scheduling Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h2 className="font-display text-base font-bold text-brand-green-dark border-b border-slate-50 pb-3">Novo Agendamento</h2>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              {/* Unit Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-brand-green" /> Selecione a Unidade de Atendimento *
                </label>
                <select
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  required
                  className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-brand-green text-xs"
                >
                  <option value="">-- Escolha um CRAS correspondente ao seu bairro --</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} - {unit.address}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1 font-light">
                  Atenção: Priorize agendar na unidade mais próxima da sua residência (CRAS Mar Grande ou Barra do Gil).
                </p>
              </div>

              {/* Grid Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-brand-green" /> Escolha o Dia de Preferência *
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-brand-green text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-light">De segunda a sexta-feira, exceto feriados municipais.</p>
                </div>

                {/* Time Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-brand-green" /> Selecione o Horário Disponível *
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                    className="w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:border-brand-green text-xs"
                  >
                    <option value="">-- Selecione o horário --</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time} horas
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-normal font-light">
                📝 <strong>Recomendação importante:</strong> Compareça à unidade selecionada com 15 minutos de antecedência levando seu comprovante de agendamento (QR Code / recibo) e seus documentos pessoais de todos os membros do seu domicílio.
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3.5 rounded-xl shadow-md transition disabled:opacity-50"
              >
                {bookingLoading ? 'Processando agendamento...' : 'Confirmar Agendamento de CadÚnico'}
              </button>
            </form>
          </div>

          {/* User History List */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-brand-green-dark border-b border-slate-50 pb-3">Seus Agendamentos</h2>

            {loading ? (
              <div className="text-center py-6 text-slate-400 text-xs animate-pulse">Buscando histórico...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-light">
                Você ainda não realizou nenhum agendamento na plataforma.
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((item) => (
                  <div key={item.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start gap-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === 'scheduled' ? 'bg-amber-100 text-amber-800' :
                        item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {item.status === 'scheduled' ? 'Agendado' :
                         item.status === 'completed' ? 'Atendido' : 'Cancelado'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        {item.time}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-slate-800">{item.unitName}</p>
                      <p className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-brand-green" /> {item.date.split('-').reverse().join('/')}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100/60">
                      {item.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => setReceiptSchedule(item)}
                            className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold py-2 rounded-lg transition flex items-center justify-center gap-1"
                          >
                            <QrCode className="w-3.5 h-3.5 text-brand-green" /> Recibo
                          </button>
                          <button
                            onClick={() => handleCancelSchedule(item.id)}
                            className="p-2 bg-white hover:bg-red-50 border border-slate-200 text-red-500 hover:border-red-200 rounded-lg transition"
                            title="Cancelar Agendamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {item.status === 'cancelled' && (
                        <p className="text-[10px] text-red-400 italic font-light">Agendamento desativado.</p>
                      )}
                      {item.status === 'completed' && (
                        <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">✔ Atendimento Concluído</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Receipt Slip Modal */}
      {receiptSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-100 shadow-2xl relative">
            <button 
              onClick={() => setReceiptSchedule(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
            >
              ✕
            </button>
            <div className="mx-auto w-12 h-12 bg-brand-green-light rounded-full flex items-center justify-center text-brand-green">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm text-brand-green-dark">Comprovante de Agendamento</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">CadÚnico • Vera Cruz/BA</p>
            </div>

            {/* Simulated Receipt Details */}
            <div className="bg-slate-50 p-4 rounded-2xl text-left text-xs space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400">Cidadão:</span>
                <span className="font-bold text-slate-800 truncate max-w-[160px]">{receiptSchedule.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CPF:</span>
                <span className="font-mono font-semibold text-slate-800">{receiptSchedule.userCpf}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unidade:</span>
                <span className="font-bold text-brand-green truncate max-w-[160px]">{receiptSchedule.unitName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Data:</span>
                <span className="font-bold text-slate-800">{receiptSchedule.date.split('-').reverse().join('/')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Horário:</span>
                <span className="font-bold text-slate-800">{receiptSchedule.time} h</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/50 pt-2 text-[10px]">
                <span className="text-slate-400">Protocolo:</span>
                <span className="font-mono text-slate-500 font-bold">{receiptSchedule.id.toUpperCase()}</span>
              </div>
            </div>

            {/* Generated Mock QR Code */}
            <div className="bg-brand-cream border border-brand-cream-dark p-3 rounded-2xl inline-block shadow-inner">
              <div className="w-32 h-32 bg-slate-800 rounded-lg flex items-center justify-center text-white p-2">
                {/* SVG Mock QR Code */}
                <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                  <path d="M5 5h30v30H5zm5 5v20h20V10zM12 12h6v6h-6zm10 10h6v6h-6zM65 5h30v30H65zm5 5v20h20V10zM72 12h6v6h-6zm10 10h6v6h-6zM5 65h30v30H5zm5 5v20h20V20H10zm2 2h6v6h-6zm10 10h6v6h-6zM45 45h10v10H45zm15 0h10v10H60zm-30 0h10v10H30zm15 15h10v10H45zm15 0h10v10H60zm15 15h10v10H75zm-15 0h10v10H60zm-15 0h10v10H45z" />
                </svg>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 font-light max-w-xs mx-auto leading-normal">
              Apresente o QR Code acima no seu celular no momento do atendimento presencial no CRAS.
            </p>

            <button
              onClick={() => {
                alert('📥 Recibo salvo no dispositivo!\n(Simulado com sucesso)');
                setReceiptSchedule(null);
              }}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold py-2.5 rounded-xl transition"
            >
              Baixar Recibo PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
