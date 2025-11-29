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
const exportsDir = path.join(process.cwd(), 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

// Criar vídeo a partir de imagem
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
      .save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject);
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

// Manipular vídeo de background
const processBackgroundVideo = (videoPath, audioDuration, outputPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);

      const videoDuration = metadata.format.duration;

      if (videoDuration >= audioDuration) {
        ffmpeg(videoPath)
          .setStartTime(0)
          .setDuration(audioDuration)
          .outputOptions(['-c:v libx264', '-crf 23'])
          .save(outputPath)
          .on('end', () => resolve(outputPath))
          .on('error', reject);
      } else {
        const loops = Math.ceil(audioDuration / videoDuration);
        ffmpeg(videoPath)
          .outputOptions([
            `-stream_loop ${loops}`,
            '-c:v libx264',
            '-t ' + audioDuration,
            '-crf 23'
          ])
          .save(outputPath)
          .on('end', () => resolve(outputPath))
          .on('error', reject);
      }
    });
  });
};

// Gerar SRT
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

const formatSRTTime = (timeStr) => {
  const [min, sec] = timeStr.split(':').map(Number);
  const totalSeconds = min * 60 + sec;

  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(Math.floor(totalSeconds % 60)).padStart(2, '0');

  return `${hours}:${minutes}:${seconds},000`;
};

// Exportar vídeo
router.post('/video', authenticateToken, async (req, res) => {
  try {
    const { projectName, audioUrl, backgroundUrl, backgroundType, verses, quality, globalStyle } = req.body;

    if (!audioUrl || !backgroundUrl) {
      return res.status(400).json({ error: 'Áudio e background são obrigatórios' });
    }

    const exportId = uuidv4();
    const filename = `${projectName || 'karaoke'}_${exportId}.mp4`;
    const outputPath = path.join(exportsDir, filename);

    const audioPath = path.join(process.cwd(), audioUrl.replace('/', ''));
    const backgroundPath = path.join(process.cwd(), backgroundUrl.replace('/', ''));

    const tempDir = path.join(exportsDir, 'temp', exportId);
    fs.mkdirSync(tempDir, { recursive: true });

    const audioDuration = await getAudioDuration(audioPath);

    // Gerar background
    let processedBackgroundPath;
    if (backgroundType === 'image') {
      processedBackgroundPath = path.join(tempDir, 'bg_video.mp4');
      await createVideoFromImage(backgroundPath, audioDuration, processedBackgroundPath);
    } else {
      processedBackgroundPath = path.join(tempDir, 'bg_processed.mp4');
      await processBackgroundVideo(backgroundPath, audioDuration, processedBackgroundPath);
    }

    // Gerar legendas
    let subtitlesPath = null;
    if (verses && verses.length > 0) {
      subtitlesPath = path.join(tempDir, 'subtitles.srt');
      fs.writeFileSync(subtitlesPath, generateSubtitles(verses), 'utf-8');
    }

    const command = ffmpeg(processedBackgroundPath)
      .input(audioPath)
      .outputOptions(['-c:v libx264', '-c:a aac', '-b:a 192k', '-shortest']);

    if (subtitlesPath) {
      command.outputOptions([
        `-vf subtitles=${subtitlesPath}:force_style='FontName=Montserrat,FontSize=${globalStyle?.fontSize || 24}'`
      ]);
    }

    if (quality === '1080p') {
      command.outputOptions(['-s 1920x1080', '-crf 18']);
    } else {
      command.outputOptions(['-s 1280x720', '-crf 23']);
    }

    command
      .save(outputPath)
      .on('end', () => {
        fs.rmSync(tempDir, { recursive: true, force: true });

        res.json({
          message: 'Vídeo gerado com sucesso!',
          videoUrl: `/exports/${filename}`
        });
      })
      .on('error', (err) => {
        console.error('Erro no FFmpeg:', err);
        res.status(500).json({ error: 'Erro ao processar vídeo' });
      });

  } catch (err) {
    console.error('Erro geral:', err);
    res.status(500).json({ error: 'Falha inesperada' });
  }
});

export default router;
