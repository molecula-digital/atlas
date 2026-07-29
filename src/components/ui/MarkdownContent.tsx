import Markdown from 'react-markdown'
import { cn } from '@/lib/utils'

type MarkdownContentProps = {
  children: string
  className?: string
}

/** Shared markdown renderer for public content (profiles, directory entries). */
export function MarkdownContent({ children, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-p:text-secondary prose-li:text-secondary prose-strong:text-primary',
        'prose-headings:text-primary prose-a:text-accent prose-a:no-underline hover:prose-a:underline',
        'prose-p:leading-relaxed prose-p:my-2 prose-ul:my-2 prose-ol:my-2',
        'prose-headings:font-sans prose-headings:font-semibold',
        'prose-h1:text-lg prose-h2:text-base prose-h3:text-sm',
        className,
      )}
    >
      <Markdown
        components={{
          a: ({ href, children: linkChildren }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {linkChildren}
            </a>
          ),
        }}
      >
        {children}
      </Markdown>
    </div>
  )
}
