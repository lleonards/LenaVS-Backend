import { supabase } from '../lib/supabaseClient.js'

export async function checkSubscription(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')

    // 1️⃣ Get user from token
    const { data: authData, error: authError } =
      await supabase.auth.getUser(token)

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const userId = authData.user.id

    // 2️⃣ Get user from DB
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return res.status(403).json({ error: 'User not found' })
    }

    if (!user.active) {
      return res.status(403).json({ error: 'Account disabled' })
    }

    // 3️⃣ Trial check
    if (user.plan === 'trial') {
      const now = new Date()
      const trialEnd = new Date(user.trial_ends_at)

      if (now > trialEnd) {
        return res.status(402).json({
          error: 'Trial expired',
          code: 'TRIAL_EXPIRED'
        })
      }
    }

    // 4️⃣ Attach user to request
    req.user = user

    next()
  } catch (err) {
    console.error('Subscription check error:', err)
    res.status(500).json({ error: 'Subscription validation failed' })
  }
}
