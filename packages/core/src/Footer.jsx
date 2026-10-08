import { Link } from "react-router-dom";
import { useClient } from "./ClientContext.jsx";
import { Container, cx } from "./ui.jsx";
import { formatAddress } from "./ContactDetails.jsx";

const SOCIAL_LABELS = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", x: "X" };

const TONES = {
  dark: "bg-primary text-primary-foreground",
  light: "border-t border-border bg-muted text-foreground",
};

export function Footer({ variant = "dark", note }) {
  const { client, template } = useClient();
  const nav = client.nav ?? template.defaultNav ?? [];
  const c = client.contact;
  const socials = Object.entries(client.social ?? {}).filter(([, href]) => href);

  return (
    <footer className={TONES[variant]}>
      <Container className="grid gap-10 py-14 md:grid-cols-3">
        <div>
          <p className="font-heading text-xl font-bold">{client.business.name}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed opacity-75">{client.business.description}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            {nav
              .filter((i) => i.to.startsWith("/"))
              .map((i) => (
                <li key={i.to + i.label}>
                  <Link to={i.to} className="opacity-80 hover:opacity-100">{i.label}</Link>
                </li>
              ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-60">Contact</p>
          <ul className="mt-4 space-y-2 text-sm opacity-90">
            <li>{formatAddress(c.address)}</li>
            <li><a href={`tel:+${c.phone ?? c.whatsapp}`} className="hover:underline">{c.phoneDisplay}</a></li>
            {c.email && <li><a href={`mailto:${c.email}`} className="break-all hover:underline">{c.email}</a></li>}
          </ul>
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-4 text-sm">
              {socials.map(([key, href]) => (
                <li key={key}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="underline-offset-4 opacity-80 hover:underline hover:opacity-100">
                    {SOCIAL_LABELS[key] ?? key}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Container>
      <div className={cx("border-t py-5 text-xs opacity-70", variant === "dark" ? "border-white/10" : "border-border")}>
        <Container className="flex flex-col justify-between gap-2 sm:flex-row">
          <p>© {new Date().getFullYear()} {client.business.name}. All rights reserved.</p>
          {note && <p>{note}</p>}
        </Container>
      </div>
    </footer>
  );
}
