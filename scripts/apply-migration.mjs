#!/usr/bin/env node
/**
 * One-time migration apply script.
 * Usage: SUPABASE_SERVICE_KEY=<your-service-role-key> node scripts/apply-migration.mjs
 *
 * The service role key is available in Supabase Dashboard → Project Settings → API.
 */

const PROJECT_ID = 'eqttpdbkdsdedpiciarz'
const PAT = process.env.SUPABASE_PAT

if (!PAT) {
  console.error('Error: SUPABASE_PAT env var is required.')
  console.error('Get your personal access token from: https://supabase.com/dashboard/account/tokens')
  console.error('Usage: SUPABASE_PAT=<token> node scripts/apply-migration.mjs')
  process.exit(1)
}

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sql = readFileSync(join(__dirname, '../supabase/migrations/20260424_add_boiler_and_fuel_types.sql'), 'utf8')

console.log('Applying migration to project:', PROJECT_ID)
console.log('SQL:\n', sql)

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PAT}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
})

const body = await res.json()

if (!res.ok) {
  console.error('Migration failed:', JSON.stringify(body, null, 2))
  process.exit(1)
}

console.log('Migration applied successfully!')
console.log(JSON.stringify(body, null, 2))
