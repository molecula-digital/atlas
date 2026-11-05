/**
 * Pull Infisical secrets into process.env before the Workers build.
 *
 * Infisical is behind Cloudflare Access at https://infisical.molecula.digital.
 * Access is cleared with CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET.
 * Infisical Universal Auth uses INFISICAL_CLIENT_ID / INFISICAL_CLIENT_SECRET.
 *
 * `wrangler secret put` stores these on the Worker runtime. Cloudflare Builds
 * does not see runtime secrets, so the same four names also have to be set
 * under Builds → Variables and secrets.
 */

const INFISICAL_DOMAIN = (
  process.env.INFISICAL_DOMAIN || 'https://infisical.molecula.digital'
).replace(/\/+$/, '')

const CREDENTIALS = [
  'CF_ACCESS_CLIENT_ID',
  'CF_ACCESS_CLIENT_SECRET',
  'INFISICAL_CLIENT_ID',
  'INFISICAL_CLIENT_SECRET',
]

export function infisicalCredentialsPresent(env = process.env) {
  return CREDENTIALS.every((key) => Boolean(env[key]?.trim()))
}

/**
 * @param {string} path
 * @param {RequestInit & { headers: Record<string, string> }} options
 */
async function infisicalFetch(path, options) {
  const response = await fetch(`${INFISICAL_DOMAIN}${path}`, options)
  const text = await response.text()
  const looksLikeAccessLogin =
    text.includes('Cloudflare Access') || text.includes('cloudflareaccess.com')
  if (!response.ok || looksLikeAccessLogin) {
    const hint = looksLikeAccessLogin
      ? 'Cloudflare Access rejected the request. The service token needs a Service Auth policy on the Infisical application.'
      : `Infisical ${options.method || 'GET'} ${path} returned ${response.status}.`
    throw new Error(hint)
  }
  return JSON.parse(text)
}

function accessHeaders() {
  return {
    'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID.trim(),
    'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET.trim(),
    'Content-Type': 'application/json',
  }
}

async function login(headers) {
  const body = await infisicalFetch('/api/v1/auth/universal-auth/login', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      clientId: process.env.INFISICAL_CLIENT_ID.trim(),
      clientSecret: process.env.INFISICAL_CLIENT_SECRET.trim(),
    }),
  })
  if (!body.accessToken) {
    throw new Error('Infisical login did not return an access token.')
  }
  return body.accessToken
}

async function resolveProjectId(headers) {
  const configured = process.env.INFISICAL_PROJECT_ID?.trim()
  if (configured) return configured

  const listed = await infisicalFetch('/api/v1/projects', { headers })
  const workspaces = listed.projects || listed.workspaces || []
  if (workspaces.length === 1) return workspaces[0].id
  const names = workspaces.map((item) => `${item.name}:${item.id}`).join(', ')
  throw new Error(
    `Set INFISICAL_PROJECT_ID. This identity can see: ${names || 'no projects'}`,
  )
}

function secretRecords(payload) {
  const rows = payload.secrets || payload.imports || []
  return rows
    .map((row) => ({
      key: row.secretKey || row.key,
      value: row.secretValue || row.value,
    }))
    .filter((row) => row.key && row.value != null)
}

/**
 * Loads the prod environment into process.env. Existing env values win, so a
 * local override is kept. Returns the names that were applied.
 */
export async function loadInfisicalSecrets() {
  if (!infisicalCredentialsPresent()) return []

  const headers = accessHeaders()
  const accessToken = await login(headers)
  headers.Authorization = `Bearer ${accessToken}`

  const projectId = await resolveProjectId(headers)
  const environment = process.env.INFISICAL_ENV?.trim() || 'prod'
  const query = new URLSearchParams({
    workspaceId: projectId,
    environment,
    secretPath: '/',
  })
  const payload = await infisicalFetch(`/api/v3/secrets/raw?${query}`, {
    headers,
  })

  const applied = []
  for (const { key, value } of secretRecords(payload)) {
    if (process.env[key]) continue
    process.env[key] = value
    applied.push(key)
  }
  console.log(
    `Infisical ${environment}: loaded ${applied.length} secret(s) from ${INFISICAL_DOMAIN}`,
  )
  return applied
}
