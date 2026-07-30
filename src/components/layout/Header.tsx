'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Briefcase, Menu, X, Map, CalendarDays, Plus, FolderOpen, Newspaper, LayoutDashboard } from 'lucide-react'
import ThemeToggle from '@/components/ui/ThemeToggle'
import { GitHubIcon } from '@/components/icons/SocialIcons'
import { useSession } from '@/lib/auth-client'
import { ENTRY_TYPE_CONFIG, ENTRY_TYPES } from '@/config'
import { ENTRY_TYPE_ICON_MAP } from '@/lib/icons'
import { useDisclosure } from '@/hooks/useDisclosure'
import { buttonVariants } from '@/components/ui/button-variants'
import { AtlasLogo } from '@/components/layout/AtlasLogo'
import { SiteFrame } from '@/components/layout/SiteFrame'

const NAV_LINK = "flex cursor-pointer items-center gap-1 px-2 py-1 text-[10px] font-mono text-secondary hover:text-accent rounded hover:bg-elevated transition-colors"
const MOBILE_LINK = "flex items-center gap-2 py-3 text-lg font-mono font-semibold text-primary hover:text-accent transition-colors"

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdown = useDisclosure()
  const pathname = usePathname()
  const { data: session } = useSession()

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const categories = ENTRY_TYPES.map((type) => ({ type, ...ENTRY_TYPE_CONFIG[type] }))

  return (
    <>
      <div className="sticky top-0 z-50 w-full">
        <header className="w-full border-b border-border bg-card/90 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:px-4 focus:py-2 focus:bg-accent focus:text-accent-foreground focus:rounded-md focus:text-sm focus:font-mono"
          >
            Ir al contenido
          </a>

          <SiteFrame className="flex h-8 items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Link href="/" className="flex items-center shrink-0" aria-label="Tech Atlas — inicio">
                  <AtlasLogo className="h-4 w-auto" priority />
                </Link>

                <nav className="hidden lg:flex items-center gap-0.5">
                  <div className="relative" ref={dropdown.ref}>
                    <button onClick={dropdown.toggle} className={NAV_LINK}>
                      <FolderOpen className="w-3 h-3" />
                      Directorio
                      <svg className={`w-2.5 h-2.5 transition-transform ${dropdown.open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {dropdown.open && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg p-1 z-50">
                        <Link href="/directorio" className="block rounded-md px-3 py-2 text-xs font-mono text-secondary hover:text-accent hover:bg-elevated transition-colors">
                          Ver todo
                        </Link>
                        <div className="h-px bg-border my-1" />
                        {categories.map((cat) => {
                          const Icon = ENTRY_TYPE_ICON_MAP[cat.icon]
                          return (
                            <Link key={cat.type} href={`/${cat.slug}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-mono text-secondary hover:text-accent hover:bg-elevated transition-colors">
                              {Icon && <Icon className="w-4 h-4" />}
                              {cat.labelPlural}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <Link href="/eventos" className={NAV_LINK}><CalendarDays className="w-3 h-3" />Eventos</Link>
                  <Link href="/noticias" className={NAV_LINK}><Newspaper className="w-3 h-3" />Noticias</Link>
                  <Link href="/empleos" className={NAV_LINK}><Briefcase className="w-3 h-3" />Empleos</Link>
                  <Link href="/#map" className={NAV_LINK}><Map className="w-3 h-3" />Mapa</Link>
                </nav>
              </div>

              <div className="hidden lg:flex items-center gap-0.5">
                <a
                  href="https://github.com/ojoanalogo/atlas-tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 font-mono text-[10px] text-secondary transition-colors hover:text-accent"
                  aria-label="Ver Tech Atlas en GitHub"
                >
                  <GitHubIcon className="w-3 h-3" />
                  GitHub
                </a>
                <ThemeToggle />
                <Link href="/dashboard" className={buttonVariants({ variant: 'accent', size: 'xs', className: 'ml-1' })}>
                  {session ? (
                    <><LayoutDashboard className="w-3 h-3" /> Dashboard</>
                  ) : (
                    <><Plus className="w-3 h-3" /> Crear cuenta</>
                  )}
                </Link>
              </div>

              {/* Mobile toggle */}
              <div className="flex lg:hidden items-center gap-1">
                <ThemeToggle />
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="relative flex h-8 w-8 cursor-pointer items-center justify-center p-1.5 text-secondary hover:text-primary"
                  aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                  aria-expanded={mobileOpen}
                >
                  <Menu className={`w-4 h-4 absolute transition-all duration-300 ${mobileOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
                  <X className={`w-4 h-4 absolute transition-all duration-300 ${mobileOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
                </button>
              </div>
          </SiteFrame>
        </header>
      </div>

      {/* Mobile menu */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`lg:hidden fixed inset-0 z-100 bg-background flex flex-col transition-all duration-300 ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      >
        <div className="flex items-center justify-between px-8 py-6">
          <Link href="/" className="flex items-center" aria-label="Tech Atlas — inicio">
            <AtlasLogo className="h-6 w-auto" />
          </Link>
          <button onClick={() => setMobileOpen(false)} className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center p-2 text-secondary hover:text-accent transition-colors" aria-label="Cerrar menú">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 space-y-2 uppercase">
          <Link href="/directorio" className={MOBILE_LINK}><FolderOpen className="w-5 h-5" />Directorio</Link>
          <div className="pl-4 space-y-1 border-l-2 border-border">
            {categories.map((cat) => {
              const Icon = ENTRY_TYPE_ICON_MAP[cat.icon]
              return (
                <Link key={cat.type} href={`/${cat.slug}`} className="flex items-center gap-2 py-2 text-sm font-mono text-secondary hover:text-accent transition-colors">
                  {Icon && <Icon className="w-4 h-4" />}
                  {cat.labelPlural}
                </Link>
              )
            })}
          </div>

          <Link href="/eventos" className={MOBILE_LINK}><CalendarDays className="w-5 h-5" />Eventos</Link>
          <Link href="/noticias" className={MOBILE_LINK}><Newspaper className="w-5 h-5" />Noticias</Link>
          <Link href="/empleos" className={MOBILE_LINK}><Briefcase className="w-5 h-5" />Empleos</Link>
          <Link href="/#map" className={MOBILE_LINK}><Map className="w-5 h-5" />Mapa</Link>
          <a
            href="https://github.com/ojoanalogo/atlas-tech"
            target="_blank"
            rel="noopener noreferrer"
            className={MOBILE_LINK}
          >
            <GitHubIcon className="w-5 h-5" />GitHub
          </a>

          <div className="pt-4">
            <Link href="/dashboard" className={buttonVariants({ variant: 'accent', size: 'lg' })}>
              {session ? (
                <><LayoutDashboard className="w-4 h-4" /> Dashboard</>
              ) : (
                <><Plus className="w-4 h-4" /> Crear cuenta</>
              )}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
