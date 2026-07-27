"use client"

import { useMemo } from "react";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/Carousel";
import { FeaturedEntryTile } from "@/components/entries/FeaturedEntryTile";
import type { AtlasEntryType } from "@/config";

interface CarouselEntry {
  slug: string;
  name: string;
  tagline?: string | null;
  entryType: AtlasEntryType;
  logo?: { url: string; alt?: string } | null;
  coverImage?: { url: string; alt?: string } | null;
  city: string;
}

export default function FeaturedCarousel({ entries }: { entries: CarouselEntry[] }) {
  const plugins = useMemo(
    () => [
      AutoScroll({
        speed: 0.3,
        stopOnInteraction: true,
        stopOnMouseEnter: false,
      }),
    ],
    [],
  );

  return (
    <Carousel
      opts={{ align: "start", loop: true }}
      plugins={plugins}
      className="w-full"
    >
      <CarouselContent className="-ml-3 items-stretch">
        {entries.map((entry) => (
          // Widths keep the tile near ~260px across the whole range, always with a peek of the next one
          <CarouselItem
            key={entry.slug}
            className="pl-3 basis-[80%] xs:basis-[62%] sm:basis-1/2 md:basis-[38%]"
          >
            <FeaturedEntryTile
              slug={entry.slug}
              name={entry.name}
              tagline={entry.tagline}
              entryType={entry.entryType}
              logo={entry.logo}
              coverImage={entry.coverImage}
              city={entry.city}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex items-center justify-center gap-2 mt-4">
        <CarouselPrevious
          className="static translate-y-0 min-h-11 min-w-11"
          size="icon"
        />
        <CarouselNext
          className="static translate-y-0 min-h-11 min-w-11"
          size="icon"
        />
      </div>
    </Carousel>
  );
}
