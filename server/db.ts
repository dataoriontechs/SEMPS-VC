import fs from 'fs';
import path from 'path';
import { User, Schedule, News, Course, BenefitProgram, SempsUnit, JobVacancy } from '../src/types';

// Simple CPF Validator
export function validateCpf(cpf: string): boolean {
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

const DB_PATH = path.join(process.cwd(), 'server', 'db.json');

interface Schema {
  users: User[];
  schedules: Schedule[];
  news: News[];
  courses: Course[];
  benefits: { [cpf: string]: BenefitProgram[] };
  units: SempsUnit[];
  jobs: JobVacancy[];
}

const initialUnits: SempsUnit[] = [
  {
    id: 'unit-1',
    name: 'CRAS Mar Grande',
    address: 'Av. ACM, s/n - Mar Grande, Vera Cruz/BA (próximo à Unidade de Saúde)',
    phone: '(71) 3633-1234',
    hours: 'Segunda a Sexta, das 08h às 17h',
    services: ['CadÚnico (Inscrição e Atualização)', 'BPC (Benefício de Prestação Continuada)', 'Serviço de Convivência e Fortalecimento de Vínculos (SCFV)', 'Atendimento Psicossocial'],
    lat: -12.9647,
    lng: -38.6083
  },
  {
    id: 'unit-2',
    name: 'CRAS Barra do Gil',
    address: 'Rua da Bica, nº 45 - Barra do Gil, Vera Cruz/BA',
    phone: '(71) 3633-5678',
    hours: 'Segunda a Sexta, das 08h às 17h',
    services: ['CadÚnico', 'Apoio Familiar e Acompanhamento do PAIF', 'Oficinas Comunitárias', 'Atendimento Psicológico e de Assistência Social'],
    lat: -12.9833,
    lng: -38.6167
  },
  {
    id: 'unit-3',
    name: 'Sede SEMPS (Centro)',
    address: 'Praça da Matriz, Centro - Vera Cruz/BA',
    phone: '(71) 3633-1111',
    hours: 'Segunda a Sexta, das 08h às 14h',
    services: ['Coordenação Geral', 'Encaminhamento para Programas Estaduais/Federais', 'Benefícios Eventuais (Auxílio Natalidade/Funeral)', 'Habitação Popular'],
    lat: -12.9622,
    lng: -38.6056
  }
];

const initialNews: News[] = [
  {
    id: 'news-1',
    title: 'Mutirão do CadÚnico em Mar Grande inicia nesta segunda-feira',
    content: 'A Secretaria Municipal de Promoção Social de Vera Cruz convoca todas as famílias que estão com o cadastro desatualizado há mais de dois anos para o grande mutirão de atualização que ocorrerá no CRAS Mar Grande. O mutirão visa evitar o bloqueio de benefícios federais como o Bolsa Família e a Tarifa Social de Energia Elétrica. Documentos necessários: RG, CPF, Carteira de Trabalho, comprovante de residência atualizado e declaração escolar das crianças.',
    date: '2026-06-20',
    category: 'campanha',
    author: 'Ascom SEMPS',
    isImportant: true
  },
  {
    id: 'news-2',
    title: 'Abertura de inscrições para novas oficinas de capacitação profissional',
    content: 'Visando impulsionar a empregabilidade e o empreendedorismo local em Vera Cruz, a SEMPS abre vagas para oficinas de Geração de Renda. Serão oferecidas qualificações em Artesanato com Resina de Conchas da Ilha e Informática Básica para jovens. As vagas são prioritariamente destinadas aos beneficiários do Bolsa Família e inscritos no CadÚnico. Faça sua inscrição diretamente pela plataforma online ou na sede do CRAS mais próximo.',
    date: '2026-06-18',
    category: 'comunicado',
    author: 'Coordenação de Cursos',
    isImportant: false
  },
  {
    id: 'news-3',
    title: 'SEMPS promove ação de acolhimento e escuta comunitária nas praias',
    content: 'No próximo sábado, a equipe técnica da SEMPS estará na Praça de Barra do Gil realizando uma ação de escuta ativa e acolhimento das famílias locais. Serão disponibilizados serviços de triagem do CadÚnico, orientações sobre o BPC e apresentações lúdicas do Serviço de Convivência para as crianças. Compareça com sua família e venha conhecer de perto os serviços sociais do nosso município.',
    date: '2026-06-15',
    category: 'evento',
    author: 'Ascom SEMPS',
    isImportant: false
  }
];

const initialCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Curso de Informática Básica e Inclusão Digital',
    description: 'Aprenda os conceitos fundamentais de computação, navegação segura na internet, digitação rápida e utilização das principais ferramentas de produtividade para o mercado de trabalho.',
    requirements: 'NIS Ativo, residir em Vera Cruz, idade mínima de 14 anos.',
    totalSlots: 15,
    availableSlots: 15,
    registeredUsers: [],
    category: 'Inclusão Digital',
    schedule: 'Terças e Quintas, das 14h às 16h'
  },
  {
    id: 'course-2',
    title: 'Oficina de Artesanato em Conchas e Resina da Ilha',
    description: 'Capacitação prática focada na produção artística e decorativa utilizando conchas locais e resinas, promovendo o artesanato sustentável e a geração de renda familiar.',
    requirements: 'Inscrito no CadÚnico, idade mínima de 16 anos.',
    totalSlots: 12,
    availableSlots: 12,
    registeredUsers: [],
    category: 'Geração de Renda',
    schedule: 'Segundas e Quartas, das 09h às 11:30'
  },
  {
    id: 'course-3',
    title: 'Atendimento ao Cliente e Hospitalidade no Turismo',
    description: 'Curso voltado para capacitar profissionais e jovens em boas práticas de atendimento, hospitalidade, técnicas de comunicação e recepção na rede hoteleira e comercial de Vera Cruz/BA.',
    requirements: 'Ensino Médio completo ou em andamento, residir no município, idade mínima de 16 anos.',
    totalSlots: 25,
    availableSlots: 25,
    registeredUsers: [],
    category: 'Qualificação Profissional',
    schedule: 'Sextas-feiras, das 13:30 às 17:30'
  }
];

