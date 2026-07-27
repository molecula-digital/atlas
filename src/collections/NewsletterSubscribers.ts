import type { CollectionConfig } from 'payload'
import { randomUUID } from 'crypto'
import { isAdminOrEditor } from '../access/roles'
import { buildNewsletterCsv } from '../lib/newsletter-csv'

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  labels: { singular: 'Suscriptor', plural: 'Suscriptores newsletter' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'status', 'source', 'subscribedAt'],
    listSearchableFields: ['email'],
    description:
      'Emails anónimos (sin cuenta Atlas). Exportar CSV (incluye también perfiles con newsletter activo): /api/newsletter-subscribers/export',
  },
  access: {
    create: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  endpoints: [
    {
      path: '/export',
      method: 'get',
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        const csv = await buildNewsletterCsv(req.payload)
        const filename = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`

        return new Response(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        })
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (typeof data.email === 'string') {
          data.email = data.email.trim().toLowerCase()
        }
        if (!data.unsubscribeToken) {
          data.unsubscribeToken = randomUUID()
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'email',
      label: 'Email',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      label: 'Estado',
      type: 'select',
      required: true,
      defaultValue: 'subscribed',
      options: [
        { label: 'Suscrito', value: 'subscribed' },
        { label: 'Cancelado', value: 'unsubscribed' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'unsubscribeToken',
      label: 'Token de baja',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Se genera automáticamente. Usar en enlaces de baja del newsletter.',
      },
    },
    {
      name: 'source',
      label: 'Origen',
      type: 'select',
      required: true,
      defaultValue: 'manual',
      options: [
        { label: 'Homepage', value: 'homepage' },
        { label: 'Footer', value: 'footer' },
        { label: 'Manual', value: 'manual' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'subscribedAt',
      label: 'Suscrito el',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
    {
      name: 'unsubscribedAt',
      label: 'Cancelado el',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        position: 'sidebar',
      },
    },
  ],
}
