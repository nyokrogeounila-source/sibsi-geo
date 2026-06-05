import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const env = readFileSync('.env.local', 'utf8')
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim()
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim()

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const { data, error } = await supabase.auth.admin.createUser({
  email: 'admin@sibsigeo.id',
  password: 'admin123',
  email_confirm: true,
  user_metadata: { nama: 'Administrator', role: 'admin' }
})

console.log('Result:', JSON.stringify(data, null, 2))
console.log('Error:', error)