import { SectionBlock } from '@/components/layout/SectionBlock'
import {
  Sparkles,
  Compass,
  UserPlus,
  Gift,
  Users,
  HelpCircle,
  ChevronDown,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { FAQS } from '@/config'
import { SectionTitle } from '@/components/ui/SectionTitle'

const FAQ_ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Compass,
  UserPlus,
  Gift,
  Users,
}

export function FaqSection() {
  return (
    <SectionBlock>
      <div className="max-w-3xl mx-auto">
        <SectionTitle
          align="center"
          className="mb-10"
          description="Todo lo que necesitas saber sobre Tech Atlas"
        >
          Preguntas frecuentes
        </SectionTitle>

        <div className="space-y-3">
          {FAQS.map((faq) => {
            const Icon = FAQ_ICON_MAP[faq.icon] ?? HelpCircle
            return (
              <details
                key={faq.question}
                className="group bg-card border border-border rounded-lg"
              >
                <summary className="flex items-center gap-3 cursor-pointer px-5 py-4 font-sans font-semibold text-primary hover:text-accent transition-colors list-none">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-accent/20 bg-accent/10">
                    <Icon className="w-3.5 h-3.5 text-accent" />
                  </span>
                  <span className="flex-1">{faq.question}</span>
                  <ChevronDown className="w-4 h-4 shrink-0 text-muted group-open:rotate-180 transition-transform duration-200" />
                </summary>
                <div className="px-5 pb-4 pl-15 text-sm text-secondary leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            )
          })}
        </div>
      </div>
    </SectionBlock>
  )
}
