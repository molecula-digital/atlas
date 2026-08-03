# Profile & Digital Wallet Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authenticated users edit a profile and generate Apple Wallet / Google Wallet digital business cards from it.

**Architecture:** Drizzle ORM manages a `profiles` table in PostgreSQL (same DB as Better Auth / Payload). Three API routes handle profile CRUD and wallet pass generation. A `/dashboard/profile` page provides the editing UI and wallet download buttons.

**Tech Stack:** Next.js 15, Drizzle ORM + drizzle-kit, passkit-generator (Apple), googleapis + jsonwebtoken (Google), Better Auth sessions, S3 media uploads (existing).

---

## File Structure

```
src/
  db/
    index.ts                          # Drizzle client instance + shared pg pool
    schema/
      profiles.ts                     # profiles table definition
  app/
    (frontend)/
      dashboard/
        profile/
          page.tsx                    # Profile edit page (server component wrapper)
          ProfileForm.tsx             # Client component: form + wallet buttons
    api/
      user/
        profile/
          route.ts                    # GET + PUT /api/user/profile
        wallet/
          route.ts                    # POST /api/user/wallet
  lib/
    wallet/
      apple.ts                        # Apple .pkpass generation
      google.ts                       # Google Wallet save link generation
      pass-model/
        pass.json                     # Apple pass template (generic type)
        icon.png                      # Required pass icon (atlas-tech logo)
        icon@2x.png                   # Retina pass icon
drizzle.config.ts                     # drizzle-kit configuration
```

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Drizzle ORM and drizzle-kit**

```bash
npm install drizzle-orm
npm install -D drizzle-kit
```

- [ ] **Step 2: Install wallet pass dependencies**

```bash
npm install passkit-generator googleapis jsonwebtoken
npm install -D @types/jsonwebtoken
```

- [ ] **Step 3: Verify installation**

Run: `npm ls drizzle-orm passkit-generator googleapis jsonwebtoken`
Expected: All four packages listed with versions, no MISSING errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add drizzle-orm, passkit-generator, google wallet SDK dependencies"
```

---

### Task 2: Drizzle Configuration & Profiles Schema

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/db/schema/profiles.ts`
- Create: `src/db/index.ts`

- [ ] **Step 1: Create `drizzle.config.ts`**

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

- [ ] **Step 2: Create the profiles schema at `src/db/schema/profiles.ts`**

```ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const profiles = pgTable('profiles', {
  userId: text('user_id').primaryKey(),
  name: text('name').notNull(),
  title: text('title'),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  photo: text('photo'),
  linkedin: text('linkedin'),
  x: text('x'),
  github: text('github'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
```

- [ ] **Step 3: Create the Drizzle client at `src/db/index.ts`**

The existing `src/lib/auth.ts` creates its own `Pool`. Extract a shared pool or create a parallel one pointing to the same DB. Since Better Auth sets `search_path` to `auth`, keep a separate pool for the app schema that uses `public`.

```ts
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema/profiles'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const db = drizzle(pool, { schema })
```

- [ ] **Step 4: Generate and run the migration**

Run: `npx drizzle-kit generate`
Expected: A new migration file created in `./drizzle/` directory.

Run: `npx drizzle-kit push`
Expected: `profiles` table created in the database. Output should show the table being created successfully.

- [ ] **Step 5: Verify the migration**

Run: `npx drizzle-kit studio`
Expected: Drizzle Studio opens showing the `profiles` table with all columns. Close it after verifying.

Alternatively, verify via psql or the pg Pool:
```bash
echo "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';" | npx tsx -e "
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'\").then(r => { console.table(r.rows); pool.end(); });
"
```

- [ ] **Step 6: Commit**

```bash
git add drizzle.config.ts src/db/ drizzle/
git commit -m "feat: add Drizzle schema and migration for profiles table"
```

---

### Task 3: Profile API Routes

**Files:**
- Create: `src/app/api/user/profile/route.ts`

