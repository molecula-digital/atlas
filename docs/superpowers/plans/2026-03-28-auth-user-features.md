# Auth & User Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public user authentication (Google sign-in via better-auth), a user dashboard for managing entries/jobs, authenticated submission API routes, and wire up the moderation workflow in Payload admin.

**Architecture:** better-auth handles public user sessions in the `auth` Postgres schema. Payload handles admin/editor/moderator auth in the `payload` schema. The two systems are linked by user ID stored on Payload documents (`owner`/`postedBy` fields). Public users authenticate via Google OAuth, then interact with Payload collections through Next.js API routes that validate the better-auth session before creating/updating documents.

**Tech Stack:** better-auth (Google provider), Next.js API routes, Payload local API, pg (Postgres pool for better-auth), React client components for auth UI

**Spec:** `docs/superpowers/specs/2026-03-28-cms-integration-design.md`
**Depends on:** Plan 1 (CMS Foundation) + Plan 2 (Frontend Migration)
**Reference:** `.agents/skills/better-auth-best-practices/SKILL.md`, `.agents/skills/create-auth-skill/SKILL.md`, `.agents/skills/better-auth-security-best-practices/SKILL.MD`

---

## File Structure

```
src/
├── lib/
│   ├── auth.ts                        # NEW — better-auth server config
│   ├── auth-client.ts                 # NEW — better-auth React client
│   ├── payload.ts                     # Existing — add submission helpers
│   └── utils.ts                       # Existing
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts           # NEW — better-auth route handler
│   │   ├── submissions/
│   │   │   ├── entries/
│   │   │   │   └── route.ts           # NEW — create/update entry (authed)
│   │   │   └── jobs/
│   │   │       └── route.ts           # NEW — create job (authed)
│   │   └── events/
│   │       └── route.ts               # Existing
│   ├── (frontend)/
│   │   ├── auth/
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx           # NEW — sign-in page
│   │   │   └── sign-out/
│   │   │       └── page.tsx           # NEW — sign-out handler
│   │   ├── dashboard/
│   │   │   ├── page.tsx               # NEW — user dashboard
│   │   │   ├── entries/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # NEW — edit entry form
│   │   │   └── jobs/
│   │   │       └── new/
│   │   │           └── page.tsx       # NEW — post job form
│   │   ├── directorio/
│   │   │   └── submit/
│   │   │       └── page.tsx           # Modify — add auth guard
│   │   └── layout.tsx                 # Existing
│   └── (payload)/                     # Existing — don't touch
├── components/
│   ├── auth/
│   │   ├── SignInButton.tsx            # NEW — Google sign-in button
│   │   ├── UserMenu.tsx               # NEW — avatar dropdown in header
│   │   └── AuthGuard.tsx              # NEW — redirect if not authed
│   ├── dashboard/
│   │   ├── MyEntries.tsx              # NEW — list user's entries
│   │   ├── MyJobs.tsx                 # NEW — list user's jobs
│   │   └── EntryEditForm.tsx          # NEW — edit entry form
│   └── layout/
│       └── Header.tsx                 # Modify — add UserMenu
├── middleware.ts                       # NEW — auth middleware for protected routes
└── collections/
    ├── Entries.ts                      # Modify — add moderation fields
    └── Jobs.ts                        # Modify — add moderation fields
```

---

### Task 1: Install better-auth and configure server

**Files:**
- Modify: `package.json`
- Create: `src/lib/auth.ts`
- Modify: `.env.example`

- [ ] **Step 1: Install better-auth**

```bash
pnpm add better-auth pg
pnpm add -D @types/pg
```

- [ ] **Step 2: Add env vars to .env.example**

Append to `.env.example`:

```env

# better-auth
BETTER_AUTH_SECRET=generate-with-openssl-rand-base64-32
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

- [ ] **Step 3: Create better-auth server config**

Create `src/lib/auth.ts`:

```typescript
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { Pool } from 'pg'

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  advanced: {
    database: {
      generateId: false, // use database defaults
    },
  },
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
```

**Note on schema:** better-auth with a raw `pg.Pool` uses its built-in Kysely adapter which creates tables in the `public` schema by default. To use the `auth` schema, we need to configure the pool with a `search_path`:

```typescript
database: new Pool({
    connectionString: process.env.DATABASE_URL,
  options: `-c search_path=auth,public`,
}),
```

Make sure the `auth` schema exists (it was created in Plan 1, Task 2, Step 3).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/auth.ts .env.example
git commit -m "feat: configure better-auth with Google provider"
```

