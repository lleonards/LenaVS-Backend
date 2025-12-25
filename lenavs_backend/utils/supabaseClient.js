import { createClient } from '@supabase/supabase-js';

// URL do projeto Supabase
const supabaseUrl = process.env.SUPABASE_URL;

// ⚠️ IMPORTANTE
// No BACKEND, use SEMPRE a SERVICE ROLE KEY
// Nunca use a ANON KEY aqui
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Supabase environment variables are missing. ' +
    'Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  );
}

// Cliente Supabase para BACKEND
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      // Backend não mantém sessão
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        // Identificação opcional do backend
        'X-Client-Info': 'lenavs-backend'
      }
    }
  }
);
