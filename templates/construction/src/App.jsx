import { Route, Routes } from "react-router-dom";
import { Footer, Header, NotFound, SiteLayout } from "@wevibed/core";
import Home from "./pages/Home.jsx";
import Projects from "./pages/Projects.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";

export default function App() {
  return (
    <SiteLayout header={<Header variant="dark" brandNameClassName="tracking-tight" />} footer={<Footer variant="dark" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SiteLayout>
  );
}
