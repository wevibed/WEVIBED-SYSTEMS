import { Reveal } from "@wevibed/core";

export default function ProcessSteps({ steps }) {
  return (
    <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title}>
          <Reveal delay={i * 80} className="h-full border-t-2 border-accent pt-5">
            <span className="font-heading text-5xl font-extrabold tracking-tight text-accent-text">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-3 font-heading text-xl font-bold">{s.title}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.text}</p>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
