import { CTABand, Container, Img, Reveal, Section, SectionHeading, Testimonials, useClient, usePageMeta } from "@wevibed/core";

export default function About() {
  const { client, content } = useClient();
  const about = content.about;
  usePageMeta("About us", client.business.description);

  return (
    <>
      <Section className="pt-10 md:pt-16">
        <Container className="grid items-start gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <SectionHeading eyebrow="About us" title={about.heading} />
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">
              {about.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </Reveal>
          {about.image && (
            <Reveal delay={100}>
              <Img src={about.image} alt={about.imageAlt ?? ""} eager className="aspect-[4/5] w-full rounded-lg object-cover" />
            </Reveal>
          )}
        </Container>
      </Section>

      {about.highlights?.length > 0 && (
        <Section tone="muted">
          <Container>
            <ul className="grid gap-8 md:grid-cols-3">
              {about.highlights.map((h) => (
                <li key={h.title}>
                  <h2 className="font-heading text-2xl">{h.title}</h2>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{h.text}</p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}

      <Testimonials />
      <CTABand title={`Visit ${client.business.shortName ?? client.business.name}`} text="Come and see the range in person, or send us a message first." />
    </>
  );
}
