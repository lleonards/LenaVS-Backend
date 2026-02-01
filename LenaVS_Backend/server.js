const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Criar diretórios necessários
const dirs = ['uploads', 'projects', 'exports', 'temp'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'exports')));

// Rotas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/export', require('./routes/export'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/support', require('./routes/support'));
app.use('/api/library', require('./routes/library'));

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LenaVS Backend is running' });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: 'LenaVS API', 
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      upload: '/api/upload',
      projects: '/api/projects',
      export: '/api/export',
      payment: '/api/payment',
      support: '/api/support',
      library: '/api/library'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Algo deu errado!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor LenaVS rodando na porta ${PORT}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
