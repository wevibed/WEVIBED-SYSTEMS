import { useSearchParams } from "react-router-dom";
import { Button, Container, FilterChips, Section, SectionHeading, useClient, usePageMeta } from "@wevibed/core";
import { SearchBox, deriveCategories, useCatalog } from "@wevibed/catalog";
import ProductCard from "../components/ProductCard.jsx";

export default function Products() {
  const { client, content } = useClient();
  usePageMeta("Products & prices", `Product catalogue and prices from ${client.business.name}.`);
  const [params] = useSearchParams();
  const known = deriveCategories(content.products.items, content.products.categories);
  const requested = params.get("category");
  const { query, setQuery, category, setCategory, categories, results, reset } = useCatalog(content.products, {
    initialCategory: known.includes(requested) ? requested : "All",
  });

  return (
    <Section className="pt-10 md:pt-14">
      <Container>
        <SectionHeading
          eyebrow="Catalogue"
          title="Products & prices."
          titleClassName="uppercase"
          text={client.features?.cart ? "Add items to your cart and send the whole order to us on WhatsApp." : "Tap a product to ask about it on WhatsApp."}
        />
        <div className="mt-8 space-y-4">
          {client.features?.search !== false && <SearchBox value={query} onChange={setQuery} placeholder="Search products, tools, solar, gas…" className="max-w-2xl" />}
          <FilterChips options={["All", ...categories]} value={category} onChange={setCategory} />
        </div>

        <p className="mt-8 text-sm font-medium text-muted-foreground" aria-live="polite">
          {results.length} product{results.length === 1 ? "" : "s"}
          {query ? ` for “${query}”` : ""}
        </p>

        {results.length > 0 ? (
          <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
            {results.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 border border-border p-10 text-center">
            <h2 className="font-heading text-3xl font-semibold uppercase">No products found.</h2>
            <p className="mt-2 text-muted-foreground">Try a different search or category, or ask us on WhatsApp.</p>
            <Button onClick={reset} className="mt-6">Show all products</Button>
          </div>
        )}
      </Container>
    </Section>
  );
}