- [ ] **Step 1: Create the profile GET and PUT route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { profiles } from '@/db/schema/profiles'
import { eq } from 'drizzle-orm'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json(profile)
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const data = {
    userId: session.user.id,
    name: body.name,
    title: body.title || null,
    company: body.company || null,
    email: body.email || null,
    phone: body.phone || null,
    website: body.website || null,
    photo: body.photo || null,
    linkedin: body.linkedin || null,
    x: body.x || null,
    github: body.github || null,
    updatedAt: new Date(),
  }

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const [profile] = await db
    .insert(profiles)
    .values({ ...data, createdAt: new Date() })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: data,
    })
    .returning()

  return NextResponse.json(profile)
}
```

- [ ] **Step 2: Test the routes manually**

Start the dev server: `npm run dev`

Test GET (should 401 without auth):
```bash
curl -s http://localhost:3000/api/user/profile | jq .
```
Expected: `{"error":"Unauthorized"}`

Test with a valid session by signing in through the browser and copying the session cookie, then:
```bash
curl -s -b "better-auth.session_token=<YOUR_TOKEN>" http://localhost:3000/api/user/profile | jq .
```
Expected: `{"error":"Profile not found"}` (404, since no profile exists yet)

Test PUT:
```bash
curl -s -X PUT -b "better-auth.session_token=<YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","title":"Developer","company":"Atlas"}' \
  http://localhost:3000/api/user/profile | jq .
```
Expected: JSON with the created profile including all fields.

Test GET again — should now return the profile.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/user/profile/route.ts
git commit -m "feat: add profile GET and PUT API routes with Drizzle"
```

---

### Task 4: Apple Wallet Pass Generation

**Files:**
- Create: `src/lib/wallet/apple.ts`
- Create: `src/lib/wallet/pass-model/pass.json`
- Create: `src/lib/wallet/pass-model/icon.png` (placeholder — use atlas-tech logo)
- Create: `src/lib/wallet/pass-model/icon@2x.png` (placeholder)

- [ ] **Step 1: Create the Apple pass model template at `src/lib/wallet/pass-model/pass.json`**

```json
{
  "formatVersion": 1,
  "passTypeIdentifier": "PLACEHOLDER",
  "teamIdentifier": "PLACEHOLDER",
  "organizationName": "Tech Atlas",
  "description": "Digital Business Card",
  "foregroundColor": "rgb(255, 255, 255)",
  "backgroundColor": "rgb(15, 15, 15)",
  "labelColor": "rgb(160, 160, 160)",
  "generic": {
    "primaryFields": [],
    "secondaryFields": [],
    "auxiliaryFields": [],
    "backFields": []
  }
}
```

- [ ] **Step 2: Add placeholder icon files**

Copy the atlas-tech logo or create a simple placeholder PNG (29x29 for `icon.png`, 58x58 for `icon@2x.png`). These are required by Apple for the pass to be valid.

If no logo is available yet, generate a minimal placeholder:
```bash
# Requires ImageMagick. If not available, manually place any 29x29 and 58x58 PNG.
convert -size 29x29 xc:'#0f0f0f' src/lib/wallet/pass-model/icon.png
convert -size 58x58 xc:'#0f0f0f' src/lib/wallet/pass-model/icon@2x.png
```

If ImageMagick is not available, create these files manually — any valid PNG of the correct size works for development.

- [ ] **Step 3: Create the Apple wallet generation module at `src/lib/wallet/apple.ts`**

```ts
import { PKPass } from 'passkit-generator'
import fs from 'fs'
import path from 'path'
import type { Profile } from '@/db/schema/profiles'

const PASS_MODEL_DIR = path.resolve(process.cwd(), 'src/lib/wallet/pass-model')

function getCertificates() {
  return {
    wwdr: fs.readFileSync(process.env.APPLE_WWDR_CERT_PATH!),
    signerCert: fs.readFileSync(process.env.APPLE_PASS_CERT_PATH!),
    signerKey: fs.readFileSync(process.env.APPLE_PASS_KEY_PATH!),
  }
}

export async function generateApplePass(profile: Profile, qrValue: string): Promise<Buffer> {
  const pass = await PKPass.from(
    {
      model: PASS_MODEL_DIR,
      certificates: getCertificates(),
    },
    {
      serialNumber: `atlas-${profile.userId}`,
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
      teamIdentifier: process.env.APPLE_TEAM_ID!,
      description: 'Digital Business Card',
      organizationName: 'Tech Atlas',
    },
  )

  pass.type = 'generic'

  // Primary: Name
  pass.primaryFields.push({
    key: 'name',
    label: 'NAME',
    value: profile.name,
  })

  // Secondary: Title + Company
  if (profile.title) {
    pass.secondaryFields.push({
      key: 'title',
      label: 'TITLE',
      value: profile.title,
    })
  }
  if (profile.company) {
    pass.secondaryFields.push({
      key: 'company',
      label: 'COMPANY',
      value: profile.company,
    })
  }

  // Auxiliary: Email + Phone
  if (profile.email) {
    pass.auxiliaryFields.push({
      key: 'email',
      label: 'EMAIL',
      value: profile.email,
    })
  }
  if (profile.phone) {
    pass.auxiliaryFields.push({
      key: 'phone',
      label: 'PHONE',
      value: profile.phone,
    })
  }

  // Back fields: website + socials
  if (profile.website) {
    pass.backFields.push({
      key: 'website',
      label: 'WEBSITE',
      value: profile.website,
    })
  }
  if (profile.linkedin) {
    pass.backFields.push({
      key: 'linkedin',
      label: 'LINKEDIN',
      value: profile.linkedin,
    })
  }
  if (profile.x) {
    pass.backFields.push({
      key: 'x',
      label: 'X / TWITTER',
      value: profile.x,
    })
  }
  if (profile.github) {
    pass.backFields.push({
      key: 'github',
      label: 'GITHUB',
      value: profile.github,
    })
  }

  // QR code
  pass.setBarcodes({
    format: 'PKBarcodeFormatQR',
    message: qrValue,
    messageEncoding: 'iso-8859-1',
  })

  return pass.getAsBuffer()
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/wallet/apple.ts src/lib/wallet/pass-model/
git commit -m "feat: add Apple Wallet pass generation with passkit-generator"
```

---

### Task 5: Google Wallet Pass Generation

**Files:**
- Create: `src/lib/wallet/google.ts`

- [ ] **Step 1: Create the Google Wallet module at `src/lib/wallet/google.ts`**

```ts
import { google } from 'googleapis'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import type { Profile } from '@/db/schema/profiles'

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID!
const CLASS_ID = process.env.GOOGLE_WALLET_CLASS_ID!

function getCredentials() {
  const raw = fs.readFileSync(process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON!)
  return JSON.parse(raw.toString())
}

function getClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON!,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  })

  return google.walletobjects({ version: 'v1', auth })
}

async function ensureClass() {
  const client = getClient()
  const classId = `${ISSUER_ID}.${CLASS_ID}`

  try {
    await client.genericclass.get({ resourceId: classId })
  } catch {
    await client.genericclass.insert({
      requestBody: {
        id: classId,
        issuerName: 'Tech Atlas',
      },
    })
  }
}

export async function generateGoogleWalletLink(profile: Profile, qrValue: string): Promise<string> {
  await ensureClass()

  const credentials = getCredentials()
  const objectId = `${ISSUER_ID}.profile-${profile.userId}`
  const classId = `${ISSUER_ID}.${CLASS_ID}`

  const genericObject = {
    id: objectId,
    classId,
    state: 'ACTIVE',
    cardTitle: {
      defaultValue: { language: 'en', value: 'Tech Atlas' },
    },
    header: {
      defaultValue: { language: 'en', value: profile.name },
    },
    subheader: profile.title
      ? { defaultValue: { language: 'en', value: profile.title } }
      : undefined,
    textModulesData: [
      ...(profile.company
        ? [{ id: 'company', header: 'Company', body: profile.company }]
        : []),
      ...(profile.email
        ? [{ id: 'email', header: 'Email', body: profile.email }]
        : []),
      ...(profile.phone
        ? [{ id: 'phone', header: 'Phone', body: profile.phone }]
        : []),
      ...(profile.website
        ? [{ id: 'website', header: 'Website', body: profile.website }]
        : []),
      ...(profile.linkedin
        ? [{ id: 'linkedin', header: 'LinkedIn', body: profile.linkedin }]
        : []),
      ...(profile.x
        ? [{ id: 'x', header: 'X / Twitter', body: profile.x }]
        : []),
      ...(profile.github
        ? [{ id: 'github', header: 'GitHub', body: profile.github }]
        : []),
    ],
    barcode: {
      type: 'QR_CODE',
      value: qrValue,
    },
  }

  const claims = {
    iss: credentials.client_email,
    aud: 'google',
    origins: [process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'],
    typ: 'savetowallet',
    payload: {
      genericObjects: [genericObject],
    },
  }

  const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' })

  return `https://pay.google.com/gp/v/save/${token}`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/wallet/google.ts
