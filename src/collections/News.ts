import type { CollectionConfig } from 'payload'
import { isAdminOrEditor, publishedOrAuthenticated } from '../access/roles'
import { revalidateEntry } from './hooks/revalidateOnPublish'
import { getPayloadPreviewUrl } from '../lib/payload-preview'
import { slugify } from '../lib/slug'

export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'Noticia', plural: 'Noticias' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'author', '_status', 'publishDate'],
    listSearchableFields: ['title', 'excerpt'],
    description:
      'Publica artículos, noticias y actualizaciones para la comunidad de Atlas Tech',
    preview: (doc) => getPayloadPreviewUrl('news', doc),
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
            const source = value || siblingData?.title
            return typeof source === 'string' ? slugify(source) : value
          },
        ],
      },
    },
    {
      name: 'author',
      label: 'Autor',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishDate',
      label: 'Fecha de publicación',
      type: 'date',
      required: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'featured',
      label: 'Destacada',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contenido',
          fields: [
            {
              name: 'title',
              label: 'Título',
              type: 'text',
              required: true,
            },
            {
              name: 'excerpt',
              label: 'Extracto',
              type: 'textarea',
              admin: {
                description:
                  'Resumen corto para listados y SEO (máx. 200 caracteres)',
              },
              maxLength: 200,
            },
            {
              name: 'coverImage',
              label: 'Imagen de portada',
              type: 'upload',
              relationTo: 'media',
            },
            {
              name: 'body',
              label: 'Contenido',
              type: 'richText',
              required: true,
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
