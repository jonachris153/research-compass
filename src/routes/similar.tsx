import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Bookmark,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Filter,
  Lightbulb,
  Search,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState, LoadingSkeleton, PageHeader } from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { exportAsFile, findSimilarPapers, getAnalyzedPapers, getPapers } from "@/services/api";
import type { SimilarityResult } from "@/types/research";

export const Route = createFileRoute("/similar")({
  head: () => ({
    meta: [
      { title: "Similar Papers & Structured Selection — Research Compass AI" },
      {
        name: "description",
        content:
          "Find semantically similar papers by idea, uploaded paper, or corpus literature with structured metadata for selection.",
      },
    ],
  }),
  component: SimilarPapersPage,
});

type SearchMode = "idea" | "paper";

const PROMPT_SUGGESTIONS = [
  "Lightweight CNN for human activity recognition on wearable inertial sensors with on-device latency constraints",
  "Transformer-based self-attention models for temporal sequence modeling of multi-channel accelerometer signals",
  "Self-supervised contrastive representation learning for unlabeled sensor streams in healthcare monitoring",
  "Explainable AI (XAI) and saliency map visualization for sensor-based activity classification",
  "Zero-shot cross-subject transfer learning for unseen daily living activities",
];

function getPublisherBadgeClass(publisher?: string) {
  const p = (publisher || "").toLowerCase();
  if (p.includes("ieee")) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (p.includes("acm")) return "bg-purple-500/15 text-purple-400 border-purple-500/30";
  if (p.includes("nature") || p.includes("springer"))
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (p.includes("elsevier")) return "bg-orange-500/15 text-orange-400 border-orange-500/30";
  if (p.includes("sensors") || p.includes("mdpi"))
    return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  if (p.includes("arxiv")) return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  return "bg-primary/10 text-primary border-primary/25";
}

