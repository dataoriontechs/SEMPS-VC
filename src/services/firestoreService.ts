import { 
  db, 
  auth,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from "../lib/firebase";
import { News, Course, JobVacancy, SempsUnit, Schedule, BenefitProgram, User, Banner, SchedulingModel, CourseEnrollment, SystemNotification, SystemConfig, BenefitType, AiTrainingDoc } from "../types";

const initialSchedulingModels: SchedulingModel[] = [
  {
    id: 'model-1',
    name: 'Cadastro e Atualização do CadÚnico',
    serviceType: 'CadÚnico',
    location: 'CRAS Mar Grande',
    unitId: 'unit-1',
    days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    hours: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
    active: true
  },
  {
    id: 'model-2',
    name: 'Cadastro e Atualização do CadÚnico',
    serviceType: 'CadÚnico',
    location: 'CRAS Barra do Gil',
    unitId: 'unit-2',
    days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
    hours: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'],
    active: true
  },
  {
    id: 'model-3',
    name: 'Atendimento do BPC (Benefício de Prestação Continuada)',
    serviceType: 'BPC',
    location: 'CRAS Mar Grande',
    unitId: 'unit-1',
    days: ['Terça', 'Quinta'],
    hours: ['09:00', '10:00', '11:00', '14:00', '15:00'],
    active: true
  },
  {
    id: 'model-4',
    name: 'Atendimento Social Geral e Habitação Popular',
    serviceType: 'Social',
    location: 'Sede SEMPS (Centro)',
    unitId: 'unit-3',
    days: ['Segunda', 'Quarta', 'Sexta'],
    hours: ['08:30', '09:30', '10:30', '11:30', '13:30'],
    active: true
  }
];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function logSistema(acao: string, descricao: string, usuarioId?: string) {
  try {
    const uid = usuarioId || auth.currentUser?.uid || "sistema";
    await addDoc(collection(db, "logs_sistema"), {
      usuario_id: uid,
      acao,
      descricao,
      data_hora: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erro ao registrar log do sistema:", error);
  }
}

// --- SEED DATA DEFINITIONS ---
const initialUnits: SempsUnit[] = [
  {
    id: 'unit-1',
    name: 'CRAS Mar Grande',
    address: 'Av. ACM, s/n - Mar Grande, Vera Cruz/BA (próximo à Unidade de Saúde)',
    phone: '(71) 3838-8638',
    hours: 'Segunda a Sexta, das 08h às 17h',
    services: ['CadÚnico (Inscrição e Atualização)', 'BPC (Benefício de Prestação Continuada)', 'Serviço de Convivência e Fortalecimento de Vínculos (SCFV)', 'Atendimento Psicossocial'],
    lat: -12.9647,
    lng: -38.6083
  },
  {
    id: 'unit-2',
    name: 'CRAS Barra do Gil',
    address: 'Rua da Bica, nº 45 - Barra do Gil, Vera Cruz/BA',
    phone: '(71) 3838-8638',
    hours: 'Segunda a Sexta, das 08h às 17h',
    services: ['CadÚnico', 'Apoio Familiar e Acompanhamento do PAIF', 'Oficinas Comunitárias', 'Atendimento Psicológico e de Assistência Social'],
    lat: -12.9833,
    lng: -38.6167
  },
  {
    id: 'unit-3',
    name: 'Sede SEMPS (Centro)',
    address: 'Praça da Matriz, Centro - Vera Cruz/BA',
    phone: '(71) 3838-8792',
    hours: 'Segunda a Sexta, das 08h às 14h',
    services: ['Coordenação Geral', 'Encaminhamento para Programas Estaduais/Federais', 'Benefícios Eventuais (Auxílio Natalidade/Funeral)', 'Habitação Popular'],
    lat: -12.9622,
    lng: -38.6056
  },
  {
    id: 'unit-4',
    name: 'CREAS Vera Cruz',
    address: 'Av. ACM, Centro - Vera Cruz/BA',
    phone: '(71) 3838-8646',
    hours: 'Segunda a Sexta, das 08h às 17h',
    services: ['Atendimento Especializado a Famílias e Indivíduos (PAEFI)', 'Medidas Socioeducativas em Meio Aberto', 'Acompanhamento Psicológico e Social', 'Defesa de Direitos Violados'],
    lat: -12.9630,
    lng: -38.6060
  },
  {
    id: 'unit-5',
    name: 'Setor de Cadastro Único e Bolsa Família',
    address: 'Praça da Matriz, Centro - Vera Cruz/BA (Sede SEMPS)',
    phone: '(71) 3838-8861',
    hours: 'Segunda a Sexta, das 08h às 14h',
    services: ['Cadastro Único (Inscrição e Atualização)', 'Acompanhamento de Condicionalidades', 'Consulta e Desbloqueio de Benefícios', 'Tarifa Social de Energia', 'Benefício de Prestação Continuada (BPC)'],
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

const defaultBenefitsForMaria = [
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

// --- SEED DATABASE FUNCTION ---
export async function seedDatabaseIfEmpty() {
  try {
    // 1. Seed & Update Units
    console.log("[Firebase Seed] Seeding and updating units...");
    for (const unit of initialUnits) {
      await setDoc(doc(db, "unidades", unit.id), {
        nome: unit.name,
        tipo: unit.id === 'unit-3' || unit.id === 'unit-5' ? 'sede' : (unit.id === 'unit-4' ? 'creas' : 'cras'),
        endereco: unit.address,
        telefone: unit.phone,
        horario_funcionamento: unit.hours,
        services: unit.services,
        latitude: unit.lat,
        longitude: unit.lng,
        // compatibility fields
        id: unit.id,
        name: unit.name,
        address: unit.address,
        phone: unit.phone,
        hours: unit.hours,
        lat: unit.lat,
        lng: unit.lng
      });
    }

    // 2. Seed News
    const newsSnap = await getDocs(collection(db, "noticias"));
    if (newsSnap.empty) {
      console.log("[Firebase Seed] Seeding news...");
      for (const item of initialNews) {
        await setDoc(doc(db, "noticias", item.id), {
          titulo: item.title,
          conteudo: item.content,
          imagem_url: item.image || "",
          data_publicacao: item.date,
          autor_id: "Ascom SEMPS",
          destaque: item.isImportant || false,
          ativo: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // compatibility fields
          id: item.id,
          title: item.title,
          content: item.content,
          date: item.date,
          category: item.category,
          author: item.author,
          isImportant: item.isImportant || false
        });
      }
    }

    // 3. Seed Courses
    const coursesSnap = await getDocs(collection(db, "cursos"));
    if (coursesSnap.empty) {
      console.log("[Firebase Seed] Seeding courses...");
      for (const course of initialCourses) {
        await setDoc(doc(db, "cursos", course.id), {
          nome: course.title,
          descricao: course.description,
          carga_horaria: "40h",
          vagas: course.totalSlots,
          data_inicio: "2026-07-10",
          ativo: true,
          created_at: new Date().toISOString(),
          // compatibility fields
          id: course.id,
          title: course.title,
          description: course.description,
          requirements: course.requirements,
          totalSlots: course.totalSlots,
          availableSlots: course.availableSlots,
          registeredUsers: course.registeredUsers || [],
          category: course.category,
          schedule: course.schedule
        });
      }
    }

    // 4. Seed Jobs
    const jobsSnap = await getDocs(collection(db, "vagas"));
    if (jobsSnap.empty) {
      console.log("[Firebase Seed] Seeding jobs...");
      for (const job of initialJobs) {
        await setDoc(doc(db, "vagas", job.id), {
          titulo: job.title,
          empresa: job.company,
          descricao: job.description,
          tipo_vaga: job.type,
          salario: job.salary || "",
          contato: job.contact,
          ativo: true,
          created_at: job.createdAt,
          // compatibility fields
          id: job.id,
          title: job.title,
          company: job.company,
          description: job.description,
          requirements: job.requirements,
          contact: job.contact,
          type: job.type,
          salary: job.salary || "",
          location: job.location,
          createdAt: job.createdAt
        });
      }
    }

    // 5. Seed default Benefits for Maria (CPF 123.456.789-00)
    const benefitsSnap = await getDocs(collection(db, "beneficios"));
    if (benefitsSnap.empty) {
      console.log("[Firebase Seed] Seeding benefits for Maria...");
      for (const benefit of defaultBenefitsForMaria) {
        await addDoc(collection(db, "beneficios"), {
          usuario_id: "user-citizen",
          userCpf: "123.456.789-00", // For lookup
          nome_beneficio: benefit.name,
          status: benefit.status,
          data_solicitacao: "2026-06-10",
          data_resultado: benefit.lastUpdated,
          observacao: benefit.observations || "",
          // compatibility fields
          id: benefit.id,
          name: benefit.name,
          description: benefit.description,
          observations: benefit.observations || "",
          lastUpdated: benefit.lastUpdated
        });
      }
    }

    // 6. Seed default Scheduling Models
    const modelsSnap = await getDocs(collection(db, "modelos_agendamento"));
    if (modelsSnap.empty) {
      console.log("[Firebase Seed] Seeding scheduling models...");
      for (const model of initialSchedulingModels) {
        await setDoc(doc(db, "modelos_agendamento", model.id), {
          name: model.name,
          serviceType: model.serviceType,
          location: model.location,
          unitId: model.unitId,
          days: model.days,
          hours: model.hours,
          active: model.active,
          created_at: new Date().toISOString()
        });
      }
    }

    // 7. Seed default Benefit Types
    const bTypesSnap = await getDocs(collection(db, "tipos_beneficios"));
    if (bTypesSnap.empty) {
      console.log("[Firebase Seed] Seeding default benefit types...");
      const defaultBenefitTypesList = [
        {
          name: "Bolsa Família Municipal (Auxílio Vera Cruz)",
          description: "Transferência direta de renda para famílias em situação de vulnerabilidade extrema na ilha."
        },
        {
          name: "Tarifa Social de Água e Energia",
          description: "Desconto de até 65% na conta de luz e tarifa reduzida de água para inscritos no CadÚnico."
        },
        {
          name: "Cesta Social Vera Cruz (Segurança Alimentar)",
          description: "Entrega mensal de insumos alimentares básicos para gestantes, nutrizes e idosos de baixa renda."
        }
      ];
      for (const bType of defaultBenefitTypesList) {
        await addDoc(collection(db, "tipos_beneficios"), {
          name: bType.name,
          description: bType.description,
          created_at: new Date().toISOString()
        });
      }
    }

    console.log("[Firebase Seed] Seeding verification completed successfully.");
  } catch (error: any) {
    console.warn("[Firebase Seed] Skipping database seeding (typically due to lack of permission or non-admin user):", error?.message || error);
  }
}

// --- NEWS SERVICE ---
export const newsService = {
  subscribeNews: (callback: (news: News[]) => void) => {
    return onSnapshot(collection(db, "noticias"), (snapshot) => {
      const items: News[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.titulo || data.title || "",
          content: data.conteudo || data.content || "",
          date: data.data_publicacao || data.date || "",
          category: data.category || "comunicado",
          image: data.imagem_url || data.image || "",
          author: data.author || "Ascom SEMPS",
          isImportant: data.destaque !== undefined ? data.destaque : (data.isImportant || false)
        });
      });
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "noticias");
    });
  },

  addNews: async (newsItem: Omit<News, "id">) => {
    await addDoc(collection(db, "noticias"), {
      titulo: newsItem.title,
      conteudo: newsItem.content,
      imagem_url: newsItem.image || "",
      data_publicacao: newsItem.date,
      autor_id: newsItem.author,
      destaque: newsItem.isImportant || false,
      ativo: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // compatibility fields
      title: newsItem.title,
      content: newsItem.content,
      date: newsItem.date,
      category: newsItem.category,
      author: newsItem.author,
      isImportant: newsItem.isImportant || false
    });
    await logSistema("noticia_criada", `Notícia "${newsItem.title}" criada com sucesso.`);
  },

  deleteNews: async (id: string) => {
    await deleteDoc(doc(db, "noticias", id));
    await logSistema("noticia_excluida", `Notícia com ID ${id} excluída com sucesso.`);
  }
};

// --- COURSES SERVICE ---
export const courseService = {
  subscribeCourses: (callback: (courses: Course[]) => void) => {
    return onSnapshot(collection(db, "cursos"), (snapshot) => {
      const items: Course[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.nome || data.title || "",
          description: data.descricao || data.description || "",
          requirements: data.requirements || "",
          totalSlots: Number(data.vagas !== undefined ? data.vagas : data.totalSlots),
          availableSlots: Number(data.availableSlots !== undefined ? data.availableSlots : (data.vagas || 0)),
          registeredUsers: data.registeredUsers || [],
          category: data.category || "Geral",
          schedule: data.schedule || "",
          imagem_url: data.imagem_url || ""
        });
      });
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "cursos");
    });
  },

  addCourse: async (courseItem: Omit<Course, "id">) => {
    await addDoc(collection(db, "cursos"), {
      nome: courseItem.title,
      descricao: courseItem.description,
      carga_horaria: "40h",
      vagas: courseItem.totalSlots,
      data_inicio: new Date().toISOString().split('T')[0],
      ativo: true,
      imagem_url: courseItem.imagem_url || "",
      created_at: new Date().toISOString(),
      // compatibility fields
      title: courseItem.title,
      description: courseItem.description,
      requirements: courseItem.requirements,
      totalSlots: courseItem.totalSlots,
      availableSlots: courseItem.totalSlots,
      registeredUsers: [],
      category: courseItem.category,
      schedule: courseItem.schedule
    });
    await logSistema("curso_criado", `Curso/oficina "${courseItem.title}" criado.`);
  },

  registerUserInCourse: async (courseId: string, userId: string) => {
    const courseRef = doc(db, "cursos", courseId);
    const courseSnap = await getDoc(courseRef);
    if (!courseSnap.exists()) return false;

    const data = courseSnap.data();
    const registeredUsers: string[] = data.registeredUsers || [];
    const totalSlots = Number(data.vagas !== undefined ? data.vagas : data.totalSlots);

    if (registeredUsers.includes(userId)) return false;
    if (registeredUsers.length >= totalSlots) return false;

    const updatedUsers = [...registeredUsers, userId];
    const newAvailableSlots = Math.max(0, totalSlots - updatedUsers.length);

    await updateDoc(courseRef, {
      registeredUsers: updatedUsers,
      availableSlots: newAvailableSlots
    });

    // Also add to the requested collection: inscricoes_cursos
    await addDoc(collection(db, "inscricoes_cursos"), {
      curso_id: courseId,
      usuario_id: userId,
      status: "confirmado",
      data_inscricao: new Date().toISOString()
    });

    return true;
  },

  updateCourse: async (id: string, courseItem: Partial<Omit<Course, "id">>) => {
    const courseRef = doc(db, "cursos", id);
    const updates: any = {};
    if (courseItem.title !== undefined) {
      updates.nome = courseItem.title;
      updates.title = courseItem.title;
    }
    if (courseItem.description !== undefined) {
      updates.descricao = courseItem.description;
      updates.description = courseItem.description;
    }
    if (courseItem.requirements !== undefined) updates.requirements = courseItem.requirements;
    if (courseItem.totalSlots !== undefined) {
      updates.vagas = Number(courseItem.totalSlots);
      updates.totalSlots = Number(courseItem.totalSlots);
    }
    if (courseItem.category !== undefined) updates.category = courseItem.category;
    if (courseItem.schedule !== undefined) updates.schedule = courseItem.schedule;
    if (courseItem.imagem_url !== undefined) updates.imagem_url = courseItem.imagem_url;

    await updateDoc(courseRef, {
      ...updates,
      updated_at: new Date().toISOString()
    });
    await logSistema("curso_atualizado", `Curso/oficina com ID ${id} atualizado.`);
  },

  deleteCourse: async (id: string) => {
    await deleteDoc(doc(db, "cursos", id));
    await logSistema("curso_excluido", `Curso/oficina com ID ${id} excluído.`);
  }
};

