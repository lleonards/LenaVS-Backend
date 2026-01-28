import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { authenticate } from '../middleware/auth.js'
import { processLyricsFile } from '../utils/lyricsProcessor.js'

const router = express.Router()

// ==================================================
// BASE DIR (Render SAFE)
// ==================================================
const BASE_UPLOAD_DIR = path.resolve('uploads')

// --------------------------------------------------
// ENSURE FOLDER
// --------------------------------------------------
function ensureFolder(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true })
  }
}

// --------------------------------------------------
// ALLOWED TYPES
// --------------------------------------------------
const allowedTypes = {
  audio: /mp3|wav|ogg|m4a|aac|flac|wma/,
  media: /mp4|mov|avi|mkv|jpg|jpeg|png/,
  lyrics: /txt|docx|pdf/
}

// --------------------------------------------------
// DETECT UPLOAD TYPE (SAFE)
// --------------------------------------------------
function getUploadType(req) {
  if (req.path.includes('/audio')) return 'audio'
  if (req.path.includes('/media')) return 'media'
  if (req.path.includes('/lyrics')) return 'lyrics'
  return 'general'
}

// --------------------------------------------------
// MULTER STORAGE
// --------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = getUploadType(req)

    let folder = BASE_UPLOAD_DIR

    if (type === 'audio') folder += '/audio'
    else if (type === 'media') folder += '/media'
    else if (type === 'lyrics') folder += '/lyrics'
    else folder += '/general'

    ensureFolder(folder)
    cb(null, folder)
  },

  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

// --------------------------------------------------
// MULTER CONFIG (NO SESSION BREAK)
// --------------------------------------------------
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const type = getUploadType(req)
    const ext = path.extname(file.originalname).toLowerCase().slice(1)

    if (!allowedTypes[type] || !allowedTypes[type].test(ext)) {
      return cb(null, false)
    }

    cb(null, true)
  }
})

// ==================================================
// ROUTES
// ==================================================

// AUDIO
router.post('/audio', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tipo de áudio não suportado' })
  }

  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      path: `/uploads/audio/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size
    }
  })
})

// MEDIA (VIDEO / IMAGE)
router.post('/media', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tipo de mídia não suportado' })
  }

  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      path: `/uploads/media/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size
    }
  })
})

// LYRICS FILE
router.post('/lyrics', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tipo de arquivo de letra não suportado' })
  }

  const lyrics = await processLyricsFile(req.file.path, req.file.mimetype)

  res.json({
    success: true,
    lyrics
  })
})

// LYRICS TEXT
router.post('/lyrics/text', authenticate, (req, res) => {
  const { text } = req.body

  if (!text) {
    return res.status(400).json({ error: 'Texto não enviado' })
  }

  const verses = text.split(/\n\s*\n/).filter(v => v.trim())

  res.json({
    success: true,
    lyrics: verses.map((verse, index) => ({
      id: uuidv4(),
      text: verse.trim(),
      order: index
    }))
  })
})

export default router
