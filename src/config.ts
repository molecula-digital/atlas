export const SITE_TITLE = 'Tech Atlas'
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://atlas-sinaloa.tech'

/** Pacific Time — all of Sinaloa uses America/Mazatlan (UTC-7, no DST). */
export const EVENT_TIMEZONE = 'America/Mazatlan'

export const DEFAULT_PAGINATION = 18

/**
 * Cell size (px) of the site-wide background grid lattice. The hero's invader
 * sprites are sized as an exact fraction of this cell and march in whole
 * cells, so both layers must derive their size from this constant — if they
 * drift apart the sprites fall out of phase with the lines and the effect
 * breaks.
 */
export const MATRIX_BOX_SIZE = 26

/**
 * Which animated layer the landing hero renders behind the headline. Both
 * variants share the accent wash and the full-bleed wrapper (see
 * HeroBackdrop); flipping this string is the whole switch — no env var, no
 * UI. 'invaders' is kept alive so the marching fleet is one edit away.
 */
export const HERO_BACKDROP: 'icons' | 'invaders' = 'invaders'

export const SITE_DESCRIPTION =
  'Directorio del ecosistema tecnológico de Sinaloa. Encuentra startups, consultoras, comunidades y talento tech construyendo desde nuestro estado.'

export const ENTRY_TYPES = [
  'startup',
  'community',
  'business',
  'consultory',
  'research-center',
  'person',
] as const

export type AtlasEntryType = (typeof ENTRY_TYPES)[number]

export interface EntryTypeConfig {
  label: string
  labelPlural: string
  description: string
  icon: string
  slug: string
}

export const ENTRY_TYPE_CONFIG: Record<AtlasEntryType, EntryTypeConfig> = {
  startup: {
    label: 'Startup',
    labelPlural: 'Startups',
    description: 'Empresas emergentes de tecnología en Sinaloa',
    icon: 'rocket',
    slug: 'startups',
  },
  community: {
    label: 'Comunidad',
    labelPlural: 'Comunidades',
    description: 'Grupos y comunidades de tecnología locales',
    icon: 'users',
    slug: 'comunidades',
  },
  business: {
    label: 'Empresa',
    labelPlural: 'Empresas',
    description: 'Empresas establecidas de tecnología',
    icon: 'briefcase',
    slug: 'empresas',
  },
  consultory: {
    label: 'Consultora',
    labelPlural: 'Consultoras',
    description: 'Empresas de consultoría y servicios tecnológicos',
    icon: 'briefcase',
    slug: 'consultoras',
  },
  'research-center': {
    label: 'Centro de Investigación',
    labelPlural: 'Centros de Investigación',
    description: 'Centros de investigación y desarrollo tecnológico',
    icon: 'microscope',
    slug: 'centros-de-investigacion',
  },
  person: {
    label: 'Persona',
    labelPlural: 'Personas',
    description: 'Talento tech destacado de la región',
    icon: 'user',
    slug: 'personas',
  },
}

export const CATEGORY_URL_MAP: Record<AtlasEntryType, string> =
  Object.fromEntries(
    Object.entries(ENTRY_TYPE_CONFIG).map(([k, v]) => [k, v.slug]),
  ) as Record<AtlasEntryType, string>

export const URL_CATEGORY_MAP: Record<string, AtlasEntryType> =
  Object.fromEntries(
    Object.entries(CATEGORY_URL_MAP).map(([k, v]) => [v, k as AtlasEntryType]),
  ) as Record<string, AtlasEntryType>

export function getEntryUrl(entryType: AtlasEntryType, slug: string): string {
  return `/${CATEGORY_URL_MAP[entryType]}/${slug}`
}

export function emptyTypeCounts(): Record<AtlasEntryType, number> {
  return Object.fromEntries(ENTRY_TYPES.map((t) => [t, 0])) as Record<
    AtlasEntryType,
    number
  >
}

export interface City {
  id: string
  name: string
}

export const SINALOA_CITIES: City[] = [
  { id: 'ahome', name: 'Ahome' },
  { id: 'angostura', name: 'Angostura' },
  { id: 'badiraguato', name: 'Badiraguato' },
  { id: 'choix', name: 'Choix' },
  { id: 'concordia', name: 'Concordia' },
  { id: 'cosala', name: 'Cosalá' },
  { id: 'culiacan', name: 'Culiacán' },
  { id: 'el-fuerte', name: 'El Fuerte' },
  { id: 'elota', name: 'Elota' },
  { id: 'escuinapa', name: 'Escuinapa' },
  { id: 'guasave', name: 'Guasave' },
  { id: 'mazatlan', name: 'Mazatlán' },
  { id: 'mocorito', name: 'Mocorito' },
  { id: 'navolato', name: 'Navolato' },
  { id: 'rosario', name: 'Rosario' },
  { id: 'salvador-alvarado', name: 'Salvador Alvarado' },
  { id: 'san-ignacio', name: 'San Ignacio' },
  { id: 'sinaloa-de-leyva', name: 'Sinaloa de Leyva' },
]

