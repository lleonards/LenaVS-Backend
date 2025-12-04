import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth.js';
import { processLyricsFile } from '../utils/lyricsProcessor.js';

const router = express.Router();

// Garante que a pasta existe
function ensureFolder(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

// Tipos aceitos
const allowedTypes = {
  audio: /mp3|wav|ogg|m4a|aac|flac|wma/,
  video: /mp4|mov|avi|mkv/,
  image: /jpg|jpeg|png/,
  lyrics: /txt|docx|pdf/
};

// FUNÇÃO QUE DETECTA O TIPO PELA ROTA (CORREÇÃO PRINCIPAL)
function getUploadType(req) {
  if (req.path.includes("audio")) return "audio";
  if (req.path.includes("media")) return req.body.type; // video ou image
  if (req.path.includes("lyrics")) return "lyrics";
  return "general";
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = getUploadType(req);

    let folder = "uploads/";
    if (type === "audio") folder += "audio/";
    else if (type === "video") folder += "video/";
    else if (type === "image") folder += "images/";
    else if (type === "lyrics") folder += "lyrics/";
    else folder += "general/";

    ensureFolder(folder);
    cb(null, folder);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const type = getUploadType(req);
    const ext = path.extname(file.originalname).toLowerCase().slice(1);

    if (!allowedTypes[type]) {
      return cb(new Error(`Tipo de upload desconhecido: ${type}`));
    }

    if (!allowedTypes[type].test(ext)) {
      return cb(new Error(`Tipo de arquivo não suportado para ${type}`));
    }

    cb(null, true);
  }
});

// ===== ROTAS =====

// AUDIO
router.post('/audio', authenticate, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

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
    console.error("Erro em /upload/audio:", error);
    res.status(500).json({ error: "Erro ao enviar áudio" });
  }
});

// VIDEO / IMAGE
router.post('/media', authenticate, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

    const type = req.body.type === "video" ? "video" : "images";

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        path: `/uploads/${type}/${req.file.filename}`,
        originalName: req.file.originalname,
        size: req.file.size,
        type
      }
    });
  } catch (error) {
    console.error("Erro em /upload/media:", error);
    res.status(500).json({ error: "Erro ao enviar mídia" });
  }
});

// LETRA (arquivo)
router.post('/lyrics', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

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
    console.error("Erro em /upload/lyrics:", error);
    res.status(500).json({ error: "Erro ao processar letra" });
  }
});

// LETRA (TEXTO)
router.post('/lyrics/text', authenticate, (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Texto não enviado" });

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
    console.error("Erro em /upload/lyrics/text:", error);
    res.status(500).json({ error: "Erro ao processar letra" });
  }
});

export default router;
