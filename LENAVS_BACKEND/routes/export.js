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

// Diretório de exports
const exportsDir = path.join(__dirname, '..', 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
  console.log("📁 Pasta 'exports' criada.");
}

// ==========================
// Funções utilitárias
// ==========================

// Criar vídeo a partir de imagem (loop por duração do áudio)
const createVideoFromImage = (imagePath, duration, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(imagePath)
      .loop(duration)
      .outputOptions([
        '-c:v libx264',
        `-t ${duration}`,
        '-pix_fmt yuv420p',
        '-vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2'
      ])
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err));
  });
};

// Duração do áudio
const getAudioDuration = (audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
};

// Processar vídeo de background (corta ou faz loop)
const processBackgroundVideo = (videoPath, duration, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);

      const videoDuration = metadata.format.duration;
      const loops = Math.ceil(duration / videoDuration);

      const ff = ffmpeg(videoPath);

      if (videoDuration < duration) {
        ff.outputOptions([
          `-stream_loop ${loops}`,
          `-t ${duration}`,
          '-c:v libx264',
          '-crf 23'
        ]);
      } else {
        ff.setStartTime(0).setDuration(duration);
      }

      ff.save(outputPath)
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err));
    });
  });
};

// ==========================
// Subtítulos SRT
// ==========================

const formatSRTTime = (timeStr) => {
  const [min, sec] = timeStr.split(':').map(Number);
  const total = min * 60 + sec;

  const hours = String(Math.floor(total / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const seconds = String(Math.floor(total % 60)).padStart(2, '0');

  return `${hours}:${minutes}:${seconds},000`;
};

const generateSubtitles = (verses) => {
  let srt = '';

  verses.forEach((v, i) => {
    if (!v.startTime || !v.endTime) return;

    srt += `${i + 1}\n`;
    srt += `${formatSRTTime(v.startTime)} --> ${formatSRTTime(v.endTime)}\n`;
    srt += `${v.text}\n\n`;
  });

  return srt;
};

// ==========================
// 🚀 Exportar Vídeo
// ==========================

router.post('/video', authenticateToken, async (req, res) => {
  try {
    const {
      projectName,
      audioUrl,
      backgroundUrl,
      backgroundType,
      verses,
      quality,
      globalStyle
    } = req.body;

    if (!audioUrl || !backgroundUrl) {
      return res.status(400).json({ error: 'Áudio e background são obrigatórios.' });
    }

    const exportId = uuidv4();
    const outputFile = `${projectName || 'karaoke'}_${exportId}.mp4`;
    const outputPath = path.join(exportsDir, outputFile);
    const tempDir = path.join(exportsDir, 'temp', exportId);

    fs.mkdirSync(tempDir, { recursive: true });

    // Paths reais no servidor
    const audioPath = path.join(__dirname, '..', audioUrl);
    const backgroundPath = path.join(__dirname, '..', backgroundUrl);

    console.log('🎵 Audio:', audioPath);
    console.log('🌄 Background:', backgroundPath);

    const audioDuration = await getAudioDuration(audioPath);

    let processedBackgroundPath = path.join(tempDir, 'background.mp4');

    if (backgroundType === 'image') {
      await createVideoFromImage(backgroundPath, audioDuration, processedBackgroundPath);
    } else {
      await processBackgroundVideo(backgroundPath, audioDuration, processedBackgroundPath);
    }

    // Subtitles
    let subtitlesPath = null;

    if (verses && verses.length > 0) {
      subtitlesPath = path.join(tempDir, 'subtitles.srt');
      fs.writeFileSync(subtitlesPath, generateSubtitles(verses), 'utf8');
    }

    const command = ffmpeg(processedBackgroundPath)
      .input(audioPath)
      .outputOptions(['-c:v libx264', '-c:a aac', '-shortest']);

    // Aplicar estilo nas legendas
    if (subtitlesPath) {
      const fontsize = globalStyle?.fontSize || 24;
      const color = (globalStyle?.color || '#FFFFFF').replace('#', '');
      const outline = (globalStyle?.outlineColor || '#000000').replace('#', '');
      const alignment = globalStyle?.alignment || 2;

      command.outputOptions([
        `-vf subtitles='${subtitlesPath}:force_style=FontName=Arial,FontSize=${fontsize},PrimaryColour=&H${color}&,OutlineColour=&H${outline}&,Alignment=${alignment}'`
      ]);
    }

    // Qualidade
    if (quality === '1080p') {
      command.outputOptions(['-s 1920x1080', '-crf 18']);
    } else {
      command.outputOptions(['-s 1280x720', '-crf 23']);
    }

    command
      .save(outputPath)
      .on('start', () => console.log('🎬 Exportação iniciada'))
      .on('progress', (p) => console.log(`⏳ ${p.percent?.toFixed(2)}%`))
      .on('end', () => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('✅ Exportação concluída');

        res.json({
          message: 'Vídeo exportado com sucesso!',
          videoUrl: `/exports/${outputFile}`,
          filename: outputFile
        });
      })
      .on('error', (err) => {
        console.error('❌ Erro FFmpeg:', err);
        fs.rmSync(tempDir, { recursive: true, force: true });
        res.status(500).json({ error: 'Erro ao exportar vídeo.' });
      });

  } catch (err) {
    console.error('❌ Erro geral:', err);
    res.status(500).json({ error: 'Erro interno ao processar exportação.' });
  }
});

export default router;