// --- JOBS SERVICE ---
export const jobsService = {
  subscribeJobs: (callback: (jobs: JobVacancy[]) => void) => {
    return onSnapshot(collection(db, "vagas"), (snapshot) => {
      const items: JobVacancy[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          title: data.titulo || data.title || "",
          company: data.empresa || data.company || "",
          description: data.descricao || data.description || "",
          requirements: data.requirements || "",
          contact: data.contato || data.contact || "",
          type: data.tipo_vaga || data.type || "CLT",
          salary: data.salario || data.salary || "",
          location: data.location || "Vera Cruz/BA",
          createdAt: data.created_at || data.createdAt || "",
          imagem_url: data.imagem_url || "",
          companyEmail: data.companyEmail || data.empresa_email || ""
        });
      });
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "vagas");
    });
  },

  addJob: async (job: Omit<JobVacancy, "id">) => {
    await addDoc(collection(db, "vagas"), {
      titulo: job.title,
      empresa: job.company,
      descricao: job.description,
      tipo_vaga: job.type,
      salario: job.salary || "",
      contato: job.contact,
      ativo: true,
      imagem_url: job.imagem_url || "",
      created_at: job.createdAt || new Date().toISOString().split('T')[0],
      companyEmail: job.companyEmail || "",
      empresa_email: job.companyEmail || "",
      // compatibility
      title: job.title,
      company: job.company,
      requirements: job.requirements,
      location: job.location
    });
    await logSistema("vaga_criada", `Vaga de emprego "${job.title}" criada na empresa "${job.company}".`);
  },

  updateJob: async (id: string, job: Partial<Omit<JobVacancy, "id">>) => {
    const jobRef = doc(db, "vagas", id);
    const updates: any = {};
    if (job.title !== undefined) {
      updates.titulo = job.title;
      updates.title = job.title;
    }
    if (job.company !== undefined) {
      updates.empresa = job.company;
      updates.company = job.company;
    }
    if (job.description !== undefined) {
      updates.descricao = job.description;
      updates.description = job.description;
    }
    if (job.type !== undefined) {
      updates.tipo_vaga = job.type;
      updates.type = job.type;
    }
    if (job.salary !== undefined) {
      updates.salario = job.salary;
      updates.salary = job.salary;
    }
    if (job.contact !== undefined) {
      updates.contato = job.contact;
      updates.contact = job.contact;
    }
    if (job.imagem_url !== undefined) updates.imagem_url = job.imagem_url;
    if (job.requirements !== undefined) updates.requirements = job.requirements;
    if (job.location !== undefined) updates.location = job.location;
    if (job.companyEmail !== undefined) {
      updates.companyEmail = job.companyEmail;
      updates.empresa_email = job.companyEmail;
    }

    await updateDoc(jobRef, {
      ...updates,
      updated_at: new Date().toISOString()
    });
    await logSistema("vaga_atualizada", `Vaga de emprego com ID ${id} atualizada.`);
  },

  deleteJob: async (id: string) => {
    await deleteDoc(doc(db, "vagas", id));
    await logSistema("vaga_excluida", `Vaga de emprego com ID ${id} excluída.`);
  },

  applyToJob: async (jobId: string, jobTitle: string, company: string, userId: string, userName: string) => {
    await addDoc(collection(db, "candidaturas"), {
      jobId,
      jobTitle,
      company,
      userId,
      userName,
      createdAt: new Date().toISOString()
    });
    await logSistema("candidatura_vaga_realizada", `Candidatura realizada por ${userName} para a vaga "${jobTitle}" da empresa "${company}".`);
  },

  subscribeCandidacies: (callback: (candidacies: any[]) => void) => {
    return onSnapshot(collection(db, "candidaturas"), (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          jobId: data.jobId || "",
          jobTitle: data.jobTitle || "",
          company: data.company || "",
          userId: data.userId || "",
          userName: data.userName || "",
          createdAt: data.createdAt || ""
        });
      });
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "candidaturas");
    });
  }
};