git commit -m "feat: add Google Wallet pass generation with official SDK"
```

---

### Task 6: Wallet API Route

**Files:**
- Create: `src/app/api/user/wallet/route.ts`

- [ ] **Step 1: Create the wallet generation route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { profiles } from '@/db/schema/profiles'
import { eq } from 'drizzle-orm'
import { generateApplePass } from '@/lib/wallet/apple'
import { generateGoogleWalletLink } from '@/lib/wallet/google'
import { SITE_URL } from '@/config'

function getQrValue(userId: string): string {
  // Default to a vCard-encoded QR if no directory entry exists.
  // The profile page could later resolve this to a directory URL.
  return `${SITE_URL}/card/${userId}`
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const platform = body.platform as string

  if (!['apple', 'google'].includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform. Use "apple" or "google".' }, { status: 400 })
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found. Save your profile first.' }, { status: 400 })
  }

  const qrValue = getQrValue(session.user.id)

  if (platform === 'apple') {
    const buffer = await generateApplePass(profile, qrValue)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${profile.name.replace(/[^a-zA-Z0-9]/g, '-')}.pkpass"`,
      },
    })
  }

  // Google
  const saveLink = await generateGoogleWalletLink(profile, qrValue)
  return NextResponse.json({ saveLink })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/user/wallet/route.ts
git commit -m "feat: add wallet pass generation API route (Apple + Google)"
```

---

### Task 7: Profile Dashboard Page

**Files:**
- Create: `src/app/(frontend)/dashboard/profile/page.tsx`
- Create: `src/app/(frontend)/dashboard/profile/ProfileForm.tsx`

- [ ] **Step 1: Create the server component page at `src/app/(frontend)/dashboard/profile/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { ProfileForm } from './ProfileForm'

