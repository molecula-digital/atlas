'use client'

import {
  useRef,
  useState,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import {
  Bold,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
} from 'lucide-react'
import { MarkdownContent } from '@/components/ui/MarkdownContent'
import { cn } from '@/lib/utils'

type MarkdownEditorProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  rows?: number
  hint?: ReactNode
  className?: string
  textareaProps?: Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'onChange' | 'id' | 'placeholder' | 'maxLength' | 'rows'
  >
}

type Mode = 'write' | 'preview'

type WrapOptions = {
  before: string
  after?: string
  placeholder?: string
  block?: boolean
}

const TOOLBAR_TOOLS: Array<{
  label: string
  icon: typeof Bold
  options: WrapOptions
}> = [
  {
    label: 'Negritas',
    icon: Bold,
    options: { before: '**', after: '**', placeholder: 'texto' },
  },
  {
    label: 'Cursiva',
    icon: Italic,
    options: { before: '*', after: '*', placeholder: 'texto' },
  },
  {
    label: 'Encabezado',
    icon: Heading2,
    options: { before: '## ', after: '', placeholder: 'Título', block: true },
  },
  {
    label: 'Lista',
    icon: List,
    options: { before: '- ', after: '', placeholder: 'elemento', block: true },
  },
  {
    label: 'Lista numerada',
    icon: ListOrdered,
    options: { before: '1. ', after: '', placeholder: 'elemento', block: true },
  },
  {
    label: 'Enlace',
    icon: Link2,
    options: { before: '[', after: '](https://)', placeholder: 'enlace' },
  },
]

const MODE_TABS = [
  { id: 'write' as const, label: 'Escribir', icon: Pencil },
  { id: 'preview' as const, label: 'Vista previa', icon: Eye },
]

function applyWrap(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  options: WrapOptions,
): { next: string; start: number; end: number } {
  const { before, after = before, placeholder = '', block = false } = options
  const selected = value.slice(selectionStart, selectionEnd)
  const content = selected || placeholder
  const prefix =
    block && selectionStart > 0 && value[selectionStart - 1] !== '\n'
      ? '\n'
      : ''
  const suffix =
    block && selectionEnd < value.length && value[selectionEnd] !== '\n'
      ? '\n'
      : ''
  const insertion = `${prefix}${before}${content}${after}${suffix}`
  const next =
    value.slice(0, selectionStart) + insertion + value.slice(selectionEnd)
  const start = selectionStart + prefix.length + before.length
  const end = start + content.length
  return { next, start, end }
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 6,
  hint,
  className,
  textareaProps,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<Mode>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wrapSelection = (options: WrapOptions) => {
    const el = textareaRef.current
    if (!el) {
      onChange(`${options.before}${value}${options.after ?? options.before}`)
      return
    }

    const { next, start, end } = applyWrap(
      value,
      el.selectionStart,
      el.selectionEnd,
      options,
    )
    if (maxLength != null && next.length > maxLength) return

    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start, end)
    })
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border bg-elevated/50 px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {MODE_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-2xs font-mono transition-colors',
                  mode === tab.id
                    ? 'bg-card text-primary border border-border shadow-sm'
                    : 'text-muted hover:text-secondary border border-transparent',
                )}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {mode === 'write' && (
          <div className="flex items-center gap-0.5">
            {TOOLBAR_TOOLS.map((tool) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.label}
                  type="button"
                  title={tool.label}
                  aria-label={tool.label}
                  onClick={() => wrapSelection(tool.options)}
                  className="inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-muted transition-colors hover:bg-card hover:text-primary"
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {mode === 'write' ? (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={rows}
          className="w-full min-h-36 resize-y border-0 bg-transparent px-3 py-2.5 text-primary font-mono text-base sm:text-sm leading-relaxed placeholder:text-muted/50 focus:outline-hidden"
          {...textareaProps}
        />
      ) : (
        <div className="min-h-36 px-3 py-2.5">
          {value.trim() ? (
            <MarkdownContent>{value}</MarkdownContent>
          ) : (
            <p className="text-sm text-muted font-mono">
              Nada que previsualizar aún.
            </p>
          )}
        </div>
      )}

      {(hint != null || maxLength != null) && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-1.5 text-2xs text-muted font-mono">
          <span>{hint}</span>
          {maxLength != null && (
            <span
              className={value.length >= maxLength ? 'text-accent' : undefined}
            >
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
