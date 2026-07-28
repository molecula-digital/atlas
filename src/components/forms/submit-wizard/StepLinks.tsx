import { X, Plus } from "lucide-react";
import { TYPE_COPY, type StepProps } from "./types";
import { buttonVariants } from '@/components/ui/Button'

export default function StepLinks({ state, setField }: StepProps) {
  const copy = state.entryType ? TYPE_COPY[state.entryType] : null;

  function addTag() {
    const t = state.tagInput.trim().toLowerCase();
    if (t && !state.tags.includes(t) && state.tags.length < 10) {
      setField("tags", [...state.tags, t]);
      setField("tagInput", "");
    }
  }

  function removeTag(tag: string) {
    setField(
      "tags",
      state.tags.filter((t: string) => t !== tag),
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-sans font-bold text-primary">
          Enlaces
        </h2>
        <p className="text-sm text-secondary">
          Todos los campos son opcionales.
        </p>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              Sitio web
            </span>
            <input
              type="url"
              value={state.website}
              onChange={(e) => setField("website", e.target.value)}
              placeholder="https://tu-sitio.com"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              X
            </span>
            <input
              type="text"
              value={state.x}
              onChange={(e) => setField("x", e.target.value)}
              placeholder="@usuario"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              Instagram
            </span>
            <input
              type="text"
              value={state.instagram}
              onChange={(e) => setField("instagram", e.target.value)}
              placeholder="@usuario"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              LinkedIn
            </span>
            <input
              type="url"
              value={state.linkedin}
              onChange={(e) => setField("linkedin", e.target.value)}
              placeholder="https://linkedin.com/in/usuario"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              GitHub
            </span>
            <input
              type="text"
              value={state.github}
              onChange={(e) => setField("github", e.target.value)}
              placeholder="usuario"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-xs font-mono text-muted uppercase tracking-wider">
              YouTube
            </span>
            <input
              type="url"
              value={state.youtube}
              onChange={(e) => setField("youtube", e.target.value)}
              placeholder="https://youtube.com/@canal"
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
            />
          </label>
          {state.entryType === "community" && (
            <>
              <label className="block">
                <span className="text-xs font-mono text-muted uppercase tracking-wider">
                  Discord
                </span>
                <input
                  type="url"
                  value={state.discord}
                  onChange={(e) => setField("discord", e.target.value)}
                  placeholder="https://discord.gg/..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
                />
              </label>
              <label className="block">
                <span className="text-xs font-mono text-muted uppercase tracking-wider">
                  Telegram
                </span>
                <input
                  type="url"
                  value={state.telegram}
                  onChange={(e) => setField("telegram", e.target.value)}
                  placeholder="https://t.me/..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
                />
              </label>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-border" />

      <div className="space-y-4">
        <h3 className="text-lg font-sans font-bold text-primary">
          Etiquetas
        </h3>
        <p className="text-sm text-secondary">
          Agrega hasta 10 etiquetas que describan tu{" "}
          {copy?.entityName ?? "registro"}.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={state.tagInput}
            onChange={(e) => setField("tagInput", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Escribe y presiona Enter"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={state.tags.length >= 10}
            className={buttonVariants({ size: "icon-lg" })}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {state.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {state.tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="text-xs text-muted font-mono">
          {state.tags.length}/10 etiquetas
        </p>
      </div>
    </div>
  );
}
