import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrAuthenticated } from '../access/roles'
import { revalidateEntry } from './hooks/revalidateOnPublish'
import {
  CITY_SELECT_OPTIONS,
  ENTRY_TYPES,
  STAGE_OPTIONS,
  TEAM_SIZE_OPTIONS,
  SECTOR_OPTIONS,
  MEETUP_FREQUENCY_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
  isStartupLike as isStartupLikeType,
} from '../config'
import { getPayloadPreviewUrl } from '../lib/payload-preview'

const entryTypeOptions = ENTRY_TYPES.map((t) => ({
  label: t.charAt(0).toUpperCase() + t.slice(1),
  value: t,
}))

const isStartupLike = (siblingData: Record<string, unknown>) =>
  isStartupLikeType(siblingData.entryType as string)

const isCommunity = (siblingData: Record<string, unknown>) =>
  siblingData.entryType === 'community'

const isPerson = (siblingData: Record<string, unknown>) =>
  siblingData.entryType === 'person'

export const Entries: CollectionConfig = {
  slug: 'entries',
  labels: { singular: 'Registro', plural: 'Registros' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'entryType', 'city', '_status', 'updatedAt'],
    listSearchableFields: ['name', 'tagline', 'tags'],
    description:
      'Gestiona startups, empresas, comunidades y personas en el directorio',
    preview: (doc) => getPayloadPreviewUrl('entries', doc),
  },
  access: {
    create: isAdminOrEditor,
    read: publishedOrAuthenticated,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  versions: {
    drafts: {
      autosave: false,
    },
  },
  hooks: {
    afterChange: [revalidateEntry],
  },
  fields: [
    // --- Sidebar fields ---
    {
      name: 'entryType',
      label: 'Tipo de registro',
      type: 'select',
      required: true,
      options: entryTypeOptions,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description:
          'Se genera automáticamente a partir del nombre si se deja vacío.',
      },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            if (!value && siblingData?.name) {
              return (siblingData.name as string)
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'city',
      label: 'Ciudad',
      type: 'select',
      required: true,
      options: CITY_SELECT_OPTIONS,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'state',
      label: 'Estado',
      type: 'text',
      defaultValue: 'Sinaloa',
      admin: { position: 'sidebar' },
    },
    {
      name: 'country',
      label: 'País',
      type: 'text',
      defaultValue: 'México',
      admin: { position: 'sidebar' },
    },
    {
      name: 'verified',
      label: 'Verificado',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      label: 'Destacado',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishDate',
      label: 'Fecha de publicación',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'owner',
      label: 'Propietario',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'ID de usuario better-auth del propietario',
      },
    },
    {
      name: 'moderationNote',
      label: 'Nota de moderación',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Razón de rechazo o retroalimentación para el propietario',
        condition: (data) => data._status === 'draft',
      },
    },
    // --- Tabs ---
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General',
          fields: [
            {
              name: 'name',
              label: 'Nombre',
              type: 'text',
              required: true,
            },
            {
              name: 'tagline',
              label: 'Eslogan',
              type: 'text',
            },
            {
              name: 'logo',
              label: 'Logo',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'coverImage',
              label: 'Imagen de portada',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'body',
              label: 'Descripción',
              type: 'textarea',
            },
          ],
        },
        {
          label: 'Enlaces',
          fields: [
            {
              name: 'website',
              label: 'Sitio web',
              type: 'text',
              admin: { description: 'URL completa (https://...)' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'x',
                  label: 'X / Twitter',
                  type: 'text',
                  admin: { width: '50%', description: 'Handle de X/Twitter' },
                },
                {
                  name: 'instagram',
                  label: 'Instagram',
                  type: 'text',
                  admin: { width: '50%', description: 'Handle de Instagram' },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'linkedin',
                  label: 'LinkedIn',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'URL o handle de LinkedIn',
                  },
                },
                {
                  name: 'github',
                  label: 'GitHub',
                  type: 'text',
                  admin: { width: '50%', description: 'Usuario de GitHub' },
                },
              ],
            },
            {
              name: 'youtube',
              label: 'YouTube',
              type: 'text',
              admin: { description: 'URL del canal de YouTube' },
            },
          ],
        },
        {
          label: 'Detalles',
          fields: [
            // --- Startup / Business / Consultory fields ---
            {
              name: 'foundedYear',
              label: 'Año de fundación',
              type: 'number',
              admin: {
                condition: (_, siblingData) => isStartupLike(siblingData),
              },
            },
            {
              name: 'stage',
              label: 'Etapa',
              type: 'select',
              options: STAGE_OPTIONS,
              admin: {
                condition: (_, siblingData) => isStartupLike(siblingData),
              },
            },
            {
              name: 'teamSize',
              label: 'Tamaño del equipo',
              type: 'select',
              options: TEAM_SIZE_OPTIONS,
              admin: {
                condition: (_, siblingData) => isStartupLike(siblingData),
              },
            },
            {
              name: 'sector',
              label: 'Sector',
              type: 'select',
              options: SECTOR_OPTIONS,
              admin: {
                condition: (_, siblingData) => isStartupLike(siblingData),
              },
            },
            {
              name: 'technologies',
              label: 'Tecnologías',
              type: 'array',
              admin: {
                condition: (_, siblingData) => isStartupLike(siblingData),
              },
              fields: [
                {
                  name: 'technology',
                  label: 'Tecnología',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'hiringUrl',
              label: 'URL de contratación',
              type: 'text',
              admin: {
                condition: (_, siblingData) => isStartupLike(siblingData),
              },
            },
            {
              name: 'businessModel',
              label: 'Modelo de negocio',
              type: 'select',
              options: BUSINESS_MODEL_OPTIONS,
              admin: {
                condition: (_, siblingData) => isStartupLike(siblingData),
              },
            },
            // --- Community fields ---
            {
              name: 'memberCount',
              label: 'Número de miembros',
              type: 'number',
              admin: {
                condition: (_, siblingData) => isCommunity(siblingData),
              },
            },
            {
              name: 'meetupFrequency',
              label: 'Frecuencia de meetups',
              type: 'select',
              options: MEETUP_FREQUENCY_OPTIONS,
              admin: {
                condition: (_, siblingData) => isCommunity(siblingData),
              },
            },
            {
              name: 'discord',
              label: 'Discord',
              type: 'text',
              admin: {
                condition: (_, siblingData) => isCommunity(siblingData),
              },
            },
            {
              name: 'telegram',
              label: 'Telegram',
              type: 'text',
              admin: {
                condition: (_, siblingData) => isCommunity(siblingData),
              },
            },
            // --- Person fields ---
            {
              name: 'role',
              label: 'Rol',
              type: 'text',
              admin: {
                condition: (_, siblingData) => isPerson(siblingData),
              },
            },
            {
              name: 'company',
              label: 'Empresa',
              type: 'text',
              admin: {
                condition: (_, siblingData) => isPerson(siblingData),
              },
            },
            {
              name: 'availableForHire',
              label: 'Disponible para contratar',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                condition: (_, siblingData) => isPerson(siblingData),
              },
            },
            {
              name: 'availableForMentoring',
              label: 'Disponible para mentoría',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                condition: (_, siblingData) => isPerson(siblingData),
              },
            },
            {
              name: 'email',
              label: 'Correo electrónico',
              type: 'email',
              admin: {
                condition: (_, siblingData) => isPerson(siblingData),
              },
            },
            {
              name: 'portfolio',
              label: 'Portafolio',
              type: 'text',
              admin: {
                condition: (_, siblingData) => isPerson(siblingData),
                description: 'URL del portafolio',
              },
            },
          ],
        },
        {
          label: 'Etiquetas',
          fields: [
            {
              name: 'tags',
              label: 'Etiquetas',
              type: 'array',
              maxRows: 10,
              fields: [
                {
                  name: 'tag',
                  label: 'Etiqueta',
                  type: 'text',
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
