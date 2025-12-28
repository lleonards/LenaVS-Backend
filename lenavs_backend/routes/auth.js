import express from 'express'
import { supabase } from '../utils/supabaseClient.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// =====================================================
// REGISTER
// =====================================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Preencha todos os campos' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'As senhas não coincidem' })
    }

    // Criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      if (error.message?.toLowerCase().includes('already')) {
        return res.status(409).json({
          message: 'Este email já está cadastrado'
        })
      }
      return res.status(400).json({ message: error.message })
    }

    if (!data?.user) {
      return res.status(400).json({ message: 'Usuário não criado' })
    }

    const userId = data.user.id

    // Verifica se já existe na tabela users
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (existingUser) {
      return res.status(201).json({
        user: existingUser,
        session: data.session
      })
    }

    // Trial de 7 dias
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        plan: 'trial',
        active: true,
        trial_ends_at: trialEndsAt.toISOString()
      })

    if (dbError) {
      console.error(dbError)
      return res.status(500).json({
        message: 'Erro ao salvar usuário'
      })
    }

    return res.status(201).json({
      user: {
        id: userId,
        email,
        name,
        plan: 'trial',
        trial_ends_at: trialEndsAt
      },
      session: data.session
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

// =====================================================
// LOGIN
// =====================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email e senha são obrigatórios'
      })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error || !data?.user) {
      return res.status(401).json({
        message: 'Email ou senha inválidos'
      })
    }

    const userId = data.user.id

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return res.status(404).json({
        message: 'Usuário não encontrado'
      })
    }

    return res.json({
      user: userData,
      session: data.session
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

// =====================================================
// VERIFY (ESSENCIAL PARA EVITAR TELA BRANCA)
// =====================================================
router.get('/verify', authenticate, async (req, res) => {
  try {
    return res.json({
      success: true,
      userId: req.userId
    })
  } catch (err) {
    return res.status(401).json({
      message: 'Sessão inválida'
    })
  }
})

export default router
