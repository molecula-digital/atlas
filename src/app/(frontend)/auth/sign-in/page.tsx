import type { Metadata } from 'next'
import { LogIn } from 'lucide-react'
import { SignInButton } from '@/components/auth/SignInButton'

export const metadata: Metadata = {
  title: 'Iniciar sesion',
  description: 'Inicia sesion en Tech Atlas para administrar tus registros y publicar empleos.',
  robots: { index: false },
}

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
        <LogIn className="h-5 w-5 text-accent" />
      </div>

      <h1 className="font-sans text-xl font-bold uppercase tracking-tight text-primary">
        Iniciar sesion
      </h1>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Inicia sesion para administrar tus registros y publicar empleos.
      </p>

      <div className="mt-6 w-full">
        <SignInButton />
      </div>

      <p className="mt-6 font-mono text-2xs text-muted">
        Al iniciar sesion, aceptas nuestros terminos de uso.
      </p>
    </div>
  )
}
