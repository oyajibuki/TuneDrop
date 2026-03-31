import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fikijrghktqilpxqoyvw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpa2lqcmdoa3RxaWxweHFveXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MzY1NjMsImV4cCI6MjA5MDUxMjU2M30.79g1KSghGC4y0YHc5C9bWnvxv6f1royaPP6Vp_RupBM'

export const supabase = createClient(supabaseUrl, supabaseKey)
