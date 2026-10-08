import { useSearchParams } from "react-router-dom";
import { Button, Container, FilterChips, Section, SectionHeading, useClient, usePageMeta } from "@wevibed/core";
import { SearchBox, deriveCategories, useCatalog } from "@wevibed/catalog";
import ProductCard from "../components/ProductCard.jsx";

export default function Shop() {
  const { client, content } = useClient();
  usePageMeta("Shop", `Browse products from ${client.business.name}.`);
  const [params] = useSearchParams();
  const known = deriveCategories(content.products.items, content.products.categories);
  const requested = params.get("category");
  const { query, setQuery, category, setCategory, categories, results, reset } = useCatalog(content.products, {
    initialCategory: known.includes(requested) ? requested : "All",
  });

  return (
    <Section className="pt-10 md:pt-14">
      <Container>
        <SectionHeading eyebrow="Shop" title="All products" text="Tap a product for sizes and details, or ask us on WhatsApp." />
        <div className="mt-8 space-y-4">
          {client.features?.search !== false && <SearchBox value={query} onChange={setQuery} placeholder="Search by name or category" className="max-w-xl" />}
          <FilterChips options={["All", ...categories]} value={category} onChange={setCategory} />
        </div>

        <p className="mt-8 text-sm text-muted-foreground" aria-live="polite">
          {results.length} product{results.length === 1 ? "" : "s"}
          {query ? ` for “${query}”` : ""}
        </p>

        {results.length > 0 ? (
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6">
            {results.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-10 rounded-lg border border-border p-10 text-center">
            <h2 className="font-heading text-2xl">No products found</h2>
            <p className="mt-2 text-muted-foreground">Try a different search or category.</p>
            <Button onClick={reset} className="mt-6">Show all products</Button>
          </div>
        )}
      </Container>
    </Section>
  );
}
