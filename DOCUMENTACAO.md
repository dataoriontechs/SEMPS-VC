# Documentação do Sistema - SEMPS VC (Vera Cruz/BA)

Esta documentação descreve as tecnologias utilizadas, a arquitetura do sistema, os perfis de usuários, o funcionamento das principais regras de negócio e o guia detalhado para publicação do frontend no **GitHub Pages** integrando com o backend **Firebase**.

---

## 🛠️ 1. Tecnologias Utilizadas

O sistema **SEMPS VC** foi desenvolvido seguindo uma arquitetura robusta, moderna e altamente responsiva (Mobile-First com precisão Desktop):

### Frontend (SPA - Single Page Application)
* **React 19 & TypeScript**: Framework principal, garantindo alta performance, tipagem estática e reatividade de dados.
* **Vite**: Ferramenta de build extremamente veloz e moderna para servir os arquivos estáticos de forma otimizada.
* **Tailwind CSS v4**: Utilitários de estilização integrados diretamente ao Vite, permitindo um design moderno, limpo, de alto contraste e totalmente responsivo.
* **Motion (f.k.a. Framer Motion)**: Micro-animações fluidas, transições de rotas e efeitos visuais suaves (fade-in, ripples, etc.).
* **Lucide React**: Biblioteca de ícones vetoriais modernos e uniformes.
* **Recharts**: Renderização de gráficos e dashboards interativos para o Painel Administrativo.

### Backend, Banco de Dados & Infraestrutura Serverless
* **Firebase Firestore**: Banco de dados não-relacional (NoSQL) em tempo real, utilizado para armazenamento persistente de dados de usuários, agendamentos, cursos, vagas e configurações.
* **Firebase Authentication**: Sistema robusto de cadastro, login e controle de sessões seguro, em conformidade com a LGPD.
* **Regras de Segurança do Firestore (`firestore.rules`)**: Segurança nativa configurada a nível de banco de dados, protegendo escritas não autorizadas e assegurando a privacidade dos dados dos cidadãos.
* **Express & Node.js (Servidor Backend)**: Servidor intermediário usado em ambiente de desenvolvimento/produção para prover APIs seguras de IA (Gemini API) e uploads de mídia (Cloudinary).

---

## 👥 2. Tipos de Usuários (Perfis de Acesso)

O sistema possui dois perfis principais de usuários que definem as permissões de visualização e ação na plataforma:

### A. Cidadão (Citizen)
* **Acesso**: Público geral de Vera Cruz/BA.
* **Funcionalidades**:
  1. **Cadastro e Login Seguro**: Acesso com CPF, NIS, endereço, telefone e senha.
  2. **Agendamento do CadÚnico**: Escolha de Unidade SEMPS (CRAS, etc.), data livre no calendário interativo e horário.
  3. **Visualização de Agendamentos**: Consulta de histórico de agendamentos e emissão de recibos digitais com QR Code de confirmação.
  4. **Cancelamento de Agendamento**: Cancelar agendamentos marcados se houver imprevistos.
  5. **Cursos e Oficinas**: Visualizar ofertas de capacitação e realizar inscrição direta (com fila de espera se as vagas acabarem).
  6. **Vagas de Emprego**: Consultar oportunidades de trabalho locais na aba "Contrata Vera Cruz" e obter instruções de candidatura.
  7. **Consulta de Benefícios**: Pesquisar se seu CPF/NIS possui algum benefício municipal ativo (ex: Auxílio Natalidade, Cesta Básica, etc.).
  8. **Assistente Virtual Inteligente**: Chat interativo com IA para tirar dúvidas sobre serviços da prefeitura.

### B. Administrador / Colaborador (Admin/Collaborator)
* **Acesso**: Servidores públicos e gestores da SEMPS.
* **Funcionalidades**:
  1. **Dashboard de Visão Geral**: Métricas em tempo real sobre total de agendamentos do dia, usuários cadastrados, vagas abertas e inscrições de cursos.
  2. **Gestão de Agendamentos**: Visualização, controle de presença (Presença confirmada, Atendido, Falta) e agendamento manual para cidadãos sem acesso à internet.
  3. **Gestão de Benefícios**: Cadastro de novos cidadãos elegíveis a benefícios de transferência de renda municipais.
  4. **Cadastro de Cursos/Oficinas**: Criar, editar, desativar e excluir cursos, controlando número de vagas e imagens de destaque.
  5. **Postagem de Vagas**: Cadastrar e excluir vagas de emprego disponíveis.
  6. **Gestão de Banners**: Adicionar novos banners institucionais na tela inicial (Home) e alternar o status de ativação deles.
  7. **Reset de Senhas**: Capacidade de resetar a senha de um usuário comum de volta para o padrão `"12345678"` caso ele a esqueça.
  8. **Gestão de Unidades SEMPS**: Cadastrar e gerenciar os postos de atendimento da secretaria.

---

## 🔄 3. Principais Regras de Negócio Implementadas

### Limitação Inteligente de Agendamentos (Nova Melhoria)
* **Regra**: Cada cidadão só pode ter **um agendamento ativo** por serviço (como CadÚnico).
* **Melhoria de Passagem de Data**: Caso o cidadão tenha realizado um agendamento para uma data que **já passou** (data retroativa), o sistema automaticamente detecta que essa data já expirou. Portanto, ele **não é mais considerado um agendamento ativo**, liberando o cidadão para agendar um novo atendimento normalmente no calendário, sem precisar de intervenção manual para excluir ou cancelar o agendamento anterior.