---

### Task 2: Create auth route handler and client

**Files:**
- Create: `src/app/api/auth/[...all]/route.ts`
- Create: `src/lib/auth-client.ts`

- [ ] **Step 1: Create the route handler**

Create `src/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

- [ ] **Step 2: Create the React client**

Create `src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
})

export const { signIn, signOut, useSession, getSession } = authClient
```

- [ ] **Step 3: Run better-auth migrations**

This creates the `user`, `session`, `account`, and `verification` tables in the `auth` schema:

```bash
npx @better-auth/cli@latest migrate
```

If the CLI can't find the config, specify the path:

```bash
npx @better-auth/cli@latest migrate --config src/lib/auth.ts
```

- [ ] **Step 4: Verify — check auth health endpoint**

```bash
curl http://localhost:3000/api/auth/ok
```

Expected response: `{ "status": "ok" }`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/auth/ src/lib/auth-client.ts
git commit -m "feat: add better-auth route handler and React client"
```

---

### Task 3: Build sign-in page and auth components

**Files:**
- Create: `src/components/auth/SignInButton.tsx`
- Create: `src/components/auth/UserMenu.tsx`
- Create: `src/components/auth/AuthGuard.tsx`
- Create: `src/app/(frontend)/auth/sign-in/page.tsx`

- [ ] **Step 1: Create Google sign-in button**

Create `src/components/auth/SignInButton.tsx`:

```tsx
'use client'

import { signIn } from '@/lib/auth-client'

interface SignInButtonProps {
  callbackURL?: string
  className?: string
}

export function SignInButton({ callbackURL = '/dashboard', className }: SignInButtonProps) {
  const handleSignIn = async () => {
    await signIn.social({
      provider: 'google',
      callbackURL,
    })
  }

  return (
    <button
      onClick={handleSignIn}
      className={className || 'flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg hover:bg-elevated transition-colors text-sm font-mono text-primary'}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continuar con Google
    </button>
  )
}
```

- [ ] **Step 2: Create user menu**

Create `src/components/auth/UserMenu.tsx`:

```tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from '@/lib/auth-client'
import { SignInButton } from './SignInButton'
import { User, LogOut, LayoutDashboard } from 'lucide-react'

export function UserMenu() {
  const { data: session, isPending } = useSession()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  if (isPending) {
    return <div className="w-8 h-8 rounded-full bg-elevated animate-pulse" />
  }

  if (!session) {
    return <SignInButton className="px-3 py-1.5 text-xs font-mono text-secondary hover:text-primary rounded-md hover:bg-elevated transition-colors" />
  }

  const user = session.user
  const initials = (user.name || user.email || '?').charAt(0).toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold"
        title={user.name || user.email}
      >
        {user.image ? (
          <img src={user.image} alt={user.name || ''} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          initials
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-50">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-xs font-mono text-primary truncate">{user.name || 'Usuario'}</p>
            <p className="text-2xs text-muted truncate">{user.email}</p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono text-secondary hover:text-primary hover:bg-elevated transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <button
            onClick={() => { signOut(); setOpen(false) }}
            className="flex items-center gap-2 w-full px-4 py-2 text-xs font-mono text-secondary hover:text-primary hover:bg-elevated transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create auth guard**

Create `src/components/auth/AuthGuard.tsx`:

```tsx
'use client'

