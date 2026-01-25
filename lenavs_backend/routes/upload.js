import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { authenticate } from '../middleware/auth.js'
import { processLyricsFile } from '../utils/lyricsProcessor.js'

const router = express.Router()

// ==================================================
// BASE DIR (Render safe)
// ==================================================
const BASE_UPLOAD_DIR = '/tmp/uploads'

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
  video: /mp4|mov|avi|mkv/,
  image: /jpg|jpeg|png/,
  lyrics: /txt|docx|pdf/
}

// --------------------------------------------------
// DETECT UPLOAD TYPE
// --------------------------------------------------
function getUploadType(req) {
  if (req.path.includes('audio')) return 'audio'
  if (req.path.includes('media')) return req.body.type
  if (req.path.includes('lyrics')) return 'lyrics'
  return 'general'
}

// --------------------------------------------------
// MULTER STORAGE
// --------------------------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const type = getUploadType(req)

      let folder = BASE_UPLOAD_DIR
      if (type === 'audio') folder += '/audio'
      else if (type === 'video') folder += '/video'
      else if (type === 'image') folder += '/images'
      else if (type === 'lyrics') folder += '/lyrics'
      else folder += '/general'

      ensureFolder(folder)
      cb(null, folder)
    } catch (err) {
      console.error('Erro ao criar pasta de upload:', err)
      cb(err)
    }
  },

  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

// --------------------------------------------------
// MULTER CONFIG
// --------------------------------------------------
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const type = getUploadType(req)
    const ext = path.extname(file.originalname).toLowerCase().slice(1)

    if (!allowedTypes[type]) {
      console.error('Tipo desconhecido:', type)
      return cb(new Error('Tipo de upload inválido'))
    }

    if (!allowedTypes[type].test(ext)) {
      return cb(new Error(`Arquivo não suportado para ${type}`))
    }

    cb(null, true)
  }
})

// ==================================================
// ROUTES
// ==================================================

router.post('/audio', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    console.error('UPLOAD AUDIO: req.file undefined')
    return res.status(400).json({ error: 'Falha no upload do áudio' })
  }

  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      path: `/tmp/uploads/audio/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size
    }
  })
})

router.post('/media', authenticate, upload.single('file'), (req, res) => {
  if (!req.file) {
    console.error('UPLOAD MEDIA: req.file undefined')
    return res.status(400).json({ error: 'Falha no upload da mídia' })
  }

  const type = req.body.type === 'video' ? 'video' : 'images'

  res.json({
    success: true,
    file: {
      filename: req.file.filename,
      path: `/tmp/uploads/${type}/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size,
      type
    }
  })
})

router.post('/lyrics', authenticate, upload.single('file'), async (req, res) => {
  if (!req.file) {
    console.error('UPLOAD LYRICS FILE: req.file undefined')
    return res.status(400).json({ error: 'Falha no upload da letra' })
  }

  const lyrics = await processLyricsFile(req.file.path, req.file.mimetype)

  res.json({
    success: true,
    lyrics
  })
})

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
