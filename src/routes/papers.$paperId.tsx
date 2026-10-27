import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Cpu, Database, FileText, Layers, Lightbulb, Tag } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { ErrorState, LoadingSkeleton, PageHeader } from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPaper } from "@/services/api";

export const Route = createFileRoute("/papers/$paperId")({
  head: ({ params }) => ({
    meta: [
      { title: `Paper Details — Research Compass AI` },
      { name: "description", content: `Detailed analysis for paper ${params.paperId}` },
    ],
  }),
  component: PaperDetailPage,
});

function PaperDetailPage() {
  const { paperId } = Route.useParams();
  const {
    data: paper,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["paper", paperId],
    queryFn: () => getPaper(paperId),
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/papers">
              <ArrowLeft className="mr-1 size-4" /> Back to All Papers
            </Link>
          </Button>
          {paper && (
            <div className="space-y-1">
              <PageHeader
                title={paper.title}
                subtitle={`${paper.authors.join(", ")} · ${paper.year}`}
              />
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {paper.topic}
                </Badge>
                {paper.relevanceCategory === "low" ? (
                  <Badge variant="destructive">Low Relevance</Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  >
                    Relevant Corpus Paper
                  </Badge>
                )}
                {paper.similarity > 0 && (
                  <Badge variant="outline" className="font-mono text-xs">
                    {paper.similarity}% Similarity
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {isError ? (
          <ErrorState message="Paper details could not be loaded." onRetry={() => refetch()} />
        ) : isLoading || !paper ? (
          <LoadingSkeleton rows={6} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content */}
            <div className="space-y-6 lg:col-span-2">
              {/* Abstract */}
              <div className="panel space-y-3 p-6">
                <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <FileText className="size-4 text-primary" /> Abstract
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">{paper.abstract}</p>
              </div>

              {/* Methodology */}
              {paper.methodology && (
                <div className="panel space-y-3 p-6">
                  <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <Layers className="size-4 text-primary" /> Methodology & Architecture
                  </h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {paper.methodology}
                  </p>
                </div>
              )}

              {/* Reported Results */}
              {paper.results && (
                <div className="panel space-y-3 p-6">
                  <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <BookOpen className="size-4 text-primary" /> Reported Experimental Results
                  </h2>
                  <p className="text-xs leading-relaxed text-muted-foreground">{paper.results}</p>
                </div>
              )}

              {/* Limitations & Future Work */}
              <div className="grid gap-4 sm:grid-cols-2">
                {paper.limitations.length > 0 && (
                  <div className="panel p-5 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                      Stated Limitations
                    </h3>
                    <ul className="list-inside list-disc text-xs text-muted-foreground space-y-1">
                      {paper.limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {paper.futureWork.length > 0 && (
                  <div className="panel p-5 space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                      Future Work Directions
                    </h3>
                    <ul className="list-inside list-disc text-xs text-muted-foreground space-y-1">
                      {paper.futureWork.map((fw, i) => (
                        <li key={i}>{fw}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Potential Opportunities */}
              {paper.opportunities && paper.opportunities.length > 0 && (
                <div className="panel p-5 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Lightbulb className="size-4" /> Potential Research Opportunities
                  </h3>
                  <ul className="list-inside list-disc text-xs text-muted-foreground space-y-1">
                    {paper.opportunities.map((opp, i) => (
                      <li key={i}>{opp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar metadata */}
            <div className="space-y-6">
              <div className="panel space-y-4 p-5">
                {/* Algorithms */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                    <Cpu className="size-3.5 text-primary" /> Algorithms Detected
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.algorithms.length > 0 ? (
                      paper.algorithms.map((algo) => (
                        <span
                          key={algo}
                          className="rounded bg-primary/10 border border-primary/20 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {algo}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None detected</span>
                    )}
                  </div>
                </div>

                {/* Datasets */}
                <div className="pt-3 border-t border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                    <Database className="size-3.5 text-primary" /> Datasets Evaluated
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.datasets.length > 0 ? (
                      paper.datasets.map((ds) => (
                        <span
                          key={ds}
                          className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-200"
                        >
                          {ds}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None detected</span>
                    )}
                  </div>
                </div>

                {/* Keywords */}
                <div className="pt-3 border-t border-border">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                    <Tag className="size-3.5 text-primary" /> Clean Keywords
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.keywords.length > 0 ? (
                      paper.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                        >
                          {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">None detected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
