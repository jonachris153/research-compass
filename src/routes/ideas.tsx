import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Lightbulb, ScanSearch } from "lucide-react";
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
import { getResearchIdeas } from "@/services/api";

export const Route = createFileRoute("/ideas")({
  head: () => ({
    meta: [
      { title: "Novel Ideas — Research Compass AI" },
      {
        name: "description",
        content: "Potentially novel research directions generated from detected corpus gaps.",
      },
    ],
  }),
  component: NovelIdeasPage,
});

const DIFFICULTIES = ["all", "Beginner", "Intermediate", "Advanced"] as const;

function NovelIdeasPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  const {
    data: ideas,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["research-ideas"],
    queryFn: getResearchIdeas,
  });

  const filteredIdeas = ideas?.filter(
    (idea) => selectedDifficulty === "all" || idea.difficulty === selectedDifficulty,
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Potentially Novel Research Directions"
          subtitle="Scoped project proposals derived directly from validated gaps in your uploaded domain corpus."
        />

        {/* Difficulty filter tabs */}
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((diff) => (
            <Button
              key={diff}
              variant={selectedDifficulty === diff ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDifficulty(diff)}
            >
              {diff === "all" ? "All Proposals" : diff}
            </Button>
          ))}
        </div>

        {isError ? (
          <ErrorState message="Could not load research directions." onRetry={() => refetch()} />
        ) : isLoading || !ideas ? (
          <LoadingSkeleton rows={5} />
        ) : filteredIdeas?.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title="No research directions match this filter"
            description="Run gap analysis or select another filter to derive project proposals."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {filteredIdeas?.map((idea) => (
              <div key={idea.id} className="panel p-6 space-y-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{idea.difficulty}</Badge>
                      <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                        Potentially Novel Direction
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Supported by {idea.supportingPapers} paper(s)
                    </span>
                  </div>

                  <h2 className="text-base font-semibold tracking-tight">{idea.title}</h2>

                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                        Problem Statement
                      </p>
                      <p className="text-muted-foreground mt-0.5">{idea.problemStatement}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                        Proposed Solution
                      </p>
                      <p className="text-foreground font-medium mt-0.5">{idea.proposedSolution}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-muted-foreground uppercase text-[10px]">
                        Addressing Research Gap
                      </p>
                      <p className="text-primary font-medium mt-0.5">{idea.researchGap}</p>
                    </div>

                    {idea.supportingGapIds && idea.supportingGapIds.length > 0 && (
                      <div className="pt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <ScanSearch className="size-3.5 text-primary shrink-0" />
                        <span>
                          Grounded in Gaps:{" "}
                          <Link to="/gaps" className="text-primary hover:underline font-medium">
                            {idea.supportingGapIds.join(", ")}
                          </Link>
                        </span>
                      </div>
                    )}

                    {idea.supportingPaperIds && idea.supportingPaperIds.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <FileText className="size-3.5 text-primary shrink-0" />
                        <span>
                          Supporting Papers: {idea.supportingPaperIds.slice(0, 3).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-2">
                    {idea.techniques.map((tech) => (
                      <span
                        key={tech}
                        className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Score breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                  <ScoreBar label="Corpus Novelty" value={idea.noveltyScore} suffix="%" />
                  <ScoreBar label="Potential Impact" value={idea.impactScore} suffix="%" />
                  <ScoreBar label="Feasibility" value={idea.feasibilityScore} suffix="%" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
