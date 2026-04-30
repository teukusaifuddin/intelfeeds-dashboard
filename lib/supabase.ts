import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Feed = {
  id: string
  title: string
  content: string | null
  source: string
  type: 'media' | 'official'
  category: 'naval' | 'air' | 'land' | 'geopolitical'
  url: string
  published_at: string | null
  created_at: string
}
