import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { useClient } from "@wevibed/core";
import { cartReducer, sanitizeCart, cartLines, cartTotals } from "./cart.js";

const Ctx = createContext(null);

function load(key) {
  try {
    return sanitizeCart(JSON.parse(localStorage.getItem(key) ?? "[]"));
  } catch {
    return []; // storage blocked or corrupted: start with an empty cart
  }
}

/** Cart state for one site. Persists to localStorage under a per-domain key. */
export function CartProvider({ products, children }) {
  const { client } = useClient();
  const storageKey = `wv-cart:${client.seo.domain}`;
  const [raw, dispatch] = useReducer(cartReducer, storageKey, load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(raw));
    } catch {
      /* storage unavailable: cart still works for this visit */
    }
  }, [storageKey, raw]);

  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const lines = useMemo(() => cartLines(raw, byId), [raw, byId]);
  const totals = useMemo(() => cartTotals(lines), [lines]);

  const api = useMemo(
    () => ({
      lines,
      totals,
      open,
      setOpen,
      add: (id, size) => {
        dispatch({ type: "add", id, size });
        setOpen(true);
      },
      setQty: (key, qty) => dispatch({ type: "setQty", key, qty }),
      remove: (key) => dispatch({ type: "remove", key }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [lines, totals, open],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useCart must be used inside <CartProvider>");
  return value;
}
