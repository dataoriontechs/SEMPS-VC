import React, { useState, useEffect } from 'react';
import { User, Schedule, SempsUnit, SchedulingModel } from '../types';
import { schedulesService, schedulingModelsService, systemConfigService } from '../services/firestoreService';
import { Calendar, Clock, MapPin, CheckCircle, AlertTriangle, FileText, QrCode, Search, Trash2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

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
  const [models, setModels] = useState<SchedulingModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [sysConfig, setSysConfig] = useState<any>(null);
  
  // Modal for showing QR receipt
  const [receiptSchedule, setReceiptSchedule] = useState<Schedule | null>(null);
  const [cancelScheduleId, setCancelScheduleId] = useState<string | null>(null);

  // Calendar month selection state
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const start = new Date();
    start.setDate(1);
    return start;
  });

  const handlePrevMonth = () => {
    setCalendarMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setCalendarMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  // Available times list
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ];

  // Subscribe to scheduling models
  useEffect(() => {
    const unsub = schedulingModelsService.subscribeModels((data) => {
      setModels(data.filter(m => m.active));
    });
    return () => unsub();
  }, []);

  // Subscribe to all schedules for real-time limit controls
  useEffect(() => {
    const unsub = schedulesService.subscribeAllSchedules((data) => {
      setAllSchedules(data);
    });
    return () => unsub();
  }, []);

  // Subscribe to system config
  useEffect(() => {
    const unsub = systemConfigService.subscribeConfig((data) => {
      setSysConfig(data);
    });
    return () => unsub();
  }, []);

  const validateDate = (dateStr: string) => {
    if (!dateStr) return { valid: true, error: '' };
    
    const selectedDateObj = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (selectedDateObj <= today) {
      return { valid: false, error: 'O agendamento para o mesmo dia ou datas retroativas não é permitido. Selecione uma data futura.' };
    }

    const daysOfWeekMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayName = daysOfWeekMap[selectedDateObj.getDay()];
    
    // Check operating days / weekends
    if (sysConfig?.daysOfOperation) {
      if (!sysConfig.daysOfOperation.includes(dayName)) {
        return { valid: false, error: `Esta data é um(a) ${dayName}, dia em que a Secretaria não realiza atendimento presencial.` };
      }
    } else {
      if (selectedDateObj.getDay() === 0 || selectedDateObj.getDay() === 6) {
        return { valid: false, error: 'Atendimento indisponível nos finais de semana.' };
      }
    }

    // Check municipal holidays
    if (sysConfig?.municipalHolidays?.includes(dateStr)) {
      return { valid: false, error: 'A data selecionada coincide com um Feriado Municipal cadastrado (Unidade Fechada).' };
    }

    // Check blocked dates
    if (sysConfig?.blockedDates?.includes(dateStr)) {
      return { valid: false, error: 'O atendimento nesta data está temporariamente suspenso por orientação da Secretaria.' };
    }

    // Check service-specific operating days
    const currentModel = models.find(m => m.id === selectedModelId);
    if (currentModel && currentModel.days && currentModel.days.length > 0) {
      if (!currentModel.days.includes(dayName)) {
        return { valid: false, error: `Este serviço específico é oferecido apenas nas: ${currentModel.days.join(', ')}.` };
      }
    }

    return { valid: true, error: '' };
  };

  const getAvailableHoursForDate = (dateStr: string) => {
    const currentModel = models.find(m => m.id === selectedModelId);
    if (!currentModel) return [];
    
    const maxDailyCapacity = currentModel.maxDaily !== undefined ? Number(currentModel.maxDaily) : 60;

    // Filter based on how many schedules are already active for this date, unit, and service
    const activeOnDate = allSchedules.filter(s => 
      s.date === dateStr && 
      s.unitId === selectedUnit && 
      (s.serviceId === selectedModelId || s.modelId === selectedModelId) && 
      ['scheduled', 'confirmed', 'aguardando', 'em_atendimento', 'completed', 'atendido'].includes(s.status)
    );

    return [{
      hour: '08:00 às 14:00 (Ordem de Chegada)',
      bookedCount: activeOnDate.length,
      isFull: activeOnDate.length >= maxDailyCapacity
    }];
  };

  const getMinDateString = () => {
    if (!selectedModelId) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const candidate = new Date(today);
    candidate.setDate(candidate.getDate() + 1);

    for (let i = 0; i < 90; i++) {
      const dateStr = candidate.toISOString().split('T')[0];
      const check = validateDate(dateStr);
      if (check.valid) {
        const avails = getAvailableHoursForDate(dateStr);
        const hasSpots = avails.some(h => !h.isFull);
        if (hasSpots) {
          return dateStr;
        }
      }
      candidate.setDate(candidate.getDate() + 1);
    }

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (selectedModelId) {
      const firstAvail = getMinDateString();
      if (firstAvail) {
        setSelectedDate(firstAvail);
        setSelectedTime('08:00 às 14:00 (Ordem de Chegada)');
        setCalendarMonth(new Date(firstAvail + 'T00:00:00'));
      }
    } else {
      setSelectedDate('');
      setSelectedTime('');
    }
  }, [selectedModelId]);

  const renderInteractiveCalendar = () => {
    if (!selectedModelId) {
      return (
        <div className="border border-dashed border-brand-green-light/60 p-6 rounded-2xl text-center bg-brand-cream/10">
          <Calendar className="w-8 h-8 text-brand-green-light/80 mx-auto mb-2 animate-bounce" />
          <p className="text-xs text-[#5a5a40]/80 font-medium">
            Selecione o Tipo de Serviço primeiro para liberar o calendário interativo de agendamentos.
          </p>
        </div>
      );
    }

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days: { date: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Prev month padding
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const m = month === 0 ? 11 : month - 1;
      const y = month === 0 ? year - 1 : year;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, dayNum: d, isCurrentMonth: true });
    }

    // Next month padding to complete 42 items (6 rows * 7 columns)
    const remainingCells = 42 - days.length;
    for (let d = 1; d <= remainingCells; d++) {
      const m = month === 11 ? 0 : month + 1;
      const y = month === 11 ? year + 1 : year;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, dayNum: d, isCurrentMonth: false });
    }

    // Check if we can go back in time (don't go before current month)
    const today = new Date();
    const isPrevDisabled = year < today.getFullYear() || (year === today.getFullYear() && month <= today.getMonth());

    return (
      <div className="bg-white border border-brand-green-light rounded-2xl p-4 space-y-4 shadow-xs">
        {/* Calendar Nav */}
        <div className="flex justify-between items-center bg-brand-green-dark p-2.5 rounded-xl text-white">
          <button
            type="button"
            disabled={isPrevDisabled}
            onClick={handlePrevMonth}
            className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 transition"
            title="Mês anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <span className="font-display font-bold text-xs capitalize tracking-wide text-white">
            {monthNames[month]} {year}
          </span>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-white/10 rounded-lg transition"
            title="Próximo mês"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[#5a5a40]/80 text-[10px] font-mono border-b border-brand-green-light/30 pb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Grid Days */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((item, idx) => {
            const { date, dayNum, isCurrentMonth } = item;
            
            // If not current month, render empty placeholder or light disabled cell
            if (!isCurrentMonth) {
              return (
                <div 
                  key={`empty-${idx}`} 
                  className="h-10 flex items-center justify-center text-[10px] text-slate-300 select-none bg-slate-50/20 rounded-lg font-light"
                >
                  {dayNum}
                </div>
              );
            }

            const validation = validateDate(date);
            const isSelected = selectedDate === date;

            let cellClass = "";
            let statusText = "Disponível";
            let clickable = true;

            if (isSelected) {
              cellClass = "bg-brand-green text-white hover:bg-brand-green-dark border-brand-green ring-2 ring-brand-green-light ring-offset-1";
              statusText = "Selecionado";
            } else if (!validation.valid) {
              clickable = false;
              if (validation.error.includes('retroativas') || validation.error.includes('mesmo dia')) {
                // Past date
                cellClass = "bg-slate-50 text-slate-300 cursor-not-allowed border-transparent";
                statusText = "Data Passada";
              } else if (validation.error.includes('final de semana') || validation.error.includes('atendimento presencial')) {
                // Unoperating / weekend
                cellClass = "bg-slate-100/60 text-slate-400 cursor-not-allowed border-dashed border-slate-200";
                statusText = "Sem Atendimento";
              } else if (validation.error.includes('Feriado Municipal')) {
                // Holiday
                cellClass = "bg-red-50 text-red-500 border border-red-100 hover:bg-red-100/30 cursor-not-allowed";
                statusText = "Feriado";
              } else if (validation.error.includes('temporariamente suspenso')) {
                // Blocked
                cellClass = "bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100/30 cursor-not-allowed";
                statusText = "Data Suspensa";
              } else {
                // service day limit
                cellClass = "bg-amber-50/50 text-amber-700/80 border border-amber-100 cursor-not-allowed";
                statusText = "Serviço Fechado";
              }
            } else {
              // Valid date - check for remaining spots
              const avails = getAvailableHoursForDate(date);
              const remainingCount = avails.filter(h => !h.isFull).length;
              if (remainingCount === 0) {
                clickable = false;
                cellClass = "bg-red-50/80 text-red-400 border border-red-100/60 cursor-not-allowed hover:bg-red-50";
                statusText = "Esgotado";
              } else {
                cellClass = "bg-emerald-50/40 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer font-bold";
                statusText = "Disponível";
              }
            }

            return (
              <button
                key={date}
                type="button"
                disabled={!clickable}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedTime('08:00 às 14:00 (Ordem de Chegada)');
                  setError('');
                }}
                className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all duration-200 border text-xs select-none ${cellClass}`}
                title={`${dayNum} - ${statusText}${!clickable && validation.error ? ` (${validation.error})` : ''}`}
              >
                <span className="font-semibold text-[11px]">{dayNum}</span>
                {isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full animate-pulse" />
                )}
                {!isSelected && clickable && (
                  <span className="absolute bottom-1 w-1 h-1 bg-emerald-500 rounded-full" />
                )}
                {!isSelected && !clickable && statusText === "Esgotado" && (
                  <span className="absolute bottom-1 w-1 h-1 bg-red-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-2 border-t border-brand-green-light/30 grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-50 border border-emerald-200 inline-block" />
            <span>Disponível</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-green inline-block" />
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-50 border border-red-100 inline-block" />
            <span>Esgotado / Feriado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-50 border border-slate-200 inline-block" />
            <span>Fechado / Passado</span>
          </div>
        </div>
      </div>
    );
  };

  // Fetch schedules for logged in user using real-time subscription
  useEffect(() => {
    if (!user) {
      setSchedules([]);
      return;
    }
    setLoading(true);
    const unsub = schedulesService.subscribeUserSchedules(user.id, (data) => {
      setSchedules(data);
      setLoading(false);
    });
    return () => {
      unsub();
    };
  }, [user]);

  const fetchSchedules = async () => {
    // Compatible no-op
  };

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

    // Run dynamic date validations (same day, past dates, operating days, holidays, blocked dates)
    const dateValidation = validateDate(selectedDate);
    if (!dateValidation.valid) {
      setError(dateValidation.error);
      return;
    }

    // Check if the citizen already has an active schedule on this exact day
    const hasAlreadyScheduledToday = allSchedules.some(s => 
      s.userId === user.id && 
      s.date === selectedDate && 
      s.status !== 'cancelled' && 
      s.status !== 'cancelado'
    ) || schedules.some(s => 
      s.date === selectedDate && 
      s.status !== 'cancelled' && 
      s.status !== 'cancelado'
    );

    if (hasAlreadyScheduledToday) {
      setError(`Atenção: Você já possui um agendamento ativo para o dia ${selectedDate.split('-').reverse().join('/')}. Só é permitido realizar um agendamento por dia.`);
      return;
    }

    // Double check if selected hour is full
    const availHours = getAvailableHoursForDate(selectedDate);
    const chosenHourObj = availHours.find(h => h.hour === selectedTime);
    if (chosenHourObj && chosenHourObj.isFull) {
      setError(`O horário das ${selectedTime} já atingiu a capacidade máxima de agendamentos. Por favor, escolha outro horário.`);
      return;
    }

    setBookingLoading(true);

    const unit = units.find(u => u.id === selectedUnit);
    const currentModel = models.find(m => m.id === selectedModelId);

    try {
      const scheduleData = {
        userId: user.id,
        userName: user.name,
        userCpf: user.cpf,
        userPhone: user.phone,
        date: selectedDate,
        time: selectedTime,
        unitId: selectedUnit,
        unitName: unit ? unit.name : 'Unidade SEMPS',
        status: 'scheduled' as const,
        createdAt: new Date().toISOString(),
        modelId: selectedModelId,
        serviceName: currentModel?.name || 'CadÚnico',
        slotsPerTime: currentModel?.slotsPerTime !== undefined ? Number(currentModel.slotsPerTime) : 5
      };

      const result = await schedulesService.addSchedule(scheduleData);

      setSuccess('Agendamento realizado com sucesso!');
      setSelectedModelId('');
      setSelectedUnit('');
      setSelectedDate('');
      setSelectedTime('');
      
      // Let's find the newly created schedule or simulate the receipt
      const createdReceipt: Schedule = {
        id: result?.id || ('new-id-' + Math.random()),
        ...scheduleData
      };
      setReceiptSchedule(createdReceipt);
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar agendamento.');
    } finally {
      setBookingLoading(false);
    }
  };

  const confirmCancelSchedule = async () => {
    if (!cancelScheduleId) return;

    try {
      setError('');
      setSuccess('');
      await schedulesService.updateScheduleStatus(cancelScheduleId, 'cancelled');
      setSuccess('Agendamento cancelado com sucesso.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao cancelar o agendamento.');
    } finally {
      setCancelScheduleId(null);
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
        <div className="bg-white border border-brand-green-light rounded-[32px] p-8 text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="bg-brand-cream text-brand-green mx-auto p-4 rounded-full w-16 h-16 flex items-center justify-center border border-brand-green-light">
            <Calendar className="w-8 h-8 text-brand-green" />
          </div>
          <h2 className="font-display font-semibold italic text-base text-brand-green-dark">Agendamento de Serviços Sociais</h2>
          <p className="text-xs text-[#5a5a40] leading-relaxed font-light">
            Para realizar e consultar seus agendamentos presenciais para o CadÚnico (Bolsa Família, Tarifa Social, BPC), você precisa estar identificado em nossa plataforma de forma segura de acordo com a LGPD.
          </p>
          <button
            onClick={onOpenAuth}
            className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold px-6 py-3.5 rounded-full shadow-md transition"
          >
            Fazer Login ou Cadastrar-se na Plataforma
          </button>
        </div>
      ) : (
        /* Main Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scheduling Form */}
          <div className="lg:col-span-2 bg-white rounded-[32px] border border-brand-green-light shadow-sm p-6 space-y-6">
            <h2 className="font-display text-base font-bold text-brand-green-dark border-b border-brand-green-light/40 pb-3">Novo Agendamento</h2>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              {/* Service/Model Selection */}
              <div>
                <label className="block text-xs font-bold text-brand-green-dark mb-1.5 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-brand-green" /> Selecione o Tipo de Serviço *
                </label>
                <select
                  value={selectedModelId}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setSelectedModelId(mId);
                    const chosen = models.find(m => m.id === mId);
                    if (chosen) {
                      setSelectedUnit(chosen.unitId);
                    } else {
                      setSelectedUnit('');
                    }
                    setSelectedDate('');
                    setSelectedTime('');
                  }}
                  required
                  className="w-full border border-brand-green-light p-3 rounded-xl focus:outline-none focus:border-brand-green text-xs bg-brand-cream/30"
                >
                  <option value="">-- Escolha o serviço social desejado --</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.location})
                    </option>
                  ))}
                </select>
              </div>

              {selectedModelId && (() => {
                const chosen = models.find(m => m.id === selectedModelId);
                if (chosen && chosen.requiresDocs && chosen.requiredDocsList && chosen.requiredDocsList.length > 0) {
                  return (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 space-y-2 animate-fade-in text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800">
                        <AlertCircle className="w-4 h-4" /> Documentação Obrigatória Necessária
                      </div>
                      <p className="font-light">Para este atendimento específico, você precisará apresentar obrigatoriamente os seguintes documentos originais na recepção:</p>
                      <ul className="list-disc pl-5 font-bold text-[11px] text-amber-950 space-y-1 mt-1">
                        {chosen.requiredDocsList.map((doc, i) => (
                          <li key={i}>{doc}</li>
                        ))}
                      </ul>
                      <p className="text-[10px] text-amber-700/90 font-light mt-1">A ausência de qualquer documento listado acima poderá inviabilizar a prestação do seu atendimento.</p>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Unit display (read-only/auto-filled from service) */}
              {selectedModelId && (
                <div>
                  <label className="block text-xs font-bold text-[#5a5a40]/80 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-brand-green" /> Unidade de Atendimento
                  </label>
                  <input
                    type="text"
                    disabled
                    value={units.find(u => u.id === selectedUnit)?.name || 'Unidade SEMPS'}
                    className="w-full border border-brand-green-light/40 p-3 rounded-xl text-xs bg-slate-50 text-slate-500 font-semibold focus:outline-none"
                  />
                  <p className="text-[10px] text-[#5a5a40]/70 mt-1 font-light">
                    Endereço: {units.find(u => u.id === selectedUnit)?.address || ''}
                  </p>
                </div>
              )}

              {/* Grid Date and Time */}
              <div className="space-y-6">
                {/* Interactive Calendar Container */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-brand-green-dark mb-1 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-brand-green" /> Calendário Interativo de Agendamentos *
                  </label>
                  {renderInteractiveCalendar()}
                </div>

                {/* Selected Date & Time Selection */}
                {selectedDate && validateDate(selectedDate).valid && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl animate-fade-in">
                    <div>
                      <label className="block text-xs font-bold text-brand-green-dark mb-1.5 flex items-center gap-1">
                        📅 Dia Selecionado
                      </label>
                      <input
                        type="text"
                        disabled
                        value={new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        className="w-full border border-emerald-200/60 p-3 rounded-xl text-xs bg-white text-emerald-800 font-bold focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2 bg-emerald-50/20 p-5 rounded-2xl border border-emerald-100/80 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-brand-green-dark flex items-center gap-1">
                            <Clock className="w-4 h-4 text-brand-green" /> Período de Atendimento
                          </span>
                          <p className="text-xs font-extrabold text-slate-800">
                            08:00 às 14:00 (Por Ordem de Chegada)
                          </p>
                        </div>
                        {(() => {
                          const avails = getAvailableHoursForDate(selectedDate);
                          const cap = Number(models.find(m => m.id === selectedModelId)?.maxDaily || 60);
                          const bookedCount = avails.length > 0 ? avails[0].bookedCount : 0;
                          const remaining = Math.max(0, cap - bookedCount);
                          return (
                            <div className="bg-brand-cream border border-brand-green-light px-3 py-1.5 rounded-xl text-center shrink-0 w-full sm:w-auto">
                              <span className="block text-[8px] font-bold text-brand-green-dark uppercase tracking-wider">Capacidade Máxima</span>
                              <span className="text-sm font-extrabold text-brand-green-dark">{cap} Vagas</span>
                            </div>
                          );
                        })()}
                      </div>

                      {(() => {
                        const avails = getAvailableHoursForDate(selectedDate);
                        const cap = Number(models.find(m => m.id === selectedModelId)?.maxDaily || 60);
                        const bookedCount = avails.length > 0 ? avails[0].bookedCount : 0;
                        const remaining = Math.max(0, cap - bookedCount);
                        return (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-slate-600">Disponibilidade de Vagas</span>
                              <span className={`font-bold ${remaining > 10 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {remaining === 0 ? 'Esgotado' : `${remaining} de ${cap} vagas restantes`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 rounded-full ${
                                  remaining > 20 ? 'bg-emerald-500' : remaining > 5 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${(remaining / cap) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      <div className="text-[10px] text-emerald-800/85 font-normal bg-emerald-50 border border-emerald-100 p-3 rounded-xl leading-relaxed">
                        ⚠️ <strong>Informação Importante:</strong> O atendimento para o Cadastro Único nesta unidade funciona em regime de <strong>ordem de chegada</strong> no período das <strong>08:00 às 14:00</strong>. Ao realizar este agendamento, sua vaga de atendimento está garantida para o dia escolhido.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-brand-cream/50 rounded-2xl border border-brand-green-light/40 text-xs text-[#5a5a40] leading-normal font-light">
                📝 <strong>Recomendação importante:</strong> Compareça à unidade selecionada com 15 minutos de antecedência levando seu comprovante de agendamento (QR Code / recibo) e seus documentos pessoais de todos os membros do seu domicílio.
              </div>

              <button
                type="submit"
                disabled={bookingLoading}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3.5 rounded-full shadow-md transition disabled:opacity-50"
              >
                {bookingLoading ? 'Processando agendamento...' : 'Confirmar Agendamento de CadÚnico'}
              </button>
            </form>
          </div>

          {/* User History List */}
          <div className="bg-white rounded-[32px] border border-brand-green-light shadow-sm p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-brand-green-dark border-b border-brand-green-light/40 pb-3">Seus Agendamentos</h2>

            {loading ? (
              <div className="text-center py-6 text-slate-400 text-xs animate-pulse">Buscando histórico...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-light">
                Você ainda não realizou nenhum agendamento na plataforma.
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((item) => (
                  <div key={item.id} className="p-4 bg-brand-cream/30 border border-brand-green-light/60 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start gap-1">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${
                        item.status === 'scheduled' ? 'bg-amber-50 text-amber-850 border border-amber-200' :
                        item.status === 'completed' ? 'bg-emerald-50 text-emerald-850 border border-emerald-200' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {item.status === 'scheduled' ? 'Agendado' :
                         item.status === 'completed' ? 'Atendido' : 'Cancelado'}
                      </span>
                      <span className="text-[10px] text-brand-green-dark font-mono font-bold">
                        {item.time}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-brand-green-dark">{item.unitName}</p>
                      <p className="text-[#5a5a40] flex items-center gap-1 font-light">
                        <Calendar className="w-3.5 h-3.5 text-brand-green" /> {item.date.split('-').reverse().join('/')}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-brand-green-light/30">
                      {item.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => setReceiptSchedule(item)}
                            className="flex-1 bg-white hover:bg-brand-cream text-brand-green-dark border border-brand-green-light text-[10px] font-bold py-2 rounded-lg transition flex items-center justify-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-brand-green" /> Ver Recibo
                          </button>
                          <button
                            onClick={() => setCancelScheduleId(item.id)}
                            className="p-2 bg-white hover:bg-red-50 border border-brand-green-light text-red-500 rounded-lg transition"
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
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">✔ Atendimento Concluído</p>
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

            {/* Stamp/Seal style visual instead of QR Code */}
            <div className="border-t border-b border-dashed border-slate-200 py-3 my-2 text-left space-y-2">
              <div className="text-center flex flex-col items-center justify-center space-y-1">
                <span className="text-[10px] font-mono text-brand-green-dark font-extrabold uppercase bg-brand-green-light/40 px-3 py-1 rounded-full border border-brand-green-light/80">
                  ★ AGENDAMENTO CONFIRMADO ★
                </span>
                <span className="text-[9px] text-slate-500 font-mono">AUTENTICAÇÃO: {receiptSchedule.id.substring(0, 8).toUpperCase()}-{Math.floor(1000 + Math.random() * 9000)}</span>
              </div>
              <p className="text-[9.5px] text-slate-500 text-center leading-relaxed font-light">
                Este recibo confirma que seu agendamento foi realizado com sucesso. Apresente este comprovante (impresso ou na tela do celular) ao atendente na unidade escolhida.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-white hover:bg-slate-50 text-brand-green-dark border border-brand-green-light text-xs font-semibold py-2.5 rounded-xl transition"
              >
                Imprimir Recibo
              </button>
              <button
                onClick={() => {
                  setReceiptSchedule(null);
                }}
                className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold py-2.5 rounded-xl transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Cancellation Confirmation Modal */}
      {cancelScheduleId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-display font-bold text-base text-slate-800">Cancelar Agendamento</h3>
              <p className="text-xs text-slate-500 font-light leading-relaxed">
                Deseja realmente cancelar este agendamento do CadÚnico? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelScheduleId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl transition"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={confirmCancelSchedule}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
