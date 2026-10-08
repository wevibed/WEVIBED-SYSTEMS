import { Container, ContactDetails, EnquiryForm, Section, SectionHeading, useClient, usePageMeta } from "@wevibed/core";

const FIELDS = [
  { name: "name", label: "Your name", required: true, autoComplete: "name" },
  { name: "phone", label: "Phone number", type: "tel", required: true, autoComplete: "tel" },
  { name: "message", label: "What do you need?", type: "textarea", required: true, placeholder: "Product names and quantities, or any questions" },
];

export default function Contact() {
  const { client } = useClient();
  usePageMeta("Contact", `Find ${client.business.name}: address, phone, WhatsApp and opening hours.`);

  return (
    <Section className="pt-10 md:pt-16">
      <Container className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <SectionHeading eyebrow="Visit or message us" title="Find the store." titleClassName="uppercase" text="Message us before you come and we will confirm stock and prices." />
          <ContactDetails className="mt-10" />
        </div>
        <div className="border border-border bg-card p-6 md:p-8">
          <h2 className="font-heading text-3xl font-semibold uppercase">Send an enquiry</h2>
          <EnquiryForm fields={FIELDS} subject="I would like to enquire about your products" submitLabel="Send enquiry" className="mt-6" />
        </div>
      </Container>
    </Section>
  );
}
