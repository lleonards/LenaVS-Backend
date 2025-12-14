import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabase } from '../lib/supabaseClient.js'

const router = express.Router()

// ------------------------------------
// REGISTER
// ------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' })
    }

    // 1️⃣ Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (authError) {
      return res.status(400).json({ error: authError.message })
    }

    const userId = authData.user.id

    // 2️⃣ Create user in database
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    const { error: dbError } = await supabase.from('users').insert([
      {
        id: userId,
        email,
        name,
        plan: 'trial',
        active: true,
        trial_ends_at: trialEndsAt.toISOString(),
      },
    ])

    if (dbError) {
      return res.status(400).json({ error: dbError.message })
    }

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        name,
        plan: 'trial',
        trial_ends_at: trialEndsAt,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ------------------------------------
// LOGIN
// ------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
      session: data.session,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
