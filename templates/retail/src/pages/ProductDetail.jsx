import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, MessageCircle } from "lucide-react";
import { Button, Container, Img, NotFound, Section, SectionHeading, cx, productEnquiryText, useClient, usePageMeta, waLink } from "@wevibed/core";
import { AddToCartButton, priceText } from "@wevibed/catalog";
import ProductCard, { AVAILABILITY_LABEL } from "../components/ProductCard.jsx";

export default function ProductDetail() {
  const { id } = useParams();
  const { client, content } = useClient();
  const product = content.products.items.find((p) => p.id === id);
  const [size, setSize] = useState("");
  const [active, setActive] = useState(0);
  usePageMeta(product?.name, product?.description);

  if (!product) return <NotFound />;

  const symbol = client.currency.symbol;
  const price = priceText(product, symbol);
  const sold = product.availability === "sold_out";
  const needsSize = (product.sizes?.length ?? 0) > 0;
  const gallery = [product.image, ...(product.images ?? [])];
  const related = content.products.items.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const enquiry = waLink(client.contact.whatsapp, productEnquiryText({ businessName: client.business.name, product, size, priceText: price }));

  return (
    <>
      <Section className="pb-10 pt-8 md:pt-12">
        <Container>
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back to shop
          </Link>
          <div className="mt-6 grid gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <Img src={gallery[active]} alt={product.name} eager className="aspect-[4/5] w-full rounded-lg bg-muted object-cover" />
              {gallery.length > 1 && (
                <ul className="mt-3 grid grid-cols-4 gap-3">
                  {gallery.map((src, i) => (
                    <li key={src + i}>
                      <button
                        type="button"
                        onClick={() => setActive(i)}
                        aria-label={`Show image ${i + 1} of ${gallery.length}`}
                        aria-pressed={i === active}
                        className={cx("block w-full overflow-hidden rounded border-2", i === active ? "border-accent" : "border-transparent")}
                      >
                        <Img src={src} alt="" className="aspect-square w-full object-cover" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-text">{product.category}</p>
              <h1 className="mt-2 font-heading text-4xl font-bold leading-tight md:text-5xl">{product.name}</h1>
              <p className="mt-4 text-2xl font-semibold">{price}</p>
              <p className="mt-1 text-sm text-muted-foreground">{AVAILABILITY_LABEL[product.availability ?? "in_stock"]}</p>
              {product.description && <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>}

              {needsSize && (
                <fieldset className="mt-8">
                  <legend className="text-sm font-semibold">Size</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.sizes.map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={size === s}
                        onClick={() => setSize(s)}
                        className={cx(
                          "min-w-12 rounded border px-4 py-2 text-sm font-semibold transition",
                          size === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {!sold ? (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="accent" size="lg" href={enquiry}>
                    <MessageCircle className="h-4 w-4" aria-hidden="true" /> Ask on WhatsApp
                  </Button>
                  {client.features?.cart && <AddToCartButton product={product} size={size || undefined} variant="primary" disabled={needsSize && !size} className="px-8 py-4" />}
                </div>
              ) : (
                <p className="mt-8 rounded bg-muted p-4 text-sm">This item is sold out. Message us and we will tell you when it is back.</p>
              )}
              {needsSize && !size && !sold && client.features?.cart && <p className="mt-3 text-sm text-muted-foreground">Select a size to add this item to your cart.</p>}
            </div>
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section tone="muted">
          <Container>
            <SectionHeading eyebrow="More like this" title="You may also like" />
            <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
