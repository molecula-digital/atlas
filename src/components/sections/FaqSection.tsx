import { SectionBlock } from '@/components/layout/SectionBlock'
import { ChevronDown } from 'lucide-react'
import { FAQS } from '@/config'
import { SectionTitle } from '@/components/ui/SectionTitle'

export function FaqSection() {
  return (
    <SectionBlock>
      <div className="max-w-3xl mx-auto">
        <SectionTitle
          className="mb-6"
          description="Sobre el directorio y cómo aparecer en él."
        >
          Preguntas frecuentes
        </SectionTitle>

        <div className="space-y-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group bg-card border border-border rounded-lg"
            >
              <summary className="flex items-center gap-3 cursor-pointer px-4 py-3 text-sm font-sans font-semibold text-primary hover:text-accent transition-colors list-none">
                <span className="flex-1">{faq.question}</span>
                <ChevronDown className="w-4 h-4 shrink-0 text-muted group-open:rotate-180 transition-transform duration-200" />
              </summary>
              <div className="px-4 pb-4 text-sm text-secondary leading-relaxed">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </SectionBlock>
  )
}
