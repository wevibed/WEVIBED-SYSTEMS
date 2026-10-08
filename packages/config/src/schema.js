// Schemas for client.config.json and the content files in clients/<slug>/content/.
// This file is the single definition of "what a client site needs".

const str = (o = {}) => ({ type: "string", min: 1, ...o });
const bool = (o = {}) => ({ type: "boolean", ...o });
const url = (o = {}) => ({ type: "string", format: "url", ...o });
const asset = (o = {}) => ({ type: "string", format: "assetPath", ...o });
const list = (items, o = {}) => ({ type: "array", items, ...o });
const obj = (props, o = {}) => ({ type: "object", props, ...o });

export const CONFIG_SCHEMA = obj({
  schemaVersion: { type: "number", required: true, values: [1] },
  status: str({ required: true, values: ["demo", "draft", "live"] }),
  template: str({ required: true, format: "slug" }),

  business: obj(
    {
      name: str({ required: true }),
      shortName: str(),
      tagline: str({ required: true, max: 80 }),
      description: str({ required: true, min: 20, max: 300 }),
      // schema.org type for search engines, e.g. HardwareStore, GeneralContractor, ClothingStore
      schemaType: str(),
    },
    { required: true },
  ),

  contact: obj(
    {
      whatsapp: str({ required: true, format: "whatsapp" }),
      // Digits with country code, only if the call number differs from the WhatsApp number
      phone: str({ format: "whatsapp" }),
      phoneDisplay: str({ required: true }),
      email: str({ format: "email" }),
      address: obj(
        { line1: str({ required: true }), line2: str(), city: str({ required: true }), country: str({ required: true }) },
        { required: true },
      ),
      mapsUrl: url(),
      hours: list(obj({ days: str({ required: true }), time: str({ required: true }) })),
    },
    { required: true },
  ),

  social: obj({ facebook: url(), instagram: url(), tiktok: url(), x: url() }),

  brand: obj(
    {
      logo: asset({ required: true }),
      // true when the logo image already contains the business name (header then shows the logo only)
      logoOnly: bool(),
      colors: obj(
        {
          primary: str({ required: true, format: "hex" }),
          accent: str({ required: true, format: "hex" }),
          background: str({ format: "hex" }),
          foreground: str({ format: "hex" }),
        },
        { required: true },
      ),
      fonts: obj(
        { heading: str({ required: true }), body: str({ required: true }), headingSerif: bool() },
        { required: true },
      ),
      radius: str(),
    },
    { required: true },
  ),

  hero: obj(
    {
      image: asset({ required: true }),
      imageAlt: str({ required: true }),
      eyebrow: str(),
      headline: str({ required: true, max: 90 }),
      subheadline: str({ required: true, max: 220 }),
      ctaLabel: str(),
      ctaTo: str({ format: "route" }),
    },
    { required: true },
  ),

  nav: list(obj({ label: str({ required: true }), to: str({ required: true, format: "route" }) })),

  features: obj({ cart: bool(), search: bool(), quoteForm: bool(), whatsappFloat: bool() }),

  seo: obj(
    {
      domain: str({ required: true, format: "domain" }),
      ogImage: asset({ required: true }),
      keywords: str(),
      locality: str(),
    },
    { required: true },
  ),

  forms: obj({ mode: str({ values: ["whatsapp", "endpoint"] }), endpoint: url() }),

  currency: obj({ code: str({ required: true }), symbol: str({ required: true }) }),

  deploy: obj({ cloudflareProject: str({ required: true, format: "slug" }) }, { required: true }),
});

const placeholderFlag = bool();

export const CONTENT_SCHEMAS = {
  products: obj({
    categories: list(str()),
    items: list(
      obj({
        id: str({ required: true, format: "slug" }),
        name: str({ required: true }),
        category: str({ required: true }),
        price: { type: "number", nullable: true, min: 0 },
        priceLabel: str(),
        unit: str(),
        description: str(),
        image: asset({ required: true }),
        images: list(asset()),
        sizes: list(str()),
        availability: str({ values: ["in_stock", "low_stock", "sold_out", "enquire"] }),
        badges: list(str({ values: ["new", "featured"] })),
        keywords: str(),
        placeholder: placeholderFlag,
      }),
      { required: true, min: 1 },
    ),
  }),

  projects: obj({
    categories: list(str()),
    items: list(
      obj({
        id: str({ required: true, format: "slug" }),
        title: str({ required: true }),
        category: str({ required: true }),
        image: asset({ required: true }),
        alt: str({ required: true }),
        location: str(),
        year: { type: "number", min: 1900 },
        summary: str(),
        placeholder: placeholderFlag,
      }),
      { required: true, min: 1 },
    ),
  }),

  services: obj({
    items: list(
      obj({
        id: str({ required: true, format: "slug" }),
        title: str({ required: true }),
        description: str({ required: true }),
        image: asset(),
        imageAlt: str(),
        placeholder: placeholderFlag,
      }),
      { required: true, min: 1 },
    ),
  }),

  testimonials: obj({
    items: list(
      obj({ name: str({ required: true }), text: str({ required: true, min: 10 }), role: str(), placeholder: placeholderFlag }),
      { required: true, min: 1 },
    ),
  }),

  about: obj({
    heading: str({ required: true }),
    paragraphs: list(str(), { required: true, min: 1 }),
    highlights: list(obj({ title: str({ required: true }), text: str({ required: true }) })),
    image: asset(),
    imageAlt: str(),
    placeholder: placeholderFlag,
  }),

  process: obj({
    heading: str(),
    steps: list(obj({ title: str({ required: true }), text: str({ required: true }) }), { required: true, min: 1 }),
  }),
};