// --- UNITS SERVICE ---
export const unitsService = {
  subscribeUnits: (callback: (units: SempsUnit[]) => void) => {
    return onSnapshot(collection(db, "unidades"), (snapshot) => {
      const items: SempsUnit[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.nome || data.name || "",
          address: data.endereco || data.address || "",
          phone: data.telefone || data.phone || "",
          hours: data.horario_funcionamento || data.hours || "",
          services: data.services || [],
          lat: Number(data.latitude !== undefined ? data.latitude : (data.lat || -12.9714)),
          lng: Number(data.longitude !== undefined ? data.longitude : (data.lng || -38.5014)),
          mapsUrl: data.maps_url || data.mapsUrl || ""
        });
      });
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "unidades");
    });
  },

  addUnit: async (unit: Omit<SempsUnit, "id">) => {
    const docRef = await addDoc(collection(db, "unidades"), {
      nome: unit.name,
      endereco: unit.address,
      telefone: unit.phone,
      horario_funcionamento: unit.hours,
      services: unit.services,
      latitude: Number(unit.lat),
      longitude: Number(unit.lng),
      maps_url: unit.mapsUrl || "",
      created_at: new Date().toISOString()
    });
    await logSistema("unidade_criada", `Unidade "${unit.name}" criada.`);
    return { ...unit, id: docRef.id };
  },

  updateUnit: async (id: string, updates: Partial<Omit<SempsUnit, "id">>) => {
    const ref = doc(db, "unidades", id);
    const cleanedUpdates: any = {};
    if (updates.name !== undefined) cleanedUpdates.nome = updates.name;
    if (updates.address !== undefined) cleanedUpdates.endereco = updates.address;
    if (updates.phone !== undefined) cleanedUpdates.telefone = updates.phone;
    if (updates.hours !== undefined) cleanedUpdates.horario_funcionamento = updates.hours;
    if (updates.services !== undefined) cleanedUpdates.services = updates.services;
    if (updates.lat !== undefined) cleanedUpdates.latitude = Number(updates.lat);
    if (updates.lng !== undefined) cleanedUpdates.longitude = Number(updates.lng);
    if (updates.mapsUrl !== undefined) cleanedUpdates.maps_url = updates.mapsUrl;

    await updateDoc(ref, {
      ...cleanedUpdates,
      updated_at: new Date().toISOString()
    });
    await logSistema("unidade_atualizada", `Unidade com ID ${id} atualizada.`);
  },

  deleteUnit: async (id: string) => {
    await deleteDoc(doc(db, "unidades", id));
    await logSistema("unidade_excluida", `Unidade com ID ${id} excluída.`);
  }
};

