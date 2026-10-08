import { MessageCircle } from "lucide-react";
import { Button, Img, productEnquiryText, useClient, waLink } from "@wevibed/core";
import { AddToCartButton, priceText } from "@wevibed/catalog";

export default function ProductCard({ product }) {
  const { client } = useClient();
  const price = priceText(product, client.currency.symbol);
  const sold = product.availability === "sold_out";
  const enquiry = waLink(client.contact.whatsapp, productEnquiryText({ businessName: client.business.name, product, priceText: price }));

  return (
    <article className="flex h-full flex-col overflow-hidden border border-border bg-card">
      <div className="relative bg-white">
        <Img src={product.image} alt={product.name} className="aspect-square w-full object-contain p-4" />
        {sold && <span className="absolute left-0 top-3 bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">Sold out</span>}
        {product.badges?.includes("new") && !sold && <span className="absolute left-0 top-3 bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground">New</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{product.category}</p>
        <h3 className="mt-1 font-heading text-xl font-semibold uppercase leading-tight tracking-wide">{product.name}</h3>
        {product.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>}
        <p className="mt-3 font-heading text-2xl font-bold text-accent-text">{price}</p>
        <div className="mt-auto space-y-2 pt-4">
          {client.features?.cart && !sold ? (
            <AddToCartButton product={product} variant="accent" className="w-full" label="Add to cart" />
          ) : (
            !sold && (
              <Button variant="accent" className="w-full" href={enquiry}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Ask on WhatsApp
              </Button>
            )
          )}
          {client.features?.cart && !sold && (
            <a href={enquiry} target="_blank" rel="noopener noreferrer" className="block text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Ask about this item
            </a>
          )}
          {sold && <Button variant="outline" disabled className="w-full">Sold out</Button>}
        </div>
      </div>
    </article>
  );
}
