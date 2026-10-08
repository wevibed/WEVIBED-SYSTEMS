import { useId, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useClient } from "./ClientContext.jsx";
import { buildEnquiryMessage, waLink } from "./whatsapp.js";
import { validateFields } from "./forms.js";
import { Button, cx } from "./ui.jsx";

const INPUT =
  "mt-1.5 w-full rounded border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30";

/**
 * Enquiry / quote form that really delivers.
 *  - mode "whatsapp" (default): composes the message and opens WhatsApp to the client's number.
 *  - mode "endpoint": POSTs JSON to forms.endpoint (Formspree, Web3Forms, a Worker, ...) and reports
 *    success or failure honestly. A WhatsApp link is always offered as a fallback.
 * Fields: [{ name, label, type: text|tel|email|textarea|select, required, options, placeholder }]
 */
export function EnquiryForm({ fields, subject, submitLabel = "Send enquiry", className }) {
  const { client } = useClient();
  const uid = useId();
  const mode = client.forms?.mode ?? "whatsapp";
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, ""])));
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ status: "idle" });

  const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (form.elements.namedItem("company_website")?.value) return; // honeypot: bots fill hidden fields
    const found = validateFields(fields, values);
    setErrors(found);
    if (Object.keys(found).length) return;

    const message = buildEnquiryMessage({ businessName: client.business.name, subject, fields, values });
    const link = waLink(client.contact.whatsapp, message);

    if (mode === "endpoint") {
      setState({ status: "sending" });
      try {
        const res = await fetch(client.forms.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ business: client.business.name, subject, message, ...values }),
        });
        if (!res.ok) throw new Error(`The server answered ${res.status}`);
        setState({ status: "sent", link });
      } catch (err) {
        setState({ status: "failed", link, detail: err.message });
      }
      return;
    }

    const win = window.open(link, "_blank");
    if (win) win.opener = null;
    setState({ status: "opened", link, blocked: !win });
  }

  return (
    <form onSubmit={onSubmit} noValidate className={cx("relative space-y-5", className)}>
      {fields.map((f) => {
        const id = `${uid}-${f.name}`;
        const errId = `${id}-err`;
        const common = {
          id,
          name: f.name,
          value: values[f.name],
          required: f.required,
          placeholder: f.placeholder,
          autoComplete: f.autoComplete,
          "aria-invalid": errors[f.name] ? true : undefined,
          "aria-describedby": errors[f.name] ? errId : undefined,
          onChange: (e) => set(f.name, e.target.value),
          className: INPUT,
        };
        return (
          <div key={f.name}>
            <label htmlFor={id} className="text-sm font-semibold">
              {f.label}
              {f.required && <span className="text-accent-text"> *</span>}
            </label>
            {f.type === "textarea" ? (
              <textarea rows={4} {...common} />
            ) : f.type === "select" ? (
              <select {...common}>
                <option value="">Select…</option>
                {f.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input type={f.type ?? "text"} {...common} />
            )}
            {errors[f.name] && (
              <p id={errId} role="alert" className="mt-1 text-sm text-red-600">
                {errors[f.name]}
              </p>
            )}
          </div>
        );
      })}

      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={state.status === "sending"}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {state.status === "sending" ? "Sending…" : mode === "whatsapp" ? `${submitLabel} on WhatsApp` : submitLabel}
      </Button>

      <div aria-live="polite" className="text-sm">
        {state.status === "sent" && <p className="rounded bg-muted p-4">Thank you, your enquiry was sent. We will get back to you shortly.</p>}
        {state.status === "opened" && (
          <p className="rounded bg-muted p-4">
            Your message is ready in WhatsApp — press send there to deliver it.{" "}
            <a href={state.link} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent-text underline">
              {state.blocked ? "WhatsApp did not open: tap here" : "Didn’t open? Tap here"}
            </a>
          </p>
        )}
        {state.status === "failed" && (
          <p role="alert" className="rounded bg-red-50 p-4 text-red-800">
            We could not send your enquiry ({state.detail}). Please{" "}
            <a href={state.link} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
              send it on WhatsApp instead
            </a>
            .
          </p>
        )}
      </div>
    </form>
  );
}
