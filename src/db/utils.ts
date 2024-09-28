import { createClient } from "@supabase/supabase-js"
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'https://xnuclrcocusfvrbejztr.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || ''
const isLocalDev = process.env.NODE_ENV === 'local';
export const supabase = createClient(supabaseUrl, supabaseKey)
