import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { db } from '@/db'
import { profiles } from '@/db/schema/profiles'
import { eq } from 'drizzle-orm'
import { generateApplePass } from '@/lib/wallet/apple'
import { generateGoogleWalletLink } from '@/lib/wallet/google'
import { SITE_URL } from '@/config'
import { withRateLimit } from '@/lib/rate-limit'

function getQrValue(userId: string): string {
  // Default to a vCard-encoded QR if no directory entry exists.
  // The profile page could later resolve this to a directory URL.
  return `${SITE_URL}/card/${userId}`
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const limited = withRateLimit(request, { limit: 20, windowMs: 15 * 60 * 1000, keyPrefix: 'user-wallet' }, session.user.id)
  if (limited) return limited

  const body = await request.json()
  const platform = body.platform as string

  if (!['apple', 'google'].includes(platform)) {
    return NextResponse.json({ error: 'Plataforma inválida. Usa "apple" o "google".' }, { status: 400 })
  }

  const [dbProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))

  if (!dbProfile) {
    return NextResponse.json({ error: 'Perfil no encontrado. Guarda tu perfil primero.' }, { status: 400 })
  }

  const profile = {
    ...dbProfile,
    name: session.user.name,
    email: dbProfile.email || session.user.email,
    photo: session.user.image ?? null,
  }

  const qrValue =
    dbProfile.isPublic && dbProfile.slug
      ? `${SITE_URL}/perfil/${dbProfile.slug}`
      : getQrValue(session.user.id)

  if (platform === 'apple') {
    const buffer = await generateApplePass(profile, qrValue)
    return new NextResponse(new Uint8Array(buffer), {
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
