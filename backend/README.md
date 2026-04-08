# GarageSales Backend - Python + FastAPI

Backend da aplicação GarageSales desenvolvido em Python com FastAPI.

## 📋 Pré-requisitos

- Python 3.9+
- PostgreSQL 12+
- pip

## 🛠️ Setup

### 1. Criar ambiente virtual

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar banco de dados

```bash
# Criar banco de dados
createdb garage_sales

# Executar migrations
psql garage_sales < app/db/init.sql
```

### 4. Configurar variáveis de ambiente

```bash
cp .env.example .env

# Editar .env com suas credenciais
# DATABASE_URL=postgresql://user:password@localhost:5432/garage_sales
# SECRET_KEY=sua_chave_secreta_aqui
```

### 5. Iniciar servidor

```bash
python main.py

# Ou com uvicorn diretamente
uvicorn main:app --reload --host 0.0.0.0 --port 5000
```

Servidor rodará em `http://localhost:5000`

## 📚 Estrutura do Projeto

```
backend/
├── app/
│   ├── controllers/      # Lógica de negócio
│   ├── routes/           # Rotas da API
│   ├── models/           # Modelos SQLAlchemy
│   ├── schemas/          # Schemas Pydantic
│   ├── core/             # Configuração e segurança
│   └── db/               # Banco de dados
├── main.py               # Entrada da aplicação
├── requirements.txt      # Dependências
└── .env.example          # Variáveis de ambiente
```

## 🔐 Autenticação

- JWT com Bearer Token
- Roles: admin e cliente
- Senhas com bcrypt

## 📡 Endpoints

Documentação automática disponível em:
- Swagger UI: `http://localhost:5000/docs`
- ReDoc: `http://localhost:5000/redoc`

## 🚀 Deploy

```bash
# Build
pip install -r requirements.txt

# Run
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

## 📝 Notas

- CORS habilitado para localhost:3000 (frontend)
- Limite de upload: 50MB
- Fotos armazenadas como BYTEA no PostgreSQL
