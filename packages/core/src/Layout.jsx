import { SkipLink } from "./ui.jsx";
import { WhatsAppFloat } from "./WhatsAppFloat.jsx";

/**
 * Page frame used by every template: skip link, header, main landmark, footer, WhatsApp button.
 * Pass the template's own <Header variant=... /> and <Footer variant=... />.
 */
export function SiteLayout({ header, footer, floatBottomClassName, children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      {header}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      {footer}
      <WhatsAppFloat bottomClassName={floatBottomClassName} />
    </div>
  );
}
