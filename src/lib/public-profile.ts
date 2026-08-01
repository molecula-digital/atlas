import { and, asc, desc, eq, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema/profiles'
import { user } from '@/db/schema/auth'
import { toPublicMediaUrl } from '@/lib/media-url'

export type PublicProfile = {
  userId: string
  slug: string
  name: string
  photo: string | null
  title: string | null
  company: string | null
  bio: string | null
  website: string | null
  linkedin: string | null
  x: string | null
  github: string | null
  email: string | null
  createdAt: Date
  updatedAt: Date
}

/** Returns a public profile by slug, or null if missing / not public. */
export async function getPublicProfileBySlug(slug: string): Promise<PublicProfile | null> {
  const [row] = await db
    .select({
      userId: profiles.userId,
      slug: profiles.slug,
      name: user.name,
      photo: user.image,
      title: profiles.title,
      company: profiles.company,
      bio: profiles.bio,
      website: profiles.website,
      linkedin: profiles.linkedin,
      x: profiles.x,
      github: profiles.github,
      email: profiles.email,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .innerJoin(user, eq(profiles.userId, user.id))
    .where(and(eq(profiles.slug, slug), eq(profiles.isPublic, true)))
    .limit(1)

  if (!row?.slug) return null

  return {
    userId: row.userId,
    slug: row.slug,
    name: row.name,
    photo: toPublicMediaUrl(row.photo),
    title: row.title,
    company: row.company,
    bio: row.bio,
    website: row.website,
    linkedin: row.linkedin,
    x: row.x,
    github: row.github,
    email: row.email,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export type PublicProfileSort = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'

/** All public user profiles for the /personas directory (independent of Payload person entries). */
export async function listPublicProfiles(
  sort: PublicProfileSort = 'date-desc',
): Promise<PublicProfile[]> {
  const orderBy =
    sort === 'name-asc'
      ? asc(user.name)
      : sort === 'name-desc'
        ? desc(user.name)
        : sort === 'date-asc'
          ? asc(profiles.createdAt)
          : desc(profiles.updatedAt)

  const rows = await db
    .select({
      userId: profiles.userId,
      slug: profiles.slug,
      name: user.name,
      photo: user.image,
      title: profiles.title,
      company: profiles.company,
      bio: profiles.bio,
      website: profiles.website,
      linkedin: profiles.linkedin,
      x: profiles.x,
      github: profiles.github,
      email: profiles.email,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
    })
    .from(profiles)
    .innerJoin(user, eq(profiles.userId, user.id))
    .where(and(eq(profiles.isPublic, true), isNotNull(profiles.slug)))
    .orderBy(orderBy)

  return rows
    .filter((row): row is typeof row & { slug: string } => Boolean(row.slug))
    .map((row) => ({
      userId: row.userId,
      slug: row.slug,
      name: row.name,
      photo: toPublicMediaUrl(row.photo),
      title: row.title,
      company: row.company,
      bio: row.bio,
      website: row.website,
      linkedin: row.linkedin,
      x: row.x,
      github: row.github,
      email: row.email,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
}

/**
 * How many public user profiles the /personas directory will show.
 *
 * Must stay in step with the filter in listPublicProfiles — the directory merges
 * these into the `person` type, so counts that ignore them under-report.
 */
export async function countPublicProfiles(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profiles)
    .innerJoin(user, eq(profiles.userId, user.id))
    .where(and(eq(profiles.isPublic, true), isNotNull(profiles.slug)))

  return row?.count ?? 0
}

/** Shape compatible with directory EntryCard rendering. */
export function publicProfileToDirectoryItem(profile: PublicProfile) {
  const tagline = [profile.title, profile.company].filter(Boolean).join(' · ') || null
  return {
    id: `user-profile:${profile.userId}`,
    kind: 'user-profile' as const,
    userId: profile.userId,
    slug: profile.slug,
    name: profile.name,
    tagline,
    entryType: 'person' as const,
    logo: profile.photo
      ? { url: profile.photo, alt: profile.name }
      : null,
    coverImage: null,
    city: 'global',
    tags: [],
    publishDate: profile.updatedAt.toISOString(),
    href: `/personas/${profile.slug}`,
  }
}
