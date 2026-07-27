import type { ReactNode } from 'react'

interface TronPanelProps {
  children: ReactNode
}

/** Dark neon grid panel used by community / newsletter CTAs. */
export function TronPanel({ children }: TronPanelProps) {
  return (
    <div
      className="tron-panel relative flex min-h-44 items-center justify-center overflow-hidden border-b border-accent/25 bg-[#050806] md:min-h-full md:border-b-0 md:border-r"
      aria-hidden="true"
    >
      <div className="tron-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border border-accent/50 bg-[#0a120c]">
        {children}
      </div>
    </div>
  )
}