function SimilarPapersPage() {
  const [searchMode, setSearchMode] = useState<SearchMode>("idea");
  const [queryText, setQueryText] = useState("");
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [results, setResults] = useState<SimilarityResult[] | null>(null);
  const [shortlisted, setShortlisted] = useState<Record<string, SimilarityResult>>({});
  const [sortBy, setSortBy] = useState<"similarity" | "year" | "citations">("similarity");

  const navigate = useNavigate();

  // Load existing papers, prioritizing the instant uploaded paper
  const { data: papersData } = useQuery({
    queryKey: ["papers-list-for-similarity"],
    queryFn: () => getPapers({ pageSize: 50 }),
  });
  const { data: instantPapersData } = useQuery({
    queryKey: ["instant-papers-for-similarity"],
    queryFn: getAnalyzedPapers,
  });

  const instantIds = useMemo(
    () => new Set((instantPapersData || []).map((p) => p.id)),
    [instantPapersData],
  );

  const rawPapers = papersData?.items || [];
  const papers = useMemo(() => {
    return [...rawPapers].sort((a, b) => {
      const aIs = instantIds.has(a.id) ? 1 : 0;
      const bIs = instantIds.has(b.id) ? 1 : 0;
      return bIs - aIs;
    });
  }, [rawPapers, instantIds]);

  // Results are not generated automatically; only when the user gives input


  const mutation = useMutation({
    mutationFn: (args: { query?: string; paperId?: string }) => findSimilarPapers(args),
    onSuccess: (data) => {
      setResults(data);
      if (data.length > 0) {
        toast.success(`Found ${data.length} semantically relevant literature matches!`);
      }
    },
    onError: () => {
      toast.error("Semantic search failed. Please verify your query or selection.");
    },
  });

  const handleIdeaSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) {
      toast.warning("Please type your research idea or hypothesis first.");
      return;
    }
    mutation.mutate({ query: queryText.trim() });
  };

  const handlePaperSelectSearch = (paperId: string) => {
    setSelectedPaperId(paperId);
    if (paperId) {
      const selected = papers.find((p) => p.id === paperId);
      mutation.mutate(
        selected
          ? { paperId, query: `${selected.title} ${selected.topic} ${selected.abstract}` }
          : { paperId },
      );
    } else {
      setResults(null);
    }
  };


  const toggleShortlist = (res: SimilarityResult) => {
    setShortlisted((prev) => {
      const next = { ...prev };
      if (next[res.paperId]) {
        delete next[res.paperId];
        toast.info(`Removed "${res.title.slice(0, 30)}…" from shortlist.`);
      } else {
        next[res.paperId] = res;
        toast.success(`Selected "${res.title.slice(0, 30)}…" for paper shortlist.`);
      }
      return next;
    });
  };

  const copyCitation = (res: SimilarityResult) => {
    const validAuthors = res.authors?.filter((a) => a && !a.toLowerCase().includes("unknown")) || [];
    const authorsFormatted = validAuthors.length > 0 ? validAuthors.join(", ") : "Research Authors";
    const publisher = res.publisher || res.journal || "IEEE / ACM Conference";
    const citation = `${authorsFormatted} (${res.year}). "${res.title}." In ${publisher}.`;
    navigator.clipboard.writeText(citation);
    toast.success("APA Citation copied to clipboard!");
  };

  const exportShortlistBibTeX = () => {
    const items = Object.values(shortlisted);
    if (items.length === 0) {
      toast.warning("No papers shortlisted yet.");
      return;
    }
    const bibtex = items
      .map((item, idx) => {
        const key = `${(item.authors?.[0] || "Author").split(" ").pop()?.toLowerCase() || "paper"}${item.year}_${idx + 1}`;
        return `@article{${key},\n  title={${item.title}},\n  author={${item.authors?.join(" and ") || "Unknown"}},\n  journal={${item.publisher || item.journal || "Research Literature"}},\n  year={${item.year}},\n  topic={${item.topic}}\n}`;
      })
      .join("\n\n");

    const blob = new Blob([bibtex], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shortlisted-papers-${Date.now()}.bib`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${items.length} shortlisted papers as BibTeX!`);
  };

  // Sort results
  const sortedResults = results
    ? [...results].sort((a, b) => {
        if (sortBy === "similarity") return b.similarity - a.similarity;
        if (sortBy === "year") return b.year - a.year;
        if (sortBy === "citations") return (b.citations || 0) - (a.citations || 0);
        return 0;
      })
    : null;

  const shortlistedCount = Object.keys(shortlisted).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Similar Papers & Structured Selection"
          subtitle="Retrieve and select semantically relevant research literature based on ideas, existing corpus papers, or new PDF uploads."
        />

        {/* Input Mode Selector Tabs */}
        <div className="panel p-6 space-y-5">
          <div className="flex border-b border-border gap-2">
            <button
              onClick={() => {
                setSearchMode("idea");
                setResults(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                searchMode === "idea"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lightbulb className="size-4" />
              1. Search by Idea / Hypothesis
            </button>
            <button
              onClick={() => {
                setSearchMode("paper");
                setResults(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                searchMode === "paper"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-4" />
              2. Match from Existing Corpus Paper
            </button>
          </div>

          {/* Mode 1: Idea / Hypothesis */}
          {searchMode === "idea" && (
            <form onSubmit={handleIdeaSearch} className="space-y-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-4 size-5 text-muted-foreground" />
                <textarea
                  rows={3}
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  placeholder="Describe your research concept, methodology, or specific architecture requirements (e.g. Lightweight CNN for human activity recognition on wearable inertial sensors)..."
                  className="w-full rounded-xl border border-border bg-surface p-4 pl-12 text-sm placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                />
              </div>

              {/* Suggestions */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Quick Research Prompts:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PROMPT_SUGGESTIONS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQueryText(prompt)}
                      className="rounded-lg border border-border/70 bg-background/50 px-2.5 py-1 text-[11px] text-slate-300 hover:border-primary/50 hover:bg-primary/5 hover:text-white transition-all text-left truncate max-w-md"
                    >
                      💡 {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground">
                  Sentence Transformers (all-MiniLM-L6-v2) embedding similarity
                </span>
                <Button type="submit" disabled={mutation.isPending || !queryText.trim()}>
                  <Sparkles className="mr-1.5 size-4" />
                  {mutation.isPending ? "Computing Semantic Embeddings…" : "Find Similar Papers"}
                </Button>
              </div>
            </form>
          )}

          {/* Mode 2: Match from Corpus Paper */}
          {searchMode === "paper" && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select a Paper from Your Corpus:
              </label>
              <select
                value={selectedPaperId}
                onChange={(e) => handlePaperSelectSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface p-3.5 text-sm text-foreground focus:border-primary/60 focus:outline-none"
              >
                <option value="">
                  -- Choose an uploaded paper to find its nearest counterparts --
                </option>
                {papers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {instantIds.has(p.id) ? "⚡ [Instant Upload] " : ""}
                    {p.title} ({p.authors[0] || "Author"} · {p.year} ·{" "}
                    {p.metadata?.journal || "Journal"})
                  </option>
                ))}
              </select>

              {selectedPaperId && (
                <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-slate-300 flex items-center justify-between">
                  <span>
                    Searching for literature matching the methodology and topic of the selected
                    paper.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePaperSelectSearch(selectedPaperId)}
                    disabled={mutation.isPending}
                  >
                    <Sparkles className="mr-1 size-3.5" /> Re-scan
                  </Button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Shortlist Action Bar if items selected */}
        {shortlistedCount > 0 && (
          <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                {shortlistedCount}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {shortlistedCount} Paper{shortlistedCount !== 1 ? "s" : ""} Selected for Corpus
                  Shortlist
                </p>
                <p className="text-xs text-muted-foreground">
                  Ready for export or comparative benchmark analysis.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={exportShortlistBibTeX}
                className="gap-1.5"
              >
                <Bookmark className="size-3.5 text-primary" /> Export BibTeX
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportAsFile("shortlisted_papers.json", Object.values(shortlisted))}
                className="gap-1.5"
              >
                <Share2 className="size-3.5" /> Export JSON
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShortlisted({})}
                className="text-muted-foreground hover:text-destructive gap-1"
              >
                <Trash2 className="size-3.5" /> Clear
              </Button>
            </div>
          </div>
        )}

        {/* Results Header & Controls */}
        {results && results.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                Structured Similarity Matches ({results.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Ranked by semantic vector proximity to your input idea/paper.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "similarity" | "year" | "citations")}
                className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:outline-none"
              >
                <option value="similarity">Similarity %</option>
                <option value="year">Publication Year</option>
                <option value="citations">Citations</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Stream */}
        {mutation.isPending ? (
          <LoadingSkeleton rows={4} />
        ) : results && results.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No sufficiently relevant papers found"
            description="Your query did not match any domain-relevant papers above the similarity threshold. Try a more specific HAR-related query, or upload additional corpus papers."
          />
        ) : sortedResults && sortedResults.length > 0 ? (
          <div className="space-y-4">
            {sortedResults.map((res) => {
              const isSelected = !!shortlisted[res.paperId];
              const publisherBadge = getPublisherBadgeClass(res.publisher || res.journal);

              return (
                <div
                  key={res.paperId}
                  className={`panel p-6 space-y-4 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                      : "hover:border-primary/40"
                  }`}
                >
                  {/* Card Header: Title, Authors, Publisher, Year, Similarity Badge */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to="/papers/$paperId"
                          params={{ paperId: res.paperId }}
                          className="text-base font-bold text-foreground hover:text-primary transition-colors leading-snug line-clamp-2"
                        >
                          {res.title}
                        </Link>
                      </div>

                      {/* Authors, Publisher/Journal, Year, Domain */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-slate-200">
                          {res.authors && res.authors.filter((a) => a && !a.toLowerCase().includes("unknown")).length > 0
                            ? res.authors.filter((a) => a && !a.toLowerCase().includes("unknown")).join(", ")
                            : "Research Authors"}
                        </span>
                        <span>·</span>
                        <span className="text-slate-400 font-mono">{res.year}</span>
                        <span>·</span>
                        <span
                          className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${publisherBadge}`}
                        >
                          🏛️ {res.publisher || res.journal || "IEEE / ACM Conference"}
                        </span>
                        {res.domain && (
                          <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">
                            {res.domain}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Similarity score meter */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        className={`text-xs px-3 py-1 font-bold gap-1 shadow-sm ${
                          res.similarity >= 80
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : res.similarity >= 65
                              ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                              : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        <Sparkles className="size-3" />
                        {res.similarity}% Match
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        Semantic Proximity
                      </span>
                    </div>
                  </div>

                  {/* Abstract snippet */}
                  <p className="text-xs text-slate-300 leading-relaxed bg-background/50 p-3 rounded-lg border border-border/40 line-clamp-3">
                    <strong className="text-foreground">Abstract Extract: </strong>
                    {res.snippet}
                  </p>

                  {/* Semantic Match Rationale & Why Similar */}
                  <div className="panel bg-surface/50 p-3.5 space-y-2 text-xs">
                    <p className="font-semibold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-emerald-400" />
                      Semantic Selection Rationale
                    </p>
                    <ul className="space-y-1.5">
                      {res.whySimilar.map((reason, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300 text-xs">
                          <Check className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Algorithms & Datasets Badges */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-border/40 text-xs">
                    {res.algorithms && res.algorithms.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Cpu className="size-3.5 text-sky-400" />
                        <span className="text-[11px] text-muted-foreground">Methods:</span>
                        <div className="flex flex-wrap gap-1">
                          {res.algorithms.map((algo) => (
                            <span
                              key={algo}
                              className="rounded bg-sky-500/10 border border-sky-500/25 px-2 py-0.5 text-[10px] font-medium text-sky-300"
                            >
                              {algo}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {res.datasets && res.datasets.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Database className="size-3.5 text-purple-400" />
                        <span className="text-[11px] text-muted-foreground">Datasets:</span>
                        <div className="flex flex-wrap gap-1">
                          {res.datasets.map((ds: string) => (
                            <span
                              key={ds}
                              className="rounded bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 text-[10px] font-medium text-purple-300"
                            >
                              {ds}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer: Selection button, View details, Test in model lab, Copy citation */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => toggleShortlist(res)}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        <Bookmark className={`size-3.5 ${isSelected ? "fill-current" : ""}`} />
                        {isSelected ? "Shortlisted (Selected)" : "Select for Shortlist"}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCitation(res)}
                        className="text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="size-3.5" /> Copy APA Citation
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigate({
                            to: "/model-lab",
                          });
                          toast.info(
                            `Switched to Model Lab. You can test topic inference for "${res.title.slice(0, 25)}…"`,
                          );
                        }}
                        className="text-xs gap-1 text-primary hover:bg-primary/10"
                      >
                        <Sparkles className="size-3.5" /> Test in Model Lab
                      </Button>

                      <Button size="sm" variant="outline" asChild className="text-xs gap-1">
                        <Link to="/papers/$paperId" params={{ paperId: res.paperId }}>
                          Full Analysis <ExternalLink className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