// --- SCHEDULES SERVICE ---
export const schedulesService = {
  subscribeAllSchedules: (callback: (schedules: Schedule[]) => void) => {
    return onSnapshot(collection(db, "agendamentos"), (snapshot) => {
      const items: Schedule[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.usuario_id || data.userId || "",
          userName: data.userName || "",
          userCpf: data.userCpf || "",
          userPhone: data.userPhone || "",
          date: data.data || data.date || "",
          time: data.hora || data.time || "",
          unitId: data.unitId || "unit-1",
          unitName: data.unitName || "CRAS Mar Grande",
          status: data.status || "scheduled",
          createdAt: data.created_at || data.createdAt || ""
        });
      });
      // Sort by date/time ascending
      items.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "agendamentos");
    });
  },

  subscribeUserSchedules: (userId: string, callback: (schedules: Schedule[]) => void) => {
    const q = query(collection(db, "agendamentos"), where("usuario_id", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const items: Schedule[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          userId: data.usuario_id || data.userId || "",
          userName: data.userName || "",
          userCpf: data.userCpf || "",
          userPhone: data.userPhone || "",
          date: data.data || data.date || "",
          time: data.hora || data.time || "",
          unitId: data.unitId || "unit-1",
          unitName: data.unitName || "CRAS Mar Grande",
          status: data.status || "scheduled",
          createdAt: data.created_at || data.createdAt || ""
        });
      });
      items.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "agendamentos");
    });
  },

  addSchedule: async (schedule: Omit<Schedule, "id"> & { modelId?: string, serviceName?: string, slotsPerTime?: number }) => {
    // Check limit of active schedules per CPF
    const cpfQuery = query(
      collection(db, "agendamentos"),
      where("userCpf", "==", schedule.userCpf),
      where("status", "in", ["scheduled", "confirmed", "aguardando", "em_atendimento"])
    );
    const cpfSnap = await getDocs(cpfQuery);
    
    // Find if there's any active appointment for the SAME service/model
    const sameServiceCount = cpfSnap.docs.filter(docSnap => {
      const data = docSnap.data();
      const sName = data.tipo_atendimento || data.serviceName || "CadÚnico";
      const targetName = schedule.serviceName || "CadÚnico";
      
      if (sName !== targetName) return false;

      // Check if the scheduled date has already passed
      const scheduleDateStr = data.data || data.date;
      if (scheduleDateStr) {
        const scheduleDate = parseSafeDate(scheduleDateStr);
        if (scheduleDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (scheduleDate < today) {
            // Date has passed, so it is no longer active even if status is scheduled/confirmed
            return false;
          }
        }
      }

      return true;
    }).length;

    if (sameServiceCount > 0) {
      throw new Error(`Cada cidadão poderá realizar apenas um agendamento ativo por serviço ("${schedule.serviceName || 'CadÚnico'}").`);
    }

    // Now check capacity limit for this specific slot
    const slotQuery = query(
      collection(db, "agendamentos"),
      where("unitId", "==", schedule.unitId),
      where("data", "==", schedule.date),
      where("hora", "==", schedule.time),
      where("status", "in", ["scheduled", "confirmed", "aguardando", "em_atendimento", "completed", "atendido"])
    );
    const slotSnap = await getDocs(slotQuery);
    const serviceSlotCount = slotSnap.docs.filter(docSnap => {
      const data = docSnap.data();
      const sId = data.serviceId || data.modelId || "";
      return sId === (schedule.modelId || "");
    }).length;

    const limitVagas = schedule.slotsPerTime !== undefined ? Number(schedule.slotsPerTime) : 5;
    if (serviceSlotCount >= limitVagas) {
      throw new Error(`Este horário atingiu o limite máximo de ${limitVagas} vagas para o serviço de "${schedule.serviceName || 'CadÚnico'}". Por favor, selecione outro horário ou data.`);
    }

    const docRef = await addDoc(collection(db, "agendamentos"), {
      usuario_id: schedule.userId,
      tipo_atendimento: schedule.serviceName || "CadÚnico",
      serviceId: schedule.modelId || "",
      modelId: schedule.modelId || "",
      data: schedule.date,
      hora: schedule.time,
      status: schedule.status || "scheduled",
      observacoes: "",
      created_at: new Date().toISOString(),
      // compatibility fields
      userId: schedule.userId,
      userName: schedule.userName,
      userCpf: schedule.userCpf,
      userPhone: schedule.userPhone,
      unitId: schedule.unitId,
      unitName: schedule.unitName
    });

    // Send notification
    await notificationsService.sendNotification({
      title: "Agendamento Realizado",
      message: `Seu agendamento para "${schedule.serviceName || 'CadÚnico'}" foi realizado com sucesso para o dia ${schedule.date} às ${schedule.time}.`,
      targetType: "user",
      userId: schedule.userId
    });

    return { id: docRef.id };
  },

  updateScheduleStatus: async (id: string, status: string) => {
    const ref = doc(db, "agendamentos", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      await updateDoc(ref, { status, updated_at: new Date().toISOString() });
      
      const sName = data.tipo_atendimento || data.serviceName || "Agendamento";
      const uId = data.usuario_id || data.userId || "";
      
      let statusLabel = status;
      if (status === 'confirmed' || status === 'confirmado') statusLabel = 'Confirmado';
      else if (status === 'cancelled' || status === 'cancelado') statusLabel = 'Cancelado';
      else if (status === 'reagendado') statusLabel = 'Reagendado';
      else if (status === 'em_atendimento') statusLabel = 'Em Atendimento';
      else if (status === 'atendido' || status === 'completed') statusLabel = 'Atendido';

      if (uId) {
        await notificationsService.sendNotification({
          title: "Alteração no seu Agendamento",
          message: `O status do seu agendamento para "${sName}" foi alterado para: ${statusLabel}.`,
          targetType: "user",
          userId: uId
        });
      }
    }
  }
};

