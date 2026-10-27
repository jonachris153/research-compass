import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { globalSearch } from "@/services/api";
import type { GlobalSearchResults } from "@/types/research";

const EMPTY: GlobalSearchResults = { papers: [], topics: [], gaps: [], ideas: [] };

export function GlobalSearch() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    if (!term.trim()) {
      setResults(EMPTY);
      return;
    }
    const t = setTimeout(async () => {
      const res = await globalSearch(term);
      if (active) setResults(res);
    }, 150);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [term]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const total =
    results.papers.length + results.topics.length + results.gaps.length + results.ideas.length;

  function go(to: string) {
    setOpen(false);
    setTerm("");
    navigate({ to });
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor="global-search" className="sr-only">
        Search papers, topics, gaps and ideas
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        id="global-search"
        value={term}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        placeholder="Search papers, topics, gaps, ideas…"
        className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/60"
      />

      {open && term.trim() ? (
        <div className="absolute left-0 right-0 top-11 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-popover p-2 shadow-2xl">
          <div className="flex flex-wrap gap-1.5 px-2 pb-2 text-[11px] text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-0.5">
              Papers {results.papers.length}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">
              Topics {results.topics.length}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5">Gaps {results.gaps.length}</span>
            <span className="rounded-full bg-muted px-2 py-0.5">Ideas {results.ideas.length}</span>
          </div>

          {total === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No matches in the demo corpus.
            </p>
          ) : null}

          {results.papers.map((p) => (
            <button
              key={p.id}
              onClick={() => go(`/papers/${p.id}`)}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span className="line-clamp-1">{p.title}</span>
              <span className="text-xs text-muted-foreground">
                Paper · {p.topic} · {p.year}
              </span>
            </button>
          ))}
          {results.topics.map((t) => (
            <button
              key={t.id}
              onClick={() => go("/landscape")}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
            >
              {t.name}
              <span className="block text-xs text-muted-foreground">
                Topic · {t.paperCount} papers
              </span>
            </button>
          ))}
          {results.gaps.map((g) => (
            <button
              key={g.id}
              onClick={() => go("/gaps")}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span className="line-clamp-1">{g.title}</span>
              <span className="text-xs text-muted-foreground">Gap · score {g.gapScore}</span>
            </button>
          ))}
          {results.ideas.map((i) => (
            <button
              key={i.id}
              onClick={() => go("/ideas")}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span className="line-clamp-1">{i.title}</span>
              <span className="text-xs text-muted-foreground">Idea · novelty {i.noveltyScore}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
