import express from 'express'
import authMiddleware from '../middleware/auth.js'
// import { sendErrorReport } from '../utils/emailService.js' // (opcional / futuro)

const router = express.Router()

// =====================================================
// SUBMIT ERROR / BUG REPORT
// =====================================================
router.post('/error', authMiddleware, async (req, res) => {
  try {
    const { subject, description, errorDetails, userAgent } = req.body

    if (!description) {
      return res.status(400).json({
        error: 'Descrição do erro é obrigatória'
      })
    }

    const report = {
      userId: req.user.id,
      subject: subject || 'Erro Reportado',
      description,
      errorDetails: errorDetails || null,
      userAgent: userAgent || req.headers['user-agent'],
      timestamp: new Date().toISOString()
    }

    // Log (por enquanto)
    console.log('🐞 Bug Report:', report)

    // 🔮 Futuro (email, webhook, Slack, etc.)
    // await sendErrorReport(report)

    return res.json({
      success: true,
      message: 'Relatório enviado com sucesso. Obrigado pelo feedback!'
    })
  } catch (error) {
    console.error('Erro ao enviar relatório:', error)
    return res.status(500).json({
      error: 'Erro ao enviar relatório'
    })
  }
})

export default router
