import React, { useState, useEffect } from 'react';
import { User, Schedule, Course, News, BenefitProgram, JobVacancy, Banner, SchedulingModel, SystemConfig, BenefitType, SempsUnit, CourseEnrollment, AiTrainingDoc } from '../types';
import { db, collection, query, where, onSnapshot, doc, setDoc, updateDoc } from '../lib/firebase';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { 
  newsService, 
  courseService, 
  jobsService, 
  schedulesService, 
  benefitsService,
  bannerService,
  schedulingModelsService,
  systemConfigService,
  notificationsService,
  benefitTypesService,
  unitsService,
  courseEnrollmentsService,
  aiTrainingDocsService
} from '../services/firestoreService';
import { cloudinaryService } from '../services/cloudinaryService';
import { Users, Calendar, GraduationCap, Briefcase, Plus, Trash2, CheckCircle2, XCircle, Search, Edit2, FileText, BarChart3, AlertCircle, Upload, Image, Eye, EyeOff, Settings, Megaphone, Building, BookOpen } from 'lucide-react';
import { maskCpf, maskNis, maskPhone } from './AuthModal';

interface AdminDashboardProps {
  user: User;
  courses: Course[];
  fetchCourses: () => void;
  fetchJobs: () => void;
  fetchNews: () => void;
  banners?: Banner[];
}

