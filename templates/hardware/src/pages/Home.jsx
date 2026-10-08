import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { Button, CTABand, Container, HeroFull, Img, Reveal, Section, SectionHeading, useClient, usePageMeta } from "@wevibed/core";
import { deriveCategories } from "@wevibed/catalog";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  const { client, content } = useClient();
  usePageMeta();
  const { items, categories: declared } = content.products;
  const categories = deriveCategories(items, declared);
  const featured = items.filter((p) => p.badges?.includes("featured"));
  const picks = (featured.length ? featured : items).slice(0, 4);
  const steps = content.process?.steps ?? [];

  return (
    <>
      <HeroFull minHeight="min-h-[70vh]" headlineClassName="uppercase" />

      <Section>
        <Container>
          <SectionHeading eyebrow="Shop by category" title="Find what you need." titleClassName="uppercase" />
          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => {
              const cover = items.find((p) => p.category === c);
              if (!cover) return null;
              return (
                <li key={c}>
                  <Reveal delay={i * 50}>
                    <Link to={`/products?category=${encodeURIComponent(c)}`} className="group block border border-border bg-card transition hover:border-accent">
                      <span className="block bg-white">
                        <Img src={cover.image} alt="" className="aspect-square w-full object-contain p-5 transition duration-500 group-hover:scale-105" />
                      </span>
                      <span className="flex items-center justify-between gap-2 border-t border-border p-4 font-heading text-lg font-semibold uppercase tracking-wide">
                        {c}
                        <ArrowRight className="h-4 w-4 shrink-0 text-accent-text transition group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Popular right now" title="Featured products" titleClassName="uppercase" />
            <Button to="/products" variant="outline">View full catalogue</Button>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
            {picks.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {steps.length > 0 && (
        <Section tone="primary">
          <Container>
            <SectionHeading eyebrow="How it works" title={content.process.heading ?? "Browse. Add. Message."} titleClassName="uppercase" />
            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title} className="border-t-2 border-accent pt-5">
                  <span className="font-heading text-4xl font-bold text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 font-heading text-2xl font-semibold uppercase">{s.title}</h3>
                  <p className="mt-2 opacity-80">{s.text}</p>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      )}

      <CTABand
        title="Visiting the store?"
        text="Message us first and we will confirm what is in stock."
        secondary={
          client.contact.mapsUrl && (
            <Button variant="light" size="lg" href={client.contact.mapsUrl}>
              <MapPin className="h-4 w-4" aria-hidden="true" /> Get directions
            </Button>
          )
        }
      />
    </>
  );
}
