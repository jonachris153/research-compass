import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BrainCircuit,
  Compass,
  FileSearch,
  FlaskConical,
  Lightbulb,
  Radar,
  ScanSearch,
  Sparkles,
} from "lucide-react";

import { BrandMark } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Research Compass AI — Navigate Research. Discover What's Next." },
      {
        name: "description",
        content:
          "Analyze research literature, uncover emerging patterns, identify potential research gaps, and generate evidence-backed research directions using machine learning.",
      },
      { property: "og:title", content: "Research Compass AI" },
      {
        property: "og:description",
        content:
          "AI-powered research intelligence: research landscape, gap analysis, semantic similarity and ML model comparison.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: FileSearch,
    title: "Research Paper Analysis",
    body: "Extract methodology, algorithms, datasets, limitations and future work from every paper in your corpus.",
  },
  {
    icon: Sparkles,
    title: "Semantic Similarity",
    body: "Describe an idea in plain language and retrieve the closest papers with explained matches.",
  },
  {
    icon: Radar,
    title: "Research Landscape",
    body: "See how topics, algorithms and datasets evolve across publication years.",
  },
  {
    icon: ScanSearch,
    title: "Gap Detection",
    body: "Surface underexplored directions using corpus-based signals and supporting evidence.",
  },
  {
    icon: FlaskConical,
    title: "ML Model Comparison",
    body: "Benchmark classical and neural classifiers on accuracy, precision, recall and F1.",
  },
  {
    icon: Lightbulb,
    title: "Novel Idea Generation",
    body: "Turn evidence-backed gaps into feasible, scoped project directions.",
  },
];

const METRICS = [
  { value: "10K+", label: "Papers Analyzed" },
  { value: "500+", label: "Research Domains" },
  { value: "95%", label: "Semantic Matching Accuracy" },
  { value: "2K+", label: "Potential Research Directions" },
];

const WORKFLOW = [
  "Upload Papers",
  "Extract Knowledge",
  "Analyze Literature",
  "Discover Gaps",
  "Generate Research Directions",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <BrandMark />
            <span className="text-sm font-semibold">Research Compass AI</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Primary">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/help">Docs</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/dashboard">Open App</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="hero-aura relative overflow-hidden">
        <div className="grid-backdrop absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
              <BrainCircuit className="size-3.5 text-primary" aria-hidden />
              AI-powered research intelligence
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Navigate Research.{" "}
              <span className="brand-gradient-text">Discover What&apos;s Next.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
              Analyze research literature, uncover emerging patterns, identify potential research
              gaps, and generate evidence-backed research directions using machine learning.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/dashboard">
                  Start Analyzing Papers
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/dashboard">Explore Demo</Link>
              </Button>
            </div>
          </div>

          <div className="relative grid place-items-center">
            <div className="relative size-72 sm:size-80" aria-hidden>
              <div className="absolute inset-0 animate-[spin_28s_linear_infinite] rounded-full border border-primary/30" />
              <div className="absolute inset-6 animate-[spin_20s_linear_infinite_reverse] rounded-full border border-info/30" />
              <div className="absolute inset-12 rounded-full border border-cyan/30" />
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute inset-0 grid place-items-center">
                <Compass className="size-20 text-primary" />
              </div>
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <span
                  key={deg}
                  className="absolute left-1/2 top-1/2 size-2 rounded-full bg-cyan"
                  style={{
                    transform: `rotate(${deg}deg) translate(140px) rotate(-${deg}deg)`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="panel grid grid-cols-2 divide-border p-2 sm:grid-cols-4 sm:divide-x">
          {METRICS.map((m) => (
            <div key={m.label} className="px-4 py-6 text-center">
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{m.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Platform demo metrics from the sample corpus — not real-world statistics.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Built for literature intelligence</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every module works on the same analyzed corpus, so evidence flows from papers through to
          research directions.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="panel group p-5 transition-colors hover:border-primary/40"
            >
              <span className="inline-grid size-10 place-items-center rounded-lg border border-border bg-elevated text-primary transition-transform group-hover:scale-105">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight">How the workflow runs</h2>
          <ol className="mt-8 grid gap-3 lg:grid-cols-5">
            {WORKFLOW.map((step, i) => (
              <li key={step} className="panel flex items-center gap-3 p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight">
          Start mapping your research domain
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Load a corpus, run the analysis pipeline, and explore potential research opportunities
          with evidence attached to every claim.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link to="/dashboard">
              Open Dashboard <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/gaps">See Gap Analysis</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        Research Compass AI · Academic project for Intelligent Computing using Machine Learning ·
        Demo data only.
      </footer>
    </div>
  );
}
