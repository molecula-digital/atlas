import { boolean, pgSchema, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const appSchema = pgSchema('app')

export const profiles = appSchema.table(
  'profiles',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    /** Contact email shown on the public profile; defaults to Google signup email. */
    email: text('email'),
    /** Public URL slug (/perfil/[slug]); required when isPublic. */
    slug: text('slug'),
    title: text('title'),
    company: text('company'),
    /** Free-text blurb shown on the public profile. */
    bio: text('bio'),
    phone: text('phone'),
    website: text('website'),
    linkedin: text('linkedin'),
    x: text('x'),
    github: text('github'),
    newsletterEnabled: boolean('newsletter_enabled').notNull().default(false),
    isPublic: boolean('is_public').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('profiles_slug_uidx').on(t.slug)],
)

export type Profile = typeof profiles.$inferSelect
export type NewProfile = typeof profiles.$inferInsert
