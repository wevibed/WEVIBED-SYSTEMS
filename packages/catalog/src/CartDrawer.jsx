import { useEffect } from "react";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Button, Img, useClient, waLink } from "@wevibed/core";
import { useCart } from "./CartContext.jsx";
import { buildCartMessage, formatMoney, priceText } from "./cart.js";

/** Header button showing the item count. */
export function CartButton({ className = "" }) {
  const { totals, setOpen } = useCart();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={`Open cart, ${totals.count} item${totals.count === 1 ? "" : "s"}`}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded ${className}`}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {totals.count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-foreground">
          {totals.count}
        </span>
      )}
    </button>
  );
}

/** Slide-over cart. "Send order" opens WhatsApp with the full order (flow first proven on a hardware-store site, now shared). */
export function CartDrawer() {
  const { client } = useClient();
  const { lines, totals, open, setOpen, setQty, remove, clear } = useCart();
  const symbol = client.currency.symbol;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const message = buildCartMessage({ businessName: client.business.name, lines, symbol });

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Your cart">
      <button type="button" aria-label="Close cart" className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background text-foreground shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-heading text-xl font-bold">Your cart ({totals.count})</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close cart" className="rounded p-2 hover:bg-foreground/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="p-5 text-muted-foreground">Your cart is empty. Add products and send your order on WhatsApp.</p>
        ) : (
          <ul className="flex-1 divide-y divide-border overflow-y-auto">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-4 p-5">
                <Img src={l.product.image} alt={l.product.name} className="h-20 w-20 shrink-0 rounded object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{l.product.name}</p>
                  {l.size && <p className="text-sm text-muted-foreground">Size {l.size}</p>}
                  <p className="text-sm text-muted-foreground">{priceText(l.product, symbol)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" aria-label={`Decrease quantity of ${l.product.name}`} onClick={() => setQty(l.key, l.qty - 1)} className="rounded border border-border p-1.5 hover:bg-foreground/5">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{l.qty}</span>
                    <button type="button" aria-label={`Increase quantity of ${l.product.name}`} onClick={() => setQty(l.key, l.qty + 1)} className="rounded border border-border p-1.5 hover:bg-foreground/5">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" aria-label={`Remove ${l.product.name}`} onClick={() => remove(l.key)} className="ml-auto rounded p-1.5 text-muted-foreground hover:text-foreground">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {lines.length > 0 && (
          <div className="space-y-3 border-t border-border p-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated total{totals.unpricedCount ? " (priced items)" : ""}</span>
              <span className="font-bold">{formatMoney(totals.pricedTotal, symbol)}</span>
            </div>
            <Button variant="accent" size="lg" className="w-full" href={waLink(client.contact.whatsapp, message)}>
              Send order on WhatsApp
            </Button>
            <button type="button" onClick={clear} className="w-full text-center text-sm text-muted-foreground underline">
              Clear cart
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

/** Add-to-cart button. Render it only when features.cart is on (it needs <CartProvider>). */
export function AddToCartButton({ product, size, variant = "primary", className = "", label = "Add to cart", disabled = false }) {
  const { add } = useCart();
  if (product.availability === "sold_out") {
    return <Button variant="outline" disabled className={className}>Sold out</Button>;
  }
  return (
    <Button variant={variant} className={className} disabled={disabled} onClick={() => add(product.id, size)}>
      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      {label}
    </Button>
  );
}
