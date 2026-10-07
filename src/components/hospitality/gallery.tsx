import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useState, type KeyboardEvent, type ReactNode } from "react";
import type { Photo } from "@/lib/hospitality/types";
import { cn } from "@/lib/utils";

/**
 * Large photo, up to three thumbnails (the last carries a "+N" when there are
 * more), and a full-screen lightbox. Everything is a real button: the main
 * photo opens the lightbox, each thumbnail opens it at that photo, and inside
 * it Left/Right/Escape work, focus is trapped and returned by Radix Dialog.
 */
export function PropertyGallery({
  images,
  name,
  overlay,
  className,
}: {
  images: Photo[];
  name: string;
  /** Anything to float over the main photo, such as the save button. */
  overlay?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const count = images.length;
  const thumbs = images.slice(1, 5);
  const extra = Math.max(0, count - 5);

  const openAt = (i: number) => {
    setIndex(i);
    setOpen(true);
  };
  const step = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  }

  return (
    <div className={className}>
      <div className="relative">
        <button
          type="button"
          onClick={() => openAt(0)}
          aria-label={`Open the ${count === 1 ? "photo" : `${count} photos`} of ${name}`}
          className="group relative block aspect-[16/10] w-full overflow-hidden rounded-2xl bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          <img
            src={images[0].src}
            alt={images[0].alt}
            fetchPriority="high"
            decoding="async"
            className="size-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            style={{ objectPosition: images[0].position ?? "center" }}
          />
          <span className="absolute bottom-3 left-3 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-brand-dark/85 px-3 text-xs text-ivory backdrop-blur">
            <Expand className="size-3.5" aria-hidden />
            {count} {count === 1 ? "photo" : "photos"}
          </span>
        </button>
        {overlay ? <div className="absolute right-3 top-3">{overlay}</div> : null}
      </div>

      {thumbs.length > 0 ? (
        <ul className="mt-2 grid grid-cols-4 gap-2">
          {thumbs.map((p, i) => {
            const last = i === thumbs.length - 1 && extra > 0;
            return (
              <li key={p.src}>
                <button
                  type="button"
                  onClick={() => openAt(i + 1)}
                  aria-label={last ? `Open all ${count} photos of ${name}` : `Open photo ${i + 2} of ${name}`}
                  className="group relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  <img
                    src={p.src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    style={{ objectPosition: p.position ?? "center" }}
                  />
                  {last ? (
                    <span className="absolute inset-0 grid place-items-center bg-brand-dark/75 font-display text-2xl text-ivory">+{extra}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="carousel-panel-in fixed inset-0 z-[60] bg-brand-dark/95" />
          <Dialog.Content
            onKeyDown={onKeyDown}
            className="fixed inset-0 z-[60] flex flex-col p-3 text-ivory focus:outline-none sm:p-6"
            aria-describedby={undefined}
          >
            <div className="flex items-center justify-between gap-4 pb-3">
              <Dialog.Title className="truncate font-display text-lg sm:text-xl">{name}</Dialog.Title>
              <div className="flex items-center gap-3">
                <p aria-live="polite" className="text-sm tabular-nums text-ivory/85">
                  {index + 1} / {count}
                </p>
                <Dialog.Close aria-label="Close gallery" className="grid size-11 place-items-center rounded-full bg-ivory/12 hover:bg-ivory/22 focus-visible:outline-2 focus-visible:outline-gold">
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              <img
                key={images[index].src}
                src={images[index].src}
                alt={images[index].alt}
                className="carousel-panel-in absolute inset-0 size-full object-contain"
              />
              {count > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous photo"
                    onClick={() => step(-1)}
                    className="absolute left-0 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-brand-dark/70 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-gold sm:left-2"
                  >
                    <ChevronLeft className="size-6" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Next photo"
                    onClick={() => step(1)}
                    className="absolute right-0 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-brand-dark/70 hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-gold sm:right-2"
                  >
                    <ChevronRight className="size-6" aria-hidden />
                  </button>
                </>
              ) : null}
            </div>

            {count > 1 ? (
              <ul className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
                {images.map((p, i) => (
                  <li key={p.src} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`Show photo ${i + 1}`}
                      aria-current={i === index}
                      className={cn(
                        "block h-14 w-20 overflow-hidden rounded-lg border-2 transition-opacity focus-visible:outline-2 focus-visible:outline-gold",
                        i === index ? "border-ivory opacity-100" : "border-transparent opacity-60 hover:opacity-100",
                      )}
                    >
                      <img src={p.src} alt="" loading="lazy" className="size-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
