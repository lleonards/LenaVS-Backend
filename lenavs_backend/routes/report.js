import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { sendErrorReport } from '../utils/emailService.js';

const router = express.Router();

// Submit bug report
router.post('/error', authenticate, async (req, res) => {
  try {
    const { subject, description, errorDetails, userAgent } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Descrição do erro é obrigatória' });
    }

    // TODO: Send email report
    // For now, just log the report
    const report = {
      userId: req.userId,
      subject: subject || 'Erro Reportado',
      description,
      errorDetails,
      userAgent,
      timestamp: new Date().toISOString()
    };

    console.log('Bug Report:', report);

    // Placeholder for email sending
    // await sendErrorReport(report);

    res.json({
      success: true,
      message: 'Relatório enviado com sucesso. Obrigado pelo feedback!'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao enviar relatório' });
  }
});

export default router;
