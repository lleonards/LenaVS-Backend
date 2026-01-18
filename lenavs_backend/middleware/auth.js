import { supabase } from '../utils/supabaseClient.js'

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        message: 'Token não fornecido',
      })
    }

    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return res.status(401).json({
        message: 'Token inválido',
      })
    }

    // 🔐 Valida token usando o Supabase Auth
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      console.error('SUPABASE AUTH ERROR:', error)
      return res.status(401).json({
        message: 'Sessão inválida ou expirada',
      })
    }

    // ✅ Usuário autenticado
    req.userId = data.user.id
    req.userEmail = data.user.email

    next()
  } catch (err) {
    console.error('AUTH MIDDLEWARE ERROR:', err)
    return res.status(500).json({
      message: 'Erro interno de autenticação',
    })
  }
}
