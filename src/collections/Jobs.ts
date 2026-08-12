import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrAuthenticated } from '../access/roles'
import {
  revalidateEntry,
  revalidateEntryDelete,
} from './hooks/revalidateOnPublish'
import { CITY_SELECT_OPTIONS } from '../config'
import { getPayloadPreviewUrl } from '../lib/payload-preview'
import { slugify } from '../lib/slug'

export const Jobs: CollectionConfig = {
  slug: 'jobs',
  labels: { singular: 'Empleo', plural: 'Empleos' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'modality', '_status', 'expiresAt'],
    listSearchableFields: ['title', 'compensation'],
    description: 'Publica ofertas de empleo y oportunidades laborales',
    preview: (doc) => getPayloadPreviewUrl('jobs', doc),
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
    afterDelete: [revalidateEntryDelete],
  },
  fields: [
    {
      name: 'title',
      label: 'Título',
      type: 'text',
      required: true,
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
          'Se genera a partir del título si se deja vacío. Solo usa letras sin acentos, números y guiones.',
      },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            if (!value && siblingData?.title) {
              const base = slugify(siblingData.title as string)
              // Append timestamp to avoid slug collisions (jobs can share titles)
              return `${base}-${Date.now().toString(36)}`
            }
            return typeof value === 'string' ? slugify(value) : value
          },
        ],
      },
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'richText',
      required: true,
    },
    {
      name: 'type',
      label: 'Tipo',
      type: 'select',
      required: true,
      options: [
        { label: 'Tiempo completo', value: 'full-time' },
        { label: 'Medio tiempo', value: 'part-time' },
        { label: 'Contrato', value: 'contract' },
        { label: 'Freelance', value: 'freelance' },
        { label: 'Voluntariado', value: 'volunteer' },
      ],
    },
    {
      name: 'modality',
      label: 'Modalidad',
      type: 'select',
      required: true,
      options: [
        { label: 'Remoto', value: 'remote' },
        { label: 'Presencial', value: 'in-person' },
        { label: 'Híbrido', value: 'hybrid' },
      ],
    },
    {
      name: 'city',
      label: 'Ciudad',
      type: 'select',
      options: CITY_SELECT_OPTIONS,
      admin: {
        condition: (_, siblingData) =>
          ['in-person', 'hybrid'].includes(siblingData.modality as string),
      },
    },
    {
      name: 'compensation',
      label: 'Compensación',
      type: 'text',
      admin: {
        description: 'Formato libre: "$15k/mes", "Voluntario", "Equity", etc.',
      },
    },
    {
      name: 'tags',
      label: 'Etiquetas',
      type: 'array',
      maxRows: 10,
      fields: [
        { name: 'tag', label: 'Etiqueta', type: 'text', required: true },
      ],
    },
    {
      name: 'contactUrl',
      label: 'URL de contacto',
      type: 'text',
      required: true,
      admin: {
        description: 'URL o correo para que los postulantes se comuniquen',
      },
    },
    {
      name: 'postedBy',
      label: 'Publicado por',
      type: 'text',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'ID de usuario better-auth del publicador',
      },
    },
    {
      name: 'moderationNote',
      label: 'Nota de moderación',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Razón de rechazo o retroalimentación para el publicador',
        condition: (data) => data._status === 'draft',
      },
    },
    {
      name: 'entry',
      label: 'Empresa',
      type: 'relationship',
      relationTo: 'entries',
      admin: {
        position: 'sidebar',
        description:
          'Empresa u organización que publicó este empleo (opcional)',
      },
    },
    {
      name: 'expiresAt',
      label: 'Fecha de expiración',
      type: 'date',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Fecha de expiración de la oferta (por defecto: 30 días)',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (!value) {
              const thirtyDays = new Date()
              thirtyDays.setDate(thirtyDays.getDate() + 30)
              return thirtyDays.toISOString()
            }
            return value
          },
        ],
      },
    },
  ],
}
