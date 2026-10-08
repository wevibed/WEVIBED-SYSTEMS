import { Quote } from "lucide-react";
import { useClient } from "./ClientContext.jsx";
import { waLink } from "./whatsapp.js";
import { Button, Container, Reveal, Section, SectionHeading, cx } from "./ui.jsx";

/** Customer quotes. Renders nothing when there are none. */
export function Testimonials({ title = "What customers say", eyebrow = "Testimonials", tone, className }) {
  const { content } = useClient();
  const items = content.testimonials?.items ?? [];
  if (!items.length) return null;
  return (
    <Section tone={tone} className={className}>
      <Container>
        <SectionHeading eyebrow={eyebrow} title={title} />
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {items.slice(0, 3).map((t, i) => (
            <li key={t.name + i}>
              <Reveal delay={i * 80} className="h-full rounded border border-border bg-card p-6 text-card-foreground">
                <Quote className="h-6 w-6 text-accent-text" aria-hidden="true" />
                <blockquote className="mt-4 leading-relaxed">“{t.text}”</blockquote>
                <p className="mt-5 font-semibold">{t.name}</p>
                {t.role && <p className="text-sm text-muted-foreground">{t.role}</p>}
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/** Closing call-to-action band that opens WhatsApp. */
export function CTABand({ title, text, label = "Chat on WhatsApp", message, secondary, className }) {
  const { client } = useClient();
  const text0 = message ?? `Hello ${client.business.name}, I would like to make an enquiry.`;
  return (
    <Section tone="primary" className={cx("py-14 md:py-20", className)}>
      <Container className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">{title}</h2>
          {text && <p className="mt-3 text-lg opacity-80">{text}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="accent" size="lg" href={waLink(client.contact.whatsapp, text0)}>
            {label}
          </Button>
          {secondary}
        </div>
      </Container>
    </Section>
  );
}
