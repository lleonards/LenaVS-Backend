# LenaVS Backend

Backend da aplicação LenaVS - Gerador de Vídeos Karaokê

## 🚀 Tecnologias

- Node.js (v18+)
- Express.js
- FFmpeg (para processamento de vídeo)
- JWT para autenticação
- Multer para upload de arquivos

## 📋 Pré-requisitos

- Node.js 18 ou superior
- FFmpeg instalado no sistema
- Porta 10000 disponível (ou configure outra no .env)

## 🔧 Instalação Local

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env e configurar as variáveis
nano .env

# Iniciar servidor
npm start

# Ou em modo de desenvolvimento
npm run dev
```

## 🌍 Variáveis de Ambiente

Configure as seguintes variáveis no arquivo `.env`:

```env
PORT=10000
NODE_ENV=production
JWT_SECRET=seu_secret_jwt_super_seguro
CORS_ORIGIN=https://seu-frontend.onrender.com
REPORT_EMAIL=seu-email@example.com
```

## 📦 Deploy no Render

### 1. Criar Web Service

1. Acesse [Render Dashboard](https://dashboard.render.com/)
2. Clique em "New +" → "Web Service"
3. Conecte seu repositório GitHub
4. Configure:
   - **Name:** lenavs-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (ou paid para melhor performance)

### 2. Configurar Variáveis de Ambiente

No painel do Render, adicione as variáveis de ambiente:

- `JWT_SECRET` - String aleatória segura
- `CORS_ORIGIN` - URL do frontend
- `REPORT_EMAIL` - Email para receber relatórios
- `NODE_ENV` - production

### 3. Instalar FFmpeg

Adicione um script de build customizado no Render:

**Build Command:**
```bash
chmod +x ./install-ffmpeg.sh && ./install-ffmpeg.sh && npm install
```

Crie o arquivo `install-ffmpeg.sh` na raiz:
```bash
#!/bin/bash
apt-get update
apt-get install -y ffmpeg
```

## 🛣️ Rotas da API

### Autenticação
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Fazer login
- `GET /api/auth/verify` - Verificar token

### Upload
- `POST /api/upload/audio` - Upload de áudio (original/instrumental)
- `POST /api/upload/media` - Upload de vídeo/imagem
- `POST /api/upload/lyrics` - Upload de arquivo de letra
- `POST /api/upload/lyrics/text` - Enviar letra como texto

### Projetos
- `POST /api/projects` - Criar projeto
- `GET /api/projects` - Listar projetos do usuário
- `GET /api/projects/:id` - Obter projeto específico
- `PUT /api/projects/:id` - Atualizar projeto
- `DELETE /api/projects/:id` - Deletar projeto
- `PATCH /api/projects/:id/visibility` - Tornar público/privado
- `GET /api/projects/public/library` - Biblioteca pública
- `POST /api/projects/clone/:id` - Clonar projeto público

### Exportação
- `POST /api/export/video` - Gerar vídeo final
- `GET /api/export/status/:jobId` - Status da exportação

### Pagamentos (Estrutura)
- `POST /api/payment/create-session` - Criar sessão de pagamento
- `POST /api/payment/webhook` - Webhook do gateway
- `GET /api/payment/history` - Histórico de pagamentos
- `GET /api/payment/subscription` - Status da assinatura

### Relatórios
- `POST /api/report/error` - Enviar relatório de erro

## 📁 Estrutura de Pastas

```
LENAVS_BACKEND/
├── middleware/
│   ├── auth.js           # Autenticação JWT
│   └── errorHandler.js   # Tratamento de erros
├── routes/
│   ├── auth.js          # Rotas de autenticação
│   ├── upload.js        # Rotas de upload
│   ├── projects.js      # Rotas de projetos
│   ├── export.js        # Rotas de exportação
│   ├── payment.js       # Rotas de pagamento
│   └── report.js        # Rotas de relatório
├── utils/
│   ├── fileSystem.js    # Utilitários de arquivos
│   ├── lyricsProcessor.js  # Processamento de letras
│   ├── videoGenerator.js   # Geração de vídeos
│   └── emailService.js     # Serviço de email
├── data/
│   └── store.js         # Store em memória (temporário)
├── server.js            # Servidor principal
├── package.json
└── README.md
```

## 🔒 Segurança

- Autenticação JWT com tokens de 7 dias
- Senhas com hash bcrypt
- CORS configurável
- Validação de tipos de arquivo
- Limite de tamanho de upload (500MB)

## 📝 Notas Importantes

### Armazenamento Temporário
Atualmente, os dados são armazenados em memória (arquivo `data/store.js`). Para produção, integre um banco de dados:

**Recomendações:**
- **PostgreSQL** - Para dados relacionais
- **MongoDB** - Para flexibilidade
- **Supabase** - Backend-as-a-Service completo

### Integrações Futuras

#### Banco de Dados
```bash
# PostgreSQL com Prisma
npm install prisma @prisma/client
npx prisma init
```

#### Gateway de Pagamento
```bash
# Stripe
npm install stripe

# Mercado Pago
npm install mercadopago
```

#### Email Service
```bash
# Nodemailer
npm install nodemailer

# SendGrid
npm install @sendgrid/mail
```

## 🐛 Troubleshooting

### FFmpeg não encontrado
```bash
# Verificar instalação
ffmpeg -version

# Instalar no Ubuntu/Debian
sudo apt-get install ffmpeg

# Instalar no macOS
brew install ffmpeg
```

### Erro de CORS
Certifique-se de que `CORS_ORIGIN` no `.env` corresponde exatamente à URL do frontend.

### Erro de memória
Aumente o limite de memória do Node:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

## 📞 Suporte

Para relatórios de bugs e dúvidas:
- Email: contato@lenavs.com
- Issues: GitHub Issues

## 📄 Licença

MIT License - LenaVS Team