// Helper to safely parse dates in multiple formats (e.g., DD/MM/YYYY, YYYY-MM-DD, etc.)
function parseSafeDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 0, 0, 0);
    }
  } else if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0);
      } else if (parts[2].length === 4) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]), 0, 0, 0);
      }
    }
  }
  return null;
}

// --- BENEFITS SERVICE ---
export const benefitsService = {
  subscribeAllBenefits: (callback: (benefitsByCpf: { [cpf: string]: BenefitProgram[] }) => void) => {
    return onSnapshot(collection(db, "beneficios"), (snapshot) => {
      const grouped: { [cpf: string]: BenefitProgram[] } = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const cpf = data.userCpf || "";
        if (!cpf) return;
        if (!grouped[cpf]) grouped[cpf] = [];
        grouped[cpf].push({
          id: docSnap.id,
          name: data.nome_beneficio || data.name || "",
          description: data.description || "",
          status: data.status || "Pendente",
          observations: data.observacao || data.observations || "",
          lastUpdated: data.data_resultado || data.lastUpdated || ""
        });
      });
      callback(grouped);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "beneficios");
    });
  },

  getBenefitsByCpf: async (cpf: string): Promise<BenefitProgram[]> => {
    const q = query(collection(db, "beneficios"), where("userCpf", "==", cpf));
    const snap = await getDocs(q);
    const list: BenefitProgram[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.nome_beneficio || data.name || "",
        description: data.description || "",
        status: data.status || "Pendente",
        observations: data.observacao || data.observations || "",
        lastUpdated: data.data_resultado || data.lastUpdated || ""
      });
    });
    return list;
  },

  updateUserBenefits: async (cpf: string, benefits: BenefitProgram[]) => {
    // Delete existing benefits for this CPF
    const q = query(collection(db, "beneficios"), where("userCpf", "==", cpf));
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      await deleteDoc(docSnap.ref);
    }

    // Add new benefits
    for (const b of benefits) {
      if (b.status === "Não Cadastrado") continue;
      await addDoc(collection(db, "beneficios"), {
        usuario_id: "user-citizen",
        userCpf: cpf,
        nome_beneficio: b.name,
        status: b.status,
        data_solicitacao: "2026-06-10",
        data_resultado: b.lastUpdated || new Date().toISOString().split('T')[0],
        observacao: b.observations || "",
        // compatibility
        name: b.name,
        description: b.description || "",
        observations: b.observations || "",
        lastUpdated: b.lastUpdated || new Date().toISOString().split('T')[0]
      });
    }
    await logSistema("beneficios_atualizados", `Benefícios sociais atualizados para o CPF ${cpf}.`);
  },

  applyForBenefit: async (cpf: string, userName: string, benefitName: string, description: string) => {
    // Check if there is already a benefit record with this name for this CPF
    const q = query(
      collection(db, "beneficios"), 
      where("userCpf", "==", cpf),
      where("nome_beneficio", "==", benefitName)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error("Você já possui uma solicitação ativa para este benefício.");
    }

    await addDoc(collection(db, "beneficios"), {
      usuario_id: "user-citizen",
      userCpf: cpf,
      nome_beneficio: benefitName,
      status: "Em Análise",
      data_solicitacao: new Date().toISOString().split('T')[0],
      data_resultado: "",
      observacao: "Solicitação efetuada online pelo cidadão. Aguardando triagem da Secretaria.",
      name: benefitName,
      description: description,
      observations: "Solicitação efetuada online pelo cidadão. Aguardando triagem da Secretaria.",
      lastUpdated: new Date().toISOString().split('T')[0]
    });

    await logSistema("solicitacao_beneficio_enviada", `Cidadão ${userName} (CPF: ${cpf}) solicitou o benefício ${benefitName}.`);
  }
};

