import express from 'express'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

/**
 * PAYMENT ROUTES - STRUCTURE
 * Integração futura (Stripe, Mercado Pago, etc.)
 */

// =====================================================
// CREATE PAYMENT SESSION
// =====================================================
router.post('/create-session', authenticate, async (req, res) => {
  try {
    const { plan, amount, currency } = req.body

    // Placeholder (integração futura)
    return res.json({
      success: true,
      message: 'Integração de pagamento pendente',
      sessionId: 'placeholder_session_id'
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      error: 'Erro ao criar sessão de pagamento'
    })
  }
})

// =====================================================
// PAYMENT WEBHOOK (SEM AUTH)
// ⚠️ IMPORTANTE: webhook NÃO usa authenticate
// =====================================================
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      return res.json({ received: true })
    } catch (error) {
      return res.status(400).json({ error: 'Webhook error' })
    }
  }
)

// =====================================================
// PAYMENT HISTORY
// =====================================================
router.get('/history', authenticate, async (req, res) => {
  try {
    return res.json({
      success: true,
      payments: []
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao buscar histórico'
    })
  }
})

// =====================================================
// SUBSCRIPTION STATUS
// =====================================================
router.get('/subscription', authenticate, async (req, res) => {
  try {
    return res.json({
      success: true,
      hasActiveSubscription: false,
      plan: null,
      expiresAt: null
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao verificar assinatura'
    })
  }
})

export default router
