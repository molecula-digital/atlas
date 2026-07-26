import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrAuthenticated } from '../access/roles'
import { revalidateEntry } from './hooks/revalidateOnPublish'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Evento', plural: 'Eventos' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'modality', 'organizer', '_status'],
    listSearchableFields: ['title', 'organizer', 'location'],
    description: 'Agenda y promueve eventos y meetups de la comunidad',
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
        description: 'Se genera automáticamente a partir del título y la fecha si se deja vacío.',
      },
      hooks: {
        beforeValidate: [
          ({ value, siblingData }) => {
            if (!value && siblingData?.title) {
              const base = (siblingData.title as string)
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
              const datePart = ((siblingData.date as string) || '').split('T')[0]
              return datePart ? `${base}-${datePart}` : base
            }
            return value
          },
        ],
      },
    },
    {
      name: 'organizer',
      label: 'Organizador',
      type: 'text',
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'richText',
    },
    {
      name: 'date',
      label: 'Fecha',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startTime',
          label: 'Hora de inicio',
          type: 'date',
          admin: { width: '50%', date: { pickerAppearance: 'timeOnly', displayFormat: 'hh:mm a' } },
        },
        {
          name: 'endTime',
          label: 'Hora de fin',
          type: 'date',
          admin: { width: '50%', date: { pickerAppearance: 'timeOnly', displayFormat: 'hh:mm a' } },
        },
      ],
    },
    {
      name: 'location',
      label: 'Ubicación',
      type: 'text',
      admin: { description: 'Nombre del lugar o dirección' },
    },
    {
      name: 'mapsUrl',
      label: 'Enlace de Google Maps',
      type: 'text',
      admin: { description: 'Link de Google Maps' },
    },
    {
      name: 'modality',
      label: 'Modalidad',
      type: 'select',
      required: true,
      defaultValue: 'in-person',
      options: [
        { label: 'Presencial', value: 'in-person' },
        { label: 'En línea', value: 'online' },
        { label: 'Híbrido', value: 'hybrid' },
      ],
    },
    {
      name: 'meetLink',
      label: 'Enlace de videollamada',
      type: 'text',
      admin: {
        description: 'Link de Zoom, Meet, etc.',
        condition: (_, siblingData) =>
          ['online', 'hybrid'].includes(siblingData.modality as string),
      },
    },
    {
      name: 'url',
      label: 'URL del evento',
      type: 'text',
      admin: { description: 'Página del evento' },
    },
    {
      name: 'registerUrl',
      label: 'Enlace de registro',
      type: 'text',
      admin: { description: 'Link de registro' },
    },
    {
      name: 'image',
      label: 'Imagen',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