export const CITY_IDS = SINALOA_CITIES.map((m) => m.id)
export const ALL_CITY_IDS = ['global', ...CITY_IDS]

export function getCityName(id: string): string {
  if (id === 'global') return 'Global'
  return SINALOA_CITIES.find((m) => m.id === id)?.name ?? id
}

/** City options formatted for Payload select fields */
export const CITY_SELECT_OPTIONS = ALL_CITY_IDS.map((id) => ({
  label: getCityName(id),
  value: id,
}))

export const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Tiempo completo',
  'part-time': 'Medio tiempo',
  contract: 'Contrato',
  freelance: 'Freelance',
  volunteer: 'Voluntariado',
}

export const MODALITY_LABELS: Record<string, string> = {
  remote: 'Remoto',
  'in-person': 'Presencial',
  hybrid: 'Híbrido',
}

export const JOB_TYPE_OPTIONS = Object.entries(JOB_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)
export const MODALITY_OPTIONS = Object.entries(MODALITY_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const STAGE_OPTIONS = [
  { value: 'Idea', label: 'Idea' },
  { value: 'Bootstrap', label: 'Bootstrap' },
  { value: 'Pre-seed', label: 'Pre-seed' },
  { value: 'Seed', label: 'Seed' },
  { value: 'Serie A', label: 'Serie A' },
  { value: 'Serie B+', label: 'Serie B+' },
  { value: 'Establecida', label: 'Establecida' },
]

export const TEAM_SIZE_OPTIONS = [
  { value: '1-5', label: '1-5' },
  { value: '6-15', label: '6-15' },
  { value: '16-50', label: '16-50' },
  { value: '51-200', label: '51-200' },
  { value: '200+', label: '200+' },
]

export const PLATFORM_OPTIONS = [
  { value: 'Discord', label: 'Discord' },
  { value: 'Telegram', label: 'Telegram' },
  { value: 'Slack', label: 'Slack' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Presencial', label: 'Presencial' },
  { value: 'Otro', label: 'Otro' },
]

export const SECTOR_OPTIONS = [
  { value: 'Desarrollo Web', label: 'Desarrollo Web' },
  { value: 'Desarrollo Mobile', label: 'Desarrollo Mobile' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'Fintech', label: 'Fintech' },
  { value: 'Edtech', label: 'Edtech' },
  { value: 'HealthTech', label: 'HealthTech' },
  { value: 'AgriTech', label: 'AgriTech' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'IA / Machine Learning', label: 'IA / Machine Learning' },
  { value: 'Ciberseguridad', label: 'Ciberseguridad' },
  { value: 'IoT', label: 'IoT' },
  { value: 'MarTech', label: 'MarTech' },
  { value: 'LegalTech', label: 'LegalTech' },
  { value: 'Logística', label: 'Logística' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Blockchain / Web3', label: 'Blockchain / Web3' },
  { value: 'Cloud / Infraestructura', label: 'Cloud / Infraestructura' },
  { value: 'Data & Analytics', label: 'Data & Analytics' },
  { value: 'Consultoría IT', label: 'Consultoría IT' },
  { value: 'Automatización', label: 'Automatización' },
  { value: 'Otro', label: 'Otro' },
]

export const MEETUP_FREQUENCY_OPTIONS = [
  { value: 'Permanente (online)', label: 'Permanente (online)' },
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Quincenal', label: 'Quincenal' },
  { value: 'Mensual', label: 'Mensual' },
  { value: 'Trimestral', label: 'Trimestral' },
  { value: 'Por evento', label: 'Por evento' },
  { value: 'Otro', label: 'Otro' },
]

export const FOCUS_AREA_OPTIONS = [
  { value: 'Desarrollo Web', label: 'Desarrollo Web' },
  { value: 'Desarrollo Mobile', label: 'Desarrollo Mobile' },
  { value: 'IA / Machine Learning', label: 'IA / Machine Learning' },
  { value: 'Emprendimiento', label: 'Emprendimiento' },
  { value: 'Diseño UX/UI', label: 'Diseño UX/UI' },
  { value: 'Ciberseguridad', label: 'Ciberseguridad' },
  { value: 'Open Source', label: 'Open Source' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Blockchain / Web3', label: 'Blockchain / Web3' },
  { value: 'DevOps / Cloud', label: 'DevOps / Cloud' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'Networking', label: 'Networking' },
  { value: 'Otro', label: 'Otro' },
]

export const BUSINESS_MODEL_OPTIONS = [
  { value: 'B2B', label: 'B2B' },
  { value: 'B2C', label: 'B2C' },
  { value: 'B2B2C', label: 'B2B2C' },
  { value: 'Marketplace', label: 'Marketplace' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'Freemium', label: 'Freemium' },
  { value: 'Open Source', label: 'Open Source' },
  { value: 'Otro', label: 'Otro' },
]

export const FAQS = [
  {
    icon: 'Sparkles',
    question: '¿Por qué existe Tech Atlas?',
    answer:
      'Porque Sinaloa es mucho más que lo que sale en las noticias. Queremos una carta de presentación para el mundo: que se vea el talento, la innovación, la creatividad y todo lo que se está construyendo aquí. No todo tiene que ser una nota roja. Tech Atlas existe para contar esa otra historia.',
  },
  {
    icon: 'Compass',
    question: '¿Qué es Tech Atlas?',
    answer:
      'Tech Atlas es un directorio abierto del ecosistema tecnológico de Sinaloa. Reúne startups, consultoras, comunidades, empresas y profesionales tech que están construyendo desde nuestro estado.',
  },
  {
    icon: 'UserPlus',
    question: '¿Cómo puedo registrarme?',
    answer:
      'Puedes registrarte de forma gratuita desde la sección "Agregar registro". Solo necesitas llenar un formulario con la información básica de tu startup, consultora, comunidad o perfil profesional.',
  },
  {
    icon: 'Gift',
    question: '¿Es gratuito aparecer en el directorio?',
    answer:
      'Sí, Tech Atlas es completamente gratuito y de código abierto. Cualquier startup, empresa o profesional tech de Sinaloa puede registrarse sin costo.',
  },
  {
    icon: 'Users',
    question: '¿Quién puede registrarse?',
    answer:
      'Startups, consultoras de tecnología, comunidades tech, empresas establecidas y profesionales independientes del sector tecnológico en Sinaloa. Si estás construyendo algo relacionado con tecnología desde nuestro estado, tienes un lugar aquí.',
  },
]

export interface AtlasCategory {
  type: AtlasEntryType
  label: string
  description: string
  icon: string
  slug: string
}

const DISPLAY_CATEGORIES: AtlasEntryType[] = [
  'startup',
  'business',
  'consultory',
  'community',
  'person',
  'research-center',
]

export const ATLAS_CATEGORIES: AtlasCategory[] = DISPLAY_CATEGORIES.map(
  (type) => ({
    type,
    label: ENTRY_TYPE_CONFIG[type].labelPlural,
    description: ENTRY_TYPE_CONFIG[type].description,
    icon: ENTRY_TYPE_CONFIG[type].icon,
    slug: ENTRY_TYPE_CONFIG[type].slug,
  }),
)

export const WHATSAPP_URL =
  'https://chat.whatsapp.com/G9ddxpZ7NUtEOT0M6UzUkY?mode=gi_t'

export const NEWSLETTER = {
  title: 'Newsletter',
  description:
    'Noticias, eventos y proyectos del ecosistema tech de Sinaloa. Un correo al mes.',
  placeholder: 'tu@email.com',
  cta: 'Suscribirme',
  success: 'Listo — te avisaremos cuando haya novedades.',
  error: 'No se pudo suscribir. Intenta de nuevo.',
  invalidEmail: 'Ingresa un email válido.',
  profileLabel: 'Suscribirme al newsletter',
  profileHint: 'Desactivado por defecto. Puedes cancelar cuando quieras.',
  unsubscribeTitle: 'Cancelar suscripción',
  unsubscribeDescription: 'Deja de recibir el newsletter de Tech Atlas.',
  unsubscribeSuccess: 'Tu suscripción fue cancelada.',
  unsubscribeCta: 'Cancelar suscripción',
  unsubscribeEmailPlaceholder: 'tu@email.com',
} as const

export const SOCIAL_LINKS = [
  {
    platform: 'github' as const,
    url: 'https://github.com/molecula-digital/atlas',
    label: 'Github',
  },
]

/** Pre-computed label/icon lookups from ENTRY_TYPE_CONFIG */
export const ENTRY_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(ENTRY_TYPE_CONFIG).map(([k, v]) => [k, v.labelPlural]),
)
export const ENTRY_TYPE_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(ENTRY_TYPE_CONFIG).map(([k, v]) => [k, v.icon]),
)

/** Check whether an entry type is a startup-like organization (startup, business, consultory, research-center) */
export function isStartupLike(type: string): boolean {
  return ['startup', 'business', 'consultory', 'research-center'].includes(type)
}
