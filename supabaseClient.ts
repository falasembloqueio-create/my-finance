import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yblrtbdrfjhfwmplnihf.supabase.co'
const supabaseKey = 'sb_publishable_lxEMBVBxy7RAH1kgKSmtMg_7IEW1GOd'

export const supabase = createClient(supabaseUrl, supabaseKey)