import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/auth/sign-in?redirect=' + encodeURIComponent(window.location.pathname))
    }
  }, [session, isPending, router])

  if (isPending) {
    return fallback || (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  return <>{children}</>
}
```

- [ ] **Step 4: Create sign-in page**

Create `src/app/(frontend)/auth/sign-in/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { SignInButton } from '@/components/auth/SignInButton'

export const metadata: Metadata = {
  title: 'Iniciar sesión',
}

export default function SignInPage() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-sm mx-auto text-center">
        <h1 className="text-2xl font-bold text-primary mb-2">Iniciar sesión</h1>
        <p className="text-sm text-muted mb-8">
          Inicia sesión para administrar tus proyectos y publicar empleos.
        </p>
        <SignInButton />
        <p className="text-2xs text-muted mt-6">
          Al iniciar sesión, aceptas nuestros términos de uso.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/ src/app/\(frontend\)/auth/
git commit -m "feat: build sign-in page and auth UI components"
```

---

### Task 4: Integrate UserMenu into Header

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Add UserMenu to header**

In `src/components/layout/Header.tsx`, make these changes:

1. Add import at the top:
```typescript
import { UserMenu } from '@/components/auth/UserMenu'
```

2. In the desktop nav, replace the `<ThemeToggle />` section with:
```tsx
<ThemeToggle />
<UserMenu />
<Link
  href="/directorio/submit"
  ...
```

3. In the mobile controls div, add UserMenu:
```tsx
<div className="flex md:hidden items-center gap-2">
  <ThemeToggle />
  <UserMenu />
  <button onClick={() => setMobileOpen(!mobileOpen)} ...>
```

4. In the mobile menu, add a Dashboard link (shown only when logged in — but since UserMenu handles the session check, we can add a static link):
```tsx
<Link href="/dashboard" className="block px-4 py-3 text-sm font-mono text-secondary hover:text-primary rounded-md hover:bg-elevated">
  Dashboard
</Link>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "feat: integrate UserMenu into header navigation"
```

---

### Task 5: Create auth middleware for protected routes

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware**

Create `src/middleware.ts`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/directorio/submit']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is protected
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  if (!isProtected) return NextResponse.next()

  // Check for better-auth session cookie
  // better-auth uses a cookie named "better-auth.session_token" (or with __Secure- prefix in prod)
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__Secure-better-auth.session_token')

  if (!sessionCookie) {
    const signInUrl = new URL('/auth/sign-in', request.url)
    signInUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/directorio/submit'],
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add auth middleware for protected routes"
```

---

### Task 6: Add moderation fields to collections

**Files:**
- Modify: `src/collections/Entries.ts`
- Modify: `src/collections/Jobs.ts`

- [ ] **Step 1: Add moderationNote field to Entries**

In `src/collections/Entries.ts`, add this field after the `owner` field:

```typescript
{
  name: 'moderationNote',
  type: 'textarea',
  admin: {
    position: 'sidebar',
    description: 'Rejection reason or feedback for the entry owner',
    condition: (data) => data._status === 'draft',
  },
},
```

- [ ] **Step 2: Add moderationNote field to Jobs**

In `src/collections/Jobs.ts`, add after the `postedBy` field:

```typescript
{
  name: 'moderationNote',
  type: 'textarea',
  admin: {
    position: 'sidebar',
    description: 'Rejection reason or feedback for the job poster',
    condition: (data) => data._status === 'draft',
  },
},
```

- [ ] **Step 3: Commit**

```bash
git add src/collections/Entries.ts src/collections/Jobs.ts
git commit -m "feat: add moderationNote field to Entries and Jobs for rejection feedback"
```

---

### Task 7: Create submission API routes

**Files:**
- Create: `src/app/api/submissions/entries/route.ts`
- Create: `src/app/api/submissions/jobs/route.ts`
- Create: `src/lib/auth-helpers.ts`

- [ ] **Step 1: Create auth helper for API routes**

Create `src/lib/auth-helpers.ts`:

```typescript
import { auth } from './auth'
import { headers } from 'next/headers'

/**
 * Get the current better-auth session in a server context.
 * Returns null if not authenticated.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}
```

- [ ] **Step 2: Create entry submission API route**

Create `src/app/api/submissions/entries/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { getPayloadClient } from '@/lib/payload'

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const payload = await getPayloadClient()

  // Validate required fields
  if (!body.entryType || !body.name || !body.city) {
    return NextResponse.json(
      { error: 'Missing required fields: entryType, name, city' },
      { status: 400 },
    )
  }

  try {
    const entry = await payload.create({
      collection: 'entries',
      data: {
        ...body,
        owner: session.user.id,
        _status: 'draft', // All submissions start as draft (pending moderation)
      },
    })

    return NextResponse.json({ success: true, id: entry.id })
  } catch (error) {
    console.error('Entry submission failed:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 })
  }

  const payload = await getPayloadClient()

  // Verify ownership
  const existing = await payload.findByID({ collection: 'entries', id })
  if (!existing || existing.owner !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Create a new draft version (published version stays live)
    await payload.update({
      collection: 'entries',
      id,
      data: {
        ...updates,
        _status: 'draft', // Edits go back to draft for moderation
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Entry update failed:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create job submission API route**

Create `src/app/api/submissions/jobs/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { getPayloadClient } from '@/lib/payload'

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (!body.title || !body.type || !body.modality || !body.contactUrl) {
    return NextResponse.json(
      { error: 'Missing required fields: title, type, modality, contactUrl' },
      { status: 400 },
    )
  }

  const payload = await getPayloadClient()

  try {
    const job = await payload.create({
      collection: 'jobs',
      data: {
        ...body,
        postedBy: session.user.id,
        _status: 'draft', // All job posts start as draft (pending moderation)
      },
    })

    return NextResponse.json({ success: true, id: job.id })
  } catch (error) {
    console.error('Job submission failed:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/auth-helpers.ts src/app/api/submissions/
git commit -m "feat: add authenticated submission API routes for entries and jobs"
```

---

### Task 8: Build user dashboard

**Files:**
- Create: `src/app/(frontend)/dashboard/page.tsx`
- Create: `src/components/dashboard/MyEntries.tsx`
- Create: `src/components/dashboard/MyJobs.tsx`
- Create: `src/app/api/user/entries/route.ts`
- Create: `src/app/api/user/jobs/route.ts`

- [ ] **Step 1: Create API routes for user's content**

Create `src/app/api/user/entries/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { getPayloadClient } from '@/lib/payload'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'entries',
    where: { owner: { equals: session.user.id } },
    limit: 50,
    sort: '-updatedAt',
    draft: true, // Include drafts so user can see pending submissions
  })

  return NextResponse.json(result)
}
```

Create `src/app/api/user/jobs/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { getPayloadClient } from '@/lib/payload'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'jobs',
    where: { postedBy: { equals: session.user.id } },
    limit: 50,
    sort: '-updatedAt',
    draft: true,
  })

  return NextResponse.json(result)
}
```

- [ ] **Step 2: Create MyEntries component**

Create `src/components/dashboard/MyEntries.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { EntryBadge } from '@/components/entries/EntryBadge'
import { getCityName, type AtlasEntryType } from '@/config'
import { Clock, CheckCircle, XCircle, Pencil } from 'lucide-react'

