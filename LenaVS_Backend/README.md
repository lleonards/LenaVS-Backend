# LenaVS Backend 🎵

Backend API para o editor de karaokê LenaVS. Construído com Node.js, Express e FFmpeg.

## 🚀 Tecnologias

- **Node.js** (v18+)
- **Express** - Framework web
- **JWT** - Autenticação
- **Multer** - Upload de arquivos
- **FFmpeg** - Processamento de vídeo
- **Canvas** - Geração de frames
- **Nodemailer** - Envio de emails

## 📁 Estrutura do Projeto

```
LENAVS_BACKEND/
├── server.js              # Servidor principal
├── package.json           # Dependências
├── .env.example          # Exemplo de variáveis de ambiente
├── middleware/
│   └── auth.js           # Middleware de autenticação
├── routes/
│   ├── auth.js           # Rotas de autenticação
│   ├── upload.js         # Rotas de upload
│   ├── projects.js       # Rotas de projetos
│   ├── export.js         # Rotas de exportação
│   ├── payment.js        # Rotas de pagamento (estrutura)
│   ├── support.js        # Rotas de suporte
│   └── library.js        # Rotas da biblioteca
├── utils/
│   └── videoGenerator.js # Gerador de vídeo
├── data/                 # Dados JSON (usuários, projetos)
├── uploads/              # Arquivos enviados
├── exports/              # Vídeos exportados
└── temp/                 # Arquivos temporários
```

## 🔧 Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Instalar FFmpeg

**Linux (Render.com):**
```bash
apt-get install -y ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Baixe de: https://ffmpeg.org/download.html

### 3. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

```env
PORT=10000
NODE_ENV=production
JWT_SECRET=sua_chave_secreta_forte_aqui
FRONTEND_URL=https://seu-frontend.onrender.com
EMAIL_SERVICE=gmail
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app
MAX_FILE_SIZE=500
```

**⚠️ IMPORTANTE:**
- Gere uma chave JWT forte: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Para Gmail, use uma senha de app: https://support.google.com/accounts/answer/185833

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token

### Upload
- `POST /api/upload/audio` - Upload de áudio
- `POST /api/upload/media` - Upload de vídeo/imagem
- `POST /api/upload/lyrics` - Upload de letra (arquivo)
- `POST /api/upload/lyrics-text` - Processar letra colada
- `DELETE /api/upload/file/:filename` - Deletar arquivo

### Projetos
- `POST /api/projects` - Criar projeto
- `GET /api/projects` - Listar projetos do usuário
- `GET /api/projects/:id` - Buscar projeto
- `PUT /api/projects/:id` - Atualizar projeto
- `DELETE /api/projects/:id` - Deletar projeto
- `POST /api/projects/:id/duplicate` - Duplicar projeto público

### Exportação
- `POST /api/export` - Exportar vídeo
- `GET /api/export/download/:filename` - Download
- `GET /api/export/list` - Listar exportações

### Biblioteca
- `GET /api/library/public` - Listar projetos públicos
- `GET /api/library/public/:id` - Buscar projeto público

### Suporte
- `POST /api/support/report-error` - Relatar erro
- `GET /api/support/faq` - FAQ

### Pagamento (Estrutura)
- `POST /api/payment/create-session` - Criar sessão
- `POST /api/payment/webhook` - Webhook
- `GET /api/payment/status/:sessionId` - Status

## 🚢 Deploy no Render.com

### 1. Criar Web Service

1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub

### 2. Configurações

- **Name:** `lenavs-backend`
- **Environment:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Plan:** Free ou pago

### 3. Variáveis de Ambiente

Adicione no Render:
```
PORT=10000
NODE_ENV=production
JWT_SECRET=sua_chave_secreta
FRONTEND_URL=https://seu-frontend.onrender.com
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app
MAX_FILE_SIZE=500
```

### 4. Instalar FFmpeg no Render

Crie um arquivo `render.yaml` na raiz:

```yaml
services:
  - type: web
    name: lenavs-backend
    env: node
    buildCommand: "apt-get update && apt-get install -y ffmpeg && npm install"
    startCommand: "npm start"
```

Ou adicione no Script de Build:
```bash
apt-get update && apt-get install -y ffmpeg && npm install
```

### 5. Deploy

Push para o GitHub e o Render fará deploy automaticamente.

## 📝 Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Modo desenvolvimento (com nodemon)
npm run dev

# Modo produção
npm start
```

Servidor rodará em: `http://localhost:10000`

## 🔒 Segurança

- Autenticação JWT
- Bcrypt para hash de senhas
- Validação de tipos de arquivo
- Limite de tamanho de upload
- CORS configurado

## 🎥 Processamento de Vídeo

O sistema usa FFmpeg para:
- Combinar áudio e vídeo/imagem
- Adicionar legendas sincronizadas
- Aplicar transições
- Exportar em múltiplos formatos

## 📦 Integração Futura

O código está preparado para integração com:
- **Banco de Dados:** MongoDB, PostgreSQL, Supabase
- **Armazenamento:** AWS S3, Cloudinary
- **Pagamentos:** Stripe, PayPal, Mercado Pago
- **Auth Externo:** Firebase, Auth0, Cognito

## 🐛 Troubleshooting

**Erro: FFmpeg não encontrado**
```bash
# Instale FFmpeg
apt-get install ffmpeg
```

**Erro: Upload falhou**
- Verifique `MAX_FILE_SIZE` no `.env`
- Confirme permissões da pasta `uploads/`

**Erro: JWT inválido**
- Verifique `JWT_SECRET` no `.env`
- Certifique-se que frontend e backend usam a mesma secret

## 📞 Suporte

Para relatar bugs ou sugerir melhorias, use o sistema de relatório de erros da aplicação.

## 📄 Licença

MIT License - LenaVS © 2024
