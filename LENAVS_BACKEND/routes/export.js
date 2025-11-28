import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Criar diretório de exports se não existir
const exportsDir = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Função auxiliar para criar vídeo a partir de imagem
const createVideoFromImage = (imagePath, duration, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(imagePath)
      .loop(duration)
      .outputOptions([
        '-c:v libx264',
        '-t ' + duration,
        '-pix_fmt yuv420p',
        '-vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2'
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err))
      .run();
  });
};

// Função auxiliar para obter duração do áudio
const getAudioDuration = (audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
};

// Função para processar vídeo de background
const processBackgroundVideo = (videoPath, audioDuration, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      
      const videoDuration = metadata.format.duration;
      
      if (videoDuration >= audioDuration) {
        // Cortar vídeo
        ffmpeg(videoPath)
          .setStartTime(0)
          .setDuration(audioDuration)
          .outputOptions(['-c:v libx264', '-crf 23'])
          .output(outputPath)
          .on('end', () => resolve(outputPath))
          .on('error', (err) => reject(err))
          .run();
      } else {
        // Loop do vídeo
        const loops = Math.ceil(audioDuration / videoDuration);
        ffmpeg(videoPath)
          .outputOptions([
            `-stream_loop ${loops}`,
            '-c:v libx264',
            '-t ' + audioDuration,
            '-crf 23'
          ])
          .output(outputPath)
          .on('end', () => resolve(outputPath))
          .on('error', (err) => reject(err))
          .run();
      }
    });
  });
};

// Função para gerar arquivo de legendas SRT
const generateSubtitles = (verses) => {
  let srt = '';
  
  verses.forEach((verse, index) => {
    if (!verse.startTime || !verse.endTime) return;
    
    srt += `${index + 1}\n`;
    srt += `${formatSRTTime(verse.startTime)} --> ${formatSRTTime(verse.endTime)}\n`;
    srt += `${verse.text}\n\n`;
  });
  
  return srt;
};

// Formatar tempo para SRT (00:00:00,000)
const formatSRTTime = (timeStr) => {
  const [min, sec] = timeStr.split(':').map(Number);
  const totalSeconds = min * 60 + sec;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.floor((totalSeconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
};

// Exportar vídeo
router.post('/video', authenticateToken, async (req, res) => {
  try {
    const { 
      projectName,
      audioUrl, 
      backgroundUrl, 
      backgroundType, // 'image' ou 'video'
      verses,
      format,
      quality,
      globalStyle
    } = req.body;

    if (!audioUrl || !backgroundUrl) {
      return res.status(400).json({ error: 'Áudio e background são obrigatórios' });
    }

    const exportId = uuidv4();
    const outputFilename = `${projectName || 'karaoke'}_${exportId}.mp4`;
    const outputPath = path.join(exportsDir, outputFilename);
    const tempDir = path.join(exportsDir, 'temp', exportId);
    
    // Criar diretório temporário
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Paths dos arquivos
    const audioPath = path.join(__dirname, '..', audioUrl);
    const backgroundPath = path.join(__dirname, '..', backgroundUrl);
    
    // Obter duração do áudio
    const audioDuration = await getAudioDuration(audioPath);
    
    // Processar background
    let processedBackgroundPath;
    
    if (backgroundType === 'image') {
      processedBackgroundPath = path.join(tempDir, 'background_video.mp4');
      await createVideoFromImage(backgroundPath, audioDuration, processedBackgroundPath);
    } else {
      processedBackgroundPath = path.join(tempDir, 'background_processed.mp4');
      await processedBackgroundPath(backgroundPath, audioDuration, processedBackgroundPath);
    }

    // Gerar arquivo de legendas
    let subtitlesPath = null;
    if (verses && verses.length > 0) {
      subtitlesPath = path.join(tempDir, 'subtitles.srt');
      const srtContent = generateSubtitles(verses);
      fs.writeFileSync(subtitlesPath, srtContent, 'utf8');
    }

    // Criar vídeo final com FFmpeg
    const command = ffmpeg(processedBackgroundPath)
      .input(audioPath)
      .outputOptions([
        '-c:v libx264',
        '-c:a aac',
        '-b:a 192k',
        '-shortest'
      ]);

    // Adicionar legendas se existirem
    if (subtitlesPath) {
      // Configurar estilo das legendas baseado no globalStyle
      const fontsize = globalStyle?.fontSize || 24;
      const fontcolor = globalStyle?.color?.replace('#', '') || 'FFFFFF';
      const bordercolor = globalStyle?.outlineColor?.replace('#', '') || '000000';
      const alignment = globalStyle?.alignment || 2; // 2 = centro
      
      command.outputOptions([
        `-vf subtitles=${subtitlesPath}:force_style='FontName=Montserrat,FontSize=${fontsize},PrimaryColour=&H${fontcolor}&,OutlineColour=&H${bordercolor}&,Alignment=${alignment},Bold=${globalStyle?.bold ? -1 : 0},Italic=${globalStyle?.italic ? -1 : 0}'`
      ]);
    }

    // Configurar qualidade
    if (quality === '1080p') {
      command.outputOptions(['-s 1920x1080', '-crf 18']);
    } else {
      command.outputOptions(['-s 1280x720', '-crf 23']);
    }

    // Executar exportação
    command
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('Iniciando exportação:', cmd);
      })
      .on('progress', (progress) => {
        console.log(`Progresso: ${progress.percent}%`);
      })
      .on('end', () => {
        // Limpar arquivos temporários
        fs.rmSync(tempDir, { recursive: true, force: true });
        
        res.json({
          message: 'Vídeo exportado com sucesso',
          videoUrl: `/exports/${outputFilename}`,
          filename: outputFilename
        });
      })
      .on('error', (err) => {
        console.error('Erro na exportação:', err);
        fs.rmSync(tempDir, { recursive: true, force: true });
        res.status(500).json({ error: 'Erro ao exportar vídeo' });
      })
      .run();

  } catch (error) {
    console.error('Erro ao exportar vídeo:', error);
    res.status(500).json({ error: 'Erro ao processar exportação' });
  }
});

// Rota para verificar status de exportação (para implementação futura de queue)
router.get('/status/:exportId', authenticateToken, (req, res) => {
  res.json({
    status: 'completed',
    message: 'Sistema de filas será implementado em versão futura'
  });
});

export default router;
