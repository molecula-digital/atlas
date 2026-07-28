import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { ENTRY_TYPE_CONFIG, ENTRY_TYPES, SOCIAL_LINKS, SITE_TITLE, NEWSLETTER, WHATSAPP_URL } from '@/config'
import { GitHubIcon } from '@/components/icons/SocialIcons'
import { AtlasLogo } from '@/components/layout/AtlasLogo'
import { NewsletterSignup } from '@/components/newsletter/NewsletterSignup'
import { buttonVariants } from '@/components/ui/Button'
import { SiteFrame } from '@/components/layout/SiteFrame'

export function Footer() {
  const categories = ENTRY_TYPES.map((type) => ({ type, ...ENTRY_TYPE_CONFIG[type] }))

  return (
    <footer className="relative z-10 border-t border-border bg-card">
      <SiteFrame className="py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="inline-flex items-center mb-3" aria-label="Tech Atlas — inicio">
                <AtlasLogo className="h-6 w-auto" />
              </Link>
              <p className="text-xs text-muted leading-relaxed">
                Directorio y comunidad del ecosistema tech de Sinaloa. Tecnología, IA, software y emprendimiento. Código abierto, hecho con cariño desde Sinaloa.
              </p>
              <div className="mt-4 flex flex-col items-start gap-3">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'accent', size: 'sm', className: 'uppercase' })}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Comunidad WhatsApp
                </a>
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: 'accent', size: 'sm', className: 'uppercase' })}
                    aria-label={`${SITE_TITLE} en ${link.label}`}
                  >
                    {link.platform === 'github' && <GitHubIcon className="w-3.5 h-3.5" />}
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-muted mb-3 tracking-wider">Directorio</p>
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li key={cat.type}><Link href={`/${cat.slug}`} className="text-xs text-secondary hover:text-accent transition-colors font-mono">{cat.labelPlural}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-muted mb-3 tracking-wider">Recursos</p>
              <ul className="space-y-2">
                <li><Link href="/directorio" className="text-xs text-secondary hover:text-accent transition-colors font-mono">Explorar</Link></li>
                <li><Link href="/#map" className="text-xs text-secondary hover:text-accent transition-colors font-mono">Mapa</Link></li>
                <li><Link href="/eventos" className="text-xs text-secondary hover:text-accent transition-colors font-mono">Eventos</Link></li>
                <li><Link href="/noticias" className="text-xs text-secondary hover:text-accent transition-colors font-mono">Noticias</Link></li>
                <li><Link href="/empleos" className="text-xs text-secondary hover:text-accent transition-colors font-mono">Empleos</Link></li>
                <li><Link href="/dashboard" className="text-xs text-secondary hover:text-accent transition-colors font-mono">Agregar registro</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-muted mb-3 tracking-wider">{NEWSLETTER.title}</p>
              <p className="text-xs text-muted leading-relaxed mb-3">{NEWSLETTER.description}</p>
              <NewsletterSignup source="footer" variant="compact" />
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-2xs text-muted font-mono">&copy; {new Date().getFullYear()} {SITE_TITLE}. Hecho en Sinaloa.</p>
            <p className="text-2xs text-muted font-mono">Hecho con open source</p>
          </div>
      </SiteFrame>
    </footer>
  )
}
