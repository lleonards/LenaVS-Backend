import { createClient } from '@supabase/supabase-js'

// --------------------------------------------------
// ENV VARIABLES (BACKEND ONLY)
// --------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Supabase env vars missing. ' +
    'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  )
}

// --------------------------------------------------
// SUPABASE CLIENT (BACKEND)
// --------------------------------------------------
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'X-Client-Info': 'lenavs-backend'
      }
    }
  }
)
