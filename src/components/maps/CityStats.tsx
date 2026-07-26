import React from "react";
import { btn } from "@/components/ui/button-styles";
import { ENTRY_TYPE_CONFIG } from "@/config";
import type { AtlasEntryType } from "@/config";
import {
  MapPin,
  Rocket,
  Users,
  Briefcase,
  Microscope,
  User,
  ArrowRight,
  Plus,
  X,
} from "lucide-react";

type TypeCounts = Record<AtlasEntryType, number>;

interface CityStatsProps {
  selectedData: {
    name: string;
    id: string;
    stats: TypeCounts;
    total: number;
  } | null;
  onClose: () => void;
}

export default function CityStats({ selectedData, onClose }: CityStatsProps) {
  return (
    <div
      data-stats-panel
      className="bg-card border border-border rounded-lg p-4 transition-all duration-200"
    >
      {!selectedData && <StatsPlaceholder />}
      {selectedData && selectedData.total > 0 && (
        <StatsContent
          name={selectedData.name}
          id={selectedData.id}
          stats={selectedData.stats}
          onClose={onClose}
        />
      )}
      {selectedData && selectedData.total === 0 && (
        <StatsEmpty name={selectedData.name} onClose={onClose} />
      )}
    </div>
  );
}

function StatsPlaceholder() {
  return (
    <div className="flex items-center gap-3 py-3 justify-center text-muted">
      <MapPin className="w-5 h-5" />
      <span className="text-sm font-mono">
        Selecciona un municipio de la lista
      </span>
    </div>
  );
}

function StatsContent({
  name,
  id,
  stats,
  onClose,
}: {
  name: string;
  id: string;
  stats: TypeCounts;
  onClose: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-sans font-bold text-primary text-lg">{name}</h3>
        <button
          type="button"
          onClick={onClose}
          className={btn({ variant: "ghost", size: "md", icon: true })}
          aria-label="Cerrar resumen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Rocket className="w-4 h-4 text-accent shrink-0" />}
          value={(stats.startup || 0) + (stats.business || 0)}
          label={ENTRY_TYPE_CONFIG.startup.labelPlural}
        />
        <StatCard
          icon={<Users className="w-4 h-4 text-accent shrink-0" />}
          value={stats.community || 0}
          label={ENTRY_TYPE_CONFIG.community.labelPlural}
        />
        <StatCard
          icon={<Briefcase className="w-4 h-4 text-accent shrink-0" />}
          value={stats.consultory || 0}
          label={ENTRY_TYPE_CONFIG.consultory.labelPlural}
        />
        <StatCard
          icon={<Microscope className="w-4 h-4 text-accent shrink-0" />}
          value={stats['research-center'] || 0}
          label={ENTRY_TYPE_CONFIG['research-center'].labelPlural}
        />
        <StatCard
          icon={<User className="w-4 h-4 text-accent shrink-0" />}
          value={stats.person || 0}
          label={ENTRY_TYPE_CONFIG.person.labelPlural}
        />
      </div>
      <a
        href={`/directorio/${id}`}
        className={btn({ variant: 'accent', size: 'md' }, 'mt-3 w-full')}
      >
        VER COMUNIDAD
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-elevated rounded-lg">
      {icon}
      <div>
        <div className="text-xl font-mono font-bold text-primary">{value}</div>
        <div className="text-2xs text-muted font-mono uppercase tracking-wider">
          {label}
        </div>
      </div>
    </div>
  );
}

function StatsEmpty({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-sans font-bold text-primary text-lg">{name}</h3>
        <button
          type="button"
          onClick={onClose}
          className={btn({ variant: "ghost", size: "md", icon: true })}
          aria-label="Cerrar resumen"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col items-center text-center py-4 space-y-3">
        <div className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center">
          <MapPin className="w-5 h-5 text-muted" />
        </div>
        <div>
          <p className="text-sm text-primary font-medium">
            Aún no hay registros
          </p>
          <p className="text-xs text-muted mt-1">
            Sé el primero en representar este municipio
          </p>
        </div>
        <a
          href="/dashboard"
          className={btn({ variant: 'accent', size: 'md' }, 'w-full border-dashed')}
        >
          <Plus className="w-3.5 h-3.5" />
          REGISTRAR PERFIL/STARTUP
        </a>
      </div>
    </div>
  );
}
