import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export const cx = (...parts) => parts.filter(Boolean).join(" ");

export function Container({ className, as: Tag = "div", children }) {
  return <Tag className={cx("mx-auto w-full max-w-7xl px-5 md:px-10", className)}>{children}</Tag>;
}

export function Section({ id, className, tone, children }) {
  return (
    <section id={id} className={cx("py-16 md:py-24", tone === "muted" && "bg-muted", tone === "primary" && "bg-primary text-primary-foreground", className)}>
      {children}
    </section>
  );
}

export function Eyebrow({ className, children }) {
  return <p className={cx("text-xs font-semibold uppercase tracking-[0.2em] text-accent-text", className)}>{children}</p>;
}

export function SectionHeading({ eyebrow, title, text, align = "left", className, titleClassName }) {
  return (
    <div className={cx(align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
      <h2 className={cx("font-heading text-3xl font-bold leading-tight md:text-5xl", titleClassName)}>{title}</h2>
      {text && <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{text}</p>}
    </div>
  );
}

const VARIANTS = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  accent: "bg-accent text-accent-foreground hover:opacity-90",
  outline: "border border-current hover:bg-foreground/5",
  light: "bg-white text-neutral-900 hover:bg-white/90",
  ghost: "hover:bg-foreground/5",
};
const SIZES = { sm: "px-4 py-2 text-xs", md: "px-6 py-3 text-sm", lg: "px-8 py-4 text-sm" };

/** Renders a router <Link> (to), an <a> (href) or a <button>. */
export function Button({ variant = "primary", size = "md", to, href, onClick, type = "button", disabled, className, children, ...rest }) {
  const classes = cx(
    "inline-flex items-center justify-center gap-2 rounded font-semibold uppercase tracking-wider transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
  // `to` may be a route ("/shop"), an anchor ("#contact") or an external/tel/mailto link.
  if (to && to.startsWith("/")) return <Link to={to} className={classes} {...rest}>{children}</Link>;
  const target = href ?? to;
  if (target) {
    const external = /^https?:/.test(target);
    return (
      <a href={target} className={classes} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...rest}>
        {children}
      </a>
    );
  }
  return <button type={type} onClick={onClick} disabled={disabled} className={classes} {...rest}>{children}</button>;
}

/** Image with lazy loading by default. `alt` is mandatory: pass alt="" only for decoration. */
export function Img({ src, alt, className, eager = false, ...rest }) {
  return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className={className} {...rest} />;
}

/** Fade/slide in once when scrolled into view. Always visible if motion is reduced or unsupported. */
export function Reveal({ as: Tag = "div", delay = 0, className, children }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => typeof window === "undefined" || !("IntersectionObserver" in window));

  useEffect(() => {
    if (shown) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cx(
        "transition duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** First focusable element: lets keyboard users jump past the navigation. */
export function SkipLink() {
  return (
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground">
      Skip to content
    </a>
  );
}
