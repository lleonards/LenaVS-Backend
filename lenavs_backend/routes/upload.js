import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { processLyricsFile } from '../utils/lyricsProcessor.js';

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type || 'general';
    let folder = 'uploads/';
    
    if (type === 'audio') folder += 'audio/';
    else if (type === 'video') folder += 'video/';
    else if (type === 'image') folder += 'images/';
    else if (type === 'lyrics') folder += 'lyrics/';
    
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      audio: /mp3|wav|ogg|m4a|aac|flac|wma/,
      video: /mp4|mov|avi|mkv/,
      image: /jpg|jpeg|png/,
      lyrics: /txt|docx|pdf/
    };

    const type = req.body.type;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    
    if (allowedTypes[type]?.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não suportado para ${type}`));
    }
  }
});

// Upload audio (original or instrumental)
router.post('/audio', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        path: `/uploads/audio/${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload do áudio' });
  }
});

// Upload video/image
router.post('/media', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const type = req.body.type === 'video' ? 'video' : 'images';

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        path: `/uploads/${type}/${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.body.type
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload da mídia' });
  }
});

// Upload lyrics file
router.post('/lyrics', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Process lyrics file
    const lyrics = await processLyricsFile(req.file.path, req.file.mimetype);

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        path: `/uploads/lyrics/${req.file.filename}`,
        originalName: req.file.originalname
      },
      lyrics
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar letra' });
  }
});

// Upload lyrics as text
router.post('/lyrics/text', authenticate, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Texto da letra não fornecido' });
    }

    // Split into verses
    const verses = text.split(/\n\s*\n/).filter(v => v.trim());

    res.json({
      success: true,
      lyrics: verses.map((verse, index) => ({
        id: uuidv4(),
        text: verse.trim(),
        order: index
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar letra' });
  }
});

export default router;