const initialJobs: JobVacancy[] = [
  {
    id: 'job-1',
    title: 'Atendente de Quiosque de Praia',
    company: 'Restaurante Sol e Mar (Praia da Penha)',
    description: 'Procuramos pessoa comunicativa, ágil e pontual para atendimento a clientes, anotação de pedidos e suporte no quiosque da praia.',
    requirements: 'Ensino Fundamental completo, residir próximo ou ter transporte fácil para a Penha, boa capacidade de comunicação.',
    contact: 'Enviar currículo para o e-mail: vagas@solemarvc.com.br ou entregar pessoalmente no restaurante.',
    type: 'CLT',
    salary: 'R$ 1.512,00 + Almoço no local',
    location: 'Praia da Penha, Vera Cruz/BA',
    createdAt: '2026-06-22'
  },
  {
    id: 'job-2',
    title: 'Eletricista de Instalações Prediais',
    company: 'Pousada Recanto da Ilha (Mar Grande)',
    description: 'Manutenção corretiva e preventiva de fiação elétrica, lâmpadas, ar condicionado e tomadas nos chalés da pousada.',
    requirements: 'Certificado NR10 ativo, experiência anterior comprovada em instalações residenciais ou comerciais de hotelaria.',
    contact: 'Falar com Sr. Marcos via WhatsApp: (71) 99988-7766.',
    type: 'Freelancer',
    salary: 'R$ 350,00 por diária de serviço',
    location: 'Mar Grande, Vera Cruz/BA',
    createdAt: '2026-06-21'
  },
  {
    id: 'job-3',
    title: 'Recepcionista Noturno',
    company: 'Hotel Marina Vera Cruz (Barra do Gil)',
    description: 'Atendimento a hóspedes no período noturno, realização de check-in e check-out, controle de acessos e rotinas administrativas de caixa.',
    requirements: 'Ensino Médio completo, informática intermediária, noções básicas de inglês serão diferencial.',
    contact: 'Enviar portfólio/currículo com o título RECEPCAO NOTURNA para: recrutamento@hotelmarina.com',
    type: 'CLT',
    salary: 'R$ 1.720,00 + Adicional Noturno',
    location: 'Barra do Gil, Vera Cruz/BA',
    createdAt: '2026-06-19'
  }
];