### Sem Diálogos de Sistema (Anti-Iframe Blocking)
* Para garantir o funcionamento perfeito em celulares, em visualizações de iFrame do AI Studio e navegadores integrados, todas as janelas do tipo `window.confirm` e `window.alert` foram substituídas por **Modais Visuais de Confirmação customizados e estilizados** (utilizando Tailwind e micro-animações do Motion). Isso impede o bloqueio do navegador e proporciona uma interface de altíssimo nível estético.

---

## 🚀 4. Guia de Publicação no GitHub Pages (Frontend Estático)

Como o sistema é uma **Single Page Application (SPA)** em React, seu frontend pode rodar de forma **100% gratuita no GitHub Pages**. O banco de dados e autenticação continuarão funcionando diretamente pelo Firebase.

Siga os passos abaixo para publicar o frontend no GitHub Pages:

### Passo A: Ajuste no arquivo `vite.config.ts`
Por padrão, o GitHub Pages serve seu site sob um subdiretório (exemplo: `https://seu-usuario.github.io/nome-do-repositorio/`). Portanto, você deve ajustar a propriedade `base` do Vite para refletir isso.

No seu arquivo `vite.config.ts`, adicione a propriedade `base`:

```ts
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // IMPORTANTE: Adicione esta linha. Substitua "nome-do-repositorio" pelo nome exato do seu projeto no GitHub.
    base: '/nome-do-repositorio/', 
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
```
*(Nota: Se você for usar um domínio personalizado no GitHub Pages, como `www.meusite.com.br`, mantenha `base: '/'`)*.

### Passo B: Criação do arquivo de SPA Fallback (`404.html`)
Como o React Router / Navbar gerencia as rotas no lado do cliente, se o usuário recarregar a página `/cadas-unico` diretamente no GitHub Pages, o servidor do GitHub retornará um erro `404`.

Para resolver isso de forma simples:
1. Copie o arquivo `index.html` da raiz do seu projeto.
2. Renomeie a cópia para `404.html` e coloque-a na mesma pasta de saída dos arquivos compilados (ou na pasta `public` antes do build).
3. Isso fará com que o GitHub Pages redirecione qualquer rota inválida para o seu app React, que processará a rota correta dinamicamente.

### Passo C: Configuração das Variáveis do Firebase no Frontend
Certifique-se de que as configurações do Firebase em `/src/lib/firebase.ts` usam as chaves corretas expostas pelo Vite. O arquivo `/src/lib/firebase.ts` utiliza as variáveis de ambiente prefixadas com `VITE_` para que fiquem acessíveis no navegador:

```env
VITE_FIREBASE_API_KEY=sua_api_key_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### Passo D: O que fazer com as rotas de backend `/api/`?
O GitHub Pages é uma hospedagem estática e **não consegue rodar o código do servidor Node.js/Express (`server.ts`)**.

As seguintes funcionalidades do sistema dependem do servidor Express:
1. **Assistente Virtual (Gemini Chat)**: utiliza `/api/assistant/chat` para não expor a chave de API do Gemini no navegador.
2. **Upload de Imagens (Cloudinary)**: utiliza as rotas `/api/cloudinary/*` para gerenciar as credenciais com segurança.

#### Como lidar com isso para colocar em produção?

* **Opção 1 (Recomendada): Hospedar o Servidor Intermediário em uma nuvem gratuita ou barata**
  Você pode publicar o servidor Express (`server.ts`) em plataformas como **Render**, **Fly.io**, **Railway** ou **Google Cloud Run**.
  * No painel dessas plataformas, você configurará as variáveis de ambiente secretas: `GEMINI_API_KEY`, `CLOUDINARY_URL`, etc.
  * No código do frontend (ex: em `src/components/AiAssistant.tsx` e `src/services/cloudinaryService.ts`), altere as chamadas `fetch('/api/...')` para apontar para a URL do seu servidor hospedado, por exemplo: `fetch('https://sua-api.onrender.com/api/...')`.

* **Opção 2 (Simplificada / Apenas Frontend): Desativar ou adaptar recursos dependentes**
  * Para o upload de imagens, no Painel Administrativo você pode substituir o upload via arquivo por um **campo de texto simples de URL de imagem** (permitindo que o administrador apenas cole o link de uma imagem hospedada no Imgur, Postimages ou no próprio Firebase Storage).
  * Para o chat do Assistente Virtual, você pode mudar a chamada de API de chat para ser feita diretamente no client-side utilizando a biblioteca `@google/genai` (embora exponha a API key no código compilado se não for protegida, não sendo o ideal para ambientes produtivos com alto tráfego).

---

## 📦 5. Scripts de Compilação do Projeto

* Para gerar a pasta final com os arquivos compilados do frontend estático, execute na raiz do projeto:
  ```bash
  npm run build
  ```
  Isso gerará a pasta `dist/` com todos os arquivos estáticos compilados (HTML, JS, CSS, imagens). É o conteúdo desta pasta `dist/` que deve ser publicado na branch `gh-pages` ou pasta `docs` do seu repositório no GitHub.

---

Com esta arquitetura, o seu sistema estará completamente seguro, escalável, livre de custos fixos de banco de dados e com um frontend performático distribuído globalmente via GitHub Pages!