// --- BANNERS SERVICE ---
export const bannerService = {
  subscribeBanners: (callback: (banners: Banner[]) => void) => {
    return onSnapshot(collection(db, "banners"), (snapshot) => {
      const items: Banner[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          titulo: data.titulo,
          imagem_url: data.imagem_url,
          ordem: Number(data.ordem) || 0,
          ativo: data.ativo !== undefined ? data.ativo : true,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at
        });
      });
      // Sort by order ascending
      items.sort((a, b) => a.ordem - b.ordem);
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "banners");
    });
  },

  addBanner: async (banner: Omit<Banner, "id" | "created_at">) => {
    await addDoc(collection(db, "banners"), {
      titulo: banner.titulo || "",
      imagem_url: banner.imagem_url,
      ordem: Number(banner.ordem) || 0,
      ativo: banner.ativo !== undefined ? banner.ativo : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    await logSistema("banner_criado", `Banner "${banner.titulo || "Sem título"}" criado.`);
  },

  updateBanner: async (id: string, updates: Partial<Omit<Banner, "id">>) => {
    const docRef = doc(db, "banners", id);
    const dataToUpdate: any = {
      updated_at: new Date().toISOString()
    };
    if (updates.titulo !== undefined) dataToUpdate.titulo = updates.titulo;
    if (updates.imagem_url !== undefined) dataToUpdate.imagem_url = updates.imagem_url;
    if (updates.ordem !== undefined) dataToUpdate.ordem = Number(updates.ordem) || 0;
    if (updates.ativo !== undefined) dataToUpdate.ativo = updates.ativo;

    await updateDoc(docRef, dataToUpdate);
    await logSistema("banner_atualizado", `Banner com ID ${id} atualizado.`);
  },

  deleteBanner: async (id: string) => {
    await deleteDoc(doc(db, "banners", id));
    await logSistema("banner_excluido", `Banner com ID ${id} excluído.`);
  }
};

// --- SCHEDULING MODELS SERVICE ---
export const schedulingModelsService = {
  subscribeModels: (callback: (models: SchedulingModel[]) => void) => {
    return onSnapshot(collection(db, "modelos_agendamento"), (snapshot) => {
      const items: SchedulingModel[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || "",
          serviceType: data.serviceType || "",
          location: data.location || "",
          unitId: data.unitId || "",
          days: data.days || [],
          hours: data.hours || [],
          active: data.active !== undefined ? data.active : true,
          description: data.description || "",
          color: data.color || "emerald",
          icon: data.icon || "Calendar",
          interval: data.interval !== undefined ? Number(data.interval) : 20,
          slotsPerTime: data.slotsPerTime !== undefined ? Number(data.slotsPerTime) : 5,
          maxDaily: data.maxDaily !== undefined ? Number(data.maxDaily) : 100,
          requiresDocs: data.requiresDocs !== undefined ? Boolean(data.requiresDocs) : false,
          requiredDocsList: data.requiredDocsList || []
        });
      });
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "modelos_agendamento");
    });
  },

  addModel: async (model: Omit<SchedulingModel, "id">) => {
    const docRef = await addDoc(collection(db, "modelos_agendamento"), {
      name: model.name,
      serviceType: model.serviceType,
      location: model.location,
      unitId: model.unitId,
      days: model.days,
      hours: model.hours,
      active: model.active,
      description: model.description || "",
      color: model.color || "emerald",
      icon: model.icon || "Calendar",
      interval: Number(model.interval) || 20,
      slotsPerTime: Number(model.slotsPerTime) || 5,
      maxDaily: Number(model.maxDaily) || 100,
      requiresDocs: Boolean(model.requiresDocs),
      requiredDocsList: model.requiredDocsList || [],
      created_at: new Date().toISOString()
    });
    await logSistema("modelo_agendamento_criado", `Modelo de agendamento "${model.name}" criado.`);
    return { ...model, id: docRef.id };
  },

  updateModel: async (id: string, updates: Partial<Omit<SchedulingModel, "id">>) => {
    const ref = doc(db, "modelos_agendamento", id);
    const cleanedUpdates: any = { ...updates };
    if (updates.interval !== undefined) cleanedUpdates.interval = Number(updates.interval);
    if (updates.slotsPerTime !== undefined) cleanedUpdates.slotsPerTime = Number(updates.slotsPerTime);
    if (updates.maxDaily !== undefined) cleanedUpdates.maxDaily = Number(updates.maxDaily);
    if (updates.requiresDocs !== undefined) cleanedUpdates.requiresDocs = Boolean(updates.requiresDocs);

    await updateDoc(ref, {
      ...cleanedUpdates,
      updated_at: new Date().toISOString()
    });
    await logSistema("modelo_agendamento_atualizado", `Modelo de agendamento com ID ${id} atualizado.`);
  },

  deleteModel: async (id: string) => {
    await deleteDoc(doc(db, "modelos_agendamento", id));
    await logSistema("modelo_agendamento_excluido", `Modelo de agendamento com ID ${id} excluído.`);
  }
};

