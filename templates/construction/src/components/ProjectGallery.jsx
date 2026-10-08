import { MediaGallery } from "@wevibed/core";

/** Adapts content/projects.json to the shared MediaGallery. */
export default function ProjectGallery({ projects, limit }) {
  const items = projects.items.map((p) => ({
    id: p.id,
    image: p.image,
    alt: p.alt,
    title: p.title,
    category: p.category,
    location: p.location,
  }));
  const categories = projects.categories?.length ? projects.categories : [...new Set(items.map((i) => i.category))];
  return <MediaGallery items={items} categories={categories} limit={limit} allLabel="All projects" />;
}
