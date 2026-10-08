import { MessageCircle } from "lucide-react";
import { useClient } from "./ClientContext.jsx";
import { waLink, generalEnquiryText } from "./whatsapp.js";
import { Button, Container, Eyebrow, Img, Reveal, cx } from "./ui.jsx";

function HeroActions({ light = false, className }) {
  const { client } = useClient();
  const h = client.hero;
  return (
    <div className={cx("flex flex-wrap gap-3", className)}>
      <Button variant={light ? "accent" : "primary"} size="lg" to={h.ctaTo ?? "/contact"}>
        {h.ctaLabel ?? "Get in touch"}
      </Button>
      <Button variant={light ? "light" : "outline"} size="lg" href={waLink(client.contact.whatsapp, generalEnquiryText(client.business.name))}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp us
      </Button>
    </div>
  );
}

/** Full-bleed photo hero with text over a dark gradient. Used by services-style and project-style sites. */
export function HeroFull({ minHeight = "min-h-[80vh]", headlineClassName = "", withHeaderOffset = false }) {
  const { client } = useClient();
  const h = client.hero;
  return (
    <section className={cx("relative flex items-end overflow-hidden bg-primary text-white", minHeight)}>
      <Img src={h.image} alt={h.imageAlt} eager className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
      <Container className={cx("relative z-10 pb-16 md:pb-24", withHeaderOffset ? "pt-40" : "pt-28")}>
        <Reveal className="max-w-4xl">
          {h.eyebrow && (
            <p className="mb-5 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              <span className="h-px w-12 bg-white/60" aria-hidden="true" />
              {h.eyebrow}
            </p>
          )}
          <h1 className={cx("font-heading text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl lg:text-8xl", headlineClassName)}>{h.headline}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">{h.subheadline}</p>
          <HeroActions light className="mt-9" />
        </Reveal>
      </Container>
    </section>
  );
}

/** Text on one side, photo on the other. Light, editorial feel for retail and boutique sites. */
export function HeroSplit({ reverse = false, imageClassName = "aspect-[4/5]", headlineClassName = "" }) {
  const { client } = useClient();
  const h = client.hero;
  return (
    <section className="overflow-hidden">
      <Container className={cx("grid items-center gap-10 py-12 md:grid-cols-2 md:gap-16 md:py-20", reverse && "md:[&>*:first-child]:order-2")}>
        <Reveal>
          {h.eyebrow && <Eyebrow className="mb-4">{h.eyebrow}</Eyebrow>}
          <h1 className={cx("font-heading text-4xl font-bold leading-[1.05] md:text-6xl", headlineClassName)}>{h.headline}</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">{h.subheadline}</p>
          <HeroActions className="mt-9" />
        </Reveal>
        <Reveal delay={120}>
          <Img src={h.image} alt={h.imageAlt} eager className={cx("w-full rounded-lg object-cover", imageClassName)} />
        </Reveal>
      </Container>
    </section>
  );
}
