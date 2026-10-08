import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useClient } from "./ClientContext.jsx";
import { Container, cx } from "./ui.jsx";

export function Brand({ className, nameClassName }) {
  const { client } = useClient();
  const name = client.business.shortName || client.business.name;
  return (
    <Link to="/" className={cx("flex items-center gap-3", className)} aria-label={`${client.business.name} home`}>
      <img src={client.brand.logo} alt={client.brand.logoOnly ? client.business.name : ""} className="h-9 w-auto md:h-10" />
      {!client.brand.logoOnly && <span className={cx("font-heading text-lg font-bold leading-none md:text-xl", nameClassName)}>{name}</span>}
    </Link>
  );
}

function NavItem({ item, className, activeClassName, onClick }) {
  if (item.to.startsWith("/")) {
    return (
      <NavLink to={item.to} end={item.to === "/"} onClick={onClick} className={({ isActive }) => cx(className, isActive && activeClassName)}>
        {item.label}
      </NavLink>
    );
  }
  const external = /^https?:/.test(item.to);
  return (
    <a href={item.to} onClick={onClick} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {item.label}
    </a>
  );
}

const SHELL = {
  light: "sticky top-0 z-30 border-b border-border bg-background/95 text-foreground backdrop-blur",
  dark: "sticky top-0 z-30 bg-primary text-primary-foreground",
  overlay: "absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-black/70 to-transparent text-white",
};

/**
 * Shared header. `variant` changes the look per industry; `actions` is a slot for things like a cart button.
 * Navigation comes from client.nav, falling back to the template's defaultNav.
 */
export function Header({ variant = "light", actions = null, brandNameClassName, linkClassName = "text-sm font-medium opacity-80 hover:opacity-100" }) {
  const { client, template } = useClient();
  const nav = client.nav ?? template.defaultNav ?? [];
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className={SHELL[variant]}>
      <Container className="flex h-16 items-center justify-between gap-4 md:h-20">
        <Brand nameClassName={brandNameClassName} />
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <NavItem key={item.to + item.label} item={item} className={linkClassName} activeClassName="!opacity-100 underline decoration-accent decoration-2 underline-offset-8" />
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {actions}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-white/10 bg-background text-foreground md:hidden">
          <Container className="flex flex-col py-2">
            {nav.map((item) => (
              <NavItem key={item.to + item.label} item={item} onClick={() => setOpen(false)} className="border-b border-border py-4 text-base font-medium" activeClassName="text-accent-text" />
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
