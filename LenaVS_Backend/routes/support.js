const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const authMiddleware = require('../middleware/auth');

// Configurar transporter de email
let transporter = null;

const initTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Configurações de email não definidas');
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Relatar erro
router.post('/report-error', authMiddleware, async (req, res) => {
  try {
    const { subject, description, errorDetails } = req.body;
    const userEmail = req.user.email;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Assunto e descrição são obrigatórios.' });
    }

    // Tentar inicializar transporter
    if (!transporter) {
      transporter = initTransporter();
    }

    // Se não houver configuração de email, salvar em arquivo
    if (!transporter) {
      const fs = require('fs');
      const path = require('path');
      const reportsDir = path.join(__dirname, '../data/error-reports');
      
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      const report = {
        date: new Date().toISOString(),
        userEmail,
        subject,
        description,
        errorDetails
      };

      const filename = `error-${Date.now()}.json`;
      fs.writeFileSync(
        path.join(reportsDir, filename),
        JSON.stringify(report, null, 2)
      );

      return res.json({
        message: 'Relatório de erro salvo com sucesso! Entraremos em contato em breve.',
        saved: true
      });
    }

    // Enviar email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Receber no próprio email
      subject: `[LenaVS] Relatório de Erro: ${subject}`,
      html: `
        <h2>Relatório de Erro - LenaVS</h2>
        <p><strong>Usuário:</strong> ${userEmail}</p>
        <p><strong>Assunto:</strong> ${subject}</p>
        <p><strong>Descrição:</strong></p>
        <p>${description}</p>
        ${errorDetails ? `
          <p><strong>Detalhes Técnicos:</strong></p>
          <pre>${JSON.stringify(errorDetails, null, 2)}</pre>
        ` : ''}
        <p><small>Data: ${new Date().toLocaleString('pt-BR')}</small></p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      message: 'Relatório de erro enviado com sucesso! Obrigado pelo feedback.',
      sent: true
    });
  } catch (error) {
    console.error('Erro ao enviar relatório:', error);
    res.status(500).json({ error: 'Erro ao enviar relatório de erro.' });
  }
});

// FAQ
router.get('/faq', (req, res) => {
  res.json({
    faqs: [
      {
        id: 1,
        question: 'Como faço upload de arquivos?',
        answer: 'No painel "Arquivos" à esquerda, clique nos botões de upload para cada tipo de mídia (Música Original, Instrumental, Vídeo/Foto, Letra).'
      },
      {
        id: 2,
        question: 'Quais formatos de áudio são suportados?',
        answer: 'Suportamos MP3, WAV, OGG, M4A, AAC, FLAC e WMA.'
      },
      {
        id: 3,
        question: 'Como sincronizo as letras com o áudio?',
        answer: 'Após fazer upload da letra, preencha os campos "Tempo Inicial" e "Tempo Final" para cada estrofe no Painel Editor de Letras.'
      },
      {
        id: 4,
        question: 'Posso editar o estilo de cada estrofe separadamente?',
        answer: 'Sim! Cada estrofe tem controles individuais de fonte, tamanho, cor, contorno e formatação.'
      },
      {
        id: 5,
        question: 'Como exporto meu vídeo?',
        answer: 'No painel "Exportar Vídeo" à direita, defina o nome do projeto, escolha o tipo de áudio (Original ou Playback) e clique em "Exportar".'
      },
      {
        id: 6,
        question: 'O vídeo/foto de fundo é obrigatório?',
        answer: 'Não! Se não enviar uma mídia de fundo, você pode escolher uma cor sólida no controle de preview.'
      },
      {
        id: 7,
        question: 'Posso compartilhar meus projetos?',
        answer: 'Sim! No menu "Biblioteca", você pode tornar seus projetos públicos para outros usuários editarem.'
      },
      {
        id: 8,
        question: 'Como salvo meu progresso?',
        answer: 'Use o menu "Projetos" para salvar seu trabalho. Você pode continuar editando posteriormente.'
      }
    ]
  });
});

module.exports = router;
