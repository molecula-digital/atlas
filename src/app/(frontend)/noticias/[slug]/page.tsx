import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { getNewsBySlug, getPublishedNews } from '@/lib/payload'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SITE_URL } from '@/config'
import { formatDateEs, extractImageUrl } from '@/lib/format'
import { WhatsAppCta } from '@/components/sections/WhatsAppCta'
import { WHATSAPP_SURFACE } from '@/lib/analytics-events'
import { safeJsonLd } from '@/lib/utils'

export async function generateStaticParams() {
  const result = await getPublishedNews()
  return result.docs.map((article) => ({ slug: article.slug as string }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await getNewsBySlug(slug)
  if (!article) return { title: 'Not Found' }
  const canonical = `${SITE_URL}/noticias/${article.slug}`
  const coverUrl = extractImageUrl(article.coverImage)
  return {
    title: article.title as string,
    description: (article.excerpt as string) || undefined,
    alternates: { canonical },
    openGraph: {
      title: article.title as string,
      description: (article.excerpt as string) || undefined,
      url: canonical,
      ...(coverUrl ? { images: [{ url: coverUrl }] } : {}),
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const article = await getNewsBySlug(slug)
  if (!article) notFound()

  const coverUrl = extractImageUrl(article.coverImage)
  const authorName =
    (article.author as { displayName?: string; email: string } | null)
      ?.displayName || (article.author as { email: string } | null)?.email

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: article.title,
            description: article.excerpt || undefined,
            datePublished: article.publishDate,
            author: authorName
              ? { '@type': 'Person', name: authorName }
              : undefined,
            image: coverUrl || undefined,
            url: `${SITE_URL}/noticias/${article.slug}`,
            publisher: {
              '@type': 'Organization',
              name: 'Tech Atlas',
              logo: {
                '@type': 'ImageObject',
                url: `${SITE_URL}/android-chrome-512x512.png`,
              },
            },
          }),
        }}
      />
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Noticias', href: '/noticias' },
          { label: article.title as string },
        ]}
      />

      <div className="max-w-3xl mx-auto">
        {coverUrl && (
          <div className="relative rounded-lg overflow-hidden mb-6 h-64">
            <Image
              src={coverUrl}
              alt={article.title as string}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        <SectionHeading>
          {formatDateEs(article.publishDate as string)}
          {authorName && ` — ${authorName}`}
        </SectionHeading>

        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6">
          {article.title as string}
        </h1>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <RichText data={article.body as any} />
        </div>

        <WhatsAppCta className="mt-8" surface={WHATSAPP_SURFACE.newsDetail} />
      </div>
    </article>
  )
}
