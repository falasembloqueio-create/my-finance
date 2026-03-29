import { createClient } from '@supabase/supabase-js'

// Substitua pelas SUAS chaves do projeto anterior
const supabaseUrl = 'https://yblrtbdrfjhfwmplnihf.supabase.co'
const supabaseAnonKey = 'sb_publishable_lxEMBVBxy7RAH1kgKSmtMg_7IEW1GOd'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)