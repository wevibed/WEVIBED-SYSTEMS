import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import data from "virtual:wevibed-client";
import "./base.css";
import { ClientProvider, usePageMeta } from "./ClientContext.jsx";
import { Button, Container } from "./ui.jsx";

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function NotFound() {
  usePageMeta("Page not found");
  return (
    <Container className="py-32 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-accent-text">404</p>
      <h1 className="mt-3 font-heading text-4xl font-bold">We couldn’t find that page</h1>
      <p className="mt-4 text-muted-foreground">The link may be old or mistyped.</p>
      <Button to="/" className="mt-8">Back to the home page</Button>
    </Container>
  );
}

/** Every template's main.jsx calls this with its <App/>. */
export function mountApp(App) {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <BrowserRouter>
        <ClientProvider data={data}>
          <ScrollToTop />
          <App />
        </ClientProvider>
      </BrowserRouter>
    </StrictMode>,
  );
}
