import { CalendarDays } from 'lucide-react'

export function EventsHeroSection() {
  return (
    <section id="eventos-hero" className="py-8 px-4">
      <div className="max-w-280 mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
          <CalendarDays className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-mono font-semibold text-accent tracking-wide">
            // DIRECTORIO
          </span>
        </div>

        <h1 className="terminal-title text-4xl md:text-5xl lg:text-hero font-sans font-bold text-primary leading-[1.1] tracking-tight uppercase">
          Eventos tech<br />
          en Sinaloa
        </h1>

        <p className="text-sm md:text-base font-mono text-muted leading-relaxed max-w-125">
          Meetups, talleres, hackatones y conferencias. Conecta con la comunidad
          tecnológica de Sinaloa y no te pierdas ni un solo evento.
        </p>
      </div>
    </section>
  )
}
