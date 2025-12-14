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
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    // 1️⃣ Criar usuário no Supabase Auth (SIGN UP NORMAL)
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    if (!data.user) {
      return res.status(400).json({ error: 'User not created' })
    }

    const userId = data.user.id

    // 2️⃣ Trial de 7 dias
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    // 3️⃣ Criar usuário na tabela users
    const { error: dbError } = await supabase.from('users').insert([
      {
        id: userId,
        email,
        name,
        plan: 'trial',
        active: true,
        trial_ends_at: trialEndsAt.toISOString()
      }
    ])

    if (dbError) {
      return res.status(400).json({ error: dbError.message })
    }

    // 4️⃣ Retornar usuário + sessão
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
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// LOGIN
// =====================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const userId = data.user.id

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      return res.status(400).json({ error: userError.message })
    }

    return res.json({
      user: userData,
      session: data.session
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// =====================================================
// GET CURRENT USER (/api/auth/me)
// =====================================================
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: 'Missing token' })
    }

    const token = authHeader.replace('Bearer ', '')

    const { data: authData, error: authError } =
      await supabase.auth.getUser(token)

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.json({ user })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
