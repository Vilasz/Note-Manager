# Note Manager

Sistema de controle de notas e boletos para restaurantes. Integra com Gmail para importar boletos automaticamente, utiliza IA para extrair dados dos documentos, e processa pagamentos via Stripe.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS v4 + Recharts
- **Backend**: Python + FastAPI + SQLAlchemy (async) + Pydantic v2
- **Banco de Dados**: PostgreSQL
- **IA**: OpenAI / Google Gemini / Anthropic Claude (configurável)
- **Pagamentos**: Stripe
- **Email**: Gmail API (OAuth2)

## Requisitos

- Node.js 20+
- Python 3.11+
- PostgreSQL 15+

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt

# Copie e configure o .env
cp .env.example .env

# Crie o banco de dados
createdb note_manager

# Execute as migrations e seed
python seed.py

# Inicie o servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

## Variáveis de Ambiente

Copie `backend/.env.example` para `backend/.env` e configure:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `SECRET_KEY` | Chave secreta para JWT |
| `GOOGLE_CLIENT_ID` | Client ID do Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Client Secret do Google OAuth |
| `AI_PROVIDER` | Provedor de IA: `openai`, `gemini`, ou `claude` |
| `OPENAI_API_KEY` | Chave da API OpenAI |
| `GEMINI_API_KEY` | Chave da API Google Gemini |
| `ANTHROPIC_API_KEY` | Chave da API Anthropic |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe |
| `STRIPE_WEBHOOK_SECRET` | Segredo do webhook Stripe |

## Funcionalidades

- Registro e login com JWT (access + refresh tokens)
- Integração OAuth2 com Gmail para importar e-mails com boletos
- Extração de dados de boletos via IA (OCR em PDFs)
- Categorização automática dos boletos
- Dashboard com KPIs, gráficos de gastos mensais e por categoria
- Listagem de boletos com filtros, busca e paginação
- Pagamento de boletos via Stripe
- Histórico de pagamentos
