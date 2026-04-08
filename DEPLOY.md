# 🏎️ Deploy GarageSales - Guia Passo a Passo

## Pré-requisitos
- Conta no [GitHub](https://github.com) 
- Conta no [Render](https://render.com) (login com GitHub)
- Conta no [Vercel](https://vercel.com) (login com GitHub)

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

## Passo 2: Deploy do Backend + Banco (Render)

### Opção A: Deploy automático via render.yaml (recomendado)

1. Acesse https://dashboard.render.com
2. Clique em **New** → **Blueprint**
3. Conecte seu repositório GitHub `garage-sales-system`
4. O Render vai detectar o `render.yaml` automaticamente
5. Clique **Apply** - ele vai criar o banco e o backend juntos
6. Aguarde o deploy (pode levar 5-10 minutos)

### Opção B: Deploy manual

#### 2a. Criar o banco PostgreSQL
1. No dashboard do Render, clique **New** → **PostgreSQL**
2. Nome: `garagesales-db`
3. Plano: **Free**
4. Clique **Create Database**
5. Copie a **Internal Database URL** (começa com `postgresql://`)

#### 2b. Criar o Web Service (Backend)
1. Clique **New** → **Web Service**
2. Conecte o repositório GitHub
3. Configure:
   - **Name**: `garagesales-api`
   - **Root Directory**: `backend`
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL` = (cole a URL do banco do passo 2a)
   - `SECRET_KEY` = (gere uma chave aleatória segura)
   - `FRONTEND_URL` = (será preenchido após o deploy do frontend)
5. Clique **Create Web Service**

#### 2c. Criar o admin de produção
Após o deploy, no Render, vá em **Shell** do seu web service e execute:
```bash
python seed_admin.py
```
Ou defina as variáveis antes:
```bash
ADMIN_EMAIL=seu@email.com ADMIN_SENHA=suasenha python seed_admin.py
```

---

## Passo 3: Deploy do Frontend (Vercel)

1. Acesse https://vercel.com/new
2. Importe o repositório `garage-sales-system`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
4. Em **Environment Variables**, adicione:
   - `VITE_API_URL` = `https://garagesales-api.onrender.com/api`
   (substitua pelo URL real do seu backend no Render)
5. Clique **Deploy**
6. Após o deploy, copie a URL do frontend (ex: `garagesales.vercel.app`)

---

## Passo 4: Conectar tudo

1. Volte ao Render, no seu Web Service
2. Em **Environment Variables**, atualize:
   - `FRONTEND_URL` = `https://garagesales.vercel.app` (URL real do Vercel)
3. O serviço vai reiniciar automaticamente

---

## Passo 5: Testar

1. Acesse a URL do Vercel (seu frontend)
2. Faça login como Admin com as credenciais criadas no seed
3. Cadastre clientes e comece a usar!

---

## Dicas importantes

- **Free tier do Render**: O backend "dorme" após 15min sem uso. O primeiro acesso após dormir demora ~30s.
- **Banco de dados free**: 256MB de storage e expira após 90 dias. Renove ou faça upgrade quando necessário.
- **Para atualizar o sistema**: Faça `git push` e tanto Render quanto Vercel fazem deploy automático.
- **Logs**: No Render, vá em seu Web Service → Logs para ver erros.

---

## URLs do seu sistema

Após o deploy, anote aqui:

- **Frontend**: https://________________.vercel.app
- **Backend API**: https://________________.onrender.com
- **Admin**: Email: __________ / Senha: __________
