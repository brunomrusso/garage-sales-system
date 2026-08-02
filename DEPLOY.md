# 🏎️ Deploy GarageSales - Guia Passo a Passo

## Stack de Deploy
- **Frontend** → [Vercel](https://vercel.com)
- **Backend** → [Railway](https://railway.app)
- **Banco de Dados** → [Supabase](https://supabase.com) (PostgreSQL)

## Pré-requisitos
- Conta no [GitHub](https://github.com)
- Conta no [Vercel](https://vercel.com) (login com GitHub)
- Conta no [Railway](https://railway.app) (login com GitHub)
- Conta no [Supabase](https://supabase.com) (login com GitHub)

---

## Passo 1: Criar repositório no GitHub

1. Acesse https://github.com/new
2. Nome do repositório: `garage-sales-system`
3. Deixe como **Private** (ou Public se preferir)
4. **NÃO** marque nenhuma opção (README, .gitignore, etc.)
5. Clique em **Create repository**
6. No terminal, execute:

```powershell
cd C:\Users\bruno\OneDrive\Documentos\Projetos\garage-sales-system
git remote add origin https://github.com/SEU_USUARIO/garage-sales-system.git
git branch -M main
git push -u origin main
```

---

## Passo 2: Banco de Dados (Supabase)

1. Acesse https://supabase.com/dashboard e crie um novo projeto
2. Escolha a região mais próxima (ex: `South America (São Paulo)`)
3. Defina uma senha forte para o banco
4. Aguarde o projeto inicializar (~2 min)
5. Vá em **Project Settings** → **Database** → **Connection string** → **URI**
6. Copie a string de conexão direta (porta **5432**, não 6543)
   - Formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
   - Substitua `[PASSWORD]` pela senha que você definiu

> **Importante**: As tabelas serão criadas automaticamente pelo backend na primeira inicialização (SQLAlchemy `create_all`). Não precisa rodar SQL manualmente.

---

## Passo 3: Backend (Railway)

1. Acesse https://railway.app/new e clique em **Deploy from GitHub repo**
2. Selecione o repositório `garage-sales-system`
3. Railway vai detectar o projeto. Configure:
   - **Root Directory**: `backend`
4. Vá em **Variables** e adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | URL copiada do Supabase (passo 2) |
| `SECRET_KEY` | Uma string aleatória longa (ex: gere em https://randomkeygen.com) |
| `FRONTEND_URL` | `https://seu-frontend.vercel.app` (preencher após passo 4) |
| `ADMIN_EMAIL` | seu email de admin |
| `ADMIN_SENHA` | senha do admin |

5. O deploy inicia automaticamente. Aguarde (~3 min)
6. Em **Settings** → **Networking** → **Generate Domain** para obter a URL pública
   - Anote a URL (ex: `garagesales-api.up.railway.app`)

---

## Passo 4: Frontend (Vercel)

1. Acesse https://vercel.com/new
2. Importe o repositório `garage-sales-system`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
4. Em **Environment Variables**, adicione:
   - `VITE_API_URL` = `https://garagesales-api.up.railway.app/api`
   (use a URL do Railway do passo 3)
5. Clique **Deploy**
6. Copie a URL gerada (ex: `garage-sales-system.vercel.app`)

---

## Passo 5: Conectar tudo

1. Volte ao Railway, no seu serviço
2. Em **Variables**, atualize:
   - `FRONTEND_URL` = `https://garage-sales-system.vercel.app` (URL real do Vercel)
3. O Railway faz redeploy automaticamente

---

## Passo 6: Testar

1. Acesse a URL do Vercel
2. Faça login com o `ADMIN_EMAIL` e `ADMIN_SENHA` configurados no Railway
3. Cadastre clientes e comece a usar!

---

## Dicas importantes

- **Railway**: Incluído nos $5/mês de crédito do plano Hobby (compartilhado com outros projetos)
- **Supabase free tier**: 500MB de storage, sem expiração (diferente do Render que expira em 90 dias)
- **Para atualizar o sistema**: Faça `git push` e Railway + Vercel fazem deploy automático
- **Logs**: No Railway, vá em seu serviço → **Deployments** → clique no deploy atual → **View Logs**
- **CORS**: Se adicionar domínio customizado no Vercel, adicione-o também em `main.py` na lista `allowed_origins`

---

## URLs do seu sistema

Após o deploy, anote aqui:

- **Frontend**: https://________________.vercel.app
- **Backend API**: https://________________.up.railway.app
- **Admin**: Email: __________ / Senha: __________