interface Entry {
  id: string
  name: string
  entryType: AtlasEntryType
  city: string
  slug: string
  _status: 'draft' | 'published'
  moderationNote?: string
  updatedAt: string
}

export function MyEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/entries')
      .then((res) => res.json())
      .then((data) => { setEntries(data.docs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse h-20 bg-elevated rounded-lg" />

  if (entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted mb-4">No tienes proyectos registrados.</p>
        <Link href="/directorio/submit" className="text-sm font-mono text-accent hover:underline">
          Agregar proyecto
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <EntryBadge entryType={entry.entryType} />
                {entry._status === 'published' ? (
                  <span className="flex items-center gap-1 text-2xs font-mono text-green-600"><CheckCircle className="w-3 h-3" /> Publicado</span>
                ) : (
                  <span className="flex items-center gap-1 text-2xs font-mono text-amber-600"><Clock className="w-3 h-3" /> Pendiente</span>
                )}
              </div>
              <h3 className="font-semibold text-primary text-sm">{entry.name}</h3>
              <p className="text-2xs text-muted font-mono">{getCityName(entry.city)}</p>
              {entry.moderationNote && entry._status === 'draft' && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400 flex items-start gap-1">
                  <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  {entry.moderationNote}
                </div>
              )}
            </div>
            <Link
              href={`/dashboard/entries/${entry.id}`}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono text-secondary hover:text-primary rounded-md hover:bg-elevated transition-colors"
            >
              <Pencil className="w-3 h-3" /> Editar
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create MyJobs component**

Create `src/components/dashboard/MyJobs.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCityName } from '@/config'
import { Clock, CheckCircle, XCircle, Briefcase } from 'lucide-react'

interface Job {
  id: string
  title: string
  type: string
  modality: string
  city?: string
  slug: string
  _status: 'draft' | 'published'
  moderationNote?: string
  expiresAt: string
  updatedAt: string
}

const typeLabels: Record<string, string> = {
  'full-time': 'Tiempo completo',
  'part-time': 'Medio tiempo',
  contract: 'Contrato',
  freelance: 'Freelance',
  volunteer: 'Voluntariado',
}

export function MyJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/jobs')
      .then((res) => res.json())
      .then((data) => { setJobs(data.docs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse h-20 bg-elevated rounded-lg" />

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted mb-4">No has publicado empleos.</p>
        <Link href="/dashboard/jobs/new" className="text-sm font-mono text-accent hover:underline">
          Publicar empleo
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => {
        const isExpired = new Date(job.expiresAt) < new Date()
        return (
          <div key={job.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {job._status === 'published' && !isExpired ? (
                    <span className="flex items-center gap-1 text-2xs font-mono text-green-600"><CheckCircle className="w-3 h-3" /> Activo</span>
                  ) : job._status === 'published' && isExpired ? (
                    <span className="flex items-center gap-1 text-2xs font-mono text-muted"><Clock className="w-3 h-3" /> Expirado</span>
                  ) : (
                    <span className="flex items-center gap-1 text-2xs font-mono text-amber-600"><Clock className="w-3 h-3" /> Pendiente</span>
                  )}
                </div>
                <h3 className="font-semibold text-primary text-sm">{job.title}</h3>
                <p className="text-2xs text-muted font-mono">
                  {typeLabels[job.type] || job.type}
                  {job.city && ` · ${getCityName(job.city)}`}
                </p>
                {job.moderationNote && job._status === 'draft' && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400 flex items-start gap-1">
                    <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {job.moderationNote}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Create dashboard page**

Create `src/app/(frontend)/dashboard/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { MyEntries } from '@/components/dashboard/MyEntries'
import { MyJobs } from '@/components/dashboard/MyJobs'
import { Plus, Briefcase } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
            <div className="flex gap-2">
              <Link
                href="/directorio/submit"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-medium bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar proyecto
              </Link>
              <Link
                href="/dashboard/jobs/new"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono font-medium border border-border text-primary rounded-md hover:bg-elevated transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5" /> Publicar empleo
              </Link>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-primary mb-4">Mis proyectos</h2>
              <MyEntries />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-primary mb-4">Mis empleos</h2>
              <MyJobs />
            </div>
          </div>
        </div>
      </section>
    </AuthGuard>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/user/ src/components/dashboard/ src/app/\(frontend\)/dashboard/
git commit -m "feat: build user dashboard with entries and jobs management"
```

---

### Task 9: Build job posting form

**Files:**
- Create: `src/app/(frontend)/dashboard/jobs/new/page.tsx`

- [ ] **Step 1: Create job posting page**

Create `src/app/(frontend)/dashboard/jobs/new/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { CITY_SELECT_OPTIONS } from '@/config'

const JOB_TYPES = [
  { value: 'full-time', label: 'Tiempo completo' },
  { value: 'part-time', label: 'Medio tiempo' },
  { value: 'contract', label: 'Contrato' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'volunteer', label: 'Voluntariado' },
]

const MODALITIES = [
  { value: 'remote', label: 'Remoto' },
  { value: 'in-person', label: 'Presencial' },
  { value: 'hybrid', label: 'Híbrido' },
]

export default function NewJobPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title'),
      type: formData.get('type'),
      modality: formData.get('modality'),
      city: formData.get('city') || undefined,
      compensation: formData.get('compensation') || undefined,
      contactUrl: formData.get('contactUrl'),
      description: {
        root: {
          type: 'root',
          children: [{
            type: 'paragraph',
            children: [{ type: 'text', text: formData.get('description') as string, version: 1 }],
            version: 1,
          }],
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      },
    }

    try {
      const res = await fetch('/api/submissions/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Submission failed')
      }

      router.push('/dashboard?submitted=job')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthGuard>
      <section className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <nav className="text-xs font-mono text-muted mb-6 uppercase">
            <a href="/dashboard" className="hover:text-accent transition-colors">Dashboard</a>
            <span className="mx-2">/</span>
            <span className="text-primary">Publicar empleo</span>
          </nav>

          <h1 className="text-2xl font-bold text-primary mb-2">Publicar empleo</h1>
          <p className="text-sm text-muted mb-8">Tu oferta será revisada antes de publicarse.</p>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-xs font-mono text-muted mb-1">Título *</label>
              <input id="title" name="title" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-primary" placeholder="Ej: Frontend Developer" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="block text-xs font-mono text-muted mb-1">Tipo *</label>
                <select id="type" name="type" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-primary">
                  {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="modality" className="block text-xs font-mono text-muted mb-1">Modalidad *</label>
                <select id="modality" name="modality" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-primary">
                  {MODALITIES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-xs font-mono text-muted mb-1">Ciudad (si aplica)</label>
                <select id="city" name="city" className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-primary">
                  <option value="">No aplica</option>
                  {CITY_SELECT_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="compensation" className="block text-xs font-mono text-muted mb-1">Compensación</label>
                <input id="compensation" name="compensation" className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-primary" placeholder="Ej: $15k/mo, Equity, Voluntario" />
              </div>
            </div>

            <div>
              <label htmlFor="contactUrl" className="block text-xs font-mono text-muted mb-1">URL o email de contacto *</label>
              <input id="contactUrl" name="contactUrl" required className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-primary" placeholder="https://... o email@..." />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-mono text-muted mb-1">Descripción *</label>
              <textarea id="description" name="description" required rows={6} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-primary" placeholder="Describe el puesto, requisitos, beneficios..." />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-accent text-accent-foreground rounded-md text-sm font-mono font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Enviar para revisión'}
            </button>
          </form>
        </div>
      </section>
    </AuthGuard>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(frontend\)/dashboard/jobs/
git commit -m "feat: build job posting form with authenticated submission"
```

---

### Task 10: Update submit page to use auth + API route

**Files:**
- Modify: `src/app/(frontend)/directorio/submit/page.tsx`

- [ ] **Step 1: Update submit page to wrap with AuthGuard**

Update `src/app/(frontend)/directorio/submit/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { SubmitWizard } from '@/components/forms/SubmitWizard'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { SINALOA_CITIES } from '@/config'

export const metadata: Metadata = {
  title: 'Agregar Proyecto',
}

export default function SubmitPage() {
  const cities = [
    { id: 'global', name: 'Global (sin ubicación específica)' },
    ...SINALOA_CITIES.map((m) => ({ id: m.id, name: m.name })),
  ]

  return (
    <AuthGuard>
      <section className="py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <nav className="text-xs font-mono text-muted mb-6 uppercase">
            <a href="/" className="hover:text-accent transition-colors">Inicio</a>
            <span className="mx-2">/</span>
            <a href="/directorio" className="hover:text-accent transition-colors">Directorio</a>
            <span className="mx-2">/</span>
            <span className="text-primary">Agregar proyecto</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-sans font-bold text-primary mb-2">Agregar proyecto</h1>
          <p className="text-secondary mb-8">
            Registra tu startup, consultora, comunidad o perfil en el directorio tech de Sinaloa.
          </p>

          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-6 md:p-8">
            <SubmitWizard cities={cities} />
          </div>
        </div>
      </section>
    </AuthGuard>
  )
}
```

Note: The SubmitWizard currently posts to the n8n webhook. In a future iteration, it should be updated to post to `/api/submissions/entries` instead. For now, the auth guard ensures only logged-in users can access the form, and the n8n webhook continues to work.

- [ ] **Step 2: Commit**

```bash
git add src/app/\(frontend\)/directorio/submit/page.tsx
git commit -m "feat: add auth guard to submit page"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `GET /api/auth/ok` returns `{ "status": "ok" }`
- [ ] Google sign-in flow works (redirects to Google, returns with session)
- [ ] UserMenu in header shows avatar/initials when logged in, sign-in button when logged out
- [ ] `/auth/sign-in` page renders with Google button
- [ ] `/dashboard` redirects to sign-in if not authenticated
- [ ] `/dashboard` shows user's entries and jobs when authenticated
- [ ] `/directorio/submit` redirects to sign-in if not authenticated
- [ ] `POST /api/submissions/entries` creates a draft entry with `owner` set to session user ID
- [ ] `POST /api/submissions/jobs` creates a draft job with `postedBy` set to session user ID
- [ ] `PATCH /api/submissions/entries` only allows the owner to edit their entry
- [ ] New submissions appear in Payload admin as drafts
- [ ] Moderator can approve (publish) or reject (add moderationNote) in Payload admin
- [ ] Rejected entries show the moderationNote in the user's dashboard
- [ ] Session persists across page navigations (cookie-based)
- [ ] Signing out clears the session

---

## Known Limitations (for future work)

- **SubmitWizard still posts to n8n** — Should be migrated to use `/api/submissions/entries` for the full Payload integration. The wizard needs significant refactoring to match the Payload data format.
- **Entry edit form** (`/dashboard/entries/[id]`) — Placeholder route exists but the actual edit form is not built in this plan. Building it requires a form that mirrors the SubmitWizard but pre-fills data and PATCHes instead of POSTs.
- **Email notifications** — Moderators aren't notified of new submissions. Could use Payload's email adapter or a webhook.
- **better-auth schema location** — The `auth` schema on Neon must be verified manually. The `pg.Pool` `search_path` option may need adjustment depending on the better-auth version.
