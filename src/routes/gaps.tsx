import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, FileText, Filter, ScanSearch, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  ScoreBar,
} from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getResearchGaps } from "@/services/api";
import type { GapCategory, ResearchGap } from "@/types/research";

export const Route = createFileRoute("/gaps")({
  head: () => ({
    meta: [
      { title: "Gap Analysis — Research Compass AI" },
      {
        name: "description",
        content: "Identify potential research gaps from corpus-wide signals and evidence.",
      },
    ],
  }),
  component: GapAnalysisPage,
});

const CATEGORIES: { label: string; value: "all" | GapCategory }[] = [
  { label: "All Categories", value: "all" },
  { label: "Algorithm", value: "algorithm" },
  { label: "Dataset", value: "dataset" },
  { label: "Methodology", value: "methodology" },
  { label: "Application", value: "application" },
  { label: "Future Work", value: "future-work" },
];

function GapAnalysisPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const {
    data: gaps,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["research-gaps"],
    queryFn: getResearchGaps,
  });

  const filteredGaps = gaps?.filter(
    (g) => selectedCategory === "all" || g.category === selectedCategory,
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Potential Research Gaps"
          subtitle="Identified from corpus signals: underrepresented topics, dataset concentration, future-work mentions, and cross-topic opportunities."
        />

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {isError ? (
          <ErrorState message="Could not load research gaps." onRetry={() => refetch()} />
        ) : isLoading || !gaps ? (
          <LoadingSkeleton rows={5} />
        ) : filteredGaps?.length === 0 ? (
          <EmptyState
            icon={ScanSearch}
            title="No gaps detected for this filter"
            description="Upload more papers to enable corpus-wide gap identification."
          />
        ) : (
          <div className="space-y-6">
            {filteredGaps?.map((gap) => (
              <div key={gap.id} className="panel p-6 space-y-5 border-l-4 border-l-primary">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="uppercase text-[10px]">
                        {gap.category}
                      </Badge>
                      <Badge
                        variant={
                          gap.trend === "rising"
                            ? "default"
                            : gap.trend === "steady"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[10px]"
                      >
                        {gap.trend} trend
                      </Badge>
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight">{gap.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {gap.description}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-elevated p-3 text-right min-w-32">
                    <p className="text-[10px] uppercase text-muted-foreground font-medium">
                      Corpus-based Gap Score
                    </p>
                    <p className="text-2xl font-bold text-primary tabular-nums">
                      {gap.gapScore}
                      <span className="text-xs text-muted-foreground">/100</span>
                    </p>
                  </div>
                </div>

                {/* Score indicators */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <ScoreBar label="Impact Score" value={gap.impactScore} suffix="%" />
                  <ScoreBar label="Confidence Score" value={gap.confidence} suffix="%" />
                  <ScoreBar label="Corpus Coverage" value={gap.coverage} suffix="%" />
                </div>

                {/* Contributing signals */}
                <div className="panel bg-surface/50 p-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Contributing Corpus Signals
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 text-xs">
                    <div className="text-slate-300">
                      Underrepresentation:{" "}
                      <span className="font-semibold text-white font-mono">
                        {gap.signals.underrepresentation}%
                      </span>
                    </div>
                    <div className="text-slate-300">
                      Future-Work Signals:{" "}
                      <span className="font-semibold text-white font-mono">
                        {gap.signals.futureWorkSignal}%
                      </span>
                    </div>
                    <div className="text-slate-300">
                      Method Concentration:{" "}
                      <span className="font-semibold text-white font-mono">
                        {gap.signals.methodConcentration}%
                      </span>
                    </div>
                    <div className="text-slate-300">
                      Dataset Concentration:{" "}
                      <span className="font-semibold text-white font-mono">
                        {gap.signals.datasetConcentration}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evidence grounded in uploaded papers */}
                {gap.evidence.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FileText className="size-3.5" /> Evidence from Uploaded Corpus
                    </p>
                    <div className="space-y-2">
                      {gap.evidence.map((ev, i) => {
                        const rawQuote = ev.quote || "No concise supporting passage detected.";
                        const displayQuote =
                          rawQuote.length > 350 ? `${rawQuote.slice(0, 347)}...` : rawQuote;
                        return (
                          <div
                            key={i}
                            className="rounded-lg border border-border bg-elevated/40 p-3 text-xs space-y-1 overflow-hidden"
                          >
                            <p className="font-medium text-foreground truncate">{ev.paperTitle}</p>
                            <blockquote className="italic text-muted-foreground break-words leading-relaxed whitespace-normal">
                              &ldquo;{displayQuote}&rdquo;
                            </blockquote>
                            <p className="text-[10px] text-primary font-medium">
                              Signal: {ev.signal}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reasons */}
                {gap.reasons.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Analysis Summary
                    </p>
                    <ul className="list-inside list-disc text-xs text-muted-foreground space-y-1">
                      {gap.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
