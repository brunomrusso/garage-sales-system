# GarageSales - Sistema de Cadastro de Garagem

Sistema web completo para gerenciar vendas de miniaturas de carros com autenticação de dois níveis (admin e cliente).

## 🚀 Características

- **Autenticação de Dois Níveis**: Admin e Cliente com roles diferenciados
- **Gerenciamento de Clientes**: CRUD completo de clientes
- **Registro de Compras**: Cadastro de miniaturas com fotos em base64
- **Controle de Pagamentos**: Rastreamento de pagamentos por cliente
- **Solicitações de Envio**: Clientes podem solicitar envio de sua garagem
- **Interface Responsiva**: UI moderna com TailwindCSS
- **API RESTful**: Backend com Express.js e PostgreSQL

## 📋 Pré-requisitos

- Node.js 16+
- PostgreSQL 12+
- npm ou yarn

## 🛠️ Setup

### 1. Configurar o Banco de Dados

```bash
# Criar banco de dados
createdb garage_sales

# Executar migrations (conectar ao banco e rodar o arquivo init.sql)
psql garage_sales < backend/app/db/init.sql
```

### 2. Setup do Backend (Python + FastAPI)

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Criar arquivo .env
cp .env.example .env

# Editar .env com suas credenciais do banco
# DATABASE_URL=postgresql://user:password@localhost:5432/garage_sales
# SECRET_KEY=sua_chave_secreta_aqui

# Iniciar servidor (desenvolvimento)
python main.py

# Servidor rodará em http://localhost:5000
# Documentação: http://localhost:5000/docs
```

### 3. Setup do Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# Iniciar servidor de desenvolvimento
npm run dev

# Aplicação rodará em http://localhost:3000
```

## 📚 Estrutura do Projeto

```
garage-sales-system/
├── backend/
│   ├── app/
│   │   ├── controllers/     # Lógica de negócio
│   │   ├── routes/          # Rotas da API
│   │   ├── models/          # Modelos SQLAlchemy
│   │   ├── schemas/         # Schemas Pydantic
│   │   ├── core/            # Configuração e segurança
│   │   └── db/              # Conexão e migrations
│   ├── main.py              # Entrada da aplicação
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # Páginas (Login, Dashboard, Garagem)
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── hooks/           # Custom hooks (useAuth)
│   │   ├── services/        # Chamadas API
│   │   ├── App.tsx          # Componente raiz
│   │   └── main.tsx         # Entrada da aplicação
│   ├── index.html
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🔐 Autenticação

### Admin
- Acesso ao dashboard de administração
- Gerenciar clientes, compras, pagamentos e solicitações
- Credenciais: Criar via banco de dados com senha hasheada (bcrypt)

### Cliente
- Visualizar sua garagem de compras
- Solicitar envio da garagem
- Ver histórico de compras e pagamentos

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/admin/login` - Login de admin
- `POST /api/auth/cliente/login` - Login de cliente

### Clientes
- `POST /api/clientes` - Criar cliente
- `GET /api/clientes` - Listar clientes (admin)
- `GET /api/clientes/:id` - Obter cliente
- `PUT /api/clientes/:id` - Atualizar cliente
- `DELETE /api/clientes/:id` - Deletar cliente (admin)

### Compras
- `POST /api/compras` - Criar compra (admin)
- `GET /api/compras/cliente/:cliente_id` - Listar compras do cliente
- `GET /api/compras/:id` - Obter compra
- `PUT /api/compras/:id` - Atualizar compra (admin)
- `DELETE /api/compras/:id` - Deletar compra (admin)

### Pagamentos
- `POST /api/pagamentos` - Criar pagamento (admin)
- `GET /api/pagamentos/cliente/:cliente_id` - Listar pagamentos do cliente
- `GET /api/pagamentos/:id` - Obter pagamento
- `PUT /api/pagamentos/:id` - Atualizar pagamento (admin)
- `DELETE /api/pagamentos/:id` - Deletar pagamento (admin)

### Solicitações de Envio
- `POST /api/solicitacoes` - Criar solicitação
- `GET /api/solicitacoes` - Listar solicitações (admin)
- `GET /api/solicitacoes/cliente/:cliente_id` - Listar solicitações do cliente
- `PUT /api/solicitacoes/:id` - Atualizar status (admin)

## 🗄️ Schema do Banco de Dados

### usuarios_admin
- id (PK)
- email (UNIQUE)
- senha_hash
- criado_em

### clientes
- id (PK)
- nome
- email (UNIQUE)
- senha_hash
- telefone
- data_cadastro

### compras
- id (PK)
- cliente_id (FK)
- descricao
- preco
- data_compra
- foto (BYTEA)

### pagamentos
- id (PK)
- cliente_id (FK)
- valor
- data_pagamento
- status

### solicitacoes_envio
- id (PK)
- cliente_id (FK)
- data_solicitacao
- status

## 🚀 Deploy

### Backend (Heroku, Railway, etc)
```bash
cd backend
pip install -r requirements.txt
# Configurar variáveis de ambiente no serviço de hosting
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Frontend (Vercel, Netlify, etc)
```bash
cd frontend
npm run build
# Deploy da pasta dist
```

## 📝 Notas Importantes

- **Backend**: Python 3.9+ com FastAPI
- **Frontend**: React 18 com TypeScript
- As fotos são armazenadas como BYTEA no PostgreSQL (base64 no JSON)
- Senhas são hasheadas com bcrypt
- JWT é usado para autenticação stateless
- CORS está configurado para comunicação frontend-backend
- Limite de upload de fotos: 50MB
- Documentação automática da API em `/docs` (Swagger UI)

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
2. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
3. Push para a branch (`git push origin feature/AmazingFeature`)
4. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC.
