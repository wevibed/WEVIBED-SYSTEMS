import { Route, Routes } from "react-router-dom";
import { Footer, Header, NotFound, SiteLayout, useClient } from "@wevibed/core";
import { CartButton, CartDrawer, CartProvider } from "@wevibed/catalog";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";

function Frame({ actions }) {
  return (
    <SiteLayout header={<Header variant="light" brandNameClassName="tracking-wide" actions={actions} />} footer={<Footer variant="light" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
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
