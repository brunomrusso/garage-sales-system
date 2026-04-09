# Arquitetura do GarageSales System

## Visão Geral
Sistema completo de gestão de vendas de miniaturas de carros com tema Disney Pixar, desenvolvido com arquitetura moderna e deploy em serviços gratuitos.

## Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Deploy**: Vercel (https://garage-sales-system.vercel.app)
- **Estado**: useState + Context API
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.12)
- **ORM**: SQLAlchemy 2.0
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT + bcrypt
- **Deploy**: Render (https://garagesales-api.onrender.com)
- **API Documentation**: Swagger/OpenUI automática

### Infraestrutura
- **Version Control**: GitHub
- **CI/CD**: Deploy automático via Git push
- **Database Hosting**: Render PostgreSQL (free tier)
- **Static Assets**: Vercel CDN

## Diagrama de Arquitetura

```
                    +---------------------+
                    |     GitHub Repo     |
                    | (brunomrusso/...)   |
                    +----------+----------+
                               |
                    +----------v----------+
                    |      Vercel        |
                    |   Frontend Host    |
                    | (React + Vite)     |
                    +----------+----------+
                               |
                               | HTTPS Requests
                               | (CORS enabled)
                               v
                    +----------+----------+
                    |       Render        |
                    |   Backend Host     |
                    | (FastAPI + Python) |
                    +----------+----------+
                               |
                               | PostgreSQL
                               v
                    +----------+----------+
                    |   Render Database  |
                    |   PostgreSQL DB    |
                    +---------------------+
```

## Estrutura de Diretórios

```
garage-sales-system/
|
+-- frontend/
|   +-- src/
|   |   +-- components/     # Componentes React reutilizáveis
|   |   +-- pages/          # Páginas principais (Login, Admin, Cliente)
|   |   +-- services/       # Clientes API (axios)
|   |   +-- contexts/       # Contextos React (Auth)
|   |   +-- types/          # Tipos TypeScript
|   |   +-- utils/          # Utilitários
|   |   +-- App.tsx         # Componente principal
|   |   +-- main.tsx        # Entry point
|   +-- public/             # Assets estáticos
|   +-- package.json
|   +-- vercel.json         # Config deploy Vercel
|
+-- backend/
|   +-- app/
|   |   +-- core/           # Configurações (settings, security)
|   |   +-- db/             # Database (session, models)
|   |   +-- models/         # SQLAlchemy Models
|   |   +-- schemas/        # Pydantic Schemas
|   |   +-- controllers/    # Lógica de negócio
|   |   +-- routes/         # Endpoints API
|   +-- main.py             # Entry point FastAPI
|   +-- requirements.txt    # Dependências Python
|   +-- .python-version    # Versão Python para Render
|
+-- render.yaml              # Config deploy Render
+-- .gitignore
+-- DEPLOY.md                # Guia de deploy
+-- ARQUITETURA.md           # Este documento
```

## Fluxos Principais

### 1. Autenticação
```
Cliente/Admin -> Frontend -> Backend API -> JWT Token -> Session
```

### 2. Cadastro de Vendas
```
Admin -> Frontend -> Backend -> Database -> Notificação Cliente
```

### 3. Gestão de Garagem
```
Cliente -> Frontend -> Backend -> Database -> Upload Fotos
```

## Modelos de Dados

### Usuários
- **UsuarioAdmin**: Gestão do sistema
- **Cliente**: Compradores das miniaturas

### Vendas
- **Lote**: Agrupamento de itens
- **VendaLote**: Itens individuais vendidos
- **Compra**: Registro de compras do cliente

### Pagamentos
- **Pagamento**: Controle de pagamentos das compras

### Envios
- **SolicitacaoEnvio**: Pedidos de envio da garagem
- **FotoGaragem**: Fotos das garagens dos clientes

## APIs Principais

### Autenticação
- `POST /api/auth/admin/login` - Login admin
- `POST /api/auth/cliente/login` - Login cliente
- `POST /api/auth/cliente/register` - Registro cliente

### Gestão
- `GET/POST/PUT/DELETE /api/clientes` - CRUD clientes
- `GET/POST/PUT/DELETE /api/lotes` - CRUD lotes
- `GET/POST/PUT/DELETE /api/vendas` - CRUD vendas
- `GET/POST/PUT/DELETE /api/pagamentos` - CRUD pagamentos
- `GET/POST/PUT/DELETE /api/solicitacoes` - CRUD solicitações

### Health Check
- `GET /health` - Verificação de saúde do serviço

## Segurança

### Frontend
- Token JWT armazenado em localStorage
- Verificação de role (admin/cliente)
- Proteção de rotas

### Backend
- CORS configurado para domínios específicos
- Hash de senhas com bcrypt
- Tokens JWT com expiração (24h)
- Validação de inputs com Pydantic

## Deploy e Infraestrutura

### Processo de Deploy
1. **Code Push** para GitHub
2. **Render**: Detecta mudanças, build e deploy automático
3. **Vercel**: Detecta mudanças, build e deploy automático
4. **Database**: Render PostgreSQL persistente

### URLs de Produção
- **Frontend**: https://garage-sales-system.vercel.app
- **Backend API**: https://garagesales-api.onrender.com
- **API Docs**: https://garagesales-api.onrender.com/docs

### Limitações Free Tier
- **Render**: Sleep após 15min inatividade (30s para acordar)
- **Vercel**: Sem limitações (sempre online)
- **Database**: 90 dias expira free tier

## Escalabilidade

### Vertical (Upgrade Path)
- **Render Starter** ($7/mês): Sem sleep, mais performance
- **Render Pro** ($50/mês): High availability, monitoring
- **Vercel Pro**: Edge functions, analytics

### Horizontal
- Load balancer (Render)
- Database replicas
- CDN global (Vercel já possui)

## Monitoramento

### Logs
- **Render**: Dashboard logs em tempo real
- **Vercel**: Analytics e error tracking

### Health Checks
- `/health` endpoint para monitoramento
- CORS validation
- Database connection status

## Próximos Passos

### Features Futuras
1. **Notificações**: Email/SMS para clientes
2. **Pagamentos Online**: Stripe/PayPal integration
3. **Relatórios**: Analytics e dashboards
4. **Mobile App**: React Native
5. **Marketplace**: Venda entre clientes

### Melhorias Técnicas
1. **Redis Cache**: Para performance
2. **Background Jobs**: Para notificações
3. **File Storage**: S3 para fotos
4. **Testing**: Unit e integration tests
5. **CI/CD**: GitHub Actions

---

**Status**: Produção ativa  
**Última atualização**: Abril 2026  
**Versão**: 1.0.0
