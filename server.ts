import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { db, validateCpf } from "./server/db";
import { User, Schedule, News, Course, BenefitProgram, SempsUnit, JobVacancy } from "./src/types";

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = 3000;

  // --- API ROUTES ---

  // Auth: Register
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name, cpf, address, phone, nis, motherName, fatherName } = req.body;

    if (!email || !password || !name || !cpf || !address || !phone || !nis) {
      return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    // CPF validation
    if (!validateCpf(cpf)) {
      return res.status(400).json({ error: "CPF inválido. Por favor, insira um CPF válido." });
    }

    // Check duplicate CPF or email
    const users = db.getUsers();
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    const cpfExists = users.some(u => u.cpf === cpf);

    if (emailExists) {
      return res.status(400).json({ error: "Este endereço de e-mail já está cadastrado." });
    }
    if (cpfExists) {
      return res.status(400).json({ error: "Este CPF já está cadastrado no sistema." });
    }

    const newUser: User = {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      password: password, // In production, hash passwords. For this application, stored safely on backend JSON.
      name,
      cpf,
      address,
      phone,
      nis,
      motherName,
      fatherName,
      role: 'citizen', // Default role
      createdAt: new Date().toISOString()
    };

    db.addUser(newUser);

    // Don't send password back
    const { password: _, ...userSafe } = newUser;
    res.status(201).json({ success: true, user: userSafe });
  });

  // Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    const { password: _, ...userSafe } = user;
    res.json({ success: true, user: userSafe });
  });

  // Auth: Password Recovery Simulation
  app.post("/api/auth/recover-password", (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Por favor, informe seu e-mail." });
    }

    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Security practice: do not leak if email exists, but here we can return friendly mock success
      return res.json({ success: true, message: "Se este e-mail estiver cadastrado, você receberá instruções de recuperação." });
    }

    res.json({
      success: true,
      message: `Um e-mail de recuperação de senha foi enviado para ${email}. Verifique sua caixa de entrada.`
    });
  });

  // News and Notices
  app.get("/api/news", (req, res) => {
    res.json(db.getNews());
  });

  app.post("/api/news", (req, res) => {
    const { title, content, category, author, isImportant } = req.body;
    if (!title || !content || !category || !author) {
      return res.status(400).json({ error: "Preencha todos os campos da notícia." });
    }

    const newPost: News = {
      id: 'news-' + Math.random().toString(36).substr(2, 9),
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      category,
      author,
      isImportant: !!isImportant
    };

    db.addNews(newPost);
    res.status(201).json(newPost);
  });

  app.delete("/api/news/:id", (req, res) => {
    const { id } = req.params;
    db.deleteNews(id);
    res.json({ success: true });
  });

  // Courses & Workshops
  app.get("/api/courses", (req, res) => {
    res.json(db.getCourses());
  });

  app.post("/api/courses", (req, res) => {
    const { title, description, requirements, totalSlots, category, schedule } = req.body;
    if (!title || !description || !requirements || !totalSlots || !category || !schedule) {
      return res.status(400).json({ error: "Preencha todos os campos do curso." });
    }

    const newCourse: Course = {
      id: 'course-' + Math.random().toString(36).substr(2, 9),
      title,
      description,
      requirements,
      totalSlots: Number(totalSlots),
      availableSlots: Number(totalSlots),
      registeredUsers: [],
      category,
      schedule
    };

    db.addCourse(newCourse);
    res.status(201).json(newCourse);
  });

  app.post("/api/courses/:id/register", (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Identificação do usuário requerida." });
    }

    const success = db.registerUserInCourse(id, userId);
    if (success) {
      res.json({ success: true, message: "Inscrição realizada com sucesso!" });
    } else {
      res.status(400).json({ error: "Não foi possível realizar a inscrição. Vagas esgotadas ou usuário já inscrito." });
    }
  });

  // CadÚnico Scheduling
  app.get("/api/schedules", (req, res) => {
    const { userId, role } = req.query;

    if (role === 'admin') {
      return res.json(db.getSchedules());
    }

    if (!userId) {
      return res.status(400).json({ error: "userId não fornecido." });
    }

    const userSchedules = db.getSchedules().filter(s => s.userId === userId);
    res.json(userSchedules);
  });

  app.post("/api/schedules", (req, res) => {
    const { userId, userName, userCpf, userPhone, date, time, unitId, unitName } = req.body;

    if (!userId || !userName || !userCpf || !userPhone || !date || !time || !unitId || !unitName) {
      return res.status(400).json({ error: "Preencha todos os dados para o agendamento." });
    }

    // Check duplicate active schedule for the same day/time at the same unit
    const schedules = db.getSchedules();
    const conflict = schedules.some(s => s.unitId === unitId && s.date === date && s.time === time && s.status === 'scheduled');
    if (conflict) {
      return res.status(400).json({ error: "Este horário já está agendado nesta unidade. Escolha outro horário." });
    }

    const newSchedule: Schedule = {
      id: 'sched-' + Math.random().toString(36).substr(2, 9),
      userId,
      userName,
      userCpf,
      userPhone,
      date,
      time,
      unitId,
      unitName,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    db.addSchedule(newSchedule);
    res.status(201).json(newSchedule);
  });

  app.post("/api/schedules/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    db.updateScheduleStatus(id, status as any);
    res.json({ success: true });
  });

  // Benefits Query & Updates
  app.get("/api/benefits", (req, res) => {
    const { cpf } = req.query;

    if (!cpf) {
      return res.status(400).json({ error: "CPF obrigatório para consulta." });
    }

    const cleanCpf = (cpf as string).trim();
    const userBenefits = db.getBenefits()[cleanCpf] || [];
    res.json({ cpf: cleanCpf, benefits: userBenefits });
  });

  app.get("/api/benefits/all", (req, res) => {
    // Return all benefit records grouped by CPF for admin
    res.json(db.getBenefits());
  });

  app.post("/api/benefits/update", (req, res) => {
    const { cpf, benefits } = req.body;

    if (!cpf || !benefits) {
      return res.status(400).json({ error: "CPF e lista de benefícios são obrigatórios." });
    }

    db.updateUserBenefits(cpf, benefits);
    res.json({ success: true, message: "Benefícios atualizados com sucesso!" });
  });

  // SEMPS Units
  app.get("/api/units", (req, res) => {
    res.json(db.getUnits());
  });

  app.post("/api/units", (req, res) => {
    const { name, address, phone, hours, services, lat, lng } = req.body;
    if (!name || !address || !phone || !hours || !services) {
      return res.status(400).json({ error: "Preencha todas as informações da unidade." });
    }

    const newUnit: SempsUnit = {
      id: 'unit-' + Math.random().toString(36).substr(2, 9),
      name,
      address,
      phone,
      hours,
      services: Array.isArray(services) ? services : [services],
      lat: Number(lat) || -12.96,
      lng: Number(lng) || -38.60
    };

    db.addUnit(newUnit);
    res.status(201).json(newUnit);
  });

  // Contrata Vera Cruz: Jobs & Freelancers
  app.get("/api/jobs", (req, res) => {
    res.json(db.getJobs());
  });

  app.post("/api/jobs", (req, res) => {
    const { title, company, description, requirements, contact, type, salary, location } = req.body;
    if (!title || !company || !description || !requirements || !contact || !type || !location) {
      return res.status(400).json({ error: "Preencha todas as informações da vaga de trabalho." });
    }

    const newJob: JobVacancy = {
      id: 'job-' + Math.random().toString(36).substr(2, 9),
      title,
      company,
      description,
      requirements,
      contact,
      type,
      salary,
      location,
      createdAt: new Date().toISOString().split('T')[0]
    };

    db.addJob(newJob);
    res.status(201).json(newJob);
  });

  app.delete("/api/jobs/:id", (req, res) => {
    const { id } = req.params;
    db.deleteJob(id);
    res.json({ success: true });
  });

  // Admin Reports and Stats
  app.get("/api/stats", (req, res) => {
    const users = db.getUsers();
    const citizensCount = users.filter(u => u.role === 'citizen').length;
    const schedules = db.getSchedules();
    const activeSchedules = schedules.filter(s => s.status === 'scheduled').length;
    const courses = db.getCourses();
    const totalInscriptions = courses.reduce((acc, c) => acc + c.registeredUsers.length, 0);
    const jobs = db.getJobs().length;

    res.json({
      citizensCount,
      activeSchedules,
      totalInscriptions,
      jobsCount: jobs,
      recentSchedules: schedules.slice(-5).reverse(),
      coursesSummary: courses.map(c => ({ id: c.id, title: c.title, enrolled: c.registeredUsers.length, total: c.totalSlots }))
    });
  });

  // Gemini AI Assistant Chatbot
  app.post("/api/assistant/chat", async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Histórico de mensagens é obrigatório." });
    }

    try {
      // Map frontend messages format to GoogleGenAI SDK format if needed, or join them into standard string prompt.
      // Since it's a simple Q&A chat, we can compile a clean prompt from history.
      const conversationContext = messages.map(m => {
        const role = m.sender === 'user' ? 'Usuário' : 'Assistente';
        return `${role}: ${m.text}`;
      }).join("\n");

      const prompt = `${conversationContext}\nAssistente:`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `Você é o "Assistente Virtual da SEMPS Vera Cruz/BA", um assistente de inteligência artificial da Secretaria Municipal de Promoção Social de Vera Cruz, na Ilha de Itaparica, Bahia.
Sua missão é ajudar os cidadãos locais com dúvidas institucionais, fornecendo respostas amigáveis, informativas, acolhedoras e em conformidade com as regras locais.

Aqui estão as diretrizes sobre como responder sobre cada serviço:
1. CadÚnico (Cadastro Único):
   - É o portão de entrada para todos os programas sociais (Bolsa Família, Tarifa Social, etc.).
   - Deve ser atualizado obrigatoriamente a cada 2 anos, ou sempre que houver mudança de endereço, renda, escola ou composição familiar.
   - Documentos necessários: RG, CPF, Carteira de Trabalho, Título de Eleitor, Comprovante de Residência (Coelba/Embasa) recente, Certidão de Nascimento e Declaração Escolar para crianças/jovens.
   - Os agendamentos podem ser feitos diretamente na nossa plataforma web escolhendo a unidade (CRAS Mar Grande, CRAS Barra do Gil) e horário disponíveis.

2. Benefícios Sociais Municipais e Federais:
   - Bolsa Família: Transferência de renda federal.
   - Bolsa Família Municipal (Auxílio Vera Cruz): Programa municipal para auxílio a famílias em extrema vulnerabilidade.
   - Tarifa Social de Energia Elétrica e Água: Descontos de até 65% na conta de luz e tarifa social de água para inscritos com NIS ativo.
   - Cesta Social Vera Cruz: Suporte alimentar mensal entregue nos CRAS para gestantes, nutrizes, idosos e deficientes de baixa renda.
   - Auxílios Eventuais: Auxílio Natalidade (enxoval e suporte financeiro imediato para novas mães) e Auxílio Funeral.
   - Consulta de Benefício: O cidadão pode consultar o status de aprovação de seus benefícios inserindo o seu CPF na plataforma na aba "Consultar Benefício".

3. Cursos e Oficinas (Capacitação):
   - A SEMPS oferece oficinas gratuitas focadas em inclusão e geração de renda.
   - Cursos atuais: Informática Básica (Inclusão Digital), Oficina de Artesanato em Conchas e Resina da Ilha (Geração de Renda) e Atendimento ao Cliente e Hospitalidade no Turismo (Qualificação Profissional).
   - Inscrições podem ser feitas diretamente pelo aplicativo na aba "Cursos".

4. Unidades de Atendimento (CRAS & Sede):
   - CRAS Mar Grande: Av. ACM, s/n (próximo à Unidade de Saúde). Atendimento das 08h às 17h.
   - CRAS Barra do Gil: Rua da Bica, nº 45. Atendimento das 08h às 17h.
   - Sede SEMPS (Centro): Praça da Matriz, Centro de Vera Cruz. Atendimento administrativo das 08h às 14h.

5. Contrata Vera Cruz:
   - Um portal integrado de empregos locais e oportunidades para freelancers na ilha, impulsionando a empregabilidade local.

Responda sempre com muita empatia, simpatia, clareza e de forma simplificada, em português do Brasil. Mostre orgulho de servir à população de Vera Cruz, BA.`
        }
      });

      const reply = response.text || "Desculpe, tive uma instabilidade temporária ao processar sua dúvida. Como posso ajudá-lo de outra forma?";
      res.json({ reply });
    } catch (error) {
      console.error("Gemini AI error:", error);
      res.status(500).json({ error: "Erro ao comunicar com a inteligência artificial da SEMPS." });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
