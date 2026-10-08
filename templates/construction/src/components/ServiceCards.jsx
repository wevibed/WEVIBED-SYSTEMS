import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Img, Reveal, cx } from "@wevibed/core";

/** Large image cards, one per service. Each links to the quote form. */
export default function ServiceCards({ services }) {
  const cols = services.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <ul className={cx("mt-12 grid gap-5", cols)}>
      {services.map((s, i) => (
        <li key={s.id}>
          <Reveal delay={i * 90} className="h-full">
            <Link to="/contact" className="group relative flex min-h-[420px] flex-col justify-between overflow-hidden bg-primary p-7 text-white md:min-h-[520px] md:p-9">
              {s.image && <Img src={s.image} alt={s.imageAlt ?? ""} className="absolute inset-0 h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" />}
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" aria-hidden="true" />
              <span className="relative flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 text-xs font-semibold tracking-widest backdrop-blur">{String(i + 1).padStart(2, "0")}</span>
                <ArrowUpRight className="h-6 w-6 text-white/80 transition group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" />
              </span>
              <span className="relative block">
                <span className="block font-heading text-4xl font-extrabold leading-none tracking-tight md:text-5xl">{s.title}</span>
                <span className="mt-4 block max-w-md text-base leading-relaxed text-white/80">{s.description}</span>
                <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-white">Discuss a project</span>
              </span>
            </Link>
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
