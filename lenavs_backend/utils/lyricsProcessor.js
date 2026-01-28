import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Default style for every verse
 * (prevents undefined font errors)
 */
const defaultStyle = {
  fontFamily: 'Montserrat',
  fontSize: 48,
  color: '#FFFFFF',
  outlineColor: '#000000',
  outlineWidth: 2,
  bold: false,
  italic: false,
  underline: false,
  alignment: 'center',
  transition: 'fade'
};

/**
 * Core processor for lyrics text
 * Used by BOTH file upload and manual paste
 */
export const processLyricsText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    return {
      verses: [],
      meta: { autoSeparated: false }
    };
  }

  // Normalize line breaks
  const text = rawText.replace(/\r\n/g, '\n').trim();

  // Detect paragraph separation (empty lines)
  const hasParagraphs = /\n\s*\n/.test(text);

  let blocks = [];
  let autoSeparated = false;

  if (hasParagraphs) {
    // Case 1: User already separated verses
    blocks = text
      .split(/\n\s*\n/)
      .map(b => b.trim())
      .filter(Boolean);
  } else {
    // Case 2: No paragraphs → split every 4 lines
    const lines = text
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    for (let i = 0; i < lines.length; i += 4) {
      blocks.push(lines.slice(i, i + 4).join('\n'));
    }

    autoSeparated = true;
  }

  const verses = blocks.map((block, index) => ({
    id: uuidv4(),
    text: block,
    order: index,
    startTime: '',
    endTime: '',
    style: { ...defaultStyle }
  }));

  return {
    verses,
    meta: {
      autoSeparated,
      method: autoSeparated ? 'groups-of-4' : 'paragraphs'
    }
  };
};

/**
 * Process lyrics file and extract verses
 * Supports: .txt (others future)
 */
export const processLyricsFile = async (filePath, mimeType) => {
  try {
    let text = '';

    if (mimeType === 'text/plain') {
      text = fs.readFileSync(filePath, 'utf-8');
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      throw new Error('Suporte para .docx em desenvolvimento. Use .txt por enquanto.');
    } else if (mimeType === 'application/pdf') {
      throw new Error('Suporte para PDF em desenvolvimento. Use .txt por enquanto.');
    } else {
      throw new Error('Tipo de arquivo não suportado');
    }

    return processLyricsText(text);
  } catch (error) {
    console.error('Error processing lyrics:', error);
    throw error;
  }
};

/**
 * Parse time string (mm:ss or ss) to seconds
 */
export const parseTimeToSeconds = (timeString) => {
  if (!timeString) return 0;

  const parts = timeString.split(':').map(Number);

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }

  return 0;
};

/**
 * Format seconds to mm:ss
 */
export const formatSecondsToTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};