export const metadata: Metadata = {
  title: 'Mi Perfil',
  robots: { index: false },
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-primary mb-8">Mi Perfil</h1>
          <ProfileForm />
        </div>
      </section>
    </AuthGuard>
  )
}
```

- [ ] **Step 2: Create the client component at `src/app/(frontend)/dashboard/profile/ProfileForm.tsx`**

```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { Save, CreditCard, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ProfileData {
  name: string
  title: string
  company: string
  email: string
  phone: string
  website: string
  photo: string
  linkedin: string
  x: string
  github: string
}

const emptyProfile: ProfileData = {
  name: '',
  title: '',
  company: '',
  email: '',
  phone: '',
  website: '',
  photo: '',
  linkedin: '',
  x: '',
  github: '',
}

const inputClass =
  'mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors'
const labelClass = 'text-xs font-mono text-muted uppercase tracking-wider'

export function ProfileForm() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<ProfileData>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [hasSavedProfile, setHasSavedProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletLoading, setWalletLoading] = useState<'apple' | 'google' | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/user/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile({
          name: data.name || '',
          title: data.title || '',
          company: data.company || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          photo: data.photo || '',
          linkedin: data.linkedin || '',
          x: data.x || '',
          github: data.github || '',
        })
        setHasSavedProfile(true)
      }
    } catch {
      // No profile yet — use empty form
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session) fetchProfile()
  }, [session, fetchProfile])

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }
      setSaved(true)
      setHasSavedProfile(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleWallet = async (platform: 'apple' | 'google') => {
    setWalletLoading(platform)
    try {
      if (platform === 'apple') {
        const res = await fetch('/api/user/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'apple' }),
        })
        if (!res.ok) throw new Error('Failed to generate pass')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${profile.name.replace(/[^a-zA-Z0-9]/g, '-')}.pkpass`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const res = await fetch('/api/user/wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'google' }),
        })
        if (!res.ok) throw new Error('Failed to generate pass')
        const data = await res.json()
        window.open(data.saveLink, '_blank')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate wallet pass')
    } finally {
      setWalletLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Form */}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            className={inputClass}
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Your full name"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Title</label>
            <input
              className={inputClass}
              value={profile.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div>
            <label className={labelClass}>Company</label>
            <input
              className={inputClass}
              value={profile.company}
              onChange={(e) => handleChange('company', e.target.value)}
              placeholder="e.g. Atlas Tech"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Email</label>
            <input
              className={inputClass}
              type="email"
              value={profile.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              className={inputClass}
              type="tel"
              value={profile.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+52 667 123 4567"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Website</label>
          <input
            className={inputClass}
            value={profile.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://yoursite.com"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>LinkedIn</label>
            <input
              className={inputClass}
              value={profile.linkedin}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              placeholder="linkedin.com/in/you"
            />
          </div>
          <div>
            <label className={labelClass}>X / Twitter</label>
            <input
              className={inputClass}
              value={profile.x}
              onChange={(e) => handleChange('x', e.target.value)}
              placeholder="@handle"
            />
          </div>
          <div>
            <label className={labelClass}>GitHub</label>
            <input
              className={inputClass}
              value={profile.github}
              onChange={(e) => handleChange('github', e.target.value)}
              placeholder="username"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !profile.name.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-mono font-medium bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar perfil'}
          </button>
          {error && (
            <span className="flex items-center gap-1 text-xs text-red-400 font-mono">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </span>
          )}
        </div>
      </div>

      {/* Wallet Card Section */}
      <div className="border-t border-border pt-8">
        <h2 className="text-lg font-semibold text-primary mb-2">Digital Wallet Card</h2>
        <p className="text-sm text-muted mb-6">
          Generate a digital business card for Apple Wallet or Google Wallet. Save your profile first.
        </p>

        {/* Card Preview */}
        <div className="mb-6 p-6 rounded-xl bg-card border border-border max-w-sm">
          <div className="text-xs font-mono text-muted uppercase tracking-wider mb-1">Tech Atlas</div>
          <div className="text-lg font-bold text-primary">{profile.name || 'Your Name'}</div>
          {profile.title && <div className="text-sm text-secondary">{profile.title}</div>}
          {profile.company && <div className="text-sm text-muted">{profile.company}</div>}
          <div className="mt-3 space-y-1">
            {profile.email && <div className="text-xs font-mono text-muted">{profile.email}</div>}
            {profile.phone && <div className="text-xs font-mono text-muted">{profile.phone}</div>}
          </div>
        </div>

        {/* Wallet Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleWallet('apple')}
            disabled={!hasSavedProfile || walletLoading !== null}
            className="flex items-center gap-2 px-4 py-2 text-sm font-mono font-medium bg-primary text-background rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {walletLoading === 'apple' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Add to Apple Wallet
          </button>
          <button
            onClick={() => handleWallet('google')}
            disabled={!hasSavedProfile || walletLoading !== null}
            className="flex items-center gap-2 px-4 py-2 text-sm font-mono font-medium border border-border text-primary rounded-md hover:bg-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {walletLoading === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4" />
            )}
            Add to Google Wallet
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify the page renders**

Run: `npm run dev`
Navigate to `http://localhost:3000/dashboard/profile`
Expected: Redirects to sign-in if not authenticated. After signing in, shows the profile form with empty fields, wallet buttons disabled.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(frontend\)/dashboard/profile/
git commit -m "feat: add dashboard profile page with form and wallet card UI"
```

---

### Task 8: Add Profile Link to Dashboard Navigation

**Files:**
- Modify: `src/app/(frontend)/dashboard/page.tsx`

- [ ] **Step 1: Add a profile link to the dashboard page**

In `src/app/(frontend)/dashboard/page.tsx`, add a "Mi Perfil" link in the header buttons alongside the existing "Agregar proyecto" and "Publicar empleo" links:

Add `User` to the lucide-react import:
```ts
import { Plus, Briefcase, User } from 'lucide-react'
```

Add this link inside the `<div className="flex gap-2">` block, before the existing links:
```tsx
<Link
  href="/dashboard/profile"
  className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-medium border border-border text-primary rounded-md hover:bg-elevated transition-colors"
>
  <User className="w-3.5 h-3.5" /> Mi Perfil
</Link>
```

- [ ] **Step 2: Verify the link appears**

Navigate to `http://localhost:3000/dashboard`
Expected: "Mi Perfil" button appears in the header bar. Clicking it navigates to `/dashboard/profile`.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(frontend\)/dashboard/page.tsx
git commit -m "feat: add profile link to dashboard navigation"
```

---

### Task 9: Add certs/ to .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add cert paths and drizzle output to `.gitignore`**

Append to `.gitignore`:
```
# Wallet certificates
certs/
```

- [ ] **Step 2: Create a placeholder `certs/` directory with a README**

```bash
mkdir -p certs
```

Create `certs/README.md`:
```markdown
# Wallet Certificates

This directory holds signing certificates for wallet pass generation.
These files are gitignored — do not commit them.

## Required files

### Apple Wallet
- `pass.pem` — Pass Type ID certificate
- `pass-key.pem` — Certificate private key
- `wwdr.pem` — Apple WWDR intermediate certificate

### Google Wallet
- `google-sa.json` — Google Cloud service account key with Wallet API enabled
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore certs/README.md
git commit -m "chore: add certs/ to gitignore with setup instructions"
```

---

### Task 10: Add Environment Variable Documentation

**Files:**
- Modify: `.env.example` (create if it doesn't exist)

- [ ] **Step 1: Add wallet env vars to `.env.example`**

Append the following to `.env.example` (or create it):

```env
# --- Wallet Pass Generation ---
APPLE_PASS_TYPE_ID=pass.com.atlastech.card
APPLE_TEAM_ID=
APPLE_PASS_CERT_PATH=certs/pass.pem
APPLE_PASS_KEY_PATH=certs/pass-key.pem
APPLE_WWDR_CERT_PATH=certs/wwdr.pem

GOOGLE_WALLET_ISSUER_ID=
GOOGLE_WALLET_SERVICE_ACCOUNT_JSON=certs/google-sa.json
GOOGLE_WALLET_CLASS_ID=atlastech.profile-card
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "docs: add wallet pass environment variables to .env.example"
```

---

### Task 11: End-to-End Verification

- [ ] **Step 1: Start the dev server and sign in**

```bash
npm run dev
```

Sign in via Google OAuth at `/auth/sign-in`.

- [ ] **Step 2: Test the full profile flow**

1. Navigate to `/dashboard` — verify "Mi Perfil" link is visible
2. Click "Mi Perfil" — verify empty form loads
3. Fill in name, title, company, email — click "Guardar perfil"
4. Verify "Guardado" confirmation appears
5. Refresh the page — verify data persists
6. Verify the card preview updates with the entered data

- [ ] **Step 3: Test wallet generation (requires valid certs)**

If Apple/Google certs are configured:
1. Click "Add to Apple Wallet" — should download a `.pkpass` file
2. Click "Add to Google Wallet" — should open the Google save link in a new tab

If certs are NOT configured yet:
1. Click wallet buttons — verify graceful error message appears (not a crash)

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build
```

Expected: Build completes with no TypeScript errors.

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during e2e verification"
```
