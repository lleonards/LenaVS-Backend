import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Process lyrics file and extract verses
 * Supports: .txt, .docx, .pdf
 */
export const processLyricsFile = async (filePath, mimeType) => {
  try {
    let text = '';

    if (mimeType === 'text/plain') {
      // Read plain text file
      text = fs.readFileSync(filePath, 'utf-8');
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // TODO: For .docx files, install and use 'mammoth' package
      // const mammoth = require('mammoth');
      // const result = await mammoth.extractRawText({ path: filePath });
      // text = result.value;
      
      throw new Error('Suporte para .docx em desenvolvimento. Use .txt por enquanto.');
    } else if (mimeType === 'application/pdf') {
      // TODO: For PDF files, install and use 'pdf-parse' package
      // const pdfParse = require('pdf-parse');
      // const dataBuffer = fs.readFileSync(filePath);
      // const data = await pdfParse(dataBuffer);
      // text = data.text;
      
      throw new Error('Suporte para PDF em desenvolvimento. Use .txt por enquanto.');
    } else {
      throw new Error('Tipo de arquivo não suportado');
    }

    // Process text and split into verses
    // Preserve accents and special characters (ç, á, é, etc.)
    const verses = text
      .split(/\n\s*\n/) // Split by double line breaks
      .filter(verse => verse.trim().length > 0)
      .map((verse, index) => ({
        id: uuidv4(),
        text: verse.trim(),
        order: index,
        startTime: '',
        endTime: '',
        style: {
          fontFamily: 'Montserrat',
          fontSize: 48,
          color: '#FFFFFF',
          outlineColor: '#000000',
          outlineWidth: 2,
          bold: false,
          italic: false,
          underline: false,
          alignment: 'center', // left, center, right
          transition: 'fade' // fade, slide, zoom-in, zoom-out
        }
      }));

    return verses;
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
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
