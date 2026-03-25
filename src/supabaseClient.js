import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://knkwaphosqronbhrvlsu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua3dhcGhvc3Fyb25iaHJ2bHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODU1ODgsImV4cCI6MjA4OTM2MTU4OH0.HvFXoCzHihc8CjQfcgdVooCpJ_ztI7sM2G2m07Y2srM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseConfigured = true