import express from 'express'
import { supabase } from '../utils/supabaseClient.js'

const router = express.Router()

// =====================================================
// REGISTER
// =====================================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Preencha todos os campos'
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'As senhas não coincidem'
      })
    }

    // 1️⃣ Tentar criar usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    // 🔴 EMAIL JÁ CADASTRADO (SUPABASE NÃO RETORNA ERRO CLARO)
    if (error || !data?.user) {
      return res.status(400).json({
        message: 'Este email já está cadastrado. Faça login.'
      })
    }

    const userId = data.user.id

    // 2️⃣ Trial de 7 dias
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    // 3️⃣ Inserir usuário na tabela users
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
    return res.status(500).json({
      message: 'Erro interno do servidor'
    })
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

    if (error) {
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
    return res.status(500).json({
      message: 'Erro interno do servidor'
    })
  }
})

export default router
