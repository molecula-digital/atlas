import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { profiles } from '@/db/schema/profiles'
import { and, eq, ne } from 'drizzle-orm'
import { z } from 'zod'
import { withRateLimit } from '@/lib/rate-limit'
import { syncSubscriptionForEmails } from '@/lib/newsletter'
import {
  isValidProfileSlug,
  isValidWebsiteInput,
  normalizeWebsite,
  slugifyProfile,
} from '@/lib/profile-fields'

const FIELD_LABELS: Record<string, string> = {
  email: 'correo',
  slug: 'slug',
  title: 'cargo',
  company: 'empresa',
  phone: 'teléfono',
  website: 'sitio web',
  linkedin: 'LinkedIn',
  x: 'X',
  github: 'GitHub',
}

const profileSchema = z
  .object({
    email: z
      .string()
      .max(254, 'El correo es demasiado largo')
      .optional()
      .default(''),
    slug: z
      .string()
      .max(60, 'El slug es demasiado largo')
      .optional()
      .default(''),
    title: z.string().max(100, 'El cargo es demasiado largo').optional().default(''),
    company: z.string().max(100, 'La empresa es demasiado larga').optional().default(''),
    phone: z.string().max(20, 'El teléfono es demasiado largo').optional().default(''),
    website: z.string().max(200, 'El sitio web es demasiado largo').optional().default(''),
    linkedin: z.string().max(200, 'LinkedIn es demasiado largo').optional().default(''),
    x: z.string().max(200, 'X es demasiado largo').optional().default(''),
    github: z.string().max(200, 'GitHub es demasiado largo').optional().default(''),
    newsletterEnabled: z.boolean().optional().default(false),
    isPublic: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.email && data.email.trim()) {
      const ok = z.string().email().safeParse(data.email.trim())
      if (!ok.success) {
        ctx.addIssue({
          code: 'custom',
          path: ['email'],
          message: 'Ingresa un correo válido',
        })
      }
    }

    if (data.website.trim() && !isValidWebsiteInput(data.website)) {
      ctx.addIssue({
        code: 'custom',
        path: ['website'],
        message: 'Ingresa un sitio web válido (ej. hola.com)',
      })
    }

    const slug = slugifyProfile(data.slug)
    if (data.isPublic) {
      if (!slug) {
        ctx.addIssue({
          code: 'custom',
          path: ['slug'],
          message: 'El slug es obligatorio para un perfil público',
        })
      } else if (!isValidProfileSlug(slug)) {
        ctx.addIssue({
          code: 'custom',
          path: ['slug'],
          message: 'Usa solo minúsculas, números y guiones (mín. 2 caracteres)',
        })
      }
    } else if (data.slug.trim() && !isValidProfileSlug(slug)) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: 'Usa solo minúsculas, números y guiones (mín. 2 caracteres)',
      })
    }
  })

function formatValidationError(issues: z.ZodIssue[]): string {
  const first = issues[0]
  if (!first) return 'Revisa los datos del formulario'
  const field = first.path[0]
  const label = typeof field === 'string' ? FIELD_LABELS[field] : null
  if (label && first.message) return `${label}: ${first.message}`
  return first.message || 'Revisa los datos del formulario'
}

function toClientProfile(
  profile: typeof profiles.$inferSelect,
  sessionUser: { name: string; email: string; image?: string | null },
) {
  return {
    exists: true,
    userId: profile.userId,
    email: profile.email || sessionUser.email,
    accountEmail: sessionUser.email,
    slug: profile.slug ?? '',
    title: profile.title ?? '',
    company: profile.company ?? '',
    phone: profile.phone ?? '',
    website: profile.website ?? '',
    linkedin: profile.linkedin ?? '',
    x: profile.x ?? '',
    github: profile.github ?? '',
    newsletterEnabled: profile.newsletterEnabled,
    isPublic: profile.isPublic,
    name: sessionUser.name,
    photo: sessionUser.image ?? '',
    createdAt: profile.createdAt?.toISOString?.() ?? profile.createdAt,
    updatedAt: profile.updatedAt?.toISOString?.() ?? profile.updatedAt,
  }
}

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))

    if (!profile) {
      return NextResponse.json({
        exists: false,
        userId: null,
        newsletterEnabled: false,
        isPublic: false,
        slug: '',
        title: '',
        company: '',
        phone: '',
        website: '',
        linkedin: '',
        x: '',
        github: '',
        name: session.user.name,
        email: session.user.email,
        accountEmail: session.user.email,
        photo: session.user.image ?? '',
      })
    }

    return NextResponse.json(toClientProfile(profile, session.user))
  } catch (err) {
    console.error('Profile GET failed:', err)
    return NextResponse.json(
      { error: 'No se pudo cargar el perfil. ¿Corriste las migraciones?' },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const limited = withRateLimit(request, { limit: 20, windowMs: 15 * 60 * 1000, keyPrefix: 'user-profile' }, session.user.id)
  if (limited) return limited

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: formatValidationError(parsed.error.issues),
        details: parsed.error.issues,
      },
      { status: 400 },
    )
  }

  const validated = parsed.data
  const contactEmail = (validated.email || session.user.email).trim().toLowerCase()
  const slug = validated.slug.trim() ? slugifyProfile(validated.slug) : null
  const website = normalizeWebsite(validated.website)

  if (validated.isPublic && !slug) {
    return NextResponse.json(
      { error: 'El slug es obligatorio para un perfil público' },
      { status: 400 },
    )
  }

  try {
    if (slug) {
      const [taken] = await db
        .select({ userId: profiles.userId })
        .from(profiles)
        .where(and(eq(profiles.slug, slug), ne(profiles.userId, session.user.id)))
        .limit(1)

      if (taken) {
        return NextResponse.json(
          { error: 'Ese slug ya está en uso. Elige otro.' },
          { status: 409 },
        )
      }
    }

    const data = {
      userId: session.user.id,
      email: contactEmail,
      slug,
      title: validated.title || null,
      company: validated.company || null,
      phone: validated.phone || null,
      website,
      linkedin: validated.linkedin || null,
      x: validated.x || null,
      github: validated.github || null,
      newsletterEnabled: validated.newsletterEnabled,
      isPublic: validated.isPublic,
      updatedAt: new Date(),
    }

    const [profile] = await db
      .insert(profiles)
      .values({ ...data, createdAt: new Date() })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: data,
      })
      .returning()

    // Reconcile both addresses in both directions: the anonymous list keys on
    // whichever address was typed into the signup form, which may be the contact
    // email rather than the Google login.
    try {
      await syncSubscriptionForEmails(validated.newsletterEnabled, [
        session.user.email,
        contactEmail,
      ])
    } catch (err) {
      console.error('Failed to sync anonymous newsletter subscriber:', err)
    }

    return NextResponse.json(toClientProfile(profile, session.user))
  } catch (err) {
    console.error('Profile PUT failed:', err)
    const message = err instanceof Error ? err.message : ''
    const missingColumn =
      /column .* does not exist/i.test(message) ||
      /relation .* does not exist/i.test(message)
    return NextResponse.json(
      {
        error: missingColumn
          ? 'Falta migrar la base de datos (pnpm db:migrate).'
          : 'No se pudo guardar el perfil',
      },
      { status: 500 },
    )
  }
}
