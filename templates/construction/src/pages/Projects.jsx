import { CTABand, Container, Section, SectionHeading, useClient, usePageMeta } from "@wevibed/core";
import ProjectGallery from "../components/ProjectGallery.jsx";

export default function Projects() {
  const { client, content } = useClient();
  usePageMeta("Our work", `Recent construction and building projects by ${client.business.name}.`);

  return (
    <>
      <Section className="pt-10 md:pt-16">
        <Container>
          <SectionHeading
            eyebrow="Our work"
            title="Projects"
            titleClassName="font-extrabold tracking-tight md:text-6xl"
            text="Filter by type of work, and tap any photo to view it larger."
          />
          <div className="mt-10">
            <ProjectGallery projects={content.projects} />
          </div>
        </Container>
      </Section>
      <CTABand
        title="Like what you see?"
        text="Send us your plans or describe your project."
        label="Request a quote on WhatsApp"
        message={`Hello ${client.business.name}, I saw your projects and would like to request a quote.`}
      />
    </>
  );
}
