const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const { generateVideo } = require('../utils/videoGenerator');

// Exportar vídeo
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { projectName, verses, audioPath, backgroundPath, backgroundColor, audioType } = req.body;

    // Validações
    if (!projectName) {
      return res.status(400).json({ error: 'Nome do projeto é obrigatório.' });
    }

    if (!audioPath) {
      return res.status(400).json({ error: 'Áudio é obrigatório.' });
    }

    if (!verses || verses.length === 0) {
      return res.status(400).json({ error: 'Letras são obrigatórias.' });
    }

    // Gerar vídeo
    const videoPath = await generateVideo({
      projectName,
      verses,
      audioPath,
      backgroundPath,
      backgroundColor: backgroundColor || '#000000',
      audioType: audioType || 'original'
    });

    res.json({
      message: 'Vídeo gerado com sucesso!',
      videoPath,
      downloadUrl: `/exports/${path.basename(videoPath)}`
    });
  } catch (error) {
    console.error('Erro ao exportar vídeo:', error);
    res.status(500).json({ error: 'Erro ao exportar vídeo: ' + error.message });
  }
});

// Download de vídeo exportado
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../exports', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado.' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('Erro ao fazer download:', error);
    res.status(500).json({ error: 'Erro ao fazer download.' });
  }
});

// Listar vídeos exportados
router.get('/list', authMiddleware, (req, res) => {
  try {
    const exportsDir = path.join(__dirname, '../exports');
    
    if (!fs.existsSync(exportsDir)) {
      return res.json({ exports: [] });
    }

    const files = fs.readdirSync(exportsDir);
    const exports = files.map(file => {
      const stats = fs.statSync(path.join(exportsDir, file));
      return {
        filename: file,
        size: stats.size,
        createdAt: stats.birthtime,
        downloadUrl: `/exports/${file}`
      };
    });

    res.json({ exports });
  } catch (error) {
    console.error('Erro ao listar exportações:', error);
    res.status(500).json({ error: 'Erro ao listar exportações.' });
  }
});

module.exports = router;
