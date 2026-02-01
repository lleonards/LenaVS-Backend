const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const audioFormats = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
  const videoFormats = ['.mp4', '.mov', '.avi', '.mkv'];
  const imageFormats = ['.jpg', '.jpeg', '.png'];
  const textFormats = ['.txt', '.docx', '.pdf'];
  
  const ext = path.extname(file.originalname).toLowerCase();
  const allFormats = [...audioFormats, ...videoFormats, ...imageFormats, ...textFormats];
  
  if (allFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de arquivo não suportado'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (process.env.MAX_FILE_SIZE || 500) * 1024 * 1024 // Default 500MB
  }
});

// Upload de áudio (Original ou Instrumental)
router.post('/audio', authMiddleware, upload.single('audio'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    res.json({
      message: 'Áudio enviado com sucesso!',
      file: {
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Erro no upload de áudio:', error);
    res.status(500).json({ error: 'Erro ao enviar áudio.' });
  }
});

// Upload de vídeo/imagem
router.post('/media', authMiddleware, upload.single('media'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    res.json({
      message: 'Mídia enviada com sucesso!',
      file: {
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        type: req.file.mimetype.startsWith('video/') ? 'video' : 'image'
      }
    });
  } catch (error) {
    console.error('Erro no upload de mídia:', error);
    res.status(500).json({ error: 'Erro ao enviar mídia.' });
  }
});

// Upload de letra (arquivo)
router.post('/lyrics', authMiddleware, upload.single('lyrics'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }

    const filePath = req.file.path;
    let content = '';

    // Ler conteúdo do arquivo
    if (path.extname(req.file.originalname).toLowerCase() === '.txt') {
      content = fs.readFileSync(filePath, 'utf8');
    } else {
      // Para outros formatos, retornar caminho do arquivo
      return res.json({
        message: 'Letra enviada com sucesso!',
        file: {
          filename: req.file.filename,
          path: `/uploads/${req.file.filename}`,
          originalname: req.file.originalname
        }
      });
    }

    // Processar letra
    const verses = processLyrics(content);

    res.json({
      message: 'Letra enviada com sucesso!',
      verses,
      file: {
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        originalname: req.file.originalname
      }
    });
  } catch (error) {
    console.error('Erro no upload de letra:', error);
    res.status(500).json({ error: 'Erro ao enviar letra.' });
  }
});

// Processar letra colada
router.post('/lyrics-text', authMiddleware, (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Texto da letra não fornecido.' });
    }

    const verses = processLyrics(text);

    res.json({
      message: 'Letra processada com sucesso!',
      verses,
      autoSeparated: verses.length > 1
    });
  } catch (error) {
    console.error('Erro ao processar letra:', error);
    res.status(500).json({ error: 'Erro ao processar letra.' });
  }
});

// Função para processar letras
function processLyrics(text) {
  // Preservar acentos e caracteres especiais
  const cleanText = text.trim();
  
  // Separar por linhas vazias (estrofes já separadas)
  let verses = cleanText.split(/\n\s*\n/).filter(v => v.trim() !== '');
  
  // Se não houver separação, criar estrofes de 4 linhas
  if (verses.length === 1) {
    const lines = cleanText.split('\n').filter(l => l.trim() !== '');
    verses = [];
    
    for (let i = 0; i < lines.length; i += 4) {
      const verse = lines.slice(i, i + 4).join('\n');
      if (verse.trim() !== '') {
        verses.push(verse);
      }
    }
  }

  // Retornar estrofes com estrutura
  return verses.map((verse, index) => ({
    id: `verse-${index + 1}`,
    text: verse.trim(),
    startTime: '00:00',
    endTime: '00:00',
    style: {
      fontFamily: 'Montserrat',
      fontSize: 40,
      color: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 2,
      bold: false,
      italic: false,
      underline: false,
      align: 'center',
      transition: {
        type: 'fade',
        duration: 0.5
      }
    }
  }));
}

// Deletar arquivo
router.delete('/file/:filename', authMiddleware, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Arquivo deletado com sucesso!' });
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado.' });
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({ error: 'Erro ao deletar arquivo.' });
  }
});

module.exports = router;
