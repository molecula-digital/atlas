'use client'

import Image from 'next/image'
import Link from 'next/link'
import { PaginatedView } from '@/components/ui/PaginatedView'
import { NewsCardSkeleton } from '@/components/entries/NewsCardSkeleton'
import { formatDateEs, extractImageUrl } from '@/lib/format'
import type { News } from '@/payload-types'

function NewsCard({ article }: { article: News }) {
  const coverUrl = extractImageUrl(article.coverImage)
  return (
    <Link
      href={`/noticias/${article.slug}`}
      className="block bg-card border border-border rounded-lg overflow-hidden hover:border-accent/50 transition-colors"
    >
      <div className="flex flex-col sm:flex-row">
        {coverUrl && (
          <div className="relative sm:w-48 h-40 sm:h-auto flex-shrink-0">
            <Image
              src={coverUrl}
              alt={article.title as string}
              fill
              className="object-cover"
              sizes="192px"
            />
          </div>
        )}
        <div className="p-4 flex-1">
          <p className="text-2xs font-mono text-muted mb-1">
            {formatDateEs(article.publishDate as string)}
          </p>
          <h2 className="text-lg font-semibold text-primary mb-1">
            {article.title as string}
          </h2>
          {article.excerpt && (
            <p className="text-sm text-secondary line-clamp-2">
              {article.excerpt as string}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function NoticiasContent() {
  return (
    <PaginatedView<News>
      endpoint="/api/directory/news"
      renderItem={(article) => <NewsCard article={article} />}
      renderSkeleton={() => <NewsCardSkeleton />}
      layout="list"
      pageSize={12}
      emptyMessage="No hay noticias publicadas aún."
    />
  )
}