// Generates initial benefits for a CPF
export function generateInitialBenefits(cpf: string): BenefitProgram[] {
  return [
    {
      id: 'b-1',
      name: 'Bolsa Família Municipal (Auxílio Vera Cruz)',
      description: 'Transferência direta de renda para famílias em situação de vulnerabilidade extrema na ilha.',
      status: 'Em Análise',
      observations: 'Cadastro recebido e em processamento de vulnerabilidade. Aguarde a visita do assistente social.',
      lastUpdated: '2026-06-23'
    },
    {
      id: 'b-2',
      name: 'Tarifa Social de Água e Energia',
      description: 'Desconto de até 65% na conta de luz e tarifa reduzida de água para inscritos no CadÚnico.',
      status: 'Aprovado',
      observations: 'Benefício ativo e homologado. Desconto automático na fatura da COELBA e EMBASA.',
      lastUpdated: '2026-06-15'
    },
    {
      id: 'b-3',
      name: 'Cesta Social Vera Cruz (Segurança Alimentar)',
      description: 'Entrega mensal de insumos alimentares básicos para gestantes, nutrizes e idosos de baixa renda.',
      status: 'Pendente',
      observations: 'Falta comprovação de residência recente na sede do CRAS correspondente para liberação da retirada.',
      lastUpdated: '2026-06-22'
    }
  ];
}

class Database {
  private schema: Schema;

  constructor() {
    this.schema = {
      users: [],
      schedules: [],
      news: [],
      courses: [],
      benefits: {},
      units: [],
      jobs: []
    };
    this.load();
  }

