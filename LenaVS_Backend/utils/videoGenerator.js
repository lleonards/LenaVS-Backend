const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const { createCanvas, registerFont } = require('canvas');

// Função principal para gerar vídeo
async function generateVideo(options) {
  const {
    projectName,
    verses,
    audioPath,
    backgroundPath,
    backgroundColor,
    audioType
  } = options;

  const exportsDir = path.join(__dirname, '../exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }

  const outputFilename = `${sanitizeFilename(projectName)}.mp4`;
  const outputPath = path.join(exportsDir, outputFilename);

  // Gerar frames das letras
  const framesDir = path.join(__dirname, '../temp', `frames-${Date.now()}`);
  if (!fs.existsSync(framesDir)) {
    fs.mkdirSync(framesDir, { recursive: true });
  }

  await generateLyricFrames(verses, framesDir, backgroundColor);

  // Processar vídeo com FFmpeg
  return new Promise((resolve, reject) => {
    const audioFilePath = path.join(__dirname, '..', audioPath.replace(/^\//, ''));

    let command = ffmpeg();

    // Adicionar background se fornecido
    if (backgroundPath) {
      const bgFilePath = path.join(__dirname, '..', backgroundPath.replace(/^\//, ''));
      command = command.input(bgFilePath);
    }

    // Adicionar áudio
    command = command.input(audioFilePath);

    // Adicionar frames das letras (simplificado - versão básica)
    // Em produção, usar overlays complexos do FFmpeg para sincronizar letras

    command
      .outputOptions([
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        '-c:a aac',
        '-b:a 192k',
        '-movflags +faststart'
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('FFmpeg iniciado:', cmd);
      })
      .on('progress', (progress) => {
        console.log(`Processando: ${progress.percent}%`);
      })
      .on('end', () => {
        console.log('Vídeo gerado com sucesso!');
        // Limpar frames temporários
        cleanupDirectory(framesDir);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Erro ao gerar vídeo:', err);
        cleanupDirectory(framesDir);
        reject(err);
      })
      .run();
  });
}

// Gerar frames das letras
async function generateLyricFrames(verses, outputDir, bgColor) {
  const width = 1920;
  const height = 1080;

  for (let i = 0; i < verses.length; i++) {
    const verse = verses[i];
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Fundo
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Configurar texto
    const style = verse.style || {};
    const fontSize = style.fontSize || 40;
    const fontFamily = style.fontFamily || 'Arial';
    const color = style.color || '#FFFFFF';
    const strokeColor = style.strokeColor || '#000000';
    const strokeWidth = style.strokeWidth || 2;
    
    let fontStyle = '';
    if (style.bold) fontStyle += 'bold ';
    if (style.italic) fontStyle += 'italic ';

    ctx.font = `${fontStyle}${fontSize}px ${fontFamily}`;
    ctx.textAlign = style.align || 'center';
    ctx.textBaseline = 'middle';

    // Desenhar texto com contorno
    const lines = verse.text.split('\n');
    const lineHeight = fontSize * 1.4;
    const startY = height / 2 - (lines.length * lineHeight) / 2;

    lines.forEach((line, idx) => {
      const y = startY + idx * lineHeight;
      const x = style.align === 'left' ? 100 : style.align === 'right' ? width - 100 : width / 2;

      // Contorno
      if (strokeWidth > 0) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.strokeText(line, x, y);
      }

      // Texto
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
    });

    // Salvar frame
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, `frame-${i.toString().padStart(4, '0')}.png`), buffer);
  }
}

// Limpar nome de arquivo
function sanitizeFilename(name) {
  return name
    .replace(/[^a-z0-9áàâãéèêíïóôõöúçñ\s-]/gi, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

// Limpar diretório
function cleanupDirectory(dir) {
  try {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  } catch (error) {
    console.error('Erro ao limpar diretório:', error);
  }
}

module.exports = { generateVideo };
