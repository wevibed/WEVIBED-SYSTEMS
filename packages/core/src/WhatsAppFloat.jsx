import { MessageCircle } from "lucide-react";
import { useClient } from "./ClientContext.jsx";
import { waLink, generalEnquiryText } from "./whatsapp.js";

export function WhatsAppFloat({ bottomClassName = "bottom-5" }) {
  const { client } = useClient();
  if (client.features?.whatsappFloat === false) return null;
  return (
    <a
      href={waLink(client.contact.whatsapp, generalEnquiryText(client.business.name))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50 ${bottomClassName}`}
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
