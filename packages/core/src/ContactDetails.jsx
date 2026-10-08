import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useClient } from "./ClientContext.jsx";
import { waLink, generalEnquiryText } from "./whatsapp.js";
import { cx } from "./ui.jsx";

export function formatAddress(address) {
  return [address.line1, address.line2, address.city, address.country].filter(Boolean).join(", ");
}

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-4">
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent-text">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <div className="mt-1 text-base leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

/** Address, phone, WhatsApp, email and opening hours, all straight from client.config.json. */
export function ContactDetails({ className }) {
  const { client } = useClient();
  const c = client.contact;
  const tel = `tel:+${c.phone ?? c.whatsapp}`;
  return (
    <div className={cx("space-y-6", className)}>
      <Row icon={MapPin} label="Find us">
        <p>{formatAddress(c.address)}</p>
        {c.mapsUrl && (
          <a href={c.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold text-accent-text underline underline-offset-4">
            Get directions
          </a>
        )}
      </Row>
      <Row icon={Phone} label="Call">
        <a href={tel} className="hover:text-accent-text">{c.phoneDisplay}</a>
      </Row>
      <Row icon={MessageCircle} label="WhatsApp">
        <a href={waLink(c.whatsapp, generalEnquiryText(client.business.name))} target="_blank" rel="noopener noreferrer" className="hover:text-accent-text">
          Message us on WhatsApp
        </a>
      </Row>
      {c.email && (
        <Row icon={Mail} label="Email">
          <a href={`mailto:${c.email}`} className="break-all hover:text-accent-text">{c.email}</a>
        </Row>
      )}
      {c.hours?.length > 0 && (
        <Row icon={Clock} label="Opening hours">
          <ul className="space-y-1">
            {c.hours.map((h) => (
              <li key={h.days} className="flex justify-between gap-6">
                <span>{h.days}</span>
                <span className="text-muted-foreground">{h.time}</span>
              </li>
            ))}
          </ul>
        </Row>
      )}
    </div>
  );
}
