import { supabase } from '../utils/supabaseClient.js'

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ message: 'Token não fornecido' })
    }

    const token = authHeader.replace('Bearer ', '')

    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      return res.status(401).json({ message: 'Token inválido' })
    }

    // disponibiliza para as rotas
    req.userId = data.user.id
    req.user = data.user

    next()
  } catch (err) {
    console.error('Auth error:', err)
    return res.status(401).json({ message: 'Não autorizado' })
  }
}
