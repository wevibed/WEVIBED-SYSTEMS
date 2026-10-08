import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Button, Img, cx, productEnquiryText, useClient, waLink } from "@wevibed/core";
import { AddToCartButton, priceText } from "@wevibed/catalog";

export const AVAILABILITY_LABEL = {
  in_stock: "In stock",
  low_stock: "Low stock",
  sold_out: "Sold out",
  enquire: "Ask for availability",
};

export default function ProductCard({ product }) {
  const { client } = useClient();
  const symbol = client.currency.symbol;
  const sold = product.availability === "sold_out";
  const price = priceText(product, symbol);
  const needsSize = (product.sizes?.length ?? 0) > 0;
  const enquiry = waLink(client.contact.whatsapp, productEnquiryText({ businessName: client.business.name, product, priceText: price }));
  const to = `/product/${product.id}`;

  return (
    <article className="group flex h-full flex-col">
      <Link to={to} className="relative block overflow-hidden rounded-lg bg-muted" aria-label={`${product.name}, ${price}`}>
        <Img src={product.image} alt="" className={cx("aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-105", sold && "opacity-60")} />
        <span className="absolute left-3 top-3 flex gap-2">
          {product.badges?.includes("new") && <span className="rounded bg-accent px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-foreground">New</span>}
          {sold && <span className="rounded bg-primary px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">Sold out</span>}
        </span>
      </Link>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{product.category}</p>
          <h3 className="mt-1 font-heading text-lg leading-snug">
            <Link to={to} className="hover:text-accent-text">{product.name}</Link>
          </h3>
        </div>
        <p className={cx("shrink-0 font-semibold", sold && "text-muted-foreground line-through")}>{price}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {AVAILABILITY_LABEL[product.availability ?? "in_stock"]}
        {needsSize ? ` · Sizes ${product.sizes.join(", ")}` : ""}
      </p>
      {!sold && (
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Button variant="outline" size="sm" href={enquiry}>
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" /> Ask on WhatsApp
          </Button>
          {client.features?.cart &&
            (needsSize ? (
              <Button variant="primary" size="sm" to={to}>Choose size</Button>
            ) : (
              <AddToCartButton product={product} variant="primary" className="px-4 py-2 text-xs" label="Add" />
            ))}
        </div>
      )}
    </article>
  );
}
