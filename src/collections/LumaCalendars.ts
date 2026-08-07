import type { CollectionConfig } from 'payload'
import { isAdminOrEditor } from '../access/roles'
import { syncLumaCalendar } from '../lib/luma/sync'

const CALENDAR_ID_PATTERN = /^cal-[A-Za-z0-9]+$/

export const LumaCalendars: CollectionConfig = {
  slug: 'luma-calendars',
  labels: { singular: 'Calendario Luma', plural: 'Calendarios Luma' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'calendarId',
      'enabled',
      'lastSyncedAt',
      'lastSyncStatus',
    ],
    listSearchableFields: ['name', 'calendarId'],
    description:
      'Calendarios públicos de Luma a sincronizar con Eventos. Puedes conectar varios; cada uno se importa por su calendar id (cal-…).',
    group: 'Integraciones',
  },
  access: {
    create: isAdminOrEditor,
    read: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  endpoints: [
    {
      path: '/:id/sync',
      method: 'post',
      handler: async (req) => {
        if (!req.user) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }

        const rawId = req.routeParams?.id
        const id = Array.isArray(rawId) ? rawId[0] : rawId
        if (id == null || id === '') {
          return Response.json({ error: 'Missing id' }, { status: 400 })
        }

        const doc = await req.payload.findByID({
          collection: 'luma-calendars',
          id,
          depth: 0,
        })

        if (!doc) {
          return Response.json({ error: 'Not found' }, { status: 404 })
        }

        const result = await syncLumaCalendar(req.payload, {
          id: doc.id,
          name: doc.name,
          calendarId: doc.calendarId,
          enabled: doc.enabled,
          syncPast: doc.syncPast,
          autoPublish: doc.autoPublish,
        })

        return Response.json({ ok: true, result })
      },
    },
  ],
  fields: [
    {
      name: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      admin: {
        description: 'Nombre interno (ej. Gina, Atlas Culiacán).',
      },
    },
    {
      name: 'calendarId',
      label: 'Calendar ID',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'ID público del calendario Luma, p. ej. cal-Pf2My2TlVNz1N89 (sale en la URL /calendar/cal-…).',
      },
      validate: (value: unknown) => {
        if (typeof value !== 'string' || !value.trim()) {
          return 'El Calendar ID es obligatorio'
        }
        if (!CALENDAR_ID_PATTERN.test(value.trim())) {
          return 'Debe verse como cal-… (solo letras y números después del prefijo)'
        }
        return true
      },
      hooks: {
        beforeValidate: [
          ({ value }) => (typeof value === 'string' ? value.trim() : value),
        ],
      },
    },
    {
      name: 'enabled',
      label: 'Activo',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Si está apagado, el cron y la sync global lo omiten.',
      },
    },
    {
      name: 'syncPast',
      label: 'Sincronizar pasados',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'Incluye eventos pasados del calendario además de los próximos.',
      },
    },
    {
      name: 'autoPublish',
      label: 'Publicar automáticamente',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description:
          'Los eventos importados quedan publicados. Desactiva para crear borradores.',
      },
    },
    {
      name: 'lastSyncedAt',
      label: 'Última sincronización',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'lastSyncStatus',
      label: 'Estado de sync',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description:
          'Resumen de la última corrida. Para forzar sync: POST /api/luma-calendars/:id/sync (sesión admin).',
      },
    },
    {
      name: 'notes',
      label: 'Notas',
      type: 'textarea',
      admin: {
        description: 'Notas internas (opcional).',
      },
    },
  ],
}
