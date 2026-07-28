import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { MapPin, Search, ChevronsDown, Plus } from "lucide-react";
import { buttonVariants } from '@/components/ui/button-variants';

interface City {
  id: string;
  name: string;
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

interface CityListProps {
  cities: City[];
  cityCounts: Record<string, number>;
  selectedCity: string | null;
  onSelectCity: (id: string) => void;
}

export default function CityList({
  cities,
  cityCounts,
  selectedCity,
  onSelectCity,
}: CityListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Sort cities: ones with entries first, then alphabetically
  const { withRecords, withoutRecords } = useMemo(() => {
    const sorted = [...cities].sort((a, b) => {
      const countA = cityCounts[a.id] || 0;
      const countB = cityCounts[b.id] || 0;
      if (countA && !countB) return -1;
      if (!countA && countB) return 1;
      return a.name.localeCompare(b.name);
    });
    return {
      withRecords: sorted.filter((m) => (cityCounts[m.id] || 0) > 0),
      withoutRecords: sorted.filter((m) => !(cityCounts[m.id] || 0)),
    };
  }, [cities, cityCounts]);

  // Filter by search
  const normalizedQuery = normalize(searchQuery.trim());
  const isSearching = normalizedQuery.length > 0;

  const filterCity = useCallback(
    (name: string) => !isSearching || normalize(name).includes(normalizedQuery),
    [isSearching, normalizedQuery],
  );

  const filteredWithRecords = useMemo(
    () => withRecords.filter((m) => filterCity(m.name)),
    [withRecords, filterCity],
  );
  const filteredWithoutRecords = useMemo(
    () => withoutRecords.filter((m) => filterCity(m.name)),
    [withoutRecords, filterCity],
  );
  const totalVisible =
    filteredWithRecords.length + filteredWithoutRecords.length;

  // Scroll indicator
  const updateScrollIndicator = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20;
    const overflows = el.scrollHeight > el.clientHeight;
    setShowScrollIndicator(overflows && !atBottom);
  }, []);

  useEffect(() => {
    updateScrollIndicator();
  }, [searchQuery, updateScrollIndicator]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollIndicator);
    return () => el.removeEventListener("scroll", updateScrollIndicator);
  }, [updateScrollIndicator]);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      {/* Search */}
      <div className="relative" data-mun-search>
        <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar municipio..."
          autoComplete="off"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-elevated border border-border rounded-lg text-primary placeholder:text-muted focus:outline-hidden focus:border-accent/50 transition-colors"
        />
      </div>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileListOpen((v) => !v)}
        className="w-full flex items-center justify-between min-h-11 lg:hidden"
      >
        <span className="font-mono text-xs text-muted uppercase tracking-wider">
          Municipios
        </span>
        <svg
          className={`w-4 h-4 text-muted transition-transform duration-200 ${mobileListOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* List */}
      <div
        className={`relative ${mobileListOpen ? "block" : "hidden"} lg:block`}
      >
        <div
          ref={listRef}
          className="space-y-0.5 lg:max-h-95 overflow-y-auto scrollbar-hide"
        >
          {totalVisible === 0 && (
            <p className="w-full text-center text-sm text-muted py-2 font-mono">
              Sin resultados
            </p>
          )}

          {filteredWithRecords.map((mun) => {
            const count = cityCounts[mun.id] || 0;
            return (
              <CityButton
                key={mun.id}
                id={mun.id}
                name={mun.name}
                count={count}
                isActive={selectedCity === mun.id}
                dimmed={false}
                onClick={onSelectCity}
              />
            );
          })}

          {/* Separator */}
          {!isSearching && filteredWithoutRecords.length > 0 && (
            <div className="flex items-center gap-3 py-3 px-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-2xs font-mono text-muted uppercase tracking-wider shrink-0">
                Sin registros
              </span>
              <div className="flex-1 border-t border-border" />
            </div>
          )}

          {filteredWithoutRecords.map((mun) => (
            <CityButton
              key={mun.id}
              id={mun.id}
              name={mun.name}
              isActive={selectedCity === mun.id}
              dimmed
              onClick={onSelectCity}
            />
          ))}

          {/* CTA */}
          {!isSearching && (
            <div className="pt-3 mt-2 border-t border-border space-y-1.5">
              <a
                href="/dashboard"
                className={buttonVariants({ variant: "accent", size: "md", className: "w-full border-dashed" })}
              >
                <Plus className="w-3.5 h-3.5" />
                REGISTRAR PERFIL/STARTUP
              </a>
              <p className="text-2xs text-muted text-center font-mono">
                Startups, personas, consultorías, comunidades y empresas
              </p>
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        {showScrollIndicator && (
          <button
            type="button"
            onClick={() => {
              const el = listRef.current;
              if (el) el.scrollBy({ top: 150, behavior: "smooth" });
            }}
            className="w-full flex items-center justify-center gap-1 py-2 text-muted hover:text-accent transition-colors cursor-pointer"
          >
            <ChevronsDown className="w-4 h-4 animate-bounce" />
            <span className="text-2xs font-mono uppercase tracking-wider">
              Más municipios
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

// --- City button ---

const CityButton = memo(function CityButton({
  id,
  name,
  count,
  isActive,
  dimmed,
  onClick,
}: {
  id: string;
  name: string;
  count?: number;
  isActive: boolean;
  dimmed: boolean;
  onClick: (id: string) => void;
}) {
  return (
    <button
      type="button"
      data-city={id}
      onClick={(e) => {
        e.stopPropagation();
        onClick(id);
      }}
      className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all text-left cursor-pointer hover:bg-elevated ${
        isActive
          ? "bg-elevated border border-accent/30 shadow-xs"
          : dimmed
            ? "opacity-50 hover:opacity-100"
            : ""
      }`}
    >
      <MapPin className="w-4 h-4 text-muted shrink-0" />
      <span className="text-sm text-primary flex-1">{name}</span>
      {count != null && count > 0 && (
        <span className="text-xs font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
});
