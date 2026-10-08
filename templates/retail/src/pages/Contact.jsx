import { Container, ContactDetails, EnquiryForm, Section, SectionHeading, useClient, usePageMeta } from "@wevibed/core";

const FIELDS = [
  { name: "name", label: "Your name", required: true, autoComplete: "name" },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
  { name: "message", label: "Your message", type: "textarea", required: true, placeholder: "Which product are you interested in? Size or colour?" },
];

export default function Contact() {
  const { client } = useClient();
  usePageMeta("Contact", `Contact ${client.business.name}: address, phone, WhatsApp and opening hours.`);

  return (
    <Section className="pt-10 md:pt-16">
      <Container className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <SectionHeading eyebrow="Get in touch" title="Contact us" text="Questions about a product, a size or a visit? Message us and we usually reply the same day." />
          <ContactDetails className="mt-10" />
        </div>
        <div className="rounded-lg border border-border bg-card p-6 md:p-8">
          <h2 className="font-heading text-2xl">Send a message</h2>
          <EnquiryForm fields={FIELDS} subject="I have a question" submitLabel="Send message" className="mt-6" />
        </div>
      </Container>
    </Section>
  );
}
