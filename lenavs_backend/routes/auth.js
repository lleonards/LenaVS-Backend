import express from 'express'
import { supabase } from '../utils/supabaseClient.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// ------------------------------------
// ME (rota protegida)
// ------------------------------------
router.get('/me', authenticate, async (req, res) => {
  try {
    // req.userId vem do middleware authenticate
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, trial_ends_at')
      .eq('id', req.userId)
      .single()

    if (error) {
      console.error('SUPABASE ME ERROR:', error)
      return res.status(500).json({
        message: 'Erro ao buscar usuário',
      })
    }

    return res.json({ user })
  } catch (err) {
    console.error('ME ROUTE ERROR:', err)
    return res.status(500).json({
      message: 'Erro interno no servidor',
    })
  }
})

export default router
