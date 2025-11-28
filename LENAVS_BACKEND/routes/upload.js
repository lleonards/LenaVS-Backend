import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Criar diretório de uploads se não existir
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 524288000 // 500MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedAudio = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.wma'];
    const allowedVideo = ['.mp4', '.mov', '.avi', '.mkv'];
    const allowedImage = ['.jpg', '.jpeg', '.png'];
    const allowedText = ['.txt', '.docx', '.pdf'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    const allAllowed = [...allowedAudio, ...allowedVideo, ...allowedImage, ...allowedText];
    
    if (allAllowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato de arquivo não suportado: ${ext}`));
    }
  }
});

// Upload de arquivo único
router.post('/file', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      message: 'Arquivo enviado com sucesso',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo' });
  }
});

// Upload de múltiplos arquivos
router.post('/multiple', authenticateToken, upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    res.json({
      message: 'Arquivos enviados com sucesso',
      files
    });
  } catch (error) {
    console.error('Erro no upload múltiplo:', error);
    res.status(500).json({ error: 'Erro ao fazer upload dos arquivos' });
  }
});

// Processar arquivo de letra (TXT, DOCX, PDF)
router.post('/lyrics', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    let lyrics = '';

    if (req.file) {
      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();

      if (ext === '.txt') {
        lyrics = fs.readFileSync(filePath, 'utf8');
      } else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        lyrics = result.value;
      } else if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        lyrics = data.text;
      }
    } else if (req.body.text) {
      lyrics = req.body.text;
    } else {
      return res.status(400).json({ error: 'Nenhuma letra foi fornecida' });
    }

    // Dividir em estrofes (por linhas em branco)
    const verses = lyrics
      .split(/\n\s*\n/)
      .map(verse => verse.trim())
      .filter(verse => verse.length > 0);

    res.json({
      message: 'Letra processada com sucesso',
      lyrics: lyrics.trim(),
      verses,
      totalVerses: verses.length
    });
  } catch (error) {
    console.error('Erro ao processar letra:', error);
    res.status(500).json({ error: 'Erro ao processar arquivo de letra' });
  }
});

// Deletar arquivo
router.delete('/file/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Arquivo deletado com sucesso' });
    } else {
      res.status(404).json({ error: 'Arquivo não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({ error: 'Erro ao deletar arquivo' });
  }
});

export default router;
