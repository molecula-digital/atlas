'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession } from '@/lib/auth-client'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { ProfileForm } from './profile/ProfileForm'
import { MyEntries } from '@/components/dashboard/MyEntries'
import { MyJobs } from '@/components/dashboard/MyJobs'
import { Plus, Briefcase, User, FolderKanban } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { btn } from '@/components/ui/button-styles'

type Tab = 'profile' | 'projects' | 'jobs'

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Mi Perfil', icon: User },
  { id: 'projects', label: 'Mis Registros', icon: FolderKanban },
  { id: 'jobs', label: 'Mis Empleos', icon: Briefcase },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function getMemberSince(createdAt?: Date | string): string {
  if (!createdAt) return ''
  const date = new Date(createdAt)
  return date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

function DashboardContent() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const user = session?.user
  const firstName = user?.name?.split(' ')[0] || 'Usuario'

  return (
    <section>
      <div className="max-w-4xl mx-auto">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm shrink-0">
              {user?.name ? getInitials(user.name) : '?'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Hola, {firstName}</h1>
              <p className="text-xs font-mono text-muted">
                {user?.email}
                {user?.createdAt && ` · Miembro desde ${getMemberSince(user.createdAt)}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/entries/new"
              className={btn({ variant: "accent", size: "md" })}
            >
              <Plus className="w-3 h-3" /> Agregar registro
            </Link>
            <Link
              href="/dashboard/jobs/new"
              className={btn({ size: "md" })}
            >
              <Briefcase className="w-3 h-3" /> Publicar empleo
            </Link>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 p-1 bg-elevated rounded-lg border border-border w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-card text-primary shadow-sm border border-border'
                    : 'text-muted hover:text-secondary border border-transparent'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'profile' && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-card border border-border rounded-lg p-6">
              <ProfileForm />
            </div>
          </div>
        )}
        {activeTab === 'projects' && <MyEntries />}
        {activeTab === 'jobs' && <MyJobs />}
      </div>
    </section>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
