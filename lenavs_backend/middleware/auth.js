import { supabase } from '../utils/supabaseClient.js'

export default async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({
        message: 'Token não fornecido'
      })
    }

    const token = authHeader.replace('Bearer ', '')

    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data?.user) {
      return res.status(401).json({
        message: 'Token inválido'
      })
    }

    req.user = data.user
    next()
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      message: 'Erro interno de autenticação'
    })
  }
}
