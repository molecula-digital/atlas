import type { AdminViewServerProps } from 'payload'
import { Gutter } from '@payloadcms/ui'
import { Newspaper, Briefcase, Building2, CalendarDays } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const COLLECTION_LABELS: Record<string, string> = {
  news: 'Noticia',
  entries: 'Registro',
  jobs: 'Empleo',
  events: 'Evento',
}

const QUICK_ACTIONS = [
  {
    label: 'Noticia',
    description: 'Artículos, noticias y actualizaciones',
    href: '/admin/collections/news/create',
    Icon: Newspaper,
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
  },
  {
    label: 'Empleo',
    description: 'Ofertas de empleo y oportunidades',
    href: '/admin/collections/jobs/create',
    Icon: Briefcase,
    iconBg: '#fef3c7',
    iconColor: '#d97706',
  },
  {
    label: 'Registro',
    description: 'Startups, empresas, comunidades y personas',
    href: '/admin/collections/entries/create',
    Icon: Building2,
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
  },
  {
    label: 'Evento',
    description: 'Eventos y meetups de la comunidad',
    href: '/admin/collections/events/create',
    Icon: CalendarDays,
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
  },
]

type DraftItem = {
  id: number | string
  collection: string
  title: string
  updatedAt: string
}

export default async function Dashboard({
  payload,
  user,
}: AdminViewServerProps) {
  const collections = ['news', 'entries', 'jobs', 'events'] as const

  const results = await Promise.all(
    collections.map((slug) =>
      payload.find({
        collection: slug,
        where: { _status: { equals: 'draft' } },
        sort: '-updatedAt',
        limit: 15,
        depth: 0,
      }),
    ),
  )

  const drafts: DraftItem[] = collections
    .flatMap((slug, i) =>
      results[i].docs.map((doc) => {
        const d = doc as unknown as Record<string, unknown>
        return {
          id: d.id as number | string,
          collection: slug,
          title: (d.title as string) || (d.name as string) || `#${d.id}`,
          updatedAt: d.updatedAt as string,
        }
      }),
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 15)

  const displayName =
    user?.displayName || user?.email?.split('@')[0] || 'usuario'

  return (
    <Gutter>
      <div style={{ paddingTop: 'var(--gutter-h)' }}>
        {/* Welcome Banner */}
        <div
          style={{
            background: 'var(--theme-elevation-50)',
            borderRadius: '10px',
            padding: '28px 32px',
            marginBottom: '28px',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
            Bienvenido, {displayName}
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              color: 'var(--theme-elevation-600)',
              fontSize: '0.9rem',
            }}
          >
            Panel de administración de Atlas Tech
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}
          >
            Acciones rápidas
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '12px',
            }}
          >
            {QUICK_ACTIONS.map(
              ({ label, description, href, Icon, iconBg, iconColor }) => (
                <a
                  key={href}
                  href={href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px',
                    borderRadius: '10px',
                    background: 'var(--theme-elevation-50)',
                    color: 'var(--theme-text)',
                    textDecoration: 'none',
                    border: '1px solid var(--theme-elevation-150)',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={20} color={iconColor} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--theme-elevation-500)',
                        marginTop: '2px',
                        lineHeight: 1.3,
                      }}
                    >
                      {description}
                    </div>
                  </div>
                </a>
              ),
            )}
          </div>
        </div>

        {/* Drafts Queue */}
        <div>
          <h2
            style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}
          >
            Borradores pendientes
          </h2>
          {drafts.length === 0 ? (
            <p
              style={{
                color: 'var(--theme-elevation-500)',
                fontSize: '0.9rem',
              }}
            >
              No hay borradores pendientes.
            </p>
          ) : (
            <div
              style={{
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.875rem',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'var(--theme-elevation-50)',
                      borderBottom: '1px solid var(--theme-elevation-150)',
                    }}
                  >
                    <th style={thStyle}>Título</th>
                    <th style={thStyle}>Tipo</th>
                    <th style={thStyle}>Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft) => (
                    <tr
                      key={`${draft.collection}-${draft.id}`}
                      style={{
                        borderBottom: '1px solid var(--theme-elevation-100)',
                      }}
                    >
                      <td style={tdStyle}>
                        <a
                          href={`/admin/collections/${draft.collection}/${draft.id}`}
                          style={{
                            color: 'var(--theme-text)',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          {draft.title}
                        </a>
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'var(--theme-elevation-100)',
                            fontSize: '0.8rem',
                          }}
                        >
                          {COLLECTION_LABELS[draft.collection] ||
                            draft.collection}
                        </span>
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: 'var(--theme-elevation-500)',
                        }}
                      >
                        {formatDistanceToNow(new Date(draft.updatedAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Gutter>
  )
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  fontWeight: 600,
  color: 'var(--theme-elevation-600)',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
}
