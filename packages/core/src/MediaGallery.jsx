import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Img, cx } from "./ui.jsx";

/** Category filter chips. Generic: used by galleries and catalogues. */
export function FilterChips({ options, value, onChange, className, tone = "light" }) {
  return (
    <div role="group" aria-label="Filter" className={cx("flex flex-wrap gap-2", className)}>
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o)}
            className={cx(
              "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : tone === "dark"
                  ? "border-white/25 text-white/80 hover:bg-white/10"
                  : "border-border text-foreground/70 hover:bg-foreground/5",
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Lightbox({ items, index, onClose, onStep }) {
  const closeRef = useRef(null);
  const item = items[index];

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onStep(-1);
      if (e.key === "ArrowRight") onStep(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, onStep]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Image viewer" className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
        <X className="h-6 w-6" />
      </button>
      {items.length > 1 && (
        <>
          <button type="button" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); onStep(-1); }} className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button type="button" aria-label="Next image" onClick={(e) => { e.stopPropagation(); onStep(1); }} className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 md:right-20">
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}
      <figure className="max-h-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <Img src={item.image} alt={item.alt} eager className="max-h-[80vh] w-auto max-w-full rounded object-contain" />
        <figcaption className="mt-3 text-center text-sm text-white/80">
          {item.title}
          {item.location ? ` · ${item.location}` : ""}
        </figcaption>
      </figure>
    </div>
  );
}

/**
 * Filterable image gallery with keyboard-accessible lightbox.
 * items: [{ id, image, alt, title, category, location }]
 */
export function MediaGallery({ items, categories, limit, allLabel = "All", tone = "light", gridClassName = "sm:grid-cols-2 lg:grid-cols-3" }) {
  const [filter, setFilter] = useState(allLabel);
  const [openIndex, setOpenIndex] = useState(null);

  const filtered = useMemo(() => (filter === allLabel ? items : items.filter((i) => i.category === filter)), [items, filter, allLabel]);
  const shown = limit ? filtered.slice(0, limit) : filtered;

  const step = useCallback((dir) => setOpenIndex((i) => (i === null ? i : (i + dir + shown.length) % shown.length)), [shown.length]);
  const close = useCallback(() => setOpenIndex(null), []);

  return (
    <div>
      {categories.length > 0 && (
        <FilterChips options={[allLabel, ...categories]} value={filter} onChange={(v) => { setFilter(v); setOpenIndex(null); }} tone={tone} />
      )}
      <ul className={cx("mt-8 grid gap-4 md:gap-6", gridClassName)}>
        {shown.map((item, i) => (
          <li key={item.id}>
            <button type="button" onClick={() => setOpenIndex(i)} className="group relative block w-full overflow-hidden rounded text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <Img src={item.image} alt={item.alt} className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="block text-xs uppercase tracking-widest text-white/70">{item.category}</span>
                <span className="block font-heading text-lg font-semibold">{item.title}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {shown.length === 0 && <p className="mt-8 text-muted-foreground">Nothing in this category yet.</p>}
      {openIndex !== null && shown[openIndex] && <Lightbox items={shown} index={openIndex} onClose={close} onStep={step} />}
    </div>
  );
}
