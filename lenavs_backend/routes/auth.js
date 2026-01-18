import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../utils/supabaseClient.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// ------------------------------------
// REGISTER
// ------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Preencha todos os campos',
      })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'As senhas não coincidem',
      })
    }

    // 🔍 Verifica se usuário já existe (SEM single)
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (findError) {
      console.error('SUPABASE FIND USER ERROR:', findError)
      return res.status(500).json({
        message: 'Erro interno no servidor',
      })
    }

    if (existingUser) {
      return res.status(400).json({
        message: 'Este email já está cadastrado',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // ➕ Cria usuário
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          trial_ends_at: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ),
        },
      ])
      .select()
      .single()

    if (insertError || !user) {
      console.error('SUPABASE INSERT ERROR:', insertError)
      return res.status(500).json({
        message: 'Erro ao criar usuário',
      })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    })
  } catch (err) {
    console.error('REGISTER ERROR:', err)
    return res.status(500).json({
      message: 'Erro interno no servidor',
    })
  }
})

// ------------------------------------
// LOGIN
// ------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email e senha são obrigatórios',
      })
    }

    // 🔍 Busca usuário (SEM single)
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (error) {
      console.error('SUPABASE LOGIN ERROR:', error)
      return res.status(500).json({
        message: 'Erro interno no servidor',
      })
    }

    if (!user) {
      return res.status(400).json({
        message: 'Email ou senha inválidos',
      })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      return res.status(400).json({
        message: 'Email ou senha inválidos',
      })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    })
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return res.status(500).json({
      message: 'Erro interno no servidor',
    })
  }
})

// ------------------------------------
// ME (rota protegida)
// ------------------------------------
router.get('/me', authenticate, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, trial_ends_at')
      .eq('id', req.userId)
      .maybeSingle()

    if (error) {
      console.error('SUPABASE ME ERROR:', error)
      return res.status(500).json({
        message: 'Erro interno no servidor',
      })
    }

    if (!user) {
      return res.status(404).json({
        message: 'Usuário não encontrado',
      })
    }

    return res.json({ user })
  } catch (err) {
    console.error('ME ERROR:', err)
    return res.status(500).json({
      message: 'Erro interno no servidor',
    })
  }
})

export default router
