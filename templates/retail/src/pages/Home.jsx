import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Button, CTABand, Container, HeroSplit, Img, Reveal, Section, SectionHeading, Testimonials, useClient, usePageMeta } from "@wevibed/core";
import { deriveCategories } from "@wevibed/catalog";
import ProductCard from "../components/ProductCard.jsx";

export default function Home() {
  const { content } = useClient();
  usePageMeta();
  const { items, categories: declared } = content.products;
  const categories = deriveCategories(items, declared);
  const featured = items.filter((p) => p.badges?.includes("featured"));
  const picks = (featured.length ? featured : items).slice(0, 4);
  const about = content.about;

  return (
    <>
      <HeroSplit />

      <Section tone="muted">
        <Container>
          <SectionHeading eyebrow="Browse" title="Shop by category" />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => {
              const cover = items.find((p) => p.category === c);
              if (!cover) return null;
              return (
                <li key={c}>
                  <Reveal delay={i * 60}>
                    <Link to={`/shop?category=${encodeURIComponent(c)}`} className="group relative block overflow-hidden rounded-lg">
                      <Img src={cover.image} alt="" className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" aria-hidden="true" />
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between p-5 text-white">
                        <span className="font-heading text-2xl">{c}</span>
                        <ArrowUpRight className="h-5 w-5 transition group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </Link>
                  </Reveal>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Our picks" title="Featured right now" />
            <Button to="/shop" variant="outline">View all products</Button>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {picks.map((p, i) => (
              <li key={p.id}>
                <Reveal delay={i * 60} className="h-full">
                  <ProductCard product={p} />
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section tone="muted">
        <Container className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {about.image && (
            <Reveal>
              <Img src={about.image} alt={about.imageAlt ?? ""} className="aspect-[4/3] w-full rounded-lg object-cover" />
            </Reveal>
          )}
          <Reveal delay={100}>
            <SectionHeading eyebrow="About us" title={about.heading} />
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">{about.paragraphs[0]}</p>
            <Button to="/about" variant="outline" className="mt-8">Read our story</Button>
          </Reveal>
        </Container>
      </Section>

      <Testimonials />

      <CTABand title="Questions about a product?" text="Send us a message and we will check size and availability for you." />
    </>
  );
}
