import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, FileText, Search, Upload } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
} from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadModal } from "@/components/upload/UploadModal";
import { getPaperFacets, getPapers } from "@/services/api";
import type { PaperQuery } from "@/services/api";

export const Route = createFileRoute("/papers")({
  head: () => ({
    meta: [
      { title: "All Papers — Research Compass AI" },
      { name: "description", content: "Browse and filter all papers in your research corpus." },
    ],
  }),
  component: PapersPage,
});

function PapersPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [query, setQuery] = useState<PaperQuery>({
    search: "",
    topic: "all",
    year: "all",
    algorithm: "all",
    dataset: "all",
    domain: "all",
    sort: "newest",
    page: 1,
    pageSize: 10,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["papers", query],
    queryFn: () => getPapers(query),
  });

  const { data: facets } = useQuery({
    queryKey: ["paper-facets"],
    queryFn: getPaperFacets,
  });

  const set = (patch: Partial<PaperQuery>) => setQuery((q) => ({ ...q, ...patch, page: 1 }));

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="All Papers"
          subtitle={data ? `${data.total} papers in corpus` : "Browse your research corpus"}
          actions={
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="size-4 mr-1.5" aria-hidden />
              Upload Papers
            </Button>
          }
        />

        <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />

        {/* Filters */}
        <div className="panel p-4">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id="papers-search"
                value={query.search}
                onChange={(e) => set({ search: e.target.value })}
                placeholder="Search title, authors, keywords…"
                className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
              />
            </div>

            <Select
              label="Topic"
              value={query.topic!}
              onChange={(v) => set({ topic: v })}
              options={["all", ...(facets?.topics ?? [])]}
            />
            <Select
              label="Year"
              value={query.year!}
              onChange={(v) => set({ year: v })}
              options={["all", ...(facets?.years ?? [])]}
            />
            <Select
              label="Algorithm"
              value={query.algorithm!}
              onChange={(v) => set({ algorithm: v })}
              options={["all", ...(facets?.algorithms ?? [])]}
            />
            <Select
              label="Sort"
              value={query.sort!}
              onChange={(v) => set({ sort: v as "newest" | "oldest" | "similar" | "cited" })}
              options={["newest", "oldest", "similar", "cited"]}
            />
          </div>
        </div>

        {isError ? (
          <ErrorState message="Could not load papers." onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <LoadingSkeleton rows={6} />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No papers found"
            description="Try adjusting your filters or upload papers to get started."
            action={<Button onClick={() => setUploadOpen(true)}>Upload Papers</Button>}
          />
        ) : (
          <>
            {/* Clean Structured Table: Paper | Year | Topic | Algorithms | Relevance | Status */}
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[11px] tracking-wider">
                      <th className="py-3.5 px-4 font-semibold w-5/12">Paper</th>
                      <th className="py-3.5 px-3 font-semibold text-center w-16">Year</th>
                      <th className="py-3.5 px-3 font-semibold w-3/12">Topic</th>
                      <th className="py-3.5 px-3 font-semibold w-2/12">Algorithms</th>
                      <th className="py-3.5 px-3 font-semibold text-center w-24">Relevance</th>
                      <th className="py-3.5 px-4 font-semibold text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {data.items.map((paper) => {
                      const isLowRelevance = paper.relevanceCategory === "low";
                      return (
                        <tr
                          key={paper.id}
                          className="hover:bg-slate-800/40 transition-colors group"
                        >
                          {/* Paper (Title + Authors) */}
                          <td className="py-3.5 px-4">
                            <Link
                              to="/papers/$paperId"
                              params={{ paperId: paper.id }}
                              className="block space-y-1"
                            >
                              <p className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                                {paper.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {paper.authors.slice(0, 3).join(", ")}
                                {paper.authors.length > 3 ? " et al." : ""}
                              </p>
                            </Link>
                          </td>

                          {/* Year */}
                          <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                            {paper.year}
                          </td>

                          {/* Topic */}
                          <td className="py-3.5 px-3">
                            <span className="inline-block rounded-md bg-slate-800/80 border border-slate-700 px-2 py-1 text-[11px] text-slate-200 line-clamp-1">
                              {paper.topic}
                            </span>
                          </td>

                          {/* Algorithms */}
                          <td className="py-3.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {paper.algorithms.slice(0, 3).map((a) => (
                                <span
                                  key={a}
                                  className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                                >
                                  {a}
                                </span>
                              ))}
                              {paper.algorithms.length > 3 && (
                                <span className="text-[10px] text-muted-foreground self-center">
                                  +{paper.algorithms.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Relevance */}
                          <td className="py-3.5 px-3 text-center">
                            {isLowRelevance ? (
                              <Badge variant="destructive" className="text-[10px] px-2 py-0.5">
                                Low
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-[10px] bg-primary/10 text-primary border-primary/30 px-2 py-0.5"
                              >
                                Relevant
                              </Badge>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                              <span className="size-1.5 rounded-full bg-emerald-400"></span>
                              {paper.status === "analyzed" ? "Analyzed" : "Ready"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Page {data.page} of {data.pages} · {data.total} total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page <= 1}
                  onClick={() => setQuery((q) => ({ ...q, page: q.page! - 1 }))}
                >
                  <ChevronLeft className="size-4 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.page >= data.pages}
                  onClick={() => setQuery((q) => ({ ...q, page: q.page! + 1 }))}
                >
                  Next <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-border bg-surface px-3 text-sm text-foreground focus:border-primary/60 focus:outline-none"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o === "all" ? `All ${label}s` : o}
        </option>
      ))}
    </select>
  );
}
