import { CTABand, Container, Img, Reveal, Section, SectionHeading, useClient, usePageMeta } from "@wevibed/core";

export default function About() {
  const { client, content } = useClient();
  const about = content.about;
  usePageMeta("About us", client.business.description);

  return (
    <>
      <Section className="pt-10 md:pt-16">
        <Container className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <SectionHeading eyebrow="About us" title={about.heading} titleClassName="font-extrabold tracking-tight md:text-6xl" />
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
              {about.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
          {about.image && (
            <Reveal delay={100}>
              <Img src={about.image} alt={about.imageAlt ?? ""} eager className="aspect-[4/3] w-full object-cover" />
            </Reveal>
          )}
        </Container>
      </Section>

      {about.highlights?.length > 0 && (
        <Section tone="muted">
          <Container>
            <ul className="grid gap-10 md:grid-cols-3">
              {about.highlights.map((h, i) => (
                <li key={h.title} className="border-t-2 border-accent pt-5">
                  <span className="font-heading text-4xl font-extrabold text-accent-text">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="mt-3 font-heading text-2xl font-bold">{h.title}</h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{h.text}</p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <CTABand title="Let's talk about your project" text="Free quotes. Tell us what you need." label="Request a quote on WhatsApp" message={`Hello ${client.business.name}, I would like to request a quote.`} />
    </>
  );
}
