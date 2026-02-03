import { createClient } from '@supabase/supabase-js'

// Sustituye con tus datos reales extraídos de tu imagen
const supabaseUrl = 'https://bgqfakzcyejvbddbdape.supabase.co' 
const supabaseKey = 'sb_publishable_E5tzUn4nyMT3OVDUI0gghA_OfBWmbT_'

export const supabase = createClient(supabaseUrl, supabaseKey)