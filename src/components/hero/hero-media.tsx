import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useSlideRotation } from "@/lib/use-slide-rotation";
import { SlideDots, SlidePauseButton } from "@/components/carousel/slide-controls";
import {
  HERO_FADE_MS,
  HERO_SLIDE_MS,
  isVideo,
  type HeroMedia,
} from "@/lib/hero-media";

/**
 * The crossfade + Ken Burns layer shared by every hero on the site.
 *
 * Three things about this component are deliberate:
 *
 * 1. Advancing is driven by a timer, never by `transitionend`. The global
 *    `prefers-reduced-motion` rule in styles.css forces
 *    `transition-duration: 0.01ms !important`, so a slideshow that waited for a
 *    transition to finish would stall for exactly the users least able to
 *    tolerate a broken page.
 * 2. The first render is always slide 0 regardless of motion preference or
 *    stored state, so server and client markup match and hydration stays clean.
 *    Motion preference only decides whether the timer ever starts.
 * 3. Ken Burns is applied only to the active slide, so moving between
 *    `animation: none` and a named animation restarts it on every revisit
 *    without remounting the image.
 */
export function HeroMediaLayer({
  media,
  className,
}: {
  media: readonly HeroMedia[];
  className?: string;
}) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const { active, paused, animate, multiple, go, select, togglePause } = useSlideRotation({
    count: media.length,
    slideMs: HERO_SLIDE_MS,
    // A video drives its own timing through `onEnded` so it is never cut short.
    skipAutoAdvance: (i) => isVideo(media[i]),
  });

  // Nothing should keep running in a tab the visitor cannot see.
  useEffect(() => {
    if (!multiple) return;
    const onVisibility = () => {
      if (document.hidden) {
        videoRefs.current.forEach((v) => v?.pause());
      } else {
        const current = media[active];
        if (isVideo(current)) void videoRefs.current[active]?.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [active, media, multiple]);

  // Only the active video plays; the rest are stopped and rewound so a slide
  // never returns mid-clip.
  useEffect(() => {
    videoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === active && animate && !paused) {
        // Autoplay can be refused. The poster stays visible and the slide falls
        // back to the ordinary timer, so the sequence keeps moving either way.
        void video.play().catch(() => {
          if (multiple) window.setTimeout(() => go(active + 1), HERO_SLIDE_MS);
        });
      } else {
        video.pause();
        if (i !== active) video.currentTime = 0;
      }
    });
  }, [active, animate, go, multiple, paused]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {media.map((item, i) => {
        const current = i === active;
        return (
          <div
            key={item.src}
            aria-hidden={!current}
            className={cn(
              "absolute inset-0 transition-opacity ease-out motion-reduce:transition-none",
              current ? "opacity-100" : "opacity-0",
            )}
            style={{ transitionDuration: `${HERO_FADE_MS}ms` }}
          >
            {isVideo(item) ? (
              <video
                ref={(el) => {
                  videoRefs.current[i] = el;
                }}
                src={item.src}
                poster={item.poster}
                muted
                playsInline
                // Only the first clip is worth fetching up front; the rest wait
                // until they are about to be shown.
                preload={i === 0 ? "metadata" : "none"}
                onEnded={() => multiple && !paused && animate && go(active + 1)}
                className={cn(
                  "size-full object-cover",
                  current && animate && "hero-kenburns",
                )}
                style={{ objectPosition: item.position ?? "center" }}
              />
            ) : (
              <img
                src={item.src}
                alt={current ? item.alt : ""}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
                decoding="async"
                className={cn(
                  "size-full object-cover",
                  current && animate && "hero-kenburns",
                )}
                style={{ objectPosition: item.position ?? "center" }}
              />
            )}
          </div>
        );
      })}

      {/* Present whenever the hero rotates, because WCAG 2.2.2 requires a way
          to stop motion that starts automatically and runs past five seconds. */}
      {multiple ? (
        <div className="absolute bottom-5 right-5 z-20 flex items-center gap-3 sm:bottom-6 sm:right-6">
          <SlideDots count={media.length} active={active} onSelect={select} label="Hero image" itemNoun="image" />
          {animate ? (
            <SlidePauseButton paused={paused} onToggle={togglePause} label="hero slideshow" />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