  private load() {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.schema = JSON.parse(raw);
        // Ensure standard fields exist
        if (!this.schema.users) this.schema.users = [];
        if (!this.schema.schedules) this.schema.schedules = [];
        if (!this.schema.news) this.schema.news = [];
        if (!this.schema.courses) this.schema.courses = [];
        if (!this.schema.benefits) this.schema.benefits = {};
        if (!this.schema.units) this.schema.units = [];
        if (!this.schema.jobs) this.schema.jobs = [];
      } else {
        // Seed initial data
        this.schema = {
          users: [
            // Admin user
            {
              id: 'user-admin',
              email: 'admin@semps.gov.br',
              password: 'adminpassword123', // Admin password
              name: 'Administrador Geral SEMPS',
              cpf: '000.000.000-00',
              address: 'SEMPS Centro',
              phone: '(71) 3633-1111',
              nis: '00000000000',
              role: 'admin',
              createdAt: '2026-06-01T12:00:00Z'
            },
            // Citizen user
            {
              id: 'user-citizen',
              email: 'maria@gmail.com',
              password: 'maria123password',
              name: 'Maria das Graças Souza',
              cpf: '123.456.789-00',
              address: 'Rua Direta de Mar Grande, nº 120 - Vera Cruz/BA',
              phone: '(71) 98888-2222',
              nis: '12345678901',
              motherName: 'Francisca das Graças',
              fatherName: 'Antônio de Souza',
              role: 'citizen',
              createdAt: '2026-06-20T14:30:00Z'
            }
          ],
          schedules: [
            {
              id: 'sched-1',
              userId: 'user-citizen',
              userName: 'Maria das Graças Souza',
              userCpf: '123.456.789-00',
              userPhone: '(71) 98888-2222',
              date: '2026-07-02',
              time: '09:30',
              unitId: 'unit-1',
              unitName: 'CRAS Mar Grande',
              status: 'scheduled',
              createdAt: '2026-06-21T15:00:00Z'
            }
          ],
          news: initialNews,
          courses: initialCourses,
          benefits: {
            '123.456.789-00': [
              {
                id: 'b-1',
                name: 'Bolsa Família Municipal (Auxílio Vera Cruz)',
                description: 'Transferência direta de renda para famílias em situação de vulnerabilidade extrema na ilha.',
                status: 'Aprovado',
                observations: 'Benefício concedido e pronto para saque na Caixa Econômica de Vera Cruz.',
                lastUpdated: '2026-06-23'
              },
              {
                id: 'b-2',
                name: 'Tarifa Social de Água e Energia',
                description: 'Desconto de até 65% na conta de luz e tarifa reduzida de água para inscritos no CadÚnico.',
                status: 'Aprovado',
                observations: 'Benefício ativo e homologado. Desconto automático na fatura da COELBA e EMBASA.',
                lastUpdated: '2026-06-15'
              },
              {
                id: 'b-3',
                name: 'Cesta Social Vera Cruz (Segurança Alimentar)',
                description: 'Entrega mensal de insumos alimentares básicos para gestantes, nutrizes e idosos de baixa renda.',
                status: 'Em Análise',
                observations: 'Cadastro em análise pela equipe social de Mar Grande.',
                lastUpdated: '2026-06-22'
              }
            ]
          },
          units: initialUnits,
          jobs: initialJobs
        };
        this.save();
      }
    } catch (e) {
      console.error('Failed to load database, resetting schema:', e);
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database:', e);
    }
  }

  // Getters
  getUsers() { return this.schema.users; }
  getSchedules() { return this.schema.schedules; }
  getNews() { return this.schema.news; }
  getCourses() { return this.schema.courses; }
  getBenefits() { return this.schema.benefits; }
  getUnits() { return this.schema.units; }
  getJobs() { return this.schema.jobs; }

  // Setters/Mutators
  addUser(user: User) {
    this.schema.users.push(user);
    // Initialize benefits list for their CPF if not exists
    if (!this.schema.benefits[user.cpf]) {
      this.schema.benefits[user.cpf] = generateInitialBenefits(user.cpf);
    }
    this.save();
  }

  updateUserBenefits(cpf: string, benefits: BenefitProgram[]) {
    this.schema.benefits[cpf] = benefits;
    this.save();
  }

  addSchedule(schedule: Schedule) {
    this.schema.schedules.push(schedule);
    this.save();
  }

  updateScheduleStatus(id: string, status: 'scheduled' | 'completed' | 'cancelled') {
    const idx = this.schema.schedules.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.schema.schedules[idx].status = status;
      this.save();
    }
  }

  addNews(news: News) {
    this.schema.news.unshift(news); // newer first
    this.save();
  }

  deleteNews(id: string) {
    this.schema.news = this.schema.news.filter(n => n.id !== id);
    this.save();
  }

  addCourse(course: Course) {
    this.schema.courses.push(course);
    this.save();
  }

  registerUserInCourse(courseId: string, userId: string): boolean {
    const course = this.schema.courses.find(c => c.id === courseId);
    if (course && course.availableSlots > 0 && !course.registeredUsers.includes(userId)) {
      course.registeredUsers.push(userId);
      course.availableSlots--;
      this.save();
      return true;
    }
    return false;
  }

  addUnit(unit: SempsUnit) {
    this.schema.units.push(unit);
    this.save();
  }

  addJob(job: JobVacancy) {
    this.schema.jobs.unshift(job); // newer first
    this.save();
  }

  deleteJob(id: string) {
    this.schema.jobs = this.schema.jobs.filter(j => j.id !== id);
    this.save();
  }
}

export const db = new Database();
