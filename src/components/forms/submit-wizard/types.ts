import {
  Rocket,
  LayoutGrid,
  FileText,
  SlidersHorizontal,
  Globe,
  Send,
} from 'lucide-react'
import { ENTRY_TYPE_ICON_MAP } from '@/lib/icons'
import {
  ENTRY_TYPES as ALL_ENTRY_TYPES,
  ENTRY_TYPE_CONFIG,
  type AtlasEntryType,
} from '@/config'
import type { WizardState } from './useWizardState'

export type EntryType = AtlasEntryType

export interface CityOption {
  id: string
  name: string
}

export interface StepProps {
  state: WizardState
  setField: (field: string, value: unknown) => void
}

export const ENTRY_TYPES = ALL_ENTRY_TYPES.map((type) => ({
  type,
  label: ENTRY_TYPE_CONFIG[type].label,
  desc: ENTRY_TYPE_CONFIG[type].description,
  icon: ENTRY_TYPE_ICON_MAP[ENTRY_TYPE_CONFIG[type].icon] || Rocket,
}))

export const STEPS = [
  { label: 'Tipo', icon: LayoutGrid },
  { label: 'Información', icon: FileText },
  { label: 'Detalles', icon: SlidersHorizontal },
  { label: 'Enlaces', icon: Globe },
  { label: 'Envío', icon: Send },
]

export const TYPE_COPY: Record<
  EntryType,
  {
    entityName: string
    namePlaceholder: string
    taglinePlaceholder: string
    descriptionPlaceholder: string
    successTitle: string
    successMessage: string
  }
> = {
  startup: {
    entityName: 'startup',
    namePlaceholder: 'Nombre de la startup',
    taglinePlaceholder: 'Una frase corta que describe tu startup',
    descriptionPlaceholder: 'Describe tu startup en detalle',
    successTitle: 'Startup enviada',
    successMessage:
      'Tu startup ha sido recibida. La revisaremos y la agregaremos al directorio pronto.',
  },
  business: {
    entityName: 'empresa',
    namePlaceholder: 'Nombre de la empresa',
    taglinePlaceholder: 'Una frase corta que describe tu empresa',
    descriptionPlaceholder: 'Describe tu empresa en detalle',
    successTitle: 'Empresa enviada',
    successMessage:
      'Tu empresa ha sido recibida. La revisaremos y la agregaremos al directorio pronto.',
  },
  consultory: {
    entityName: 'consultoría',
    namePlaceholder: 'Nombre de la consultoría',
    taglinePlaceholder: 'Una frase corta que describe tu consultoría',
    descriptionPlaceholder: 'Describe tu consultoría en detalle',
    successTitle: 'Consultoría enviada',
    successMessage:
      'Tu consultoría ha sido recibida. La revisaremos y la agregaremos al directorio pronto.',
  },
  'research-center': {
    entityName: 'centro de investigación',
    namePlaceholder: 'Nombre del centro de investigación',
    taglinePlaceholder: 'Una frase corta que describe el centro',
    descriptionPlaceholder:
      'Describe el centro de investigación, sus líneas de investigación y actividades',
    successTitle: '¡Centro de investigación enviado!',
    successMessage:
      'Tu centro de investigación ha sido recibido. Lo revisaremos y lo agregaremos al directorio pronto.',
  },
  community: {
    entityName: 'comunidad',
    namePlaceholder: 'Nombre de la comunidad',
    taglinePlaceholder: 'Una frase corta que describe tu comunidad',
    descriptionPlaceholder: 'Describe tu comunidad en detalle',
    successTitle: 'Comunidad enviada',
    successMessage:
      'Tu comunidad ha sido recibida. La revisaremos y la agregaremos al directorio pronto.',
  },
  person: {
    entityName: 'perfil',
    namePlaceholder: 'Tu nombre completo',
    taglinePlaceholder: 'Tu título profesional o especialidad',
    descriptionPlaceholder: 'Cuéntanos sobre ti, tu experiencia y lo que haces',
    successTitle: 'Perfil enviado',
    successMessage:
      'Tu perfil ha sido recibido. Lo revisaremos y lo agregaremos al directorio pronto.',
  },
}
