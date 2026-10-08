import { Container, ContactDetails, EnquiryForm, Section, SectionHeading, useClient, usePageMeta } from "@wevibed/core";

export default function Contact() {
  const { client, content } = useClient();
  usePageMeta("Request a quote", `Request a quote from ${client.business.name}.`);

  const fields = [
    { name: "name", label: "Your name", required: true, autoComplete: "name" },
    { name: "phone", label: "Phone number", type: "tel", required: true, autoComplete: "tel" },
    { name: "email", label: "Email (optional)", type: "email", autoComplete: "email" },
    { name: "type", label: "Type of work", type: "select", required: true, options: [...content.services.items.map((s) => s.title), "Something else"] },
    { name: "location", label: "Where is the project?", placeholder: "Suburb or town" },
    { name: "details", label: "Tell us about the project", type: "textarea", required: true, placeholder: "Size, timing, budget range, anything that helps us quote accurately" },
  ];

  return (
    <Section className="pt-10 md:pt-16">
      <Container className="grid gap-12 md:grid-cols-5 md:gap-16">
        <div className="md:col-span-2">
          <SectionHeading eyebrow="Get a quote" title="Request a quote" titleClassName="font-extrabold tracking-tight" text="Fill in the form and your request opens in WhatsApp, ready to send. Or call us on the number below." />
          <ContactDetails className="mt-10" />
        </div>
        <div className="border border-border bg-card p-6 md:col-span-3 md:p-10">
          <h2 className="font-heading text-2xl font-bold">Project details</h2>
          <EnquiryForm fields={fields} subject="I would like to request a quote for a project" submitLabel="Request quote" className="mt-6" />
        </div>
      </Container>
    </Section>
  );
}
