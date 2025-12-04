import ffmpeg from 'fluent-ffmpeg';
import { createCanvas, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { parseTimeToSeconds } from './lyricsProcessor.js';

/**
 * Generate karaoke video with synced lyrics
 */
export const generateVideo = async ({
  outputFilename,
  audioPath,
  backgroundPath,
  backgroundType,
  backgroundColor,
  verses,
  videoDuration
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const outputPath = `exports/${outputFilename}`;
      const tempDir = 'uploads/temp';
      
      // Create temp directory
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate subtitle file (ASS format for styling)
      const subtitlePath = await generateSubtitles(verses, tempDir);

      // Start FFmpeg process
      let command = ffmpeg();

      // Add audio input
      command.input(`.${audioPath}`);

      // Handle background
      if (backgroundPath && backgroundType === 'video') {
        // Use video background
        command.input(`.${backgroundPath}`);
        
        // Add video filters
        command.complexFilter([
          // Scale background to 1920x1080 and loop if needed
          `[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,loop=loop=-1:size=1:start=0[bg]`,
          // Burn subtitles
          `[bg]ass=${subtitlePath}[v]`
        ]);
        
        command.outputOptions('-map', '[v]');
        command.outputOptions('-map', '0:a');
        
      } else if (backgroundPath && backgroundType === 'image') {
        // Use image background (convert to video)
        command.input(`.${backgroundPath}`);
        command.inputOptions('-loop 1');
        
        command.complexFilter([
          `[1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2[bg]`,
          `[bg]ass=${subtitlePath}[v]`
        ]);
        
        command.outputOptions('-map', '[v]');
        command.outputOptions('-map', '0:a');
        
      } else {
        // Use solid color background
        const color = backgroundColor.replace('#', '');
        
        command.input(`color=c=${color}:s=1920x1080:d=${videoDuration}`);
        command.inputFormat('lavfi');
        
        command.complexFilter([
          `[0:v]ass=${subtitlePath}[v]`
        ]);
        
        command.outputOptions('-map', '[v]');
        command.outputOptions('-map', '1:a');
      }

      // Output settings
      command
        .outputOptions('-c:v', 'libx264')
        .outputOptions('-preset', 'medium')
        .outputOptions('-crf', '23')
        .outputOptions('-c:a', 'aac')
        .outputOptions('-b:a', '192k')
        .outputOptions('-shortest')
        .output(outputPath);

      // Handle progress
      command.on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      });

      // Handle completion
      command.on('end', () => {
        console.log('Video generation completed');
        // Clean up temp files
        try {
          fs.unlinkSync(subtitlePath);
        } catch (e) {}
        resolve(`/exports/${outputFilename}`);
      });

      // Handle error
      command.on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      });

      // Run the command
      command.run();

    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generate ASS subtitle file with styling
 */
const generateSubtitles = async (verses, tempDir) => {
  const subtitlePath = path.join(tempDir, `subtitles_${Date.now()}.ass`);
  
  // ASS file header
  let assContent = `[Script Info]
Title: LenaVS Karaoke
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
`;

  // Create styles for each verse (if they have custom styles)
  const uniqueStyles = new Map();
  verses.forEach((verse, index) => {
    const styleKey = JSON.stringify(verse.style);
    if (!uniqueStyles.has(styleKey)) {
      uniqueStyles.set(styleKey, `Style${index}`);
      
      const s = verse.style;
      const alignment = s.alignment === 'left' ? 1 : s.alignment === 'right' ? 3 : 2;
      const bold = s.bold ? -1 : 0;
      const italic = s.italic ? -1 : 0;
      const underline = s.underline ? -1 : 0;
      
      // Convert hex colors to ASS format (&HAABBGGRR)
      const primaryColor = hexToAssColor(s.color);
      const outlineColor = hexToAssColor(s.outlineColor);
      
      assContent += `Style: ${uniqueStyles.get(styleKey)},${s.fontFamily},${s.fontSize},${primaryColor},&H000000FF,${outlineColor},&H00000000,${bold},${italic},${underline},0,100,100,0,0,1,${s.outlineWidth},0,${alignment},10,10,10,1\n`;
    }
  });

  assContent += '\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';

  // Add dialogue lines
  verses.forEach((verse, index) => {
    if (!verse.startTime || !verse.endTime) return;
    
    const startSeconds = parseTimeToSeconds(verse.startTime);
    const endSeconds = parseTimeToSeconds(verse.endTime);
    
    const start = formatAssTime(startSeconds);
    const end = formatAssTime(endSeconds);
    
    const styleKey = JSON.stringify(verse.style);
    const styleName = uniqueStyles.get(styleKey);
    
    // Handle transitions
    let effect = '';
    if (verse.style.transition === 'fade') {
      effect = `{\\fad(300,300)}`;
    } else if (verse.style.transition === 'slide') {
      effect = `{\\move(1920,540,960,540)}`;
    } else if (verse.style.transition === 'zoom-in') {
      effect = `{\\t(0,300,\\fscx120\\fscy120)\\t(300,600,\\fscx100\\fscy100)}`;
    }
    
    const text = verse.text.replace(/\n/g, '\\N');
    
    assContent += `Dialogue: 0,${start},${end},${styleName},,0,0,0,,${effect}${text}\n`;
  });

  fs.writeFileSync(subtitlePath, assContent, 'utf-8');
  return subtitlePath;
};

/**
 * Convert hex color to ASS color format
 */
const hexToAssColor = (hex) => {
  hex = hex.replace('#', '');
  const r = hex.substring(0, 2);
  const g = hex.substring(2, 4);
  const b = hex.substring(4, 6);
  return `&H00${b}${g}${r}`;
};

/**
 * Format seconds to ASS time format (h:mm:ss.cs)
 */
const formatAssTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
};
