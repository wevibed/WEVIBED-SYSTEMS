// Shared Tailwind 3 preset. Colours and fonts are CSS variables written into the page <head>
// from client.config.json (see head.mjs / color.js), so one template can look different per client.
const v = (name) => `rgb(var(--wv-${name}) / <alpha-value>)`;

export default {
  theme: {
    extend: {
      colors: {
        background: v("background"),
        foreground: v("foreground"),
        card: v("card"),
        primary: { DEFAULT: v("primary"), foreground: v("primary-foreground") },
        accent: { DEFAULT: v("accent"), foreground: v("accent-foreground"), text: v("accent-text") },
        muted: { DEFAULT: v("muted"), foreground: v("muted-foreground") },
        border: v("border"),
      },
      borderColor: { DEFAULT: v("border") },
      fontFamily: {
        heading: ["var(--wv-font-heading)"],
        body: ["var(--wv-font-body)"],
      },
      borderRadius: {
        DEFAULT: "var(--wv-radius)",
        md: "var(--wv-radius)",
        lg: "calc(var(--wv-radius) * 2)",
      },
    },
  },
  plugins: [
    {
      handler({ addBase }) {
        addBase({
          html: { scrollBehavior: "smooth", WebkitFontSmoothing: "antialiased" },
          body: {
            backgroundColor: "rgb(var(--wv-background))",
            color: "rgb(var(--wv-foreground))",
            fontFamily: "var(--wv-font-body)",
          },
          "h1, h2, h3, h4": { fontFamily: "var(--wv-font-heading)" },
          "::selection": { backgroundColor: "rgb(var(--wv-accent))", color: "rgb(var(--wv-accent-foreground))" },
          "@media (prefers-reduced-motion: reduce)": { html: { scrollBehavior: "auto" } },
        });
      },
    },
  ],
};
