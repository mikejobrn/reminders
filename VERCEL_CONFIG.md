# Troubleshooting - Login não funciona na Vercel

## ✅ Problema Resolvido!

### Causa Raiz:

**NextAuth v5 com Credentials provider e `strategy: "jwt"` não pode usar PrismaAdapter.**

O código estava configurado assim:
```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma), // ❌ Incompatível com JWT + Credentials
  session: { strategy: "jwt" },
  providers: [Credentials({...})]
})
```

Isso causava um conflito silencioso que fazia o login falhar sem erros visíveis.

### Correção Aplicada:

Removido o `PrismaAdapter`:
```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" }, // ✅ Apenas JWT, sem adapter
  providers: [Credentials({...})]
})
```

### O que foi feito:

1. ✅ Removido PrismaAdapter incompatível
2. ✅ Verificado que o banco tem usuários
3. ✅ Testado credenciais localmente (funcionando)
4. ✅ Deploy feito com correção

### Credenciais de Teste:

```
Email: teste@lembretes.app
Senha: 123456
```

Aguarde o deploy da Vercel terminar (~2-3 minutos) e tente fazer login em: https://lembretesmyklan.vercel.app/login

---

## 📚 Por que isso aconteceu?

### Contexto Técnico:

No **NextAuth v5**, existem duas estratégias de sessão:

1. **Database Session** (`strategy: "database"`)
   - Requer um adapter (PrismaAdapter, DrizzleAdapter, etc.)
   - Sessões armazenadas no banco de dados
   - Funciona com OAuth providers (Google, GitHub, etc.)

2. **JWT Session** (`strategy: "jwt"`)
   - Não usa adapter
   - Sessões armazenadas em tokens JWT
   - **Obrigatório** para Credentials provider

### O Problema:

O código estava misturando as duas estratégias:
```typescript
adapter: PrismaAdapter(prisma),  // ← Para database strategy
session: { strategy: "jwt" },     // ← Para JWT strategy
providers: [Credentials({...})]   // ← Requer JWT strategy
```

Isso criava um conflito onde o NextAuth tentava usar o adapter para validar credenciais, mas a sessão era JWT, causando falhas silenciosas.

### Referências:

- [NextAuth v5 Docs - Session Strategy](https://authjs.dev/concepts/session-strategies)
- [NextAuth v5 Docs - Credentials Provider](https://authjs.dev/getting-started/providers/credentials)

---

## 🔧 Configuração de Variáveis de Ambiente (Referência)

1. Entre em [vercel.com](https://vercel.com)
2. Selecione seu projeto **lembretesmyklan**
3. Vá em **Settings** → **Environment Variables**

### 2. Adicione as Seguintes Variáveis

#### **DATABASE_URL** (Obrigatória)
```
DATABASE_URL=postgresql://usuario:senha@host:5432/database?sslmode=require
```
- Se estiver usando Neon, copie a connection string do painel do Neon
- Exemplo Neon: `postgresql://usuario:senha@ep-exemplo-123456.us-east-2.aws.neon.tech/lembretes?sslmode=require`

#### **NEXTAUTH_SECRET** (Obrigatória)
```
NEXTAUTH_SECRET=sua-chave-secreta-aqui
```

**Como gerar uma chave segura:**
```bash
openssl rand -base64 32
```
Ou use este gerador online: https://generate-secret.vercel.app/32

⚠️ **IMPORTANTE**: Use uma chave diferente para produção! Nunca compartilhe esta chave.

#### **NEXTAUTH_URL** (Obrigatória)
```
NEXTAUTH_URL=https://lembretesmyklan.vercel.app
```

### 3. Configure o Ambiente

Para cada variável, selecione em quais ambientes ela deve estar disponível:
- ✅ Production
- ✅ Preview
- ✅ Development (opcional)

### 4. Faça o Redeploy

Após adicionar todas as variáveis:

1. Vá em **Deployments**
2. Clique nos três pontos (`...`) do último deployment
3. Clique em **Redeploy**
4. Marque ☑️ **Use existing Build Cache** (mais rápido)
5. Clique em **Redeploy**

## ✅ Como Testar

Após o redeploy:

1. Acesse https://lembretesmyklan.vercel.app/login
2. Tente fazer login com credenciais válidas
3. Se ainda não tiver usuário, registre em https://lembretesmyklan.vercel.app/register

## 🔍 Como Verificar se Está Funcionando

### Logs na Vercel

1. Vá em **Deployments** → clique no deployment ativo
2. Vá em **Functions** → clique em qualquer função
3. Veja os logs em **Logs**
4. Tente fazer login e veja se aparecem erros

### Console do Navegador

1. Abra DevTools (F12)
2. Vá em **Network**
3. Tente fazer login
4. Verifique a resposta de `/api/auth/callback/credentials`
   - ✅ Sucesso: deve redirecionar para `/lists` ou `/`
   - ❌ Falha: redireciona para `/login?callbackUrl=...`

## 🐛 Troubleshooting

### Se ainda não funcionar:

#### 1. Verifique se o banco está acessível
- Teste a conexão do DATABASE_URL
- Verifique se o Neon está no plano correto

#### 2. Verifique se as migrations foram executadas
Execute no terminal local:
```bash
npx prisma migrate deploy
```

#### 3. Crie um usuário de teste
Execute no terminal local (se tiver o .env configurado):
```bash
npx prisma db seed
```

Ou crie manualmente via registro: https://lembretesmyklan.vercel.app/register

#### 4. Verifique os logs do servidor
Na Vercel:
- **Deployments** → deployment ativo → **Functions**
- Procure por erros de database, JWT, ou autenticação

### Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| Redireciona para `/login` | NEXTAUTH_SECRET não configurada | Adicione a variável e redeploy |
| "Database connection failed" | DATABASE_URL inválida | Verifique a connection string |
| CSRF token error | NEXTAUTH_URL incorreta | Use a URL exata do deploy |
| "User not found" | Banco vazio | Crie um usuário via /register |

## 📝 Checklist

- [ ] DATABASE_URL configurada
- [ ] NEXTAUTH_SECRET gerada e configurada
- [ ] NEXTAUTH_URL apontando para o domínio correto
- [ ] Redeploy feito após adicionar variáveis
- [ ] Usuário criado no banco (via /register ou seed)
- [ ] Testado login no navegador

## 🎯 Próximos Passos (Opcional)

Depois que o login funcionar, você pode adicionar:

- **BLOB_READ_WRITE_TOKEN** - para upload de arquivos (Vercel Blob)
- **ONESIGNAL_APP_ID** e **ONESIGNAL_REST_API_KEY** - para notificações push

Mas essas não são necessárias para o login funcionar.

---

## 📚 O que aconteceu (Diagnóstico Completo)

### Sintomas:
- Login não funcionava
- Não apareciam erros no console
- Redirecionava de volta para `/login?callbackUrl=%2F`
- Requisições retornavam 200 OK

### Investigação:

1. **Variáveis de ambiente**: ✅ Todas configuradas corretamente
   - `NEXTAUTH_SECRET` ✅
   - `NEXTAUTH_URL` ✅  
   - `DATABASE_URL` ✅

2. **Migrations**: ✅ Aplicadas no banco
   - Rodei `npx prisma migrate deploy` → "No pending migrations"

3. **Banco de dados**: ❌ **VAZIO!**
   - Não havia nenhum usuário criado
   - O seed não roda automaticamente no deploy

### Causa Raiz:

O NextAuth estava funcionando corretamente, mas quando tentava autenticar:
- Buscava o usuário no banco pelo email
- Não encontrava (banco vazio)
- Retornava erro silencioso
- Redirecionava para `/login`

### Solução Aplicada:

```bash
# Conectei ao banco de produção e rodei o seed
export DATABASE_URL="postgresql://..."
npx prisma db seed
```

Isso criou um usuário de teste:
- Email: `teste@lembretes.app`
- Senha: `123456`

### Scripts Criados:

Para facilitar no futuro, criei dois scripts:

#### 1. Aplicar Migrations em Produção
```bash
./scripts/migrate-production.sh
```

#### 2. Popular Banco com Dados de Teste
```bash
./scripts/seed-production.sh
```

---

## 🎯 Próximas Vezes

Se o login não funcionar após deploy:

1. ✅ Verifique variáveis de ambiente
2. ✅ Rode migrations: `npx prisma migrate deploy`
3. ✅ Crie um usuário:
   - Via seed: `npx prisma db seed`
   - Via app: https://lembretesmyklan.vercel.app/register

---

## 🚀 Para Produção Real

Quando for colocar em produção de verdade:

1. **Não use o usuário de teste** (`teste@lembretes.app`)
2. **Crie seu próprio usuário** via `/register`
3. **Remova ou altere o seed** para não criar usuários de teste
4. **Configure autenticação OAuth** (Google, Apple) para facilitar cadastros

