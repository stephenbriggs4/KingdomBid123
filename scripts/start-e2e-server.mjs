import { createServer } from 'vite'

// Browser smoke tests must never inherit a developer's production Supabase
// values from .env.local. Process-level values take precedence over Vite env
// files and keep this server pointed at a deliberately nonexistent local API.
process.env.VITE_SUPABASE_URL = 'http://127.0.0.1:54321'
process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'faithbid-local-e2e-placeholder'
process.env.VITE_SUPABASE_ANON_KEY = ''
process.env.VITE_FAITHBID_QA_MODE = 'false'
process.env.VITE_FAITHBID_ALLOW_PRODUCTION_DEV = 'false'

const server = await createServer({
  mode: 'e2e',
  server: {
    host: '127.0.0.1',
    port: 4181,
    strictPort: true,
    hmr: false,
  },
})

await server.listen()

let closing = false
const close = async () => {
  if (closing) return
  closing = true
  await server.close()
  process.exit(0)
}

process.once('SIGINT', close)
process.once('SIGTERM', close)
