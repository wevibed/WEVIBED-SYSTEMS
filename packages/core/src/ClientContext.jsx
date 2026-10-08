import { createContext, useContext, useEffect, useMemo } from "react";
import { siteTitle } from "../../config/src/meta.js";

const Ctx = createContext(null);

/** Makes the client's config, content and template metadata available to every component. */
export function ClientProvider({ data, children }) {
  const value = useMemo(() => ({ client: data.config, content: data.content, template: data.template }), [data]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useClient() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useClient must be used inside <ClientProvider>");
  return value;
}

/** Per-page <title> and description (the static <head> is generated at build time). */
export function usePageMeta(title, description) {
  const { client } = useClient();
  useEffect(() => {
    document.title = title ? `${title} | ${client.business.name}` : siteTitle(client);
    const tag = document.querySelector('meta[name="description"]');
    if (tag) tag.setAttribute("content", description || client.business.description);
  }, [client, title, description]);
}
