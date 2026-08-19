import { createClient } from '@supabase/supabase-js'

// Read Supabase credentials from Vite environment variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[BillBox] Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// Name of the Supabase Storage bucket used for company logos.
export const LOGO_BUCKET = 'logos'

// Name of the Supabase Storage bucket used for receipt uploads.
export const RECEIPT_BUCKET = 'receipts'

// Accepted mime types for receipt uploads. Must mirror allowed_mime_types in schema.sql.
export const RECEIPT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'application/pdf',
]

// Max upload size per receipt file: 20 MB (in bytes).
export const RECEIPT_MAX_SIZE = 20 * 1024 * 1024