export default function AdminDashboard({ user, courses, fetchCourses, fetchJobs, fetchNews, banners = [] }: AdminDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<string>('stats');
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // AI Training states
  const [aiDocs, setAiDocs] = useState<AiTrainingDoc[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isParsingPdf, setIsParsingPdf] = useState<boolean>(false);
  const [parsedDocText, setParsedDocText] = useState<string>('');
  const [docTitle, setDocTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const [citizensCount, setCitizensCount] = useState<number>(0);
  const [jobs, setJobs] = useState<JobVacancy[]>([]);
  const [jobsCount, setJobsCount] = useState<number>(0);
  const [candidacies, setCandidacies] = useState<any[]>([]);

  // System Config states
  const [sysConfig, setSysConfig] = useState<SystemConfig | null>(null);
  const [configSecHours, setConfigSecHours] = useState('');
  const [configMinNotice, setConfigMinNotice] = useState(24);
  const [configMaxCancel, setConfigMaxCancel] = useState(2);
  const [configLandingMsg, setConfigLandingMsg] = useState('');
  const [configDays, setConfigDays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [newBlockedDate, setNewBlockedDate] = useState('');

  // Notification Campaign states
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignMessage, setCampaignMessage] = useState('');
  const [campaignTarget, setCampaignTarget] = useState<'all' | 'cidadao' | 'colaborador' | 'administrador'>('all');

  // Scheduling Models states
  const [schedulingModels, setSchedulingModels] = useState<SchedulingModel[]>([]);
  const [modelName, setModelName] = useState('');
  const [modelServiceType, setModelServiceType] = useState('CadÚnico');
  const [modelLocation, setModelLocation] = useState('CRAS Mar Grande');
  const [modelUnitId, setModelUnitId] = useState('unit-1');
  const [modelDays, setModelDays] = useState<string[]>(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
  const [modelHours, setModelHours] = useState<string[]>([
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ]);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [modelDescription, setModelDescription] = useState('');
  const [modelColor, setModelColor] = useState('emerald');
  const [modelIcon, setModelIcon] = useState('Calendar');
  const [modelInterval, setModelInterval] = useState(20);
  const [modelSlotsPerTime, setModelSlotsPerTime] = useState(5);
  const [modelMaxDaily, setModelMaxDaily] = useState(100);
  const [modelRequiresDocs, setModelRequiresDocs] = useState(false);
  const [modelRequiredDocsText, setModelRequiredDocsText] = useState('');
  const [modelActive, setModelActive] = useState(true);

  // Users Management states
  const [usersList, setUsersList] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserCpf, setNewUserCpf] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserNis, setNewUserNis] = useState('');
  const [newUserRole, setNewUserRole] = useState<'colaborador' | 'administrador' | 'cidadao'>('colaborador');

  // Compute stats object dynamically in real-time
  const activeSchedules = schedules.filter(s => s.status === 'scheduled').length;
  const totalInscriptions = courses.reduce((acc, c) => acc + (c.registeredUsers?.length || 0), 0);
  const recentSchedules = schedules.slice(-5).reverse();
  const coursesSummary = courses.map(c => ({
    id: c.id,
    title: c.title,
    enrolled: c.registeredUsers?.length || 0,
    total: c.totalSlots
  }));

  const stats = {
    citizensCount,
    activeSchedules,
    totalInscriptions,
    jobsCount,
    recentSchedules,
    coursesSummary
  };

  // Process monthly CadÚnico appointments for Recharts
  const processSchedulesForChart = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    
    // Group by day of the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyDataMap: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      dailyDataMap[d] = 0;
    }

    schedules.forEach(s => {
      if (s.date) {
        const parts = s.date.split('-');
        if (parts.length === 3) {
          const sYear = parseInt(parts[0], 10);
          const sMonth = parseInt(parts[1], 10) - 1; // 0-indexed
          const sDay = parseInt(parts[2], 10);
          
          if (sYear === currentYear && sMonth === currentMonth) {
            dailyDataMap[sDay] = (dailyDataMap[sDay] || 0) + 1;
          }
        }
      }
    });

    const chartData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      chartData.push({
        dia: `${String(d).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}`,
        "Agendamentos": dailyDataMap[d] || 0
      });
    }

    const totalActual = Object.values(dailyDataMap).reduce((a, b) => a + b, 0);
    return chartData;
  };

  // Process candidacies per job vacancy for Recharts
  const processCandidaciesForChart = () => {
    const counts: Record<string, { jobTitle: string, company: string, count: number }> = {};
    
    candidacies.forEach(c => {
      const key = `${c.jobTitle} - ${c.company}`;
      if (!counts[key]) {
        counts[key] = {
          jobTitle: c.jobTitle,
          company: c.company,
          count: 0
        };
      }
      counts[key].count += 1;
    });

    const data = Object.values(counts).map(item => ({
      vaga: item.jobTitle.length > 20 ? `${item.jobTitle.substring(0, 18)}...` : item.jobTitle,
      empresa: item.company,
      "Candidaturas": item.count
    }));

    return data.sort((a, b) => b["Candidaturas"] - a["Candidaturas"]).slice(0, 6);
  };

  // Search citizen for updating benefits
  const [citizenSearchCpf, setCitizenSearchCpf] = useState<string>('');
  const [citizenBenefits, setCitizenBenefits] = useState<BenefitProgram[]>([]);
  const [benefitSearched, setBenefitSearched] = useState<boolean>(false);

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    confirmStyle?: 'danger' | 'primary';
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    confirmStyle: 'danger',
    onConfirm: () => {}
  });

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmStyle: 'danger' | 'primary' = 'danger',
    confirmText: string = 'Confirmar'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmStyle,
      confirmText,
      onConfirm
    });
  };

  // Master Benefit Types states
  const [masterBenefitTypes, setMasterBenefitTypes] = useState<BenefitType[]>([]);
  const [editingBenefitTypeId, setEditingBenefitTypeId] = useState<string | null>(null);
  const [benefitTypeName, setBenefitTypeName] = useState('');
  const [benefitTypeDescription, setBenefitTypeDescription] = useState('');

  // Units Management states
  const [unitsList, setUnitsList] = useState<SempsUnit[]>([]);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [unitName, setUnitName] = useState('');
  const [unitAddress, setUnitAddress] = useState('');
  const [unitPhone, setUnitPhone] = useState('');
  const [unitHours, setUnitHours] = useState('');
  const [unitServicesText, setUnitServicesText] = useState('');
  const [unitLat, setUnitLat] = useState<number>(-12.9714);
  const [unitLng, setUnitLng] = useState<number>(-38.5014);
  const [unitMapsUrl, setUnitMapsUrl] = useState('');

  // Job Editing states
  const [jobCompanyEmail, setJobCompanyEmail] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Course Editing states
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // User Editing states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

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

  // Manual Scheduling Form State
  const [manualSchedName, setManualSchedName] = useState('');
  const [manualSchedCpf, setManualSchedCpf] = useState('');
  const [manualSchedPhone, setManualSchedPhone] = useState('');
  const [manualSchedDate, setManualSchedDate] = useState('');
  const [manualSchedTime, setManualSchedTime] = useState('');
  const [manualSchedUnitId, setManualSchedUnitId] = useState('unit-1');

  // Manual Course Enrollment Form State
  const [manualEnrollCourseId, setManualEnrollCourseId] = useState('');
  const [manualEnrollName, setManualEnrollName] = useState('');
  const [manualEnrollCpf, setManualEnrollCpf] = useState('');
  const [manualEnrollPhone, setManualEnrollPhone] = useState('');

  // Image Upload and Proxy states
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  
  // News image state
  const [newsImageFile, setNewsImageFile] = useState<File | null>(null);
  const [newsImagePreview, setNewsImagePreview] = useState<string>('');

  // Course image state
  const [courseImageFile, setCourseImageFile] = useState<File | null>(null);
  const [courseImagePreview, setCourseImagePreview] = useState<string>('');

  // Job image state
  const [jobImageFile, setJobImageFile] = useState<File | null>(null);
  const [jobImagePreview, setJobImagePreview] = useState<string>('');

  // Banner Form state
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerOrder, setBannerOrder] = useState<number>(0);
  const [bannerActive, setBannerActive] = useState<boolean>(true);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePreview, setBannerImagePreview] = useState<string>('');

  const fetchAdminStats = async () => {
    // Kept for compatible signature call, no-op
  };

  const fetchAllSchedules = async () => {
    // Kept for compatible signature call, no-op
  };

  useEffect(() => {
    // Real-time schedules subscription
    const unsubSchedules = schedulesService.subscribeAllSchedules((data) => {
      setSchedules(data);
    });

    // Real-time citizens count
    const q = query(collection(db, "usuarios"), where("tipo_usuario", "in", ["citizen", "cidadao"]));
    const unsubCitizens = onSnapshot(q, (snapshot) => {
      setCitizensCount(snapshot.size);
    });

    // Real-time jobs subscription
    const unsubJobs = jobsService.subscribeJobs((data) => {
      setJobs(data);
      setJobsCount(data.length);
    });

    // Real-time scheduling models subscription
    const unsubModels = schedulingModelsService.subscribeModels((data) => {
      setSchedulingModels(data);
    });

    // Real-time all users subscription
    const unsubAllUsers = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const uItems: User[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        uItems.push({
          id: docSnap.id,
          email: data.email || "",
          name: data.nome || data.name || "",
          cpf: data.cpf || "",
          address: data.address || "",
          phone: data.telefone || data.phone || "",
          nis: data.nis || "",
          role: (data.tipo_usuario || data.role || 'cidadao') as any,
          createdAt: data.created_at || new Date().toISOString(),
          active: data.ativo !== undefined ? data.ativo : true
        });
      });
      setUsersList(uItems);
    });

    // Real-time system configuration subscription
    const unsubConfig = systemConfigService.subscribeConfig((config) => {
      setSysConfig(config);
      setConfigSecHours(config.secretariatOpeningHours);
      setConfigMinNotice(config.minNoticeHours);
      setConfigMaxCancel(config.maxCancelHours);
      setConfigLandingMsg(config.landingPageMessage);
      setConfigDays(config.daysOfOperation);
    });

    // Real-time benefit types subscription
    const unsubBenefitTypes = benefitTypesService.subscribeBenefitTypes((data) => {
      setMasterBenefitTypes(data);
    });

    // Real-time SEMPS units subscription
    const unsubUnits = unitsService.subscribeUnits((data) => {
      setUnitsList(data);
    });

    // Real-time candidacies subscription
    const unsubCandidacies = jobsService.subscribeCandidacies((data) => {
      setCandidacies(data);
    });

    // Real-time AI training documents subscription
    const unsubAiDocs = aiTrainingDocsService.subscribe((data) => {
      setAiDocs(data);
    });

    return () => {
      unsubSchedules();
      unsubCitizens();
      unsubJobs();
      unsubModels();
      unsubAllUsers();
      unsubConfig();
      unsubBenefitTypes();
      unsubUnits();
      unsubCandidacies();
      unsubAiDocs();
    };
  }, []);

  const handleUpdateScheduleStatus = async (id: string, newStatus: string) => {
    try {
      await schedulesService.updateScheduleStatus(id, newStatus);
      setSuccess('Status do agendamento atualizado com sucesso.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao atualizar agendamento.');
    }
  };

  const handleSaveSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await systemConfigService.updateConfig({
        secretariatOpeningHours: configSecHours,
        minNoticeHours: Number(configMinNotice),
        maxCancelHours: Number(configMaxCancel),
        landingPageMessage: configLandingMsg,
        daysOfOperation: configDays
      });
      setSuccess('Configurações do sistema salvas com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações do sistema.');
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday) return;
    setError('');
    setSuccess('');

    try {
      const currentHolidays = sysConfig?.municipalHolidays || [];
      if (currentHolidays.includes(newHoliday)) {
        setError('Este feriado já está cadastrado.');
        return;
      }
      await systemConfigService.updateConfig({
        municipalHolidays: [...currentHolidays, newHoliday]
      });
      setSuccess('Feriado municipal registrado!');
      setNewHoliday('');
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar feriado.');
    }
  };

  const handleRemoveHoliday = async (dateStr: string) => {
    setError('');
    setSuccess('');

    try {
      const currentHolidays = sysConfig?.municipalHolidays || [];
      await systemConfigService.updateConfig({
        municipalHolidays: currentHolidays.filter(d => d !== dateStr)
      });
      setSuccess('Feriado municipal removido.');
    } catch (err: any) {
      setError(err.message || 'Erro ao remover feriado.');
    }
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate) return;
    setError('');
    setSuccess('');

    try {
      const currentBlocked = sysConfig?.blockedDates || [];
      if (currentBlocked.includes(newBlockedDate)) {
        setError('Esta data já está bloqueada.');
        return;
      }
      await systemConfigService.updateConfig({
        blockedDates: [...currentBlocked, newBlockedDate]
      });
      setSuccess('Data bloqueada com sucesso pela Secretaria!');
      setNewBlockedDate('');
    } catch (err: any) {
      setError(err.message || 'Erro ao bloquear data.');
    }
  };

  const handleRemoveBlockedDate = async (dateStr: string) => {
    setError('');
    setSuccess('');

    try {
      const currentBlocked = sysConfig?.blockedDates || [];
      await systemConfigService.updateConfig({
        blockedDates: currentBlocked.filter(d => d !== dateStr)
      });
      setSuccess('Bloqueio de data removido.');
    } catch (err: any) {
      setError(err.message || 'Erro ao remover bloqueio.');
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!campaignTitle || !campaignMessage) {
      setError('Por favor, preencha o título e a mensagem do comunicado.');
      return;
    }

    try {
      await notificationsService.sendNotification({
        title: campaignTitle,
        message: campaignMessage,
        targetType: campaignTarget
      });
      setSuccess('Campanha e aviso em massa enviados para o perfil selecionado com sucesso!');
      setCampaignTitle('');
      setCampaignMessage('');
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar campanha.');
    }
  };

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    setError('');
    setSuccess('');

    try {
      const userRef = doc(db, 'usuarios', userId);
      await updateDoc(userRef, { ativo: !currentActive });
      setSuccess('Status de ativação do usuário alterado com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar ativação do usuário.');
    }
  };

  const handleResetUserPassword = (userId: string) => {
    showConfirm(
      'Resetar Senha de Usuário',
      'Deseja realmente resetar a senha deste usuário para a senha padrão "12345678"? Ele será solicitado a alterar no próximo login.',
      async () => {
        setError('');
        setSuccess('');
        try {
          const userRef = doc(db, 'usuarios', userId);
          await updateDoc(userRef, { 
            password: '12345678',
            needsPasswordChange: true 
          });
          setSuccess('Senha resetada para "12345678". O usuário deverá mudá-la ao fazer o próximo login.');
        } catch (err: any) {
          setError(err.message || 'Erro ao resetar senha do usuário.');
        }
      },
      'primary',
      'Resetar Senha'
    );
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
      const list = await benefitsService.getBenefitsByCpf(citizenSearchCpf);
      // Merge search results with current masterBenefitTypes
      const mergedList = masterBenefitTypes.map((m, idx) => {
        const existing = list.find(b => b.name.toLowerCase() === m.name.toLowerCase());
        return {
          id: existing?.id || `b-${idx}-${Date.now()}`,
          name: m.name,
          description: m.description,
          status: existing?.status || 'Não Cadastrado',
          observations: existing?.observations || '',
          lastUpdated: existing?.lastUpdated || ''
        };
      });
      setCitizenBenefits(mergedList);
      setBenefitSearched(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao buscar benefícios.');
    }
  };

  const handleSaveBenefits = async () => {
    setError('');
    setSuccess('');

    try {
      await benefitsService.updateUserBenefits(citizenSearchCpf, citizenBenefits);
      setSuccess('Benefícios do cidadão atualizados e salvos com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar benefícios.');
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

  // --- USER MANAGEMENT HANDLERS ---
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newUserName || !newUserEmail || !newUserPassword || !newUserCpf) {
      setError('Por favor, preencha todos os campos obrigatórios (Nome, E-mail, Senha e CPF).');
      return;
    }

    try {
      const cleanCpf = newUserCpf.replace(/\D/g, '');
      if (cleanCpf.length !== 11) {
        setError('O CPF informado deve conter exatamente 11 dígitos.');
        return;
      }

      const duplicateCpf = usersList.find(u => u.id !== editingUserId && u.cpf.replace(/\D/g, '') === cleanCpf);
      if (duplicateCpf) {
        setError('Este CPF já está cadastrado no sistema.');
        return;
      }

      const duplicateEmail = usersList.find(u => u.id !== editingUserId && u.email.toLowerCase() === newUserEmail.toLowerCase());
      if (duplicateEmail) {
        setError('Este e-mail já está em uso.');
        return;
      }

      if (editingUserId) {
        const userRef = doc(db, "usuarios", editingUserId);
        const updateData: any = {
          nome: newUserName,
          cpf: newUserCpf,
          telefone: newUserPhone,
          email: newUserEmail.toLowerCase().trim(),
          tipo_usuario: newUserRole,
          address: newUserAddress,
          nis: newUserNis,
          updated_at: new Date().toISOString()
        };
        if (newUserPassword !== '********') {
          updateData.password = newUserPassword;
        }
        await updateDoc(userRef, updateData);
        setSuccess(`Usuário ${newUserName} atualizado com sucesso!`);
        setEditingUserId(null);
      } else {
        const userRef = doc(collection(db, "usuarios"));
        const userProfile = {
          uid: userRef.id,
          nome: newUserName,
          cpf: newUserCpf,
          telefone: newUserPhone,
          email: newUserEmail.toLowerCase().trim(),
          tipo_usuario: newUserRole,
          password: newUserPassword,
          ativo: true,
          foto_url: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          address: newUserAddress,
          nis: newUserNis,
          needsPasswordChange: false
        };

        await setDoc(userRef, userProfile);
        setSuccess(`Usuário ${newUserName} cadastrado com sucesso como ${newUserRole === 'administrador' ? 'Administrador' : newUserRole === 'colaborador' ? 'Colaborador' : 'Cidadão'}!`);
      }
      
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserCpf('');
      setNewUserPhone('');
      setNewUserAddress('');
      setNewUserNis('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar usuário.');
    }
  };

  const handleEditUser = (u: User) => {
    setEditingUserId(u.id);
    setNewUserName(u.name);
    setNewUserEmail(u.email);
    setNewUserCpf(maskCpf(u.cpf));
    setNewUserPhone(maskPhone(u.phone));
    setNewUserAddress(u.address || '');
    setNewUserNis(maskNis(u.nis || ''));
    setNewUserRole(u.role);
    setNewUserPassword('********'); // placeholder
  };

  const handleDeleteUser = (uId: string, name: string) => {
    if (uId === user.id) {
      setError('Você não pode desativar sua própria conta.');
      return;
    }
    showConfirm(
      'Desativar Usuário',
      `Tem certeza de que deseja desativar o usuário "${name}"?`,
      async () => {
        setError('');
        setSuccess('');
        try {
          await updateDoc(doc(db, "usuarios", uId), { ativo: false });
          setSuccess(`Usuário "${name}" desativado do sistema com sucesso.`);
        } catch (err: any) {
          setError(err.message || 'Erro ao desativar usuário.');
        }
      }
    );
  };

  // --- MASTER BENEFIT TYPES HANDLERS ---
  const handleSaveBenefitType = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!benefitTypeName || !benefitTypeDescription) {
      setError('Por favor, preencha o nome e a descrição do tipo de benefício.');
      return;
    }

    try {
      if (editingBenefitTypeId) {
        await benefitTypesService.updateBenefitType(editingBenefitTypeId, {
          name: benefitTypeName,
          description: benefitTypeDescription
        });
        setSuccess('Tipo de benefício atualizado com sucesso!');
        setEditingBenefitTypeId(null);
      } else {
        await benefitTypesService.addBenefitType({
          name: benefitTypeName,
          description: benefitTypeDescription
        });
        setSuccess('Novo tipo de benefício cadastrado com sucesso!');
      }
      setBenefitTypeName('');
      setBenefitTypeDescription('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar tipo de benefício.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEditBenefitType = (bType: BenefitType) => {
    setEditingBenefitTypeId(bType.id);
    setBenefitTypeName(bType.name);
    setBenefitTypeDescription(bType.description);
    
    // Smoothly scroll the edit form into view
    setTimeout(() => {
      const formElement = document.getElementById('benefit-type-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleDeleteBenefitType = (id: string, name: string) => {
    showConfirm(
      'Excluir Tipo de Benefício',
      `Tem certeza de que deseja excluir o tipo de benefício "${name}"?`,
      async () => {
        setError('');
        setSuccess('');
        try {
          await benefitTypesService.deleteBenefitType(id);
          setSuccess(`Tipo de benefício "${name}" excluído com sucesso.`);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err: any) {
          setError(err.message || 'Erro ao excluir tipo de benefício.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    );
  };

  // --- SEMPS UNITS HANDLERS ---
  const handleSaveUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!unitName || !unitAddress || !unitPhone || !unitHours) {
      setError('Preencha os campos obrigatórios da unidade (Nome, Endereço, Telefone, Horário de Funcionamento).');
      return;
    }

    try {
      const unitData = {
        name: unitName,
        address: unitAddress,
        phone: unitPhone,
        hours: unitHours,
        services: unitServicesText.split('\n').map(s => s.trim()).filter(Boolean),
        lat: -12.9714,
        lng: -38.5014,
        mapsUrl: unitMapsUrl
      };

      if (editingUnitId) {
        await unitsService.updateUnit(editingUnitId, unitData);
        setSuccess('Unidade SEMPS atualizada com sucesso!');
        setEditingUnitId(null);
      } else {
        await unitsService.addUnit(unitData);
        setSuccess('Nova unidade SEMPS cadastrada com sucesso!');
      }

      setUnitName('');
      setUnitAddress('');
      setUnitPhone('');
      setUnitHours('');
      setUnitServicesText('');
      setUnitLat(-12.9714);
      setUnitLng(-38.5014);
      setUnitMapsUrl('');
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar unidade SEMPS.');
    }
  };

  const handleEditUnit = (unit: SempsUnit) => {
    setEditingUnitId(unit.id);
    setUnitName(unit.name);
    setUnitAddress(unit.address);
    setUnitPhone(unit.phone);
    setUnitHours(unit.hours);
    setUnitServicesText(unit.services?.join('\n') || '');
    setUnitLat(unit.lat || -12.9714);
    setUnitLng(unit.lng || -38.5014);
    setUnitMapsUrl(unit.mapsUrl || '');
  };

  const handleDeleteUnit = (id: string, name: string) => {
    showConfirm(
      'Remover Unidade SEMPS',
      `Tem certeza de que deseja remover a unidade "${name}"?`,
      async () => {
        setError('');
        setSuccess('');
        try {
          await unitsService.deleteUnit(id);
          setSuccess(`Unidade "${name}" excluída com sucesso.`);
        } catch (err: any) {
          setError(err.message || 'Erro ao excluir unidade.');
        }
      }
    );
  };

  // --- SCHEDULING MODELS HANDLERS ---
  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!modelName || !modelServiceType || !modelLocation) {
      setError('Por favor, preencha o nome, tipo de serviço e local do modelo.');
      return;
    }

    try {
      const modelData = {
        name: modelName,
        serviceType: modelServiceType,
        location: modelLocation,
        unitId: modelUnitId,
        days: modelDays,
        hours: modelHours,
        active: modelActive,
        description: modelDescription,
        color: modelColor,
        icon: modelIcon,
        interval: Number(modelInterval),
        slotsPerTime: Number(modelSlotsPerTime),
        maxDaily: Number(modelMaxDaily),
        requiresDocs: modelRequiresDocs,
        requiredDocsList: modelRequiredDocsText.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (editingModelId) {
        await schedulingModelsService.updateModel(editingModelId, modelData);
        setSuccess('Modelo de agendamento atualizado com sucesso!');
        setEditingModelId(null);
      } else {
        await schedulingModelsService.addModel(modelData);
        setSuccess('Novo modelo de agendamento cadastrado com sucesso!');
      }

      setModelName('');
      setModelServiceType('CadÚnico');
      setModelLocation('CRAS Mar Grande');
      setModelUnitId('unit-1');
      setModelDays(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']);
      setModelHours([
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
      ]);
      setModelDescription('');
      setModelColor('emerald');
      setModelIcon('Calendar');
      setModelInterval(20);
      setModelSlotsPerTime(5);
      setModelMaxDaily(100);
      setModelRequiresDocs(false);
      setModelRequiredDocsText('');
      setModelActive(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar modelo.');
    }
  };

  const handleEditModel = (model: SchedulingModel) => {
    setEditingModelId(model.id);
    setModelName(model.name);
    setModelServiceType(model.serviceType);
    setModelLocation(model.location);
    setModelUnitId(model.unitId);
    setModelDays(model.days);
    setModelHours(model.hours);
    setModelDescription(model.description || '');
    setModelColor(model.color || 'emerald');
    setModelIcon(model.icon || 'Calendar');
    setModelInterval(model.interval || 20);
    setModelSlotsPerTime(model.slotsPerTime || 5);
    setModelMaxDaily(model.maxDaily || 100);
    setModelRequiresDocs(!!model.requiresDocs);
    setModelRequiredDocsText(model.requiredDocsList ? model.requiredDocsList.join(', ') : '');
    setModelActive(model.active !== undefined ? model.active : true);

    const element = document.getElementById('model-form-container');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteModel = (id: string) => {
    showConfirm(
      'Excluir Modelo de Agendamento',
      'Deseja realmente excluir este modelo de agendamento?',
      async () => {
        try {
          await schedulingModelsService.deleteModel(id);
          setSuccess('Modelo de agendamento excluído com sucesso.');
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Erro ao excluir modelo.');
        }
      }
    );
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await newsService.addNews({
        title: newsTitle,
        content: newsContent,
        category: newsCategory,
        author: user.name,
        isImportant: newsIsImportant,
        date: new Date().toISOString().split('T')[0],
        image: newsImagePreview
      });
      setSuccess('Notícia publicada com sucesso!');
      setNewsTitle('');
      setNewsContent('');
      setNewsCategory('comunicado');
      setNewsIsImportant(false);
      setNewsImageFile(null);
      setNewsImagePreview('');
      fetchNews();
    } catch (err: any) {
      setError(err.message || 'Erro ao publicar notícia.');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCourseId) {
        await courseService.updateCourse(editingCourseId, {
          title: courseTitle,
          description: courseDescription,
          requirements: courseRequirements,
          totalSlots: courseSlots,
          category: courseCategory,
          schedule: courseSchedule,
          imagem_url: courseImagePreview
        });
        setSuccess('Curso/Oficina atualizado com sucesso!');
        setEditingCourseId(null);
      } else {
        await courseService.addCourse({
          title: courseTitle,
          description: courseDescription,
          requirements: courseRequirements,
          totalSlots: courseSlots,
          availableSlots: courseSlots,
          registeredUsers: [],
          category: courseCategory,
          schedule: courseSchedule,
          imagem_url: courseImagePreview
        });
        setSuccess('Curso/Oficina criado com sucesso!');
      }
      setCourseTitle('');
      setCourseDescription('');
      setCourseRequirements('');
      setCourseCategory('');
      setCourseSchedule('');
      setCourseImageFile(null);
      setCourseImagePreview('');
      fetchCourses();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar curso.');
    }
  };

  const handleEditCourse = (c: Course) => {
    setEditingCourseId(c.id);
    setCourseTitle(c.title);
    setCourseDescription(c.description);
    setCourseRequirements(c.requirements);
    setCourseCategory(c.category);
    setCourseSlots(c.totalSlots);
    setCourseSchedule(c.schedule);
    setCourseImagePreview(c.imagem_url || '');
  };

  const handleDeleteCourse = (courseId: string, title: string) => {
    showConfirm(
      'Excluir Curso/Oficina',
      `Tem certeza de que deseja remover o curso/oficina "${title}"?`,
      async () => {
        try {
          setError('');
          setSuccess('');
          await courseService.deleteCourse(courseId);
          setSuccess(`Curso/Oficina "${title}" excluído com sucesso.`);
          fetchCourses();
        } catch (err: any) {
          setError(err.message || 'Erro ao excluir curso.');
        }
      }
    );
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const jobData = {
        title: jobTitle,
        company: jobCompany,
        companyEmail: jobCompanyEmail,
        description: jobDescription,
        requirements: jobRequirements,
        salary: jobSalary,
        location: jobLocation,
        type: jobType,
        contact: jobContact,
        imagem_url: jobImagePreview,
        createdAt: new Date().toISOString().split('T')[0]
      };

      if (editingJobId) {
        await jobsService.updateJob(editingJobId, jobData);
        setSuccess('Vaga de emprego atualizada com sucesso!');
        setEditingJobId(null);
      } else {
        await jobsService.addJob(jobData);
        setSuccess('Vaga / Oportunidade publicada no Contrata Vera Cruz!');
      }
      setJobTitle('');
      setJobCompany('');
      setJobCompanyEmail('');
      setJobDescription('');
      setJobRequirements('');
      setJobSalary('');
      setJobLocation('');
      setJobContact('');
      setJobImageFile(null);
      setJobImagePreview('');
      fetchJobs();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar vaga.');
    }
  };

  const handleEditJob = (j: JobVacancy) => {
    setEditingJobId(j.id);
    setJobTitle(j.title);
    setJobCompany(j.company);
    setJobCompanyEmail(j.companyEmail || '');
    setJobDescription(j.description);
    setJobRequirements(j.requirements);
    setJobSalary(j.salary || '');
    setJobLocation(j.location);
    setJobType(j.type);
    setJobContact(j.contact);
    setJobImagePreview(j.imagem_url || '');
  };

  const handleDeleteJob = (id: string, title: string) => {
    showConfirm(
      'Excluir Vaga de Emprego',
      `Tem certeza de que deseja remover a vaga "${title}"?`,
      async () => {
        try {
          setError('');
          setSuccess('');
          await jobsService.deleteJob(id);
          setSuccess(`Vaga "${title}" excluída com sucesso.`);
          fetchJobs();
        } catch (err: any) {
          setError(err.message || 'Erro ao excluir vaga.');
        }
      }
    );
  };

  const handleManualSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!manualSchedName || !manualSchedCpf || !manualSchedPhone || !manualSchedDate || !manualSchedTime || !manualSchedUnitId) {
      setError('Por favor, preencha todos os campos do agendamento presencial.');
      return;
    }

    const unitMap: { [key: string]: string } = {
      'unit-1': 'CRAS Mar Grande',
      'unit-2': 'CRAS Barra do Gil',
      'unit-3': 'Sede SEMPS (Centro)'
    };
    const unitName = unitMap[manualSchedUnitId] || 'CRAS Mar Grande';

    try {
      await schedulesService.addSchedule({
        userId: 'offline-' + Math.random().toString(36).substr(2, 9),
        userName: manualSchedName,
        userCpf: manualSchedCpf,
        userPhone: manualSchedPhone,
        date: manualSchedDate,
        time: manualSchedTime,
        unitId: manualSchedUnitId,
        unitName: unitName,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      });
      setSuccess(`Agendamento presencial para ${manualSchedName} realizado com sucesso!`);
      setManualSchedName('');
      setManualSchedCpf('');
      setManualSchedPhone('');
      setManualSchedDate('');
      setManualSchedTime('');
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar agendamento presencial.');
    }
  };

  const handleManualEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!manualEnrollCourseId || !manualEnrollName || !manualEnrollCpf || !manualEnrollPhone) {
      setError('Por favor, preencha todos os campos para a matrícula presencial.');
      return;
    }

    try {
      const offlineId = `offline:${manualEnrollName} (CPF: ${manualEnrollCpf} • Tel: ${manualEnrollPhone})`;
      const successRegister = await courseService.registerUserInCourse(manualEnrollCourseId, offlineId);
      if (successRegister) {
        setSuccess(`Matrícula presencial de ${manualEnrollName} realizada com sucesso!`);
        setManualEnrollName('');
        setManualEnrollCpf('');
        setManualEnrollPhone('');
        fetchCourses();
      } else {
        setError('Não foi possível realizar a matrícula. Vagas esgotadas ou usuário já inscrito.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar matrícula.');
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!bannerImagePreview) {
      setError('Por favor, informe a URL da imagem para o banner.');
      return;
    }

    try {
      await bannerService.addBanner({
        titulo: bannerTitle,
        imagem_url: bannerImagePreview,
        ordem: Number(bannerOrder) || 0,
        ativo: bannerActive
      });

      setSuccess('Banner adicionado com sucesso!');
      setBannerTitle('');
      setBannerOrder(0);
      setBannerActive(true);
      setBannerImageFile(null);
      setBannerImagePreview('');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar o banner.');
    }
  };

  const handleDeleteBanner = (bannerId: string) => {
    showConfirm(
      'Excluir Banner',
      'Tem certeza de que deseja excluir este banner?',
      async () => {
        setError('');
        setSuccess('');
        try {
          await bannerService.deleteBanner(bannerId);
          setSuccess('Banner excluído com sucesso!');
        } catch (err: any) {
          setError(err.message || 'Erro ao excluir banner.');
        }
      }
    );
  };

  const handleToggleBannerStatus = async (bannerId: string, currentStatus: boolean) => {
    setError('');
    setSuccess('');

    try {
      await bannerService.updateBanner(bannerId, { ativo: !currentStatus });
      setSuccess('Status do banner atualizado!');
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar status do banner.');
    }
  };

  const handleUpdateBannerOrder = async (bannerId: string, currentOrder: number, change: number) => {
    setError('');
    setSuccess('');

    try {
      const newOrder = Math.max(0, currentOrder + change);
      await bannerService.updateBanner(bannerId, { ordem: newOrder });
      setSuccess('Ordem do banner atualizada!');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar ordem do banner.');
    }
  };

  const handlePdfFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Por favor, selecione apenas arquivos em formato PDF.");
      return;
    }

    setPdfFile(file);
    setError("");
    setSuccess("");
    setIsParsingPdf(true);
    setParsedDocText("");

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        try {
          const res = await aiTrainingDocsService.parsePdf(base64String);
          setParsedDocText(res.text);
          setDocTitle(file.name.replace(/\.[^/.]+$/, ""));
          setSuccess("PDF processado e textos extraídos com sucesso! Revise as informações abaixo.");
        } catch (err: any) {
          setError(err.message || "Erro ao processar PDF no servidor.");
        } finally {
          setIsParsingPdf(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setError("Falha ao carregar o arquivo PDF.");
      setIsParsingPdf(false);
    }
  };

  const handleSaveAiDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!docTitle || !parsedDocText) {
      setError("Título e conteúdo do treinamento são obrigatórios.");
      return;
    }

    try {
      await aiTrainingDocsService.add({
        title: docTitle,
        content: parsedDocText,
        active: true
      });
      setSuccess(`Documento "${docTitle}" adicionado ao treinamento da IA com sucesso!`);
      setDocTitle("");
      setParsedDocText("");
      setPdfFile(null);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar treinamento de IA.");
    }
  };

  const handleToggleAiDocActive = async (id: string, currentStatus: boolean) => {
    setError("");
    setSuccess("");
    try {
      await aiTrainingDocsService.update(id, { active: !currentStatus });
      setSuccess("Status do documento de treinamento atualizado!");
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar status do treinamento.");
    }
  };

  const handleDeleteAiDoc = (id: string, title: string) => {
    showConfirm(
      "Excluir Documento de Treinamento",
      `Deseja realmente excluir o documento "${title}"? Ele deixará de ser usado pela IA imediatamente.`,
      async () => {
        setError("");
        setSuccess("");
        try {
          await aiTrainingDocsService.delete(id);
          setSuccess(`Documento "${title}" excluído do treinamento com sucesso.`);
        } catch (err: any) {
          setError(err.message || "Erro ao excluir documento de treinamento.");
        }
      }
    );
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="border-b border-brand-green-light pb-4">
        <h1 className="font-display text-2xl font-bold italic text-brand-green-dark">Painel Administrativo SEMPS</h1>
        <p className="text-xs text-[#5a5a40] font-light mt-1">Controle completo da plataforma digital: gestão de notícias, cursos, agendamentos do CadÚnico, contratações e benefícios.</p>
      </div>

      {/* Admin subtabs navigation */}
      <div className="flex bg-brand-cream border border-brand-green-light p-1.5 rounded-2xl gap-1 overflow-x-auto">
        <button
          onClick={() => { setActiveSubTab('stats'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'stats' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Relatórios & Estatísticas
        </button>

        <button
          onClick={() => { setActiveSubTab('benefits'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'benefits' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
          }`}
        >
          <FileText className="w-4 h-4" /> Atualizar Benefícios
        </button>

        <button
          onClick={() => { setActiveSubTab('schedules'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'schedules' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
          }`}
        >
          <Calendar className="w-4 h-4" /> 
          <span>Agendamentos CadÚnico</span>
          {activeSchedules > 0 && (
            <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded-full font-mono font-black animate-pulse shadow-xs">
              {activeSchedules}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveSubTab('news'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'news' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
          }`}
        >
          <Plus className="w-4 h-4" /> Postar Notícias
        </button>

        <button
          onClick={() => { setActiveSubTab('courses'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'courses' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Criar Cursos
        </button>

        <button
          onClick={() => { setActiveSubTab('jobs'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'jobs' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
          }`}
        >
          <Briefcase className="w-4 h-4" /> 
          <span>Cadastrar Vagas</span>
          {jobsCount > 0 && (
            <span className="bg-teal-600 text-white text-[9px] px-2 py-0.5 rounded-full font-mono font-black shadow-xs">
              {jobsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveSubTab('banners'); setError(''); setSuccess(''); }}
          className={`flex-1 min-w-[110px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'banners' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
          }`}
        >
          <Image className="w-4 h-4" /> Banners do Carrossel
        </button>

        {(user.role === 'admin' || user.role === 'administrador') && (
          <>
            <button
              onClick={() => { setActiveSubTab('sched_models'); setError(''); setSuccess(''); }}
              className={`flex-1 min-w-[125px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'sched_models' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
              }`}
            >
              <Calendar className="w-4 h-4" /> Modelos de Agendamento
            </button>

            <button
              onClick={() => { setActiveSubTab('users_management'); setError(''); setSuccess(''); }}
              className={`flex-1 min-w-[125px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'users_management' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
              }`}
            >
              <Users className="w-4 h-4" /> Gestão de Usuários
            </button>

            <button
              onClick={() => { setActiveSubTab('units_management'); setError(''); setSuccess(''); }}
              className={`flex-1 min-w-[125px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'units_management' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
              }`}
            >
              <Building className="w-4 h-4" /> Gestão de Unidades
            </button>

            <button
              onClick={() => { setActiveSubTab('system_config'); setError(''); setSuccess(''); }}
              className={`flex-1 min-w-[125px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'system_config' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
              }`}
            >
              <Settings className="w-4 h-4" /> Config do Sistema
            </button>

            <button
              onClick={() => { setActiveSubTab('ai_training'); setError(''); setSuccess(''); }}
              className={`flex-1 min-w-[125px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeSubTab === 'ai_training' ? 'bg-white text-brand-green-dark shadow-sm' : 'text-brand-green-dark/70 hover:text-brand-green-dark'
              }`}
            >
              <FileText className="w-4 h-4" /> Treinar IA (PDF)
            </button>
          </>
        )}
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

          {/* PAINEL DE INDICADORES (RECHARTS DASHBOARDS) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-50 pb-4 gap-2">
              <div>
                <h3 className="font-display font-bold text-xs text-brand-green-dark">Painel de Indicadores de Atendimento</h3>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Indicadores em tempo real para agendamentos do CadÚnico e volume de candidaturas em vagas de emprego.</p>
              </div>
              <span className="text-[9px] font-bold text-brand-green bg-brand-green-light/40 px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                Mês Atual: {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart 1: CadÚnico Appointments Daily Trend */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                    📈 Agendamentos de CadÚnico Realizados no Mês
                  </span>
                  <span className="text-[9px] font-semibold text-brand-green-dark bg-brand-cream px-2 py-0.5 rounded border border-brand-green-light/30 font-mono">
                    Total: {processSchedulesForChart().reduce((acc, curr) => acc + curr.Agendamentos, 0)}
                  </span>
                </div>
                <div className="h-[280px] w-full bg-slate-50/50 p-3 rounded-2xl border border-slate-100/80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={processSchedulesForChart()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScheds" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="dia" 
                        stroke="#94a3b8" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        dy={8}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '12px', 
                          fontSize: '11px',
                          color: '#1e293b'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Agendamentos" 
                        stroke="#10b981" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#colorScheds)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Job Candidacies Volume */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-xs text-slate-700 flex items-center gap-1.5">
                    💼 Volume de Candidaturas em Vagas de Emprego
                  </span>
                  <span className="text-[9px] font-semibold text-brand-green-dark bg-brand-cream px-2 py-0.5 rounded border border-brand-green-light/30 font-mono">
                    Total: {processCandidaciesForChart().reduce((acc, curr) => acc + curr.Candidaturas, 0)}
                  </span>
                </div>
                <div className="h-[280px] w-full bg-slate-50/50 p-3 rounded-2xl border border-slate-100/80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processCandidaciesForChart()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="vaga" 
                        stroke="#94a3b8" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        dy={8}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          border: '1px solid #e2e8f0', 
                          borderRadius: '12px', 
                          fontSize: '11px',
                          color: '#1e293b'
                        }} 
                      />
                      <Bar 
                        dataKey="Candidaturas" 
                        fill="#0d9488" 
                        radius={[6, 6, 0, 0]} 
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-fade-in">
          {/* Left Column: Update Citizen Benefits */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="font-display font-bold text-base text-brand-green-dark">Atualizar Benefícios por Cidadão</h2>
              <p className="text-xs text-slate-500 font-light mt-1">Busque o cidadão por seu CPF para gerenciar aprovações de programas locais, Bolsa Família ou auxílios emergenciais.</p>
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
                    <div key={b.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex flex-col gap-4 justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1 flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nome do Benefício</label>
                            <input
                              type="text"
                              value={b.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                setCitizenBenefits(prev => prev.map(item => item.id === b.id ? { ...item, name: newName } : item));
                              }}
                              className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-green"
                            />
                          </div>
                          {b.status !== 'Não Cadastrado' && (
                            <button
                              type="button"
                              onClick={() => {
                                handleBenefitStatusChange(b.id, 'Não Cadastrado');
                                handleBenefitObservationChange(b.id, '');
                                setSuccess(`Benefício "${b.name}" marcado para exclusão. Clique em salvar para confirmar.`);
                              }}
                              className="mt-4 px-2.5 py-1.5 text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition flex items-center gap-1 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir do Cidadão
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Descrição do Benefício</label>
                          <textarea
                            rows={1}
                            value={b.description || ''}
                            onChange={(e) => {
                              const newDesc = e.target.value;
                              setCitizenBenefits(prev => prev.map(item => item.id === b.id ? { ...item, description: newDesc } : item));
                            }}
                            className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs text-slate-600 leading-normal focus:outline-none focus:border-brand-green"
                          />
                        </div>
                      </div>

                      <div className="space-y-3 shrink-0">
                        {/* Status Selector */}
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status do Benefício</label>
                          <select
                            value={b.status}
                            onChange={(e) => handleBenefitStatusChange(b.id, e.target.value as any)}
                            className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs font-bold text-slate-700"
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

          {/* Right Column: Master Benefit Types list and form */}
          {(user.role === 'admin' || user.role === 'administrador' || user.role === 'colaborador') ? (
            <div className="space-y-6">
              {/* Form to Create/Edit Benefit Type */}
              <div id="benefit-type-form" className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div>
                  <h2 className="font-display font-bold text-base text-brand-green-dark">
                    {editingBenefitTypeId ? '✏️ Editar Tipo de Benefício' : '➕ Cadastrar Novo Tipo de Benefício'}
                  </h2>
                  <p className="text-xs text-slate-500 font-light mt-1">
                    Defina os programas sociais municipais ou auxílios governamentais que o município oferece.
                  </p>
                </div>

                <form onSubmit={handleSaveBenefitType} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Benefício *</label>
                    <input
                      type="text"
                      value={benefitTypeName}
                      onChange={(e) => setBenefitTypeName(e.target.value)}
                      placeholder="Ex: Auxílio Cesta Básica Vera Cruz"
                      required
                      className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Descrição Detalhada *</label>
                    <textarea
                      rows={3}
                      value={benefitTypeDescription}
                      onChange={(e) => setBenefitTypeDescription(e.target.value)}
                      placeholder="Descreva as regras, valor, quem tem direito e como solicitar..."
                      required
                      className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50 leading-relaxed focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
                    >
                      {editingBenefitTypeId ? 'Salvar Alterações' : 'Cadastrar Tipo de Benefício'}
                    </button>
                    {editingBenefitTypeId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBenefitTypeId(null);
                          setBenefitTypeName('');
                          setBenefitTypeDescription('');
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-3 rounded-xl transition"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* List of Registered Master Benefit Types */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
                <h2 className="font-display font-bold text-sm text-brand-green-dark border-b border-slate-100 pb-2">
                  Programas e Benefícios Ativos no Sistema
                </h2>

                <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                  {masterBenefitTypes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Nenhum programa de benefício ativo.</p>
                  ) : (
                    masterBenefitTypes.map((item) => (
                      <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-slate-500 font-light mt-0.5 leading-normal">{item.description}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => handleEditBenefitType(item)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBenefitType(item.id, item.name)}
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-4 text-center">
              <div className="bg-amber-50 text-amber-800 p-4 rounded-2xl max-w-xs mx-auto border border-amber-100 flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-600" />
                <span className="font-bold text-xs">Acesso Restrito à Equipe SEMPS</span>
                <p className="text-[10px] text-slate-500 leading-relaxed font-light">
                  Apenas usuários com privilégios de <strong>Administrador ou Colaborador</strong> do sistema SEMPS podem gerenciar, cadastrar, alterar ou remover os tipos de benefícios ativos.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. AGENDAMENTOS CADÚNICO TAB */}
      {activeSubTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* List of Schedules (2 columns) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
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
                          <div className="text-[10px] text-slate-400 font-mono font-normal">
                            {s.userId.startsWith('offline') ? '👤 Presencial ' : '💻 Online '} 
                            • CPF {s.userCpf}
                          </div>
                        </td>
                        <td className="p-3 text-slate-700 font-bold">{s.unitName}</td>
                        <td className="p-3 text-slate-700">
                          <div>{s.date.split('-').reverse().join('/')}</div>
                          <div className="font-mono text-[10px] font-bold text-brand-green">{s.time} h</div>
                        </td>
                        <td className="p-3 font-mono text-slate-500">{s.userPhone}</td>
                        <td className="p-3 flex flex-col items-center justify-center gap-2 pt-4">
                          {/* Status Dropdown */}
                          <select
                            value={s.status}
                            onChange={(e) => handleUpdateScheduleStatus(s.id, e.target.value)}
                            className={`text-[10px] font-bold p-1.5 rounded-lg border focus:outline-none cursor-pointer ${
                              s.status === 'completed' || s.status === 'atendido' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                              s.status === 'cancelled' || s.status === 'cancelado' ? 'bg-red-50 text-red-800 border-red-200' :
                              s.status === 'confirmed' || s.status === 'confirmado' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                              s.status === 'em_atendimento' ? 'bg-indigo-50 text-indigo-800 border-indigo-200 animate-pulse' :
                              s.status === 'aguardando' || s.status === 'scheduled' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                              s.status === 'faltou' ? 'bg-slate-100 text-slate-800 border-slate-300' :
                              'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            <option value="scheduled">Aguardando Confirmação</option>
                            <option value="aguardando">Aguardando Atendimento</option>
                            <option value="confirmed">Confirmado</option>
                            <option value="em_atendimento">Em Atendimento ⚡</option>
                            <option value="completed">Atendido (Finalizado)</option>
                            <option value="faltou">Faltou</option>
                            <option value="cancelled">Cancelado</option>
                            <option value="reagendado">Reagendado</option>
                          </select>

                          {/* Quick Actions */}
                          {s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'faltou' && (
                            <div className="flex gap-1 mt-0.5">
                              {s.status !== 'em_atendimento' ? (
                                <button
                                  onClick={() => handleUpdateScheduleStatus(s.id, 'em_atendimento')}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm transition cursor-pointer"
                                >
                                  Fazer Check-in ⚡
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateScheduleStatus(s.id, 'completed')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm transition animate-pulse cursor-pointer"
                                >
                                  Finalizar Atendimento ✓
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form to Register Schedule Manually (1 column) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-50 pb-2">
              <h2 className="font-display font-bold text-sm text-brand-green-dark">Agendar Presencialmente (Sem Cadastro)</h2>
              <p className="text-[11px] text-slate-500 font-light mt-0.5">Use esta opção para agendar atendimentos de cidadãos pessoalmente na recepção ou por telefone.</p>
            </div>

            <form onSubmit={handleManualSchedule} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={manualSchedName}
                  onChange={(e) => setManualSchedName(e.target.value)}
                  placeholder="Ex: João da Silva Souza"
                  required
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">CPF *</label>
                  <input
                    type="text"
                    value={manualSchedCpf}
                    onChange={(e) => setManualSchedCpf(maskCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Telefone *</label>
                  <input
                    type="text"
                    value={manualSchedPhone}
                    onChange={(e) => setManualSchedPhone(maskPhone(e.target.value))}
                    placeholder="(71) 99999-9999"
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    value={manualSchedDate}
                    onChange={(e) => setManualSchedDate(e.target.value)}
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Horário *</label>
                  <select
                    value={manualSchedTime}
                    onChange={(e) => setManualSchedTime(e.target.value)}
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green font-bold text-slate-700"
                  >
                    <option value="">Selecione...</option>
                    {["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].map(t => (
                      <option key={t} value={t}>{t} h</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Unidade CRAS de Destino *</label>
                <select
                  value={manualSchedUnitId}
                  onChange={(e) => setManualSchedUnitId(e.target.value)}
                  required
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green text-slate-700"
                >
                  <option value="unit-1">CRAS Mar Grande</option>
                  <option value="unit-2">CRAS Barra do Gil</option>
                  <option value="unit-3">Sede SEMPS (Centro)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition cursor-pointer"
              >
                Agendar Atendimento Presencial
              </button>
            </form>
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">URL da Imagem de Capa (Opcional)</label>
              <input
                type="text"
                value={newsImagePreview}
                onChange={(e) => setNewsImagePreview(e.target.value)}
                placeholder="Ex: https://images.unsplash.com/... ou link de imagem pública"
                className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
              />
            </div>

            <button
              type="submit"
              disabled={uploadingImage}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition disabled:bg-slate-300"
            >
              {uploadingImage ? 'Enviando Imagem...' : 'Publicar Comunicado Oficial'}
            </button>
          </form>
        </div>
      )}

      {/* 5. CRIAR CURSOS TAB */}
      {activeSubTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Side: Course Management & Enrolled Students (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h2 className="font-display font-bold text-base text-brand-green-dark border-b border-slate-50 pb-2">Gestão de Matrículas por Curso</h2>
              <p className="text-xs text-slate-500 font-light mt-1">Visualize os cursos disponíveis, vagas restantes e a lista de cidadãos inscritos (com ou sem cadastro digital).</p>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {courses.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Nenhum curso cadastrado ainda.</p>
                ) : (
                  courses.map((c) => {
                    const enrolledCount = c.registeredUsers?.length || 0;
                    const available = c.availableSlots;
                    return (
                      <div key={c.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50 hover:bg-slate-50/70 transition space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <span className="bg-brand-cream border border-brand-green-light text-brand-green-dark text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                              {c.category}
                            </span>
                            <h3 className="font-display font-bold text-xs text-slate-800 mt-1">{c.title}</h3>
                            <p className="text-[10px] text-slate-500 font-light">{c.schedule}</p>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-2">
                            <button
                              onClick={() => handleEditCourse(c)}
                              className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded border border-blue-100 transition"
                              title="Editar Curso"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id, c.title)}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-100 transition"
                              title="Excluir Curso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="text-xs font-bold text-brand-green font-mono">{available} vagas</span>
                            <p className="text-[9px] text-slate-400 font-normal">{enrolledCount} matrículas</p>
                          </div>
                        </div>

                        {/* List of enrolled users */}
                        <div className="bg-white rounded-xl border border-slate-100 p-3 space-y-2">
                          <h4 className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                            👥 Cidadãos Matriculados nesta Oficina:
                          </h4>
                          {c.registeredUsers && c.registeredUsers.length > 0 ? (
                            <ul className="space-y-1.5 divide-y divide-slate-50">
                              {c.registeredUsers.map((regUser, index) => {
                                const isOffline = regUser.startsWith('offline:');
                                const displayName = isOffline 
                                  ? regUser.replace('offline:', '') 
                                  : regUser === 'user-citizen' 
                                    ? 'Maria das Graças Souza (CPF: 123.456.789-00 • Tel: (71) 98888-2222)'
                                    : `Cidadão Cadastrado (${regUser})`;

                                return (
                                  <li key={index} className="text-[10px] text-slate-700 font-medium pt-1.5 first:pt-0 flex items-center justify-between">
                                    <span className="truncate pr-2">
                                      {isOffline ? '👤 ' : '💻 '} {displayName}
                                    </span>
                                    <span className="bg-slate-100 text-slate-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                                      {isOffline ? 'Presencial' : 'Online'}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">Nenhum cidadão matriculado neste curso ainda.</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Side: Manual Enrollment Form & Create New Course (1 column) */}
          <div className="space-y-6">
            {/* Form: Matricular Manualmente */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-2">
                <h2 className="font-display font-bold text-sm text-brand-green-dark">Matricular Cidadão Manualmente</h2>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">Matricule pessoas diretamente nos cursos e oficinas municipais (especialmente idosos ou quem não tem internet).</p>
              </div>

              <form onSubmit={handleManualEnroll} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Selecionar Curso / Oficina *</label>
                  <select
                    value={manualEnrollCourseId}
                    onChange={(e) => setManualEnrollCourseId(e.target.value)}
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green text-slate-700 font-medium"
                  >
                    <option value="">Selecione o Curso...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id} disabled={c.availableSlots <= 0}>
                        {c.title} ({c.availableSlots} vagas restantes)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Nome Completo do Aluno *</label>
                  <input
                    type="text"
                    value={manualEnrollName}
                    onChange={(e) => setManualEnrollName(e.target.value)}
                    placeholder="Ex: Maria José de Oliveira"
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">CPF *</label>
                    <input
                      type="text"
                      value={manualEnrollCpf}
                      onChange={(e) => setManualEnrollCpf(maskCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      required
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Telefone *</label>
                    <input
                      type="text"
                      value={manualEnrollPhone}
                      onChange={(e) => setManualEnrollPhone(maskPhone(e.target.value))}
                      placeholder="(71) 99999-9999"
                      required
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition cursor-pointer"
                >
                  Confirmar Matrícula Presencial
                </button>
              </form>
            </div>

            {/* Form: Criar Novo Curso (Original Form) */}
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-50 pb-2">
                <h2 className="font-display font-bold text-sm text-brand-green-dark">
                  {editingCourseId ? '✏️ Editar Curso / Oficina' : 'Cadastrar Novo Curso de Capacitação'}
                </h2>
                <p className="text-[11px] text-slate-500 font-light mt-0.5">
                  {editingCourseId ? 'Altere as informações abaixo e clique em salvar.' : 'Adicione novas opções de oficinas de geração de renda ou capacitação para o município.'}
                </p>
              </div>

              <form onSubmit={handleCreateCourse} className="space-y-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Nome do Curso / Oficina *</label>
                  <input
                    type="text"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="Ex: Curso de Eletricista de Manutenção Comercial"
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Categoria *</label>
                    <input
                      type="text"
                      value={courseCategory}
                      onChange={(e) => setCourseCategory(e.target.value)}
                      placeholder="Inclusão Digital, Geração de Renda..."
                      required
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Total de Vagas *</label>
                    <input
                      type="number"
                      value={courseSlots}
                      onChange={(e) => setCourseSlots(Number(e.target.value))}
                      required
                      min={1}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Cronograma / Dias e Horários *</label>
                  <input
                    type="text"
                    value={courseSchedule}
                    onChange={(e) => setCourseSchedule(e.target.value)}
                    placeholder="Ex: Terças e Quintas, 14h às 16h"
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Descrição do Curso *</label>
                  <textarea
                    rows={2}
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Descreva resumidamente o que o aluno aprenderá..."
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Requisitos Mínimos *</label>
                  <textarea
                    rows={2}
                    value={courseRequirements}
                    onChange={(e) => setCourseRequirements(e.target.value)}
                    placeholder="Ex: Estar inscrito no CadÚnico com NIS ativo, idade mínima 16 anos."
                    required
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">URL da Imagem de Capa (Opcional)</label>
                  <input
                    type="text"
                    value={courseImagePreview}
                    onChange={(e) => setCourseImagePreview(e.target.value)}
                    placeholder="Ex: https://images.unsplash.com/... ou link de imagem pública"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={uploadingImage}
                    className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition cursor-pointer disabled:bg-slate-300"
                  >
                    {uploadingImage ? 'Enviando Imagem...' : editingCourseId ? 'Salvar Alterações' : 'Criar Curso / Oficina'}
                  </button>
                  {editingCourseId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCourseId(null);
                        setCourseTitle('');
                        setCourseDescription('');
                        setCourseRequirements('');
                        setCourseCategory('');
                        setCourseSchedule('');
                        setCourseImageFile(null);
                        setCourseImagePreview('');
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-3 rounded-xl transition"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. CADASTRAR VAGA CONTRATA VERA CRUZ TAB */}
      {activeSubTab === 'jobs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
          {/* Left: Form (2 columns) */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-50 pb-2">
              <h2 className="font-display font-bold text-base text-brand-green-dark">
                {editingJobId ? '✏️ Editar Oportunidade de Trabalho' : 'Publicar Vaga no Contrata Vera Cruz'}
              </h2>
              <p className="text-[11px] text-slate-500 font-light mt-0.5">
                {editingJobId ? 'Altere as informações abaixo e salve as atualizações.' : 'Divulgue novas oportunidades de emprego para os trabalhadores locais.'}
              </p>
            </div>

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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail da Empresa (Para Recebimento de Currículos) *</label>
                <input
                  type="email"
                  value={jobCompanyEmail}
                  onChange={(e) => setJobCompanyEmail(e.target.value)}
                  placeholder="rh@empresa.com"
                  required
                  className="w-full border border-slate-200 p-3 rounded-xl text-xs bg-slate-50"
                />
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL da Imagem / Flyer da Vaga (Opcional)</label>
                <input
                  type="text"
                  value={jobImagePreview}
                  onChange={(e) => setJobImagePreview(e.target.value)}
                  placeholder="Ex: https://images.unsplash.com/... ou link de imagem pública"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploadingImage}
                  className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition disabled:bg-slate-300"
                >
                  {uploadingImage ? 'Enviando Imagem...' : editingJobId ? 'Salvar Alterações' : 'Publicar Oportunidade'}
                </button>
                {editingJobId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingJobId(null);
                      setJobTitle('');
                      setJobCompany('');
                      setJobCompanyEmail('');
                      setJobDescription('');
                      setJobRequirements('');
                      setJobSalary('');
                      setJobLocation('');
                      setJobContact('');
                      setJobImageFile(null);
                      setJobImagePreview('');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-3 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right: Job List (1 column layout) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h2 className="font-display font-bold text-base text-brand-green-dark">Vagas Publicadas ({jobs.length})</h2>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Sincronizado via Firestore
                </div>
              </div>

              <div className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
                {jobs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">Nenhuma vaga cadastrada no Contrata Vera Cruz.</p>
                ) : (
                  jobs.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between gap-3 hover:shadow-sm transition">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">{item.title}</span>
                          <span className="text-[9px] bg-brand-cream border border-brand-green-light text-brand-green-dark px-2 py-0.5 rounded-full font-bold uppercase shrink-0">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-semibold">{item.company} {item.companyEmail ? `(📧 ${item.companyEmail})` : ''}</p>
                        <p className="text-[10px] text-slate-500">📍 {item.location} {item.salary ? `| 💵 ${item.salary}` : ''}</p>
                        <p className="text-[11px] text-slate-600 font-light mt-1.5 line-clamp-3 leading-relaxed">{item.description}</p>
                      </div>

                      <div className="flex gap-1.5 justify-end mt-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleEditJob(item)}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteJob(item.id, item.title)}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. BANNERS DO CARROSSEL TAB */}
      {activeSubTab === 'banners' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
          {/* Left: Create banner form (1 column) */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-50 pb-2">
              <h2 className="font-display font-bold text-sm text-brand-green-dark">Adicionar Banner de Carrossel</h2>
              <p className="text-[11px] text-[#5a5a40] font-light mt-0.5">
                Publique anúncios dinâmicos e campanhas diretamente na seção principal da Landing Page.
              </p>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Título do Banner (Opcional)</label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="Ex: Força-Tarefa: Atualize seu CadÚnico!"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Ordem de Exibição *</label>
                  <input
                    type="number"
                    value={bannerOrder}
                    onChange={(e) => setBannerOrder(Number(e.target.value))}
                    required
                    min={0}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="banner-active"
                    checked={bannerActive}
                    onChange={(e) => setBannerActive(e.target.checked)}
                    className="h-4 w-4 text-brand-green rounded border-slate-300"
                  />
                  <label htmlFor="banner-active" className="text-[11px] text-slate-700 font-bold">Banner Ativo</label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">URL da Imagem do Banner *</label>
                <input
                  type="text"
                  required
                  value={bannerImagePreview}
                  onChange={(e) => setBannerImagePreview(e.target.value)}
                  placeholder="Ex: https://images.unsplash.com/... ou link de imagem pública"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition"
              >
                Cadastrar Banner
              </button>
            </form>
          </div>

          {/* Right: Existing Banners List (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h2 className="font-display font-bold text-base text-brand-green-dark border-b border-slate-50 pb-2">Banners Cadastrados</h2>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {banners.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">Nenhum banner cadastrado no sistema.</p>
                ) : (
                  [...banners].sort((a, b) => a.ordem - b.ordem).map((b) => (
                    <div key={b.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50 hover:bg-slate-50/70 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-14 rounded-lg overflow-hidden bg-slate-200 border shrink-0">
                          <img src={b.imagem_url} alt={b.titulo || "Banner"} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs text-slate-800">{b.titulo || "Sem título (Apenas Imagem)"}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${b.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                              {b.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">Ordem: {b.ordem}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleBannerStatus(b.id, !!b.ativo)}
                          className={`p-2 rounded-xl text-[11px] font-bold border flex items-center gap-1 cursor-pointer transition ${
                            b.ativo 
                              ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700' 
                              : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700'
                          }`}
                          title={b.ativo ? "Desativar Banner" : "Ativar Banner"}
                        >
                          {b.ativo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{b.ativo ? 'Desativar' : 'Ativar'}</span>
                        </button>

                        {/* Order adjustment buttons */}
                        <div className="flex border rounded-xl overflow-hidden bg-white">
                          <button
                            onClick={() => handleUpdateBannerOrder(b.id, b.ordem, -1)}
                            className="px-2.5 py-1.5 hover:bg-slate-100 text-xs font-bold text-slate-600"
                            title="Subir Ordem"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleUpdateBannerOrder(b.id, b.ordem, 1)}
                            className="px-2.5 py-1.5 hover:bg-slate-100 text-xs font-bold text-slate-600"
                            title="Descer Ordem"
                          >
                            +
                          </button>
                        </div>

                        {/* Delete Button */}
                        {(user?.role === 'admin' || user?.role === 'administrador') && (
                          <button
                            onClick={() => handleDeleteBanner(b.id)}
                            className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl cursor-pointer transition"
                            title="Excluir Banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODELOS DE AGENDAMENTO TAB */}
      {activeSubTab === 'sched_models' && (user.role === 'admin' || user.role === 'administrador') && (
        <div id="model-form-container" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
          {/* Left: Create/Edit model form (1 column) */}
          <div className="bg-white rounded-3xl border border-brand-green-light/40 p-6 shadow-sm space-y-4">
            <div className="border-b border-brand-green-light/40 pb-2">
              <h2 className="font-display font-bold text-sm text-brand-green-dark">
                {editingModelId ? 'Editar Modelo de Agendamento' : 'Cadastrar Novo Modelo de Agendamento'}
              </h2>
              <p className="text-[11px] text-[#5a5a40] font-light mt-0.5">
                Defina o tipo de serviço, local, dias da semana e horários disponíveis para agendamentos.
              </p>
            </div>

            <form onSubmit={handleSaveModel} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Ex: Atualização CadÚnico, Benefício de Prestação Continuada"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Tipo de Serviço *</label>
                  <select
                    value={modelServiceType}
                    onChange={(e) => setModelServiceType(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  >
                    <option value="CadÚnico">CadÚnico</option>
                    <option value="Benefício Social">Benefício Social</option>
                    <option value="Apoio Jurídico">Apoio Jurídico</option>
                    <option value="Atendimento Técnico">Atendimento Técnico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Unidade SEMPS *</label>
                  <select
                    value={modelUnitId}
                    onChange={(e) => {
                      const uId = e.target.value;
                      setModelUnitId(uId);
                      if (uId === 'unit-1') setModelLocation('CRAS Mar Grande');
                      else if (uId === 'unit-2') setModelLocation('CRAS Barra do Gil');
                      else setModelLocation('Sede SEMPS');
                    }}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  >
                    <option value="unit-1">CRAS Mar Grande</option>
                    <option value="unit-2">CRAS Barra do Gil</option>
                    <option value="unit-3">Sede SEMPS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Dias de Atendimento (Selecione os dias) *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day) => {
                    const checked = modelDays.includes(day);
                    return (
                      <label key={day} className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) {
                              setModelDays(prev => prev.filter(d => d !== day));
                            } else {
                              setModelDays(prev => [...prev, day]);
                            }
                          }}
                          className="h-3.5 w-3.5 text-brand-green rounded border-slate-300"
                        />
                        <span>{day}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Horários de Atendimento (Selecione ou remova) *</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                  {[
                    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
                  ].map((hour) => {
                    const included = modelHours.includes(hour);
                    return (
                      <button
                        type="button"
                        key={hour}
                        onClick={() => {
                          if (included) {
                            setModelHours(prev => prev.filter(h => h !== hour));
                          } else {
                            setModelHours(prev => [...prev, hour].sort());
                          }
                        }}
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold border transition ${
                          included 
                            ? 'bg-brand-green text-white border-brand-green' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {hour}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Descrição do Serviço</label>
                <textarea
                  rows={2}
                  value={modelDescription}
                  onChange={(e) => setModelDescription(e.target.value)}
                  placeholder="Explique brevemente o objetivo e público deste agendamento..."
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Cor de Identificação</label>
                  <select
                    value={modelColor}
                    onChange={(e) => setModelColor(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  >
                    <option value="emerald">Verde Esmeralda</option>
                    <option value="blue">Azul</option>
                    <option value="orange">Laranja</option>
                    <option value="purple">Roxo</option>
                    <option value="rose">Rosa / Vermelho</option>
                    <option value="amber">Amarelo / Âmbar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Ícone</label>
                  <select
                    value={modelIcon}
                    onChange={(e) => setModelIcon(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  >
                    <option value="Calendar">Calendário</option>
                    <option value="FileText">Documento</option>
                    <option value="Users">Social / Família</option>
                    <option value="GraduationCap">Educação</option>
                    <option value="Briefcase">Profissional / Emprego</option>
                    <option value="Heart">Apoio / Saúde</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-700 mb-1">Intervalo (Min) *</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={modelInterval}
                    onChange={(e) => setModelInterval(Number(e.target.value))}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-700 mb-1">Vagas / Horário *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={modelSlotsPerTime}
                    onChange={(e) => setModelSlotsPerTime(Number(e.target.value))}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-700 mb-1">Max Diário *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={modelMaxDaily}
                    onChange={(e) => setModelMaxDaily(Number(e.target.value))}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Necessita Documentação?</label>
                <select
                  value={modelRequiresDocs ? 'Sim' : 'Não'}
                  onChange={(e) => setModelRequiresDocs(e.target.value === 'Sim')}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              {modelRequiresDocs && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Documentos Obrigatórios (Separados por vírgula)</label>
                  <input
                    type="text"
                    value={modelRequiredDocsText}
                    onChange={(e) => setModelRequiredDocsText(e.target.value)}
                    placeholder="Ex: RG, CPF, Comprovante de Residência, NIS"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Status do Modelo</label>
                <select
                  value={modelActive ? 'Ativo' : 'Inativo'}
                  onChange={(e) => setModelActive(e.target.value === 'Ativo')}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green font-bold"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition"
                >
                  {editingModelId ? 'Atualizar Modelo' : 'Cadastrar Modelo'}
                </button>
                {editingModelId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingModelId(null);
                      setModelName('');
                      setModelServiceType('CadÚnico');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 px-4 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right: Existing Models List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <h2 className="font-display font-bold text-base text-brand-green-dark border-b border-slate-50 pb-2">Modelos de Agendamento Ativos</h2>
              
              <div className="space-y-3">
                {schedulingModels.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">Nenhum modelo de agendamento cadastrado no sistema.</p>
                ) : (
                  schedulingModels.map((m) => (
                    <div key={m.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-xs text-slate-800">{m.name}</h4>
                          <span className="text-[9px] font-bold bg-brand-green-light/40 text-brand-green-dark px-2 py-0.5 rounded-full">
                            {m.serviceType}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          📍 Local: <strong>{m.location}</strong>
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                          📅 Dias: <strong>{m.days.join(', ')}</strong>
                        </p>
                        {m.description && (
                          <p className="text-[10px] text-[#5a5a40] italic font-medium bg-[#f5f5dc] px-2 py-1.5 rounded-lg border border-[#e6e6be] my-1">
                            {m.description}
                          </p>
                        )}
                        <p className="text-[9px] text-slate-500 font-mono mt-1">
                          ⏱️ Intervalo: <strong>{m.interval}m</strong> | Vagas/Horário: <strong>{m.slotsPerTime}</strong> | Max Diário: <strong>{m.maxDaily}</strong> | Status: <strong className={m.active ? "text-emerald-600" : "text-red-500"}>{m.active ? "ATIVO" : "INATIVO"}</strong>
                        </p>
                        {m.requiresDocs && m.requiredDocsList && m.requiredDocsList.length > 0 && (
                          <div className="text-[9px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 mt-1.5">
                            <strong>📄 Documentos Obrigatórios:</strong> {m.requiredDocsList.join(', ')}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 font-medium flex flex-wrap gap-1 items-center mt-2">
                          ⏰ Horários: {m.hours.map(h => (
                            <span key={h} className="bg-slate-200/60 text-slate-700 text-[9px] px-1.5 py-0.5 rounded">
                              {h}
                            </span>
                          ))}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 w-full md:w-auto justify-end">
                        <button
                          onClick={() => handleEditModel(m)}
                          className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl cursor-pointer transition flex items-center gap-1 text-[11px] font-bold"
                          title="Editar Modelo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleDeleteModel(m.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl cursor-pointer transition"
                          title="Excluir Modelo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. CONFIGURAÇÕES DO SISTEMA SUBTAB */}
      {activeSubTab === 'system_config' && (user.role === 'admin' || user.role === 'administrador') && (
        <div className="space-y-8 animate-fade-in text-xs text-slate-700">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Column: General Settings Form */}
            <div className="bg-white rounded-3xl border border-brand-green-light/40 p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 pb-2 flex items-center gap-2 text-brand-green-dark">
                <Settings className="w-5 h-5 text-brand-green" />
                <h2 className="font-display font-bold text-sm">Parâmetros Operacionais & Horários</h2>
              </div>

              <form onSubmit={handleSaveSystemConfig} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Horário de Funcionamento da Secretaria *</label>
                  <input
                    type="text"
                    required
                    value={configSecHours}
                    onChange={(e) => setConfigSecHours(e.target.value)}
                    placeholder="Ex: 08:00 - 17:00"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Aviso Prévio Mínimo (Horas) *</label>
                    <input
                      type="number"
                      required
                      value={configMinNotice}
                      onChange={(e) => setConfigMinNotice(Number(e.target.value))}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">Tempo mínimo de antecedência para agendar.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Prazo Limite Cancelamento (Horas) *</label>
                    <input
                      type="number"
                      required
                      value={configMaxCancel}
                      onChange={(e) => setConfigMaxCancel(Number(e.target.value))}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none"
                    />
                    <p className="text-[9px] text-slate-400 mt-0.5">Tempo máximo de antecedência para cancelar.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Mensagem da Página Inicial *</label>
                  <textarea
                    rows={3}
                    required
                    value={configLandingMsg}
                    onChange={(e) => setConfigLandingMsg(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green resize-none"
                  />
                </div>

                {/* Days of operation */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Dias Úteis de Atendimento *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day) => {
                      const isChecked = configDays.includes(day);
                      return (
                        <label key={day} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 cursor-pointer text-[11px] font-medium transition select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setConfigDays(configDays.filter(d => d !== day));
                              } else {
                                setConfigDays([...configDays, day]);
                              }
                            }}
                            className="w-4 h-4 text-brand-green border-slate-300 rounded"
                          />
                          <span>{day}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition"
                >
                  Salvar Parâmetros do Sistema
                </button>
              </form>
            </div>

            {/* Right Column: Campaigns, Holidays and Blocked Dates */}
            <div className="space-y-6">
              
              {/* Send System Notification Campaign */}
              <div className="bg-white rounded-3xl border border-brand-green-light/40 p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-2 flex items-center gap-2 text-brand-green-dark">
                  <Megaphone className="w-5 h-5 text-brand-green" />
                  <h2 className="font-display font-bold text-sm">Criar Campanhas & Avisos aos Usuários</h2>
                </div>

                <form onSubmit={handleSendCampaign} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Título do Aviso *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Campanha do Agasalho 2026"
                      value={campaignTitle}
                      onChange={(e) => setCampaignTitle(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Conteúdo da Notificação *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Escreva a mensagem que os usuários receberão em suas barras de notificações."
                      value={campaignMessage}
                      onChange={(e) => setCampaignMessage(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Perfil do Destinatário (Segmentação) *</label>
                    <select
                      value={campaignTarget}
                      onChange={(e) => setCampaignTarget(e.target.value as any)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                    >
                      <option value="all">Todos os usuários cadastrados (Público Geral)</option>
                      <option value="cidadao">Cidadãos (Cidadaos)</option>
                      <option value="colaborador">Apenas Colaboradores</option>
                      <option value="administrador">Apenas Administradores</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition"
                  >
                    Enviar Comunicado de Alerta
                  </button>
                </form>
              </div>

              {/* Holidays and Blocked Dates Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Municipal Holidays */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-3">
                  <h3 className="font-display font-bold text-brand-green-dark text-xs flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                    <Calendar className="w-4 h-4 text-brand-green" /> Feriados Municipais
                  </h3>
                  
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newHoliday}
                      onChange={(e) => setNewHoliday(e.target.value)}
                      className="border border-slate-200 p-2 rounded-lg text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddHoliday}
                      className="bg-brand-green hover:bg-brand-green-dark text-white px-3.5 py-2 rounded-lg font-bold transition text-xs"
                    >
                      Add
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {(sysConfig?.municipalHolidays || []).length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4">Sem feriados registrados.</p>
                    ) : (
                      sysConfig?.municipalHolidays.map((hDate) => (
                        <div key={hDate} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-2 rounded-xl text-[11px]">
                          <span className="font-mono font-bold text-slate-700">
                            {new Date(hDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHoliday(hDate)}
                            className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded transition"
                          >
                            ✖
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Secretarial Blocked Dates */}
                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-3">
                  <h3 className="font-display font-bold text-brand-green-dark text-xs flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                    <XCircle className="w-4 h-4 text-brand-green" /> Datas Bloqueadas (Vera Cruz)
                  </h3>
                  
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newBlockedDate}
                      onChange={(e) => setNewBlockedDate(e.target.value)}
                      className="border border-slate-200 p-2 rounded-lg text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleAddBlockedDate}
                      className="bg-brand-green hover:bg-brand-green-dark text-white px-3.5 py-2 rounded-lg font-bold transition text-xs"
                    >
                      Bloquear
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {(sysConfig?.blockedDates || []).length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-4">Nenhuma data bloqueada.</p>
                    ) : (
                      sysConfig?.blockedDates.map((bDate) => (
                        <div key={bDate} className="flex justify-between items-center bg-red-50/60 border border-red-100 p-2 rounded-xl text-[11px]">
                          <span className="font-mono font-bold text-slate-700">
                            {new Date(bDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlockedDate(bDate)}
                            className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded transition"
                          >
                            ✖
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>
      )}
      {activeSubTab === 'users_management' && (user.role === 'admin' || user.role === 'administrador') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
          {/* Left: Register user form (1 column) */}
          <div className="bg-white rounded-3xl border border-brand-green-light/40 p-6 shadow-sm space-y-4">
            <div className="border-b border-brand-green-light/40 pb-2">
              <h2 className="font-display font-bold text-sm text-brand-green-dark">
                {editingUserId ? '✏️ Editar Usuário' : '➕ Cadastrar Novo Usuário'}
              </h2>
              <p className="text-[11px] text-[#5a5a40] font-light mt-0.5">
                {editingUserId ? 'Modifique os dados do perfil do usuário e clique em salvar.' : 'Registre cidadãos, colaboradores ou novos administradores diretamente no sistema.'}
              </p>
            </div>

            <form onSubmit={handleRegisterUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nome do usuário"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    value={newUserCpf}
                    onChange={(e) => setNewUserCpf(maskCpf(e.target.value))}
                    maxLength={14}
                    placeholder="000.000.000-00"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Senha Provisória *</label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Min. 6 caracteres"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Telefone (Opcional)</label>
                  <input
                    type="text"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(maskPhone(e.target.value))}
                    placeholder="(71) 90000-0000"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Nível de Acesso / Tipo *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                  >
                    <option value="cidadao">Cidadão (Cidadao)</option>
                    <option value="colaborador">Colaborador (Colaborador)</option>
                    <option value="administrador">Administrador (Admin)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Número NIS (Opcional)</label>
                <input
                  type="text"
                  value={newUserNis}
                  onChange={(e) => setNewUserNis(maskNis(e.target.value))}
                  placeholder="000.00000.00-0"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Endereço Completo (Opcional)</label>
                <textarea
                  value={newUserAddress}
                  onChange={(e) => setNewUserAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro, Vera Cruz - BA"
                  rows={2}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition"
                >
                  {editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                </button>
                {editingUserId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUserId(null);
                      setNewUserName('');
                      setNewUserEmail('');
                      setNewUserPassword('');
                      setNewUserCpf('');
                      setNewUserPhone('');
                      setNewUserAddress('');
                      setNewUserNis('');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right: Existing Users List with Search */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h2 className="font-display font-bold text-base text-brand-green-dark">Usuários do Sistema ({usersList.length})</h2>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Sincronizado via Firestore
                </div>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {usersList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">Nenhum usuário cadastrado no sistema.</p>
                ) : (
                  usersList.map((u) => (
                    <div key={u.id} className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-xs text-slate-800">{u.name}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            u.role === 'admin' || u.role === 'administrador'
                              ? 'bg-red-100 text-red-800'
                              : u.role === 'colaborador'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {u.role === 'admin' || u.role === 'administrador'
                              ? 'Administrador'
                              : u.role === 'colaborador'
                              ? 'Colaborador'
                              : 'Cidadão'}
                          </span>

                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            u.active !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {u.active !== false ? 'Ativo' : 'Bloqueado'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono">
                          📧 {u.email} | 💳 CPF: {u.cpf}
                        </p>
                        {u.phone && (
                          <p className="text-[10px] text-slate-500 font-medium">
                            📞 {u.phone} {u.nis ? `| 📋 NIS: ${u.nis}` : ''}
                          </p>
                        )}
                        {u.address && (
                          <p className="text-[10px] text-slate-400 italic">
                            🏠 {u.address}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 w-full md:w-auto justify-end flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleEditUser(u)}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleUserActive(u.id, u.active !== false)}
                          className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg border transition ${
                            u.active !== false 
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {u.active !== false ? 'Desativar' : 'Reativar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetUserPassword(u.id)}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg transition"
                        >
                          Resetar Senha
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'units_management' && (user.role === 'admin' || user.role === 'administrador') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
          {/* Left: Create/Edit Unit Form (1 column) */}
          <div className="bg-white rounded-3xl border border-brand-green-light/40 p-6 shadow-sm space-y-4">
            <div className="border-b border-brand-green-light/40 pb-2">
              <h2 className="font-display font-bold text-sm text-brand-green-dark">
                {editingUnitId ? '✏️ Editar Unidade SEMPS' : '➕ Cadastrar Nova Unidade SEMPS'}
              </h2>
              <p className="text-[11px] text-[#5a5a40] font-light mt-0.5">
                Gerencie unidades físicas como CRAS, CREAS e sedes administrativas da Secretaria.
              </p>
            </div>

            <form onSubmit={handleSaveUnit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Nome da Unidade *</label>
                <input
                  type="text"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  placeholder="Ex: CRAS Vera Cruz Centro"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Endereço Completo *</label>
                <input
                  type="text"
                  required
                  value={unitAddress}
                  onChange={(e) => setUnitAddress(e.target.value)}
                  placeholder="Ex: Av. Salvador, nº 100, Centro"
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Telefone *</label>
                  <input
                    type="text"
                    required
                    value={unitPhone}
                    onChange={(e) => setUnitPhone(maskPhone(e.target.value))}
                    placeholder="(71) 00000-0000"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Funcionamento *</label>
                  <input
                    type="text"
                    required
                    value={unitHours}
                    onChange={(e) => setUnitHours(e.target.value)}
                    placeholder="Ex: 08:00 às 14:00"
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Serviços Oferecidos (Um por linha)</label>
                <textarea
                  value={unitServicesText}
                  onChange={(e) => setUnitServicesText(e.target.value)}
                  placeholder="Cadastro Único&#10;Atendimento Psicológico&#10;Oficinas do PAIF"
                  rows={4}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Link de endereço do Google Maps</label>
                <input
                  type="text"
                  value={unitMapsUrl}
                  onChange={(e) => setUnitMapsUrl(e.target.value)}
                  placeholder="Ex: https://maps.app.goo.gl/..."
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition"
                >
                  {editingUnitId ? 'Salvar Alterações' : 'Cadastrar Unidade'}
                </button>
                {editingUnitId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUnitId(null);
                      setUnitName('');
                      setUnitAddress('');
                      setUnitPhone('');
                      setUnitHours('');
                      setUnitServicesText('');
                      setUnitLat(-12.9714);
                      setUnitLng(-38.5014);
                      setUnitMapsUrl('');
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right: Units List (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <h2 className="font-display font-bold text-base text-brand-green-dark">Unidades Cadastradas ({unitsList.length})</h2>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Sincronizado via Firestore
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {unitsList.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-12">Nenhuma unidade SEMPS cadastrada.</p>
                ) : (
                  unitsList.map((item) => (
                    <div key={item.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{item.name}</span>
                          <span className="text-[9px] font-mono bg-brand-green/15 text-brand-green-dark px-1.5 py-0.5 rounded-md font-bold">
                            🌐 Lat: {item.lat.toFixed(4)} | Lng: {item.lng.toFixed(4)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          📍 <strong>Endereço:</strong> {item.address}
                        </p>
                        <p className="text-[11px] text-slate-600 leading-normal">
                          📞 <strong>Telefone:</strong> {item.phone} | 🕒 <strong>Horário:</strong> {item.hours}
                        </p>
                        {item.services && item.services.length > 0 && (
                          <div className="pt-1.5 flex flex-wrap gap-1">
                            {item.services.map((svc, sIdx) => (
                              <span key={sIdx} className="text-[9px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                                • {svc}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 w-full md:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleEditUnit(item)}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(item.id, item.name)}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'ai_training' && (user.role === 'admin' || user.role === 'administrador') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in text-xs text-slate-700">
          
          {/* Left Column: Upload & Extract Form (1 column) */}
          <div className="bg-white rounded-3xl border border-brand-green-light/40 p-6 shadow-sm space-y-5">
            <div className="border-b border-brand-green-light/40 pb-2 flex items-center gap-2 text-brand-green-dark">
              <FileText className="w-5 h-5 text-brand-green" />
              <div>
                <h2 className="font-display font-bold text-sm">Carregar PDF de Treinamento</h2>
                <p className="text-[11px] text-[#5a5a40] font-light mt-0.5">
                  Envie documentos oficiais para treinar a Inteligência Artificial com regras atualizadas.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-2">Arquivo PDF (.pdf)</label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-brand-green rounded-2xl p-6 text-center transition bg-slate-50 cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isParsingPdf}
                  />
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto animate-pulse" />
                    <p className="text-xs font-medium text-slate-600">
                      {pdfFile ? pdfFile.name : "Clique para selecionar ou arraste o PDF"}
                    </p>
                    <p className="text-[10px] text-slate-400 font-light">
                      Apenas arquivos PDF são aceitos
                    </p>
                  </div>
                </div>
              </div>

              {isParsingPdf && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-blue-700">
                    <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                    <span className="font-bold text-xs">Analisando e extraindo textos do PDF...</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-light">
                    Isso pode levar alguns segundos dependendo do tamanho do documento.
                  </p>
                </div>
              )}

              {parsedDocText && !isParsingPdf && (
                <form onSubmit={handleSaveAiDoc} className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Título do Documento *</label>
                    <input
                      type="text"
                      required
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="Ex: Regulamento do Auxílio Vera Cruz"
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Conteúdo Extraído (Revise e edite se necessário) *</label>
                    <textarea
                      required
                      value={parsedDocText}
                      onChange={(e) => setParsedDocText(e.target.value)}
                      rows={12}
                      className="w-full border border-slate-200 p-3 rounded-2xl text-xs bg-slate-50 focus:outline-none focus:border-brand-green resize-none font-mono leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Salvar no Banco de Treinamento
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Active Documents List (2 columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <div>
                  <h2 className="font-display font-bold text-base text-brand-green-dark">Banco de Treinamento da IA</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">Estes documentos alimentam as respostas do assistente virtual em tempo real.</p>
                </div>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full shrink-0 font-bold">
                  {aiDocs.length} Documento(s)
                </div>
              </div>

              <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1">
                {aiDocs.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400">Nenhum documento de treinamento cadastrado.</p>
                    <p className="text-[10px] text-slate-400 font-light max-w-xs mx-auto">
                      Carregue um arquivo PDF à esquerda para iniciar o treinamento do assistente virtual.
                    </p>
                  </div>
                ) : (
                  aiDocs.map((doc) => (
                    <div key={doc.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3 hover:shadow-xs transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-display font-bold text-xs text-slate-800 flex items-center gap-2">
                            📄 {doc.title}
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Adicionado em {new Date(doc.createdAt).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleAiDocActive(doc.id, doc.active)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition ${
                              doc.active 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {doc.active ? 'Ativo na IA' : 'Pausado'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteAiDoc(doc.id, doc.title)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-100"
                            title="Remover documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-slate-100 max-h-[120px] overflow-y-auto">
                        <p className="text-[11px] text-slate-500 whitespace-pre-wrap leading-relaxed font-mono">
                          {doc.content.length > 300 ? `${doc.content.substring(0, 300)}...` : doc.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}
      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 space-y-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
              confirmModal.confirmStyle === 'danger' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
            }`}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-display font-bold text-base text-slate-800">{confirmModal.title}</h3>
              <p className="text-xs text-slate-500 font-light leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-3 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmModal(prev => ({ ...prev, isOpen: false }));
                  await confirmModal.onConfirm();
                }}
                className={`flex-1 text-white text-xs font-bold py-3 rounded-xl shadow-md transition ${
                  confirmModal.confirmStyle === 'danger' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmModal.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
