import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { generateVideo } from '../utils/videoGenerator.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Export video
router.post('/video', authenticate, async (req, res) => {
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
    } = req.body;

    // Validate required fields
    if (!projectName) {
      return res.status(400).json({ error: 'Nome do projeto é obrigatório' });
    }

    const audioPath = audioType === 'instrumental' 
      ? audioInstrumentalPath 
      : audioOriginalPath;

    if (!audioPath) {
      return res.status(400).json({ error: 'Arquivo de áudio não fornecido' });
    }

    if (!verses || verses.length === 0) {
      return res.status(400).json({ error: 'Letras não fornecidas' });
    }

    // Generate unique filename
    const outputFilename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${uuidv4()}.mp4`;
    
    // Start video generation
    const videoPath = await generateVideo({
      outputFilename,
      audioPath,
      backgroundPath,
      backgroundType,
      backgroundColor: backgroundColor || '#000000',
      verses,
      videoDuration
    });

    res.json({
      success: true,
      message: 'Vídeo gerado com sucesso',
      videoPath,
      downloadUrl: `/exports/${outputFilename}`
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar vídeo',
      details: error.message 
    });
  }
});

// Get export status (for future async processing)
router.get('/status/:jobId', authenticate, async (req, res) => {
  try {
    // Placeholder for future async job tracking
    res.json({
      success: true,
      status: 'completed',
      progress: 100
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

export default router;
