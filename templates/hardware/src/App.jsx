import { Route, Routes } from "react-router-dom";
import { Footer, Header, NotFound, SiteLayout, useClient } from "@wevibed/core";
import { CartButton, CartDrawer, CartProvider } from "@wevibed/catalog";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import Contact from "./pages/Contact.jsx";

function Frame({ actions }) {
  return (
    <SiteLayout
      header={<Header variant="dark" brandNameClassName="uppercase tracking-wide" linkClassName="text-sm font-semibold uppercase tracking-wider opacity-80 hover:opacity-100" actions={actions} />}
      footer={<Footer variant="dark" />}
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SiteLayout>
  );
}

export default function App() {
  const { client, content } = useClient();
  if (!client.features?.cart) return <Frame actions={null} />;
  return (
    <CartProvider products={content.products.items}>
      <Frame actions={<CartButton />} />
      <CartDrawer />
    </CartProvider>
  );
}
