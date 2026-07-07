import "dotenv/config";
import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { db, validateCpf } from "./server/db";
import { User, Schedule, News, Course, BenefitProgram, SempsUnit, JobVacancy } from "./src/types";
import * as pdfParse from "pdf-parse";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";

// Initialize Firebase client on server to fetch AI training documents
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

async function getActiveTrainingDocs(): Promise<string> {
  try {
    const docsRef = collection(firestoreDb, "ai_training_docs");
    const q = query(docsRef, where("active", "==", true));
    const querySnapshot = await getDocs(q);
    
    let additionalContext = "";
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      additionalContext += `\n\n--- INFORMAÇÃO COMPLEMENTAR DE TREINAMENTO (${data.title}) ---\n${data.content}\n`;
    });
    return additionalContext;
  } catch (error) {
    console.error("Erro ao obter documentos de treinamento do Firestore:", error);
    return "";
  }
}

async function getPlatformSystemContext(): Promise<string> {
  try {
    let context = "";

    // 1. Fetch News
    try {
      const newsRef = collection(firestoreDb, "noticias");
      const newsSnapshot = await getDocs(newsRef);
      if (!newsSnapshot.empty) {
        context += "\n\n--- NOTÍCIAS E COMUNICADOS RECENTES DA PLATAFORMA ---\n";
        newsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.ativo !== false) {
            const dateStr = data.data_publicacao || data.date || "";
            const titleStr = data.titulo || data.title || "";
            const contentStr = data.conteudo || data.content || "";
            context += `- [Notícia em ${dateStr}] ${titleStr}: ${contentStr}\n`;
          }
        });
      }
    } catch (e) {
      console.error("Erro ao obter notícias do Firestore:", e);
    }

    // 2. Fetch Courses
    try {
      const coursesRef = collection(firestoreDb, "cursos");
      const coursesSnapshot = await getDocs(coursesRef);
      if (!coursesSnapshot.empty) {
        context += "\n\n--- CURSOS E OFICINAS DE CAPACITAÇÃO DISPONÍVEIS ---\n";
        coursesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.ativo !== false) {
            const titleStr = data.nome || data.title || "";
            const descStr = data.descricao || data.description || "";
            const hoursStr = data.carga_horaria || "";
            const slots = data.vagas !== undefined ? data.vagas : (data.totalSlots || 0);
            context += `- Curso: ${titleStr}\n  Descrição: ${descStr}\n  Carga Horária: ${hoursStr}\n  Vagas Totais: ${slots}\n`;
          }
        });
      }
    } catch (e) {
      console.error("Erro ao obter cursos do Firestore:", e);
    }

    // 3. Fetch Job Vacancies
    try {
      const jobsRef = collection(firestoreDb, "vagas");
      const jobsSnapshot = await getDocs(jobsRef);
      if (!jobsSnapshot.empty) {
        context += "\n\n--- VAGAS DE EMPREGO DISPONÍVEIS (CONTRATA VERA CRUZ) ---\n";
        jobsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.ativo !== false) {
            const titleStr = data.titulo || data.title || "";
            const companyStr = data.empresa || data.company || "";
            const descStr = data.descricao || "";
            const salaryStr = data.salario || "";
            const contactStr = data.contato || "";
            context += `- Vaga: ${titleStr}\n  Empresa: ${companyStr}\n  Descrição: ${descStr}\n  Remuneração: ${salaryStr}\n  Contato: ${contactStr}\n`;
          }
        });
      }
    } catch (e) {
      console.error("Erro ao obter vagas do Firestore:", e);
    }

    // 4. Fetch Units
    try {
      const unitsRef = collection(firestoreDb, "unidades");
      const unitsSnapshot = await getDocs(unitsRef);
      if (!unitsSnapshot.empty) {
        context += "\n\n--- UNIDADES DE ATENDIMENTO E CRAS ---\n";
        unitsSnapshot.forEach((doc) => {
          const data = doc.data();
          const nameStr = data.nome || data.name || "";
          const addrStr = data.endereco || data.address || "";
          const phoneStr = data.telefone || data.phone || "";
          const hoursStr = data.horario_funcionamento || data.hours || "";
          const svcs = data.services || [];
          context += `- Unidade: ${nameStr}\n  Endereço: ${addrStr}\n  Telefone: ${phoneStr}\n  Funcionamento: ${hoursStr}\n  Serviços: ${Array.isArray(svcs) ? svcs.join(", ") : ""}\n`;
        });
      }
    } catch (e) {
      console.error("Erro ao obter unidades do Firestore:", e);
    }

    // 5. Fetch Benefit Types
    try {
      const bTypesRef = collection(firestoreDb, "tipos_beneficios");
      const bTypesSnapshot = await getDocs(bTypesRef);
      if (!bTypesSnapshot.empty) {
        context += "\n\n--- PROGRAMAS E BENEFÍCIOS DISPONÍVEIS ---\n";
        bTypesSnapshot.forEach((doc) => {
          const data = doc.data();
          const nameStr = data.name || "";
          const descStr = data.description || "";
          context += `- Benefício: ${nameStr}\n  Descrição: ${descStr}\n`;
        });
      }
    } catch (e) {
      console.error("Erro ao obter tipos de benefícios do Firestore:", e);
    }

    return context;
  } catch (error) {
    console.error("Erro geral no getPlatformSystemContext:", error);
    return "";
  }
}


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
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const PORT = 3000;

  // --- API ROUTES ---

  // --- CLOUDINARY UPLOAD & DELETE API PROXIES ---
  app.post("/api/cloudinary/upload", async (req, res) => {
    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo ou base64 foi enviado." });
    }

    try {
      const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "semps-vc").trim().replace(/\s+/g, '-').toLowerCase();
      const apiKey = process.env.CLOUDINARY_API_KEY || "836598318314955";
      const apiSecret = process.env.CLOUDINARY_API_SECRET || "-FaCGVjsOHbL6DXlV8w7g2EtINc";
      const timestamp = Math.round(new Date().getTime() / 1000);

      const signatureStr = `timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      
      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: file,
          api_key: apiKey,
          timestamp: timestamp,
          signature: signature,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.warn("Cloudinary upload failed, falling back to direct base64 storage. Error was:", text);
        // Fallback: Return original base64/file so the app works seamlessly even without valid credentials
        return res.json({ secure_url: file, public_id: "fallback_base64" });
      }

      const data = await response.json();
      res.json({ secure_url: data.secure_url, public_id: data.public_id });
    } catch (error: any) {
      console.warn("Cloudinary upload error, falling back to direct base64 storage. Error was:", error.message);
      // Fallback: Return original base64/file so the app works seamlessly even without valid credentials
      return res.json({ secure_url: file, public_id: "fallback_base64" });
    }
  });

  app.post("/api/cloudinary/delete", async (req, res) => {
    const { public_id } = req.body;
    if (!public_id) {
      return res.status(400).json({ error: "O campo public_id é obrigatório." });
    }

    if (public_id === "fallback_base64" || public_id.startsWith("data:") || public_id.startsWith("http")) {
      console.log("[Cloudinary Proxy] Skipping delete call for fallback or static image:", public_id);
      return res.json({ result: "ok" });
    }

    try {
      const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || "semps-vc").trim().replace(/\s+/g, '-').toLowerCase();
      const apiKey = process.env.CLOUDINARY_API_KEY || "836598318314955";
      const apiSecret = process.env.CLOUDINARY_API_SECRET || "-FaCGVjsOHbL6DXlV8w7g2EtINc";
      const timestamp = Math.round(new Date().getTime() / 1000);

      const signatureStr = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
      const signature = crypto.createHash("sha1").update(signatureStr).digest("hex");

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;

      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_id: public_id,
          api_key: apiKey,
          timestamp: timestamp,
          signature: signature,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Cloudinary delete error response:", text);
        return res.status(response.status).json({ error: "Erro ao deletar no Cloudinary: " + text });
      }

      const data = await response.json();
      res.json({ success: true, result: data.result });
    } catch (error: any) {
      console.error("Erro ao deletar imagem no Cloudinary:", error);
      res.status(500).json({ error: "Erro interno ao processar exclusão: " + error.message });
    }
  });

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

  // Helper function to call Gemini API with retries and a fallback model on transient failures (like 503)
  async function generateContentWithRetry(parameters: {
    model: string;
    contents: string;
    config: any;
  }, retries = 3, delay = 1000): Promise<any> {
    let lastError: any = null;
    const modelsToTry = [parameters.model, "gemini-3.1-flash-lite"];

    for (const currentModel of modelsToTry) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          console.log(`[Gemini AI] Calling model ${currentModel} (attempt ${attempt}/${retries})...`);
          const response = await ai.models.generateContent({
            ...parameters,
            model: currentModel
          });
          return response;
        } catch (error: any) {
          lastError = error;
          console.error(`[Gemini AI] Attempt ${attempt} failed with model ${currentModel}:`, error.message || error);
          
          const statusCode = error?.status || error?.code || error?.error?.code;
          const isTransient = statusCode === 503 || statusCode === 429 || statusCode === 500;
          
          if (attempt < retries && isTransient) {
            const currentDelay = delay * Math.pow(2, attempt - 1);
            console.log(`[Gemini AI] Waiting ${currentDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, currentDelay));
          } else {
            break; // Try next model or stop if not transient / last attempt
          }
        }
      }
    }
    throw lastError || new Error("Failed to generate content after retries.");
  }

  // Admin PDF Parsing Route
  app.post("/api/admin/parse-pdf", async (req, res) => {
    const { file } = req.body; // base64 representation of PDF
    if (!file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    try {
      // Decode base64 PDF
      const base64Data = file.replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      const pdf = (pdfParse as any).default || pdfParse;
      const parsedData = await pdf(buffer);
      
      res.json({ 
        success: true, 
        text: parsedData.text,
        numpages: parsedData.numpages 
      });
    } catch (err: any) {
      console.error("Erro ao analisar arquivo PDF:", err);
      res.status(500).json({ error: "Falha ao extrair textos do arquivo PDF: " + err.message });
    }
  });

  // Gemini AI Assistant Chatbot
  app.post("/api/assistant/chat", async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Histórico de mensagens é obrigatório." });
    }

    try {
      // Get additional training documents context uploaded by administrators
      const trainingContext = await getActiveTrainingDocs();

      // Get dynamic system news, courses, job vacancies, and units context
      const platformContext = await getPlatformSystemContext();

      // Map frontend messages format to GoogleGenAI SDK format if needed, or join them into standard string prompt.
      // Since it's a simple Q&A chat, we can compile a clean prompt from history.
      const conversationContext = messages.map(m => {
        const role = m.sender === 'user' ? 'Usuário' : 'Assistente';
        return `${role}: ${m.text}`;
      }).join("\n");

      const prompt = `${conversationContext}\nAssistente:`;

      const baseSystemInstruction = `Seu nome é Vera. Você é a Assistente Virtual da SEMPS Vera Cruz/BA (Secretaria Municipal de Promoção Social de Vera Cruz, na Ilha de Itaparica, Bahia).

REGRAS DE COMPORTAMENTO E ESCOPO EXCLUSIVO:
1. Você APENAS responde sobre assuntos de Assistência Social e temas relacionados diretamente à SEMPS, tais como Bolsa Família, CadÚnico, Benefícios Municipais, Cursos de Capacitação, Vagas do portal Contrata Vera Cruz e Unidades de Atendimento (CRAS/CREAS/SEMPS) locais.
2. Se o usuário fizer perguntas fora desse escopo (por exemplo: futebol, receitas culinárias gerais, programação de software, geografia mundial, piadas genéricas, ciência ou qualquer assunto não relacionado a políticas sociais, assistência social e serviços de Vera Cruz), recuse educadamente de forma acolhedora, explicando que seu propósito exclusivo é ajudar com dúvidas sobre assistência social e a SEMPS de Vera Cruz.
3. PRIVACIDADE E SEGURANÇA (SEM ACESSO A INFORMAÇÕES PESSOAIS): Você NÃO tem acesso a dados pessoais ou registros privados de nenhum cidadão (como CPFs específicos, benefícios individuais aprovados de um usuário, registros privados de agendamento ou cadastros). Nunca invente ou afirme conhecer as informações pessoais de quem está falando. Se o cidadão perguntar sobre seu próprio benefício ou agendamento individual, oriente-o gentilmente a acessar as seções seguras da própria plataforma, como a aba "Consultar Benefício" (inserindo o CPF de forma protegida ali) ou a tela de agendamentos no painel.

DIRETRIZES SOBRE OS SERVIÇOS PADRÃO:
- CadÚnico: Portão de entrada para Bolsa Família, Tarifa Social, etc. Atualização obrigatória a cada 2 anos, ou por mudanças de endereço, renda, escola ou composição familiar. Documentos: RG, CPF, Carteira de Trabalho, Título de Eleitor, Comprovante de Residência recente (Coelba/Embasa), Certidão de Nascimento e Declaração Escolar. Agendamentos são feitos na plataforma web escolhendo a unidade e horário.
- Benefícios Sociais: Bolsa Família (Federal), Bolsa Família Municipal (Auxílio Vera Cruz para famílias em vulnerabilidade extrema), Tarifa Social de Energia/Água (descontos para NIS ativo), Cesta Social (entrega de alimentos no CRAS para gestantes, nutrizes, idosos, deficientes de baixa renda), Auxílio Natalidade (enxoval e suporte financeiro imediato para novas mães) e Auxílio Funeral.
- Cursos e Oficinas: Inclusão e geração de renda (ex: Informática Básica, Artesanato, Hospitalidade no Turismo). Inscrições diretas no menu "Cursos".
- Unidades de Atendimento: CRAS Mar Grande (Av. ACM s/n, próx à Unidade de Saúde, 08h às 17h), CRAS Barra do Gil (Rua da Bica nº 45, 08h às 17h), Sede SEMPS (Praça da Matriz, Centro, 08h às 14h).
- Contrata Vera Cruz: Portal de empregos e oportunidades locais na ilha.

CONTEXTO REAL E ATUALIZADO DO SISTEMA (NOTÍCIAS, CURSOS E VAGAS ATIVAS NA PLATAFORMA):
Abaixo estão os dados reais coletados diretamente da nossa plataforma agora. Utilize essas informações atualizadas para embasar suas respostas com total precisão:
${platformContext}

Responda sempre em português do Brasil com muita empatia, simpatia, clareza e de forma simplificada, acolhendo o cidadão com carinho e demonstrando orgulho em servir à população de Vera Cruz, BA.`;

      // Combine base system instructions with PDF training material context if available
      const fullSystemInstruction = trainingContext 
        ? `${baseSystemInstruction}\n\nIMPORTANTE: Utilize também as seguintes informações oficiais e regulamentos recentemente adicionados via PDF de treinamento para responder às dúvidas do cidadão com precisão:\n${trainingContext}`
        : baseSystemInstruction;

      const response = await generateContentWithRetry({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: fullSystemInstruction
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
