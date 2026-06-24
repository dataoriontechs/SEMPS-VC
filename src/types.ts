export type UserRole = 'citizen' | 'admin';

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
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