// --- COURSE ENROLLMENTS SERVICE ---
export const courseEnrollmentsService = {
  subscribeEnrollments: (callback: (enrollments: CourseEnrollment[]) => void) => {
    return onSnapshot(collection(db, "inscricoes_cursos_detalhes"), (snapshot) => {
      const items: CourseEnrollment[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          courseId: data.courseId || "",
          courseTitle: data.courseTitle || "",
          userId: data.userId || "",
          fullName: data.fullName || "",
          cpf: data.cpf || "",
          rg: data.rg || "",
          birthDate: data.birthDate || "",
          gender: data.gender || "",
          maritalStatus: data.maritalStatus || "",
          motherName: data.motherName || "",
          address: data.address || "",
          neighborhood: data.neighborhood || "",
          cep: data.cep || "",
          city: data.city || "",
          phone: data.phone || "",
          whatsApp: data.whatsApp || "",
          email: data.email || "",
          education: data.education || "",
          profession: data.profession || "",
          employmentStatus: data.employmentStatus || "",
          hasNis: data.hasNis || false,
          nisNumber: data.nisNumber || "",
          hasDisability: data.hasDisability || false,
          disabilityType: data.disabilityType || "",
          observations: data.observations || "",
          lgpdAccepted: data.lgpdAccepted || false,
          status: data.status || "Inscrito",
          createdAt: data.createdAt || new Date().toISOString()
        });
      });
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "inscricoes_cursos_detalhes");
    });
  },

  enroll: async (enrollment: Omit<CourseEnrollment, "id" | "createdAt">) => {
    // Check if user is already enrolled in this course
    const q = query(
      collection(db, "inscricoes_cursos_detalhes"),
      where("userId", "==", enrollment.userId),
      where("courseId", "==", enrollment.courseId)
    );
    const snap = await getDocs(q);
    const existingActive = snap.docs.filter(doc => doc.data().status !== 'Cancelado');
    if (existingActive.length > 0) {
      throw new Error("Você já possui uma inscrição ativa para este curso!");
    }

    const docRef = await addDoc(collection(db, "inscricoes_cursos_detalhes"), {
      ...enrollment,
      createdAt: new Date().toISOString()
    });

    // Mirror to standard registration structure too for backward compatibility
    await addDoc(collection(db, "inscricoes_cursos"), {
      curso_id: enrollment.courseId,
      usuario_id: enrollment.userId,
      status: enrollment.status === "Lista de Espera" ? "lista_espera" : "confirmado",
      data_inscricao: new Date().toISOString()
    });

    // Also update Course registeredUsers
    const courseRef = doc(db, "cursos", enrollment.courseId);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
      const data = courseSnap.data();
      const currentUsers: string[] = data.registeredUsers || [];
      if (!currentUsers.includes(enrollment.userId) && enrollment.status !== 'Lista de Espera') {
        const updatedUsers = [...currentUsers, enrollment.userId];
        const vagas = Number(data.vagas !== undefined ? data.vagas : (data.totalSlots || 0));
        await updateDoc(courseRef, {
          registeredUsers: updatedUsers,
          availableSlots: Math.max(0, vagas - updatedUsers.length)
        });
      }
    }

    // Send in-app notification to citizen
    await notificationsService.sendNotification({
      title: "Inscrição Realizada",
      message: `Sua inscrição no curso/oficina "${enrollment.courseTitle}" foi enviada com sucesso! Status atual: ${enrollment.status}.`,
      targetType: "user",
      userId: enrollment.userId
    });

    await logSistema("inscricao_curso_realizada", `Inscrição realizada para ${enrollment.fullName} no curso ${enrollment.courseTitle}`);
    return docRef.id;
  },

  updateEnrollmentStatus: async (id: string, status: CourseEnrollment['status'], courseId?: string, userId?: string) => {
    const ref = doc(db, "inscricoes_cursos_detalhes", id);
    await updateDoc(ref, { status });

    if (courseId && userId) {
      const courseRef = doc(db, "cursos", courseId);
      const courseSnap = await getDoc(courseRef);
      if (courseSnap.exists()) {
        const data = courseSnap.data();
        let currentUsers: string[] = data.registeredUsers || [];
        const vagas = Number(data.vagas !== undefined ? data.vagas : (data.totalSlots || 0));

        if (status === 'Aprovado' || status === 'Inscrito') {
          if (!currentUsers.includes(userId)) {
            currentUsers = [...currentUsers, userId];
          }
        } else {
          // Cancelled, Reprovado, etc -> remove
          currentUsers = currentUsers.filter(uid => uid !== userId);
        }
        await updateDoc(courseRef, {
          registeredUsers: currentUsers,
          availableSlots: Math.max(0, vagas - currentUsers.length)
        });
      }

      // Send automated notification
      await notificationsService.sendNotification({
        title: "Atualização de Inscrição em Curso",
        message: `Sua inscrição no curso foi alterada para o status: ${status}.`,
        targetType: "user",
        userId: userId
      });
    }

    await logSistema("inscricao_curso_status_atualizado", `Status da inscrição ${id} atualizado para ${status}.`);
  }
};

// --- SYSTEM NOTIFICATIONS SERVICE ---
export const notificationsService = {
  subscribeNotifications: (userId: string, role: string, callback: (notifications: SystemNotification[]) => void) => {
    return onSnapshot(collection(db, "notificacoes_sistema"), (snapshot) => {
      const items: SystemNotification[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const targetType = data.targetType || "all";
        const targetUser = data.userId || "";
        
        let show = false;
        if (targetType === "all") show = true;
        else if (targetType === "cidadao" && (role === "cidadao" || role === "citizen")) show = true;
        else if (targetType === "colaborador" && role === "colaborador") show = true;
        else if (targetType === "administrador" && (role === "administrador" || role === "admin")) show = true;
        else if (targetType === "user" && targetUser === userId) show = true;

        if (show) {
          items.push({
            id: docSnap.id,
            title: data.title || "",
            message: data.message || "",
            targetType: data.targetType || "all",
            userId: data.userId || "",
            createdAt: data.createdAt || new Date().toISOString(),
            readBy: data.readBy || []
          });
        }
      });
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "notificacoes_sistema");
    });
  },

  sendNotification: async (notif: Omit<SystemNotification, "id" | "createdAt">) => {
    const docRef = await addDoc(collection(db, "notificacoes_sistema"), {
      ...notif,
      createdAt: new Date().toISOString(),
      readBy: []
    });
    return docRef.id;
  },

  markAsRead: async (id: string, userId: string) => {
    const ref = doc(db, "notificacoes_sistema", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      const readBy: string[] = data.readBy || [];
      if (!readBy.includes(userId)) {
        await updateDoc(ref, {
          readBy: [...readBy, userId]
        });
      }
    }
  }
};

