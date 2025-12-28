import express from 'express'
import authMiddleware from '../middleware/auth.js'
import { generateVideo } from '../utils/videoGenerator.js'
import { v4 as uuidv4 } from 'uuid'

const router = express.Router()

// =====================================================
// EXPORT VIDEO
// =====================================================
router.post('/video', authMiddleware, async (req, res) => {
  try {
    const {
      projectName,
      audioType, // 'original' or 'instrumental'
      audioOriginalPath,
      audioInstrumentalPath,
      backgroundPath,
      backgroundType, // 'video' or 'image'
      backgroundColor,
      verses,
      videoDuration
    } = req.body

    // Validações básicas
    if (!projectName) {
      return res.status(400).json({ error: 'Nome do projeto é obrigatório' })
    }

    const audioPath =
      audioType === 'instrumental'
        ? audioInstrumentalPath
        : audioOriginalPath

    if (!audioPath) {
      return res.status(400).json({ error: 'Arquivo de áudio não fornecido' })
    }

    if (!verses || verses.length === 0) {
      return res.status(400).json({ error: 'Letras não fornecidas' })
    }

    // Nome único do arquivo final
    const outputFilename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${uuidv4()}.mp4`

    // Geração do vídeo
    const videoPath = await generateVideo({
      outputFilename,
      audioPath,
      backgroundPath,
      backgroundType,
      backgroundColor: backgroundColor || '#000000',
      verses,
      videoDuration
    })

    return res.json({
      success: true,
      message: 'Vídeo gerado com sucesso',
      videoPath,
      downloadUrl: `/exports/${outputFilename}`
    })
  } catch (error) {
    console.error('Export error:', error)
    return res.status(500).json({
      error: 'Erro ao gerar vídeo',
      details: error.message
    })
  }
})

// =====================================================
// EXPORT STATUS (FUTURO / PLACEHOLDER)
// =====================================================
router.get('/status/:jobId', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'completed',
      progress: 100
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar status' })
  }
})

export default router
