export type UserRole = 'administrador' | 'colaborador' | 'cidadao' | 'admin' | 'citizen';

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  cpf: string;
  address: string;
  phone: string;
  nis: string;
  motherName?: string;
  fatherName?: string;
  role: UserRole;
  createdAt: string;
  needsPasswordChange?: boolean;
  active?: boolean;
}

export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Schedule {
  id: string;
  userId: string;
  userName: string;
  userCpf: string;
  userPhone: string;
  date: string;
  time: string;
  unitId: string;
  unitName: string;
  status: ScheduleStatus;
  createdAt: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'campanha' | 'comunicado' | 'evento' | 'aviso';
  image?: string;
  author: string;
  isImportant?: boolean;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  requirements: string;
  totalSlots: number;
  availableSlots: number;
  registeredUsers: string[]; // User IDs
  category: string;
  schedule: string;
  imagem_url?: string;
}

export interface BenefitProgram {
  id: string;
  name: string;
  description: string;
  status: 'Aprovado' | 'Em Análise' | 'Pendente' | 'Não Cadastrado';
  observations?: string;
  lastUpdated?: string;
}

export interface BenefitQuery {
  cpf: string;
  benefits: BenefitProgram[];
}

export interface SempsUnit {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  services: string[];
  lat: number;
  lng: number;
  mapsUrl?: string;
}

export interface BenefitType {
  id: string;
  name: string;
  description: string;
}

export type JobType = 'CLT' | 'Freelancer';

export interface JobVacancy {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string;
  contact: string;
  type: JobType;
  salary?: string;
  location: string;
  createdAt: string;
  imagem_url?: string;
  companyEmail?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface Banner {
  id: string;
  titulo?: string;
  imagem_url: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SchedulingModel {
  id: string;
  name: string;
  serviceType: string;
  location: string;
  unitId: string;
  days: string[];
  hours: string[];
  active: boolean;
  description?: string;
  color?: string; // Ex: 'emerald', 'blue', 'orange'
  icon?: string; // Lucide icon name
  interval?: number; // minutos
  slotsPerTime?: number; // Vagas por horário
  maxDaily?: number; // Max por dia
  requiresDocs?: boolean;
  requiredDocsList?: string[];
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  
  // Form fields
  fullName: string;
  cpf: string;
  rg: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  motherName: string;
  address: string;
  neighborhood: string;
  cep: string;
  city: string;
  phone: string;
  whatsApp: string;
  email: string;
  education: string;
  profession: string;
  employmentStatus: string;
  hasNis: boolean;
  nisNumber?: string;
  hasDisability: boolean;
  disabilityType?: string;
  observations?: string;
  lgpdAccepted: boolean;
  
  status: 'Inscrito' | 'Em análise' | 'Aprovado' | 'Reprovado' | 'Lista de Espera' | 'Cancelado' | 'Concluído';
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  targetType: 'all' | 'cidadao' | 'colaborador' | 'administrador' | 'user';
  userId?: string;
  createdAt: string;
  readBy?: string[]; // IDs of users who have read it
}

export interface SystemConfig {
  id: string;
  daysOfOperation: string[]; // ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta']
  municipalHolidays: string[]; // ['YYYY-MM-DD']
  blockedDates: string[]; // ['YYYY-MM-DD']
  blockedHours: string[]; // ['09:00']
  extraHours: { date: string; hour: string }[];
  secretariatOpeningHours: string; // "08:00 - 17:00"
  unitHours: Record<string, string>; // { 'unit-1': "08:00 - 17:00" }
  unitCaps: Record<string, number>; // { 'unit-1': 100 }
  maxCancelHours: number; // e.g. 2
  minNoticeHours: number; // e.g. 24
  landingPageMessage: string;
  featuredNewsIds: string[];
  featuredCampaignIds: string[];
}

