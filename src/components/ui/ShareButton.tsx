"use client"

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { btn } from "@/components/ui/button-styles";

export default function ShareButton({
  title,
  url,
}: {
  title: string;
  url: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    // Mobile: use native share sheet when available
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled — ignore
      }
      return;
    }

    // Desktop fallback: copy to clipboard
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className={btn({ size: 'md' })}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-accent" />
          <span className="text-accent">LINK COPIADO</span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          COMPARTIR
        </>
      )}
    </button>
  );
}
