# LenaVS Backend

Backend do sistema LenaVS - Plataforma de criação de vídeos karaokê.

## 🚀 Tecnologias

- Node.js + Express
- JWT para autenticação
- Multer para upload de arquivos
- FFmpeg para processamento de vídeo
- Bcrypt para segurança

## 📋 Pré-requisitos

- Node.js 18+
- FFmpeg instalado no sistema

## 🔧 Instalação Local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# Iniciar servidor de desenvolvimento
npm run dev

# Ou iniciar em produção
npm start
```

## 🌐 Deploy no Render

### 1. Criar Web Service

1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub

### 2. Configurações do Serviço

- **Name**: `lenavs-backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Free (ou superior conforme necessário)

### 3. Variáveis de Ambiente

Adicione no Render Dashboard (Environment):

```
PORT=10000
NODE_ENV=production
JWT_SECRET=seu-secret-super-seguro-aqui
CORS_ORIGIN=https://seu-frontend.onrender.com
MAX_FILE_SIZE=524288000
PAYMENT_WEBHOOK_SECRET=seu-webhook-secret
```

### 4. Instalar FFmpeg no Render

Adicione um arquivo `render.yaml` na raiz (opcional):

```yaml
services:
  - type: web
    name: lenavs-backend
    env: node
    buildCommand: |
      npm install
      apt-get update && apt-get install -y ffmpeg
    startCommand: npm start
```

Ou use o buildpack padrão que já inclui FFmpeg.

## 📡 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token

### Projetos
- `GET /api/projects` - Listar projetos do usuário
- `POST /api/projects` - Criar projeto
- `GET /api/projects/:id` - Buscar projeto
- `PUT /api/projects/:id` - Atualizar projeto
- `DELETE /api/projects/:id` - Deletar projeto
- `POST /api/projects/:id/duplicate` - Duplicar projeto

### Upload
- `POST /api/upload/file` - Upload de arquivo único
- `POST /api/upload/multiple` - Upload múltiplo
- `POST /api/upload/lyrics` - Processar letra (txt/docx/pdf)
- `DELETE /api/upload/file/:filename` - Deletar arquivo

### Exportação
- `POST /api/export/video` - Exportar vídeo karaokê
- `GET /api/export/status/:exportId` - Status da exportação

### Pagamentos (Estrutura genérica)
- `POST /api/payment/create-session` - Criar sessão
- `POST /api/payment/webhook` - Webhook do provedor
- `GET /api/payment/status/:sessionId` - Status
- `GET /api/payment/plans` - Listar planos

## 🔒 Autenticação

Todas as rotas protegidas requerem header:
```
Authorization: Bearer <token>
```

## 📁 Estrutura de Diretórios

```
LENAVS_BACKEND/
├── middleware/           # Middlewares (auth, errorHandler)
├── routes/              # Rotas da API
├── uploads/             # Arquivos enviados (criado automaticamente)
├── exports/             # Vídeos exportados (criado automaticamente)
├── server.js            # Servidor principal
├── package.json         # Dependências
└── .env                 # Variáveis de ambiente
```

## ⚠️ Notas Importantes

1. **Banco de Dados**: Atualmente usando armazenamento em memória. Para produção, integre com PostgreSQL, MongoDB ou outro banco de dados.

2. **FFmpeg**: Certifique-se de que o FFmpeg está instalado no ambiente de produção.

3. **Uploads**: Os arquivos são armazenados localmente. Para produção em escala, considere usar S3, Google Cloud Storage ou similar.

4. **Pagamentos**: A estrutura está preparada para integração. Adicione seu provedor preferido (Stripe, PayPal, Mercado Pago, etc.).

## 🔐 Segurança

- Sempre use HTTPS em produção
- Mantenha o JWT_SECRET seguro e complexo
- Configure CORS adequadamente
- Implemente rate limiting para produção
- Valide e sanitize todos os inputs

## 📞 Suporte

Para problemas ou dúvidas, abra uma issue no repositório.
