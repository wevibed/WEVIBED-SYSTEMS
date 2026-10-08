import { Button, CTABand, Container, HeroFull, Section, SectionHeading, Testimonials, useClient, usePageMeta } from "@wevibed/core";
import ServiceCards from "../components/ServiceCards.jsx";
import ProjectGallery from "../components/ProjectGallery.jsx";
import ProcessSteps from "../components/ProcessSteps.jsx";

export default function Home() {
  const { client, content } = useClient();
  usePageMeta();
  const highlights = content.about.highlights ?? [];

  return (
    <>
      <HeroFull minHeight="min-h-[88vh]" />

      {highlights.length > 0 && (
        <section className="bg-primary text-primary-foreground" aria-label="Why choose us">
          <Container>
            <ul className="grid divide-white/10 md:grid-cols-3 md:divide-x">
              {highlights.slice(0, 3).map((h) => (
                <li key={h.title} className="py-8 md:px-8 md:first:pl-0 md:last:pr-0">
                  <h2 className="font-heading text-xl font-bold">{h.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed opacity-75">{h.text}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <Section id="services">
        <Container>
          <SectionHeading eyebrow="What we do" title="Our services" titleClassName="font-extrabold tracking-tight md:text-6xl" />
          <ServiceCards services={content.services.items} />
        </Container>
      </Section>

      <Section tone="muted" id="work">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Our work" title="Built in the real world." text="A selection of recent projects. Tap any photo to view it larger." titleClassName="font-extrabold tracking-tight md:text-6xl" />
            <Button to="/projects" variant="outline">View all projects</Button>
          </div>
          <div className="mt-10">
            <ProjectGallery projects={content.projects} limit={6} />
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionHeading eyebrow="How we work" title={content.process.heading ?? "From first call to handover"} titleClassName="font-extrabold tracking-tight md:text-6xl" />
          <ProcessSteps steps={content.process.steps} />
        </Container>
      </Section>

      <Testimonials tone="muted" title="What clients say" />

      <CTABand
        title="Planning a build?"
        text="Tell us about your project and we will come back with a quote."
        label="Request a quote on WhatsApp"
        message={`Hello ${client.business.name}, I would like to request a quote for a project.`}
        secondary={
          <Button to="/contact" variant="light" size="lg">
            Use the quote form
          </Button>
        }
      />
    </>
  );
}
