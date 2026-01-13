# 🚀 Guia de Deploy - Lembretes PWA

Este guia detalha o processo completo de deploy do aplicativo na Vercel com banco de dados Neon e notificações OneSignal.

## 📋 Checklist Pré-Deploy

- [ ] Código commitado no GitHub
- [ ] Conta criada no Neon (neon.tech)
- [ ] Conta criada na Vercel (vercel.com)
- [ ] Conta criada no OneSignal (onesignal.com)
- [ ] Todas as variáveis de ambiente documentadas

## 1️⃣ Configurar Banco de Dados (Neon - Gratuito)

### Criar conta e projeto

1. Acesse [neon.tech](https://neon.tech)
2. Clique em "Sign Up" (pode usar GitHub)
3. Clique em "Create Project"
4. Preencha:
   - **Project name:** lembretes-db
   - **Region:** US East (Ohio) - mais próximo do Brasil
   - **Postgres version:** 16 (latest)
5. Clique em "Create Project"

### Copiar Connection String

1. Na dashboard do projeto, clique em "Connection Details"
2. Selecione "Pooled connection"
3. Copie a connection string:
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Salve em local seguro** (vamos usar depois)

### Rodar Migrations (Local primeiro)

```bash
# Criar arquivo .env local
cp .env.example .env

# Editar .env e adicionar DATABASE_URL
# DATABASE_URL="postgresql://..."

# Rodar migrations
npx prisma migrate dev --name init

# Gerar Prisma Client
npx prisma generate
```

## 2️⃣ Configurar Notificações (OneSignal - Gratuito)

### Criar conta e app

1. Acesse [onesignal.com](https://onesignal.com)
2. Clique em "Get Started Free"
3. Crie uma conta (pode usar email ou Google)
4. Clique em "New App/Website"
5. Preencha:
   - **App Name:** Lembretes
   - **Platform:** Web Push
6. Clique em "Next"

### Configurar Web Push

1. **Site URL:** `https://seu-dominio.vercel.app` (usaremos depois)
2. **Site Name:** Lembretes
3. **Auto Resubscribe:** Enabled
4. **Default Icon URL:** (deixe em branco por enquanto)
5. Clique em "Save"

### Copiar credenciais

1. No menu lateral, clique em "Settings" → "Keys & IDs"
2. Copie:
   - **OneSignal App ID:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
   - **REST API Key:** `YourRestApiKeyHere`
3. **Salve em local seguro**

## 3️⃣ Configurar Vercel

### Criar conta e projeto

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Sign Up" com GitHub
3. Autorize o acesso ao GitHub
4. Clique em "Import Project"
5. Selecione seu repositório `lembretes`

### Configurar variáveis de ambiente

Na tela de configuração do projeto, clique em "Environment Variables" e adicione:

#### 1. DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
Environment: Production, Preview, Development
```

#### 2. NEXTAUTH_URL
```
Key: NEXTAUTH_URL
Value: https://seu-projeto.vercel.app
Environment: Production, Preview
```
*Para Development, use `http://localhost:3000`*

#### 3. NEXTAUTH_SECRET
Gere um secret seguro:
```bash
openssl rand -base64 32
```
Copie o resultado e adicione:
```
Key: NEXTAUTH_SECRET
Value: [seu-secret-gerado]
Environment: Production, Preview, Development
```

#### 4. ONESIGNAL_APP_ID
```
Key: ONESIGNAL_APP_ID
Value: [seu-onesignal-app-id]
Environment: Production, Preview, Development
```

#### 5. ONESIGNAL_REST_API_KEY
```
Key: ONESIGNAL_REST_API_KEY
Value: [sua-onesignal-api-key]
Environment: Production, Preview, Development
```

#### 6. BLOB_READ_WRITE_TOKEN (configurar depois)
```
Key: BLOB_READ_WRITE_TOKEN
Value: [vercel-blob-token]
Environment: Production, Preview, Development
```

### Deploy inicial

1. Clique em "Deploy"
2. Aguarde o build (2-3 minutos)
3. Quando concluído, copie a URL: `https://seu-projeto.vercel.app`

## 4️⃣ Finalizar configuração OneSignal

### Atualizar Site URL

1. Volte ao OneSignal
2. Settings → All Browsers
3. Atualize **Site URL** com sua URL da Vercel
4. Clique em "Save"

### Testar notificações

1. Acesse sua PWA: `https://seu-projeto.vercel.app`
2. Ao fazer login, deve aparecer prompt de notificação
3. Clique em "Permitir"
4. Teste criando um lembrete com data/hora

## 5️⃣ Configurar Vercel Blob (Anexos de arquivos)

### Criar Blob Store

1. No dashboard da Vercel, abra seu projeto
2. Clique em "Storage" → "Create Database"
3. Selecione "Blob"
4. Clique em "Create"
5. Conecte ao seu projeto

### Copiar token

1. Em "Settings" → "Environment Variables"
2. A Vercel já criou automaticamente: `BLOB_READ_WRITE_TOKEN`
3. Verifique se está presente nos 3 ambientes

## 6️⃣ Deploy Automático (GitHub)

### Configurar GitHub Actions (opcional)

Se quiser ter mais controle sobre o deploy, configure GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Deploy automático padrão

Por padrão, a Vercel já faz deploy automático:
- **Push na `main`** → Deploy em produção
- **Pull Request** → Deploy de preview
- **Push em outras branches** → Deploy de preview

## 🔍 Verificações Pós-Deploy

### Teste o aplicativo

- [ ] Acesse `https://seu-projeto.vercel.app`
- [ ] PWA é instalável (ícone de instalação no navegador)
- [ ] Cadastro de usuário funciona
- [ ] Login funciona
- [ ] Dark mode funciona
- [ ] Notificações pedem permissão
- [ ] Criar lembrete funciona

### Verifique logs

1. Dashboard Vercel → "Logs"
2. Procure por erros
3. Se houver erro de conexão com banco:
   - Verifique se `DATABASE_URL` está correta
   - Verifique se migrations foram executadas

### Rodar migrations em produção

```bash
# Conectar ao banco de produção
DATABASE_URL="sua-production-url" npx prisma migrate deploy

# Ou via Vercel CLI
vercel env pull .env.production
npx prisma migrate deploy
```

## 🐛 Troubleshooting Comum

### Erro: "Error connecting to database"

**Solução:**
1. Verifique se `DATABASE_URL` contém `?sslmode=require`
2. Teste conexão local: `npx prisma db pull`
3. Verifique se IP não está bloqueado no Neon

### Erro: "NEXTAUTH_URL is not defined"

**Solução:**
1. Adicione `NEXTAUTH_URL` nas variáveis de ambiente
2. Use a URL completa: `https://seu-projeto.vercel.app`
3. Não use `localhost` em produção

### Erro: "OneSignal failed to initialize"

**Solução:**
1. Verifique se `ONESIGNAL_APP_ID` está correto
2. Verifique se URL do site no OneSignal corresponde à URL da Vercel
3. Certifique-se de estar usando HTTPS

### PWA não instala

**Solução:**
1. Abra DevTools → Application → Manifest
2. Verifique se há erros no manifest.json
3. Certifique-se de ter ícones em `/public/icons/`
4. PWA só funciona em HTTPS (Vercel já fornece)

### Fontes não carregam

**Solução:**
1. Verifique se `/public/fonts/inter/` existe
2. Verifique no DevTools → Network se fontes retornam 200
3. Limpe cache: `vercel --prod --force`

### Build falha com erro TypeScript

**Solução:**
1. Rode `npm run build` localmente primeiro
2. Corrija erros de tipo
3. Commit e push novamente

## 📊 Monitoramento

### Vercel Analytics (opcional, pago)

1. Dashboard → Analytics
2. Habilite para ver métricas de performance

### OneSignal Dashboard

1. Veja estatísticas de notificações
2. Usuários subscritos
3. Taxa de entrega

### Neon Dashboard

1. Veja uso de storage (0.5 GB free)
2. Queries executadas
3. Connection pooling

## 🔒 Segurança

### Recomendações

1. **NUNCA** commite arquivo `.env` no Git
2. Use secrets diferentes para dev/prod
3. Rotacione `NEXTAUTH_SECRET` periodicamente
4. Use CORS adequado nas APIs
5. Mantenha dependências atualizadas: `npm audit`

### Rate Limiting (recomendado)

Adicione rate limiting nas APIs:
```bash
npm install @vercel/edge-rate-limit
```

## 💰 Custos Estimados

Para uso pessoal/caseiro:

| Serviço | Plano | Custo |
|---------|-------|-------|
| **Neon** | Free tier | $0 (0.5 GB) |
| **Vercel** | Hobby | $0 |
| **OneSignal** | Free | $0 (10k users) |
| **GitHub** | Free | $0 |
| **Total** | | **$0/mês** |

Upgrade necessário quando:
- Neon: >0.5 GB storage ou >3 GB transfer
- Vercel: Domínio custom ou >100 GB bandwidth
- OneSignal: >10k usuários

## 📱 Domínio Customizado (Opcional)

### Adicionar domínio

1. Dashboard Vercel → Settings → Domains
2. Adicione seu domínio: `lembretes.seudominio.com`
3. Configure DNS conforme instruções
4. Aguarde propagação (até 48h)
5. Atualize `NEXTAUTH_URL` e OneSignal

## ✅ Checklist Final

- [ ] App acessível via HTTPS
- [ ] Login/cadastro funciona
- [ ] Banco de dados conectado
- [ ] Migrations executadas
- [ ] Notificações funcionando
- [ ] PWA instalável
- [ ] Dark mode funciona
- [ ] README.md atualizado com URL
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy automático ativo

## 🎉 Pronto!

Seu aplicativo está no ar! Acesse:
```
https://seu-projeto.vercel.app
```

Para dúvidas ou problemas, abra uma issue no GitHub.
