const SUPABASE_URL = 'https://shaejjiiayjkpcxhxxvz.supabase.co'
const SERVICE_ROLE_KEY = 'isi_service_role_key_anda'

const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@sibsigeo.id',
    password: 'admin123',
    email_confirm: true,
    user_metadata: { nama: 'Administrator', role: 'admin' }
  })
})

const data = await res.json()
console.log(JSON.stringify(data, null, 2))