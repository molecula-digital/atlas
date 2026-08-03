'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { buttonVariants } from '@/components/ui/button-variants'

/**
 * Edit shortcut shown only to the person a public profile belongs to.
 *
 * The session is read on the client on purpose: /personas/[slug] is statically
 * generated, and a server-side session check would make the whole page dynamic.
 * Everyone else renders nothing.
 */
export function ProfileEditButton({ userId }: { userId: string }) {
  const { data: session } = useSession()

  // The session can resolve from its cookie cache before React hydrates, and
  // rendering the button on that first pass disagrees with the server HTML.
  // Staying empty until after hydration keeps the two in step.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!hydrated || session?.user?.id !== userId) return null

  return (
    <Link
      href="/dashboard/profile"
      className={buttonVariants({
        variant: 'neutral',
        size: 'sm',
        className: 'shrink-0',
      })}
    >
      <Pencil className="w-3.5 h-3.5" />
      Editar perfil
    </Link>
  )
}
