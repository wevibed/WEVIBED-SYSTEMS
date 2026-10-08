import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { filterProducts, deriveCategories } from "./filter.js";

/** Search input with clear button. */
export function SearchBox({ value, onChange, placeholder = "Search products", className = "" }) {
  return (
    <label className={`relative block ${className}`}>
      <span className="sr-only">Search products</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-border bg-card py-3 pl-12 pr-11 text-base text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  );
}

/** Query + category state and the filtered list, in one hook. */
export function useCatalog(products, { initialCategory = "All" } = {}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const categories = useMemo(() => deriveCategories(products.items, products.categories), [products]);
  const results = useMemo(() => filterProducts(products.items, { query, category }), [products, query, category]);
  const reset = () => {
    setQuery("");
    setCategory("All");
  };
  return { query, setQuery, category, setCategory, categories, results, reset };
}