// --- SYSTEM CONFIG SERVICE ---
export const systemConfigService = {
  subscribeConfig: (callback: (config: SystemConfig) => void) => {
    return onSnapshot(doc(db, "configuracoes_sistema", "global"), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          id: snapshot.id,
          daysOfOperation: data.daysOfOperation || ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
          municipalHolidays: data.municipalHolidays || [],
          blockedDates: data.blockedDates || [],
          blockedHours: data.blockedHours || [],
          extraHours: data.extraHours || [],
          secretariatOpeningHours: data.secretariatOpeningHours || "08:00 - 17:00",
          unitHours: data.unitHours || { 'unit-1': "08:00 - 17:00", 'unit-2': "08:00 - 17:00", 'unit-3': "08:00 - 17:00" },
          unitCaps: data.unitCaps || { 'unit-1': 50, 'unit-2': 50, 'unit-3': 100 },
          maxCancelHours: data.maxCancelHours !== undefined ? Number(data.maxCancelHours) : 2,
          minNoticeHours: data.minNoticeHours !== undefined ? Number(data.minNoticeHours) : 24,
          landingPageMessage: data.landingPageMessage || "Secretaria Municipal de Promoção Social de Vera Cruz",
          featuredNewsIds: data.featuredNewsIds || [],
          featuredCampaignIds: data.featuredCampaignIds || []
        });
      } else {
        const initialConfig: Omit<SystemConfig, "id"> = {
          daysOfOperation: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
          municipalHolidays: ['2026-01-01', '2026-09-07', '2026-12-25'],
          blockedDates: [],
          blockedHours: [],
          extraHours: [],
          secretariatOpeningHours: "08:00 - 17:00",
          unitHours: { 'unit-1': "08:00 - 17:00", 'unit-2': "08:00 - 17:00", 'unit-3': "08:00 - 17:00" },
          unitCaps: { 'unit-1': 50, 'unit-2': 50, 'unit-3': 100 },
          maxCancelHours: 2,
          minNoticeHours: 24,
          landingPageMessage: "Secretaria Municipal de Promoção Social - Compromisso e respeito com as famílias de Vera Cruz.",
          featuredNewsIds: [],
          featuredCampaignIds: []
        };
        setDoc(doc(db, "configuracoes_sistema", "global"), initialConfig).then(() => {
          callback({ id: "global", ...initialConfig });
        });
      }
    }, (error) => {
      console.warn("Failed subscribing to global config, using memory default:", error);
    });
  },

  updateConfig: async (updates: Partial<Omit<SystemConfig, "id">>) => {
    const ref = doc(db, "configuracoes_sistema", "global");
    await updateDoc(ref, updates);
    await logSistema("configuracoes_atualizadas", "Configurações globais do sistema atualizadas.");
  }
};

// --- BENEFIT TYPES SERVICE ---
export const benefitTypesService = {
  subscribeBenefitTypes: (callback: (types: BenefitType[]) => void) => {
    return onSnapshot(collection(db, "tipos_beneficios"), (snapshot) => {
      const items: BenefitType[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || "",
          description: data.description || ""
        });
      });
      callback(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "tipos_beneficios");
    });
  },

  addBenefitType: async (type: Omit<BenefitType, "id">) => {
    const docRef = await addDoc(collection(db, "tipos_beneficios"), {
      name: type.name,
      description: type.description,
      created_at: new Date().toISOString()
    });
    await logSistema("tipo_beneficio_criado", `Tipo de benefício "${type.name}" criado.`);
    return { ...type, id: docRef.id };
  },

  updateBenefitType: async (id: string, updates: Partial<Omit<BenefitType, "id">>) => {
    const ref = doc(db, "tipos_beneficios", id);
    const cleanedUpdates: any = {};
    if (updates.name !== undefined) cleanedUpdates.name = updates.name;
    if (updates.description !== undefined) cleanedUpdates.description = updates.description;

    await updateDoc(ref, {
      ...cleanedUpdates,
      updated_at: new Date().toISOString()
    });
    await logSistema("tipo_beneficio_atualizado", `Tipo de benefício com ID ${id} atualizado.`);
  },

  deleteBenefitType: async (id: string) => {
    await deleteDoc(doc(db, "tipos_beneficios", id));
    await logSistema("tipo_beneficio_excluido", `Tipo de benefício com ID ${id} excluído.`);
  }
};

export const aiTrainingDocsService = {
  getAll: async (): Promise<AiTrainingDoc[]> => {
    try {
      const q = query(collection(db, "ai_training_docs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as AiTrainingDoc[];
    } catch (error) {
      console.error("Erro ao carregar documentos de IA:", error);
      return [];
    }
  },

  subscribe: (callback: (docs: AiTrainingDoc[]) => void) => {
    const q = query(collection(db, "ai_training_docs"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const items: AiTrainingDoc[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as AiTrainingDoc[];
      callback(items);
    }, (error) => {
      console.error("Erro no onSnapshot do treinamento de IA:", error);
    });
  },

  add: async (docData: Omit<AiTrainingDoc, "id" | "createdAt">): Promise<AiTrainingDoc> => {
    const newDoc = {
      title: docData.title,
      content: docData.content,
      active: docData.active,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(collection(db, "ai_training_docs"), newDoc);
    try {
      await logSistema("doc_ia_criado", `Documento de IA "${docData.title}" adicionado.`);
    } catch (e) {}
    return { ...newDoc, id: docRef.id };
  },

  update: async (id: string, updates: Partial<Omit<AiTrainingDoc, "id" | "createdAt">>): Promise<void> => {
    const ref = doc(db, "ai_training_docs", id);
    await updateDoc(ref, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    try {
      await logSistema("doc_ia_atualizado", `Documento de IA ID ${id} atualizado.`);
    } catch (e) {}
  },

  delete: async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "ai_training_docs", id));
    try {
      await logSistema("doc_ia_deletado", `Documento de IA ID ${id} deletado.`);
    } catch (e) {}
  },

  parsePdf: async (base64Pdf: string): Promise<{ text: string; numpages: number }> => {
    const response = await fetch("/api/admin/parse-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: base64Pdf })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erro ao processar PDF no servidor.");
    }
    return data;
  }
};

