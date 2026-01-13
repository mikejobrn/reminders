# Lembretes - PWA estilo iPhone

Aplicativo de lembretes com interface idêntica ao iPhone Reminders, desenvolvido com Next.js 16, React 18+, e PostgreSQL.

## 🚀 Tecnologias

- **Frontend:** Next.js 16.1.1 (App Router), React 18+, TypeScript, Tailwind CSS v4
- **Backend:** NextAuth.js v5, Prisma ORM v7.2.0, PostgreSQL (Neon)
- **Database:** Neon PostgreSQL com @prisma/adapter-neon
- **Real-time:** Socket.io (planejado)
- **PWA:** next-pwa, Service Workers, IndexedDB (Dexie - planejado)
- **Notificações:** OneSignal (planejado)
- **Storage:** Vercel Blob (planejado)
- **Design:** Sistema de cores iOS, Fonte Inter, Ionicons 5
- **Timezone:** Luxon
- **Recorrência:** rrule.js

## ✨ Features Implementadas

- ✅ Autenticação completa (login/registro)
- ✅ Sistema de listas com cores e ícones
- ✅ Lembretes com prioridade, tags, notas
- ✅ Suporte a subtarefas infinitas
- ✅ Dark mode completo
- ✅ Design 100% fiel ao iPhone
- ✅ Proteção de rotas com Proxy (Next.js 16)
- ✅ API RESTful completa
- ✅ Sistema de permissões (compartilhamento de listas)

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Neon (PostgreSQL gratuito)
- Conta na Vercel (hospedagem gratuita) - opcional

## 🔧 Setup Local

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd lembretes
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados (Neon)

1. Acesse [neon.tech](https://neon.tech) e crie uma conta gratuita
2. Crie um novo projeto
3. Copie a connection string (Pooled connection)
4. Crie o arquivo `.env`:

```bash
cp .env.example .env
```

5. Edite `.env` e adicione sua connection string:

```env
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### 4. Execute as migrations do Prisma

```bash
# Rodar migrations
npx prisma migrate dev --name init

# Gerar Prisma Client
npx prisma generate

# Criar dados de teste (opcional)
npx prisma db seed
```

**Credenciais de teste criadas pelo seed:**
- Email: `teste@lembretes.app`
- Senha: `123456`

### 5. Configure o NextAuth.js

Gere um secret para o NextAuth:

```bash
openssl rand -base64 32
```

Adicione ao `.env`:

```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu-secret-gerado-aqui"
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## 🎯 Funcionalidades Principais

### Autenticação
- Login com email e senha
- Registro de novos usuários
- Sessão persistente
- Proteção automática de rotas

### Listas
- Criar, editar, excluir listas
- Cores e ícones personalizados
- Contador de tarefas incompletas
- Sistema de permissões (compartilhamento)

### Lembretes
- Criar, editar, excluir lembretes
- Prioridades (baixa, média, alta)
- Tags coloridas
- Notas e anexos
- Data e hora com timezone
- Recorrência
- Subtarefas infinitas

## 🌐 Deploy na Vercel

### 1. Instale o Vercel CLI

```bash
npm install -g vercel
```

### 2. Faça login

```bash
vercel login
```

### 3. Configure o projeto

```bash
vercel link
```

### 4. Adicione as variáveis de ambiente

```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add ONESIGNAL_APP_ID
vercel env add ONESIGNAL_REST_API_KEY
```

Ou adicione pelo dashboard da Vercel: Settings → Environment Variables

### 5. Deploy

```bash
vercel --prod
```

### 6. Configure deploy automático

1. Conecte seu repositório GitHub à Vercel
2. Cada push na branch `main` fará deploy automático

## 📱 Features

### Implementadas
- ✅ Autenticação (email/senha)
- ✅ Design system iOS completo
- ✅ Dark mode
- ✅ Schema de banco de dados completo
- ✅ Configuração PWA básica

### Em desenvolvimento
- 🚧 CRUD de listas e tarefas
- 🚧 Subtarefas infinitas
- 🚧 Drag and drop
- 🚧 Timezone handling (Luxon)
- 🚧 Recorrência (rrule.js)
- 🚧 Notificações push (OneSignal)
- 🚧 Offline-first (IndexedDB)
- 🚧 Tempo real (Socket.io)
- 🚧 Compartilhamento de listas
- 🚧 Anexos de arquivos

### Planejadas (Fase 2)
- ⏳ Lembretes por localização
- ⏳ Visualização em calendário
- ⏳ Export/Import de dados
- ⏳ Modo avançado de recorrência

## 🎨 Design System

O design replica fielmente o aplicativo Lembretes do iPhone:

- **Cores:** Sistema de cores iOS (light/dark)
- **Fonte:** Inter (similar à SF Pro)
- **Ícones:** Ionicons 5 (estilo iOS)
- **Animações:** Spring animations, fade, scale
- **Gestos:** Swipe, pull-to-refresh
- **Haptic:** Vibration API

## 📖 Scripts disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Linter
npm run lint

# Prisma Studio (visualizar banco)
npx prisma studio

# Reset do banco (CUIDADO: apaga todos os dados)
npx prisma migrate reset
```

## 🐛 Troubleshooting

### Erro de conexão com banco de dados
- Verifique se a `DATABASE_URL` está correta
- Certifique-se de que incluiu `?sslmode=require` no final
- Teste a conexão: `npx prisma db pull`

### Erro no NextAuth
- Verifique se `NEXTAUTH_SECRET` está configurado
- Em produção, configure `NEXTAUTH_URL` com sua URL da Vercel

### PWA não funciona
- PWA só funciona em HTTPS (exceto localhost)
- Limpe o cache do navegador e service workers

### Fontes não carregam
- Verifique se as fontes estão em `/public/fonts/inter/`
- Limpe o cache: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)

## 📄 Licença

ISC

## 👤 Autor

Desenvolvido para uso pessoal/caseiro.
