import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Globe } from 'lucide-react'
import { SITE_TITLE, SITE_URL } from '@/config'
import { getPublicProfileBySlug } from '@/lib/public-profile'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { btn } from '@/components/ui/button-styles'
import { GitHubIcon, LinkedInIcon, XIcon } from '@/components/icons/SocialIcons'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const profile = await getPublicProfileBySlug(slug)
  if (!profile) return { title: 'Perfil no encontrado', robots: { index: false } }

  const description = [profile.title, profile.company].filter(Boolean).join(' · ')
    || `Perfil en ${SITE_TITLE}`
  const canonical = `${SITE_URL}/perfil/${profile.slug}`

  return {
    title: `${profile.name} — Perfil`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${profile.name} — Perfil`,
      description,
      url: canonical,
      ...(profile.photo ? { images: [{ url: profile.photo }] } : {}),
    },
  }
}

function normalizeHref(value: string, kind: 'url' | 'linkedin' | 'x' | 'github'): string {
  if (/^https?:\/\//i.test(value)) return value
  switch (kind) {
    case 'linkedin':
      return value.includes('linkedin.com') ? `https://${value}` : `https://linkedin.com/in/${value.replace(/^\/+/, '')}`
    case 'x':
      return `https://x.com/${value.replace(/^@/, '')}`
    case 'github':
      return `https://github.com/${value.replace(/^@/, '')}`
    default:
      return `https://${value}`
  }
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params
  const profile = await getPublicProfileBySlug(slug)
  if (!profile) notFound()

  const subtitle = [profile.title, profile.company].filter(Boolean).join(' · ')
  const links = [
    profile.website
      ? { href: normalizeHref(profile.website, 'url'), label: 'Sitio web', icon: 'globe' as const }
      : null,
    profile.linkedin
      ? { href: normalizeHref(profile.linkedin, 'linkedin'), label: 'LinkedIn', icon: 'linkedin' as const }
      : null,
    profile.x
      ? { href: normalizeHref(profile.x, 'x'), label: 'X', icon: 'x' as const }
      : null,
    profile.github
      ? { href: normalizeHref(profile.github, 'github'), label: 'GitHub', icon: 'github' as const }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string; icon: 'globe' | 'linkedin' | 'x' | 'github' }>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Personas', href: '/personas' },
          { label: profile.name },
        ]}
      />

      <div className="mt-8 flex flex-col sm:flex-row gap-6 items-start">
        <div className="w-20 h-20 rounded-full overflow-hidden border border-border bg-elevated shrink-0 flex items-center justify-center text-2xl font-mono font-bold text-accent">
          {profile.photo ? (
            <Image
              src={profile.photo}
              alt={profile.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            profile.name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="terminal-title text-2xl md:text-3xl font-sans font-bold text-primary">
            {profile.name}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-secondary font-mono">{subtitle}</p>
          )}

          {links.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btn({ variant: 'neutral', size: 'sm' })}
                  >
                    {link.icon === 'globe' && <Globe className="w-3.5 h-3.5" />}
                    {link.icon === 'linkedin' && <LinkedInIcon className="w-3.5 h-3.5" />}
                    {link.icon === 'x' && <XIcon className="w-3.5 h-3.5" />}
                    {link.icon === 'github' && <GitHubIcon className="w-3.5 h-3.5" />}
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="mt-10 text-xs text-muted font-mono">
        <Link href="/dashboard/profile" className="hover:text-accent transition-colors">
          ¿Este es tu perfil? Edítalo en el dashboard
        </Link>
      </p>
    </div>
  )
}
