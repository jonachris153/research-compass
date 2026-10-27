import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, FileText, Gauge, Layers, Lightbulb, ScanSearch, Upload } from "lucide-react";
import { useState } from "react";
import { UploadModal } from "@/components/upload/UploadModal";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import {
  ChartCard,
  ErrorState,
  InsightCard,
  LoadingSkeleton,
  MetricCard,
  PageHeader,
} from "@/components/common/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboard } from "@/services/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Research Overview — Research Compass AI" },
      {
        name: "description",
        content:
          "Analytics overview of the analyzed research corpus: topics, algorithms, potential gaps and generated research directions.",
      },
      { property: "og:title", content: "Research Overview — Research Compass AI" },
      {
        property: "og:description",
        content: "Your current research landscape at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

const axis = { stroke: "var(--muted-foreground)", fontSize: 12 };
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

function DashboardPage() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Research Overview"
          subtitle="Your current research landscape at a glance."
          actions={
            <>
              <Button variant="outline" onClick={() => setUploadOpen(true)}>
                <Upload className="size-4 mr-1.5" aria-hidden />
                Upload Papers
              </Button>
              <Button asChild>
                <Link to="/gaps">Analyze Gaps</Link>
              </Button>
            </>
          }
        />

        <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />

        {isError ? (
          <ErrorState message="The dashboard service is unavailable." onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Total Papers"
                value={data.totalPapers}
                icon={FileText}
              />
              <MetricCard label="Research Topics" value={data.researchTopics} icon={Layers} />
              <MetricCard label="Potential Gaps" value={data.potentialGaps} icon={ScanSearch} />
              <MetricCard label="Generated Ideas" value={data.generatedIdeas} icon={Lightbulb} />
              <MetricCard
                label="Average Similarity"
                value={`${data.averageSimilarity}%`}
                icon={Gauge}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Topic Distribution"
                description="Share of papers per topic cluster."
              >
                <div className="h-72 flex items-center justify-center">
                  {!data.topicDistribution || data.topicDistribution.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No papers analyzed yet. Upload PDFs to view topic distribution.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.topicDistribution}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={58}
                          outerRadius={92}
                          paddingAngle={3}
                          stroke="var(--background)"
                        >
                          {data.topicDistribution.map((entry, i) => (
                            <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend
                          wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                          formatter={(value) => (
                            <span style={{ color: "#e2e8f0", fontSize: 11, fontWeight: 500 }}>
                              {value}
                            </span>
                          )}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: 8,
                            fontSize: 12,
                            color: "#f8fafc",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                          }}
                          itemStyle={{ color: "#38bdf8", fontWeight: 600 }}
                          labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Algorithm Usage" description="Mentions across the analyzed corpus.">
                <div className="h-72 flex items-center justify-center">
                  {!data.algorithmUsage || data.algorithmUsage.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No algorithm mentions detected yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.algorithmUsage} layout="vertical" margin={{ left: 24 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          horizontal={false}
                        />
                        <XAxis type="number" tick={axis} tickLine={false} axisLine={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={axis}
                          tickLine={false}
                          axisLine={false}
                          width={90}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0f172a",
                            borderColor: "#334155",
                            borderRadius: 8,
                            fontSize: 12,
                            color: "#f8fafc",
                          }}
                          itemStyle={{ color: "#38bdf8", fontWeight: 600 }}
                          labelStyle={{ color: "#f8fafc", fontWeight: 600 }}
                          cursor={{ fill: "rgba(56, 189, 248, 0.1)" }}
                        />
                        <Bar
                          dataKey="value"
                          fill="var(--chart-1)"
                          radius={[0, 6, 6, 0]}
                          barSize={16}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
            </div>

            <div className="grid gap-4">
              <ChartCard
                title="Research Domain Distribution"
                description="Application areas covered."
              >
                <div className="h-72 flex items-center justify-center">
                  {!data.domainDistribution || data.domainDistribution.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No domain data available yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.domainDistribution}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ ...axis, fontSize: 10 }}
                          tickLine={false}
                          axisLine={false}
                          interval={0}
                          angle={-12}
                          height={48}
                          textAnchor="end"
                        />
                        <YAxis tick={axis} tickLine={false} axisLine={false} width={30} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                        <Bar
                          dataKey="value"
                          fill="var(--chart-2)"
                          radius={[6, 6, 0, 0]}
                          barSize={34}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard
                title="Research Insights"
                description="Generated from corpus-wide patterns."
                className="lg:col-span-1"
              >
                <div className="space-y-3">
                  {!data.insights || data.insights.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-6 text-center">No corpus insights available yet.</p>
                  ) : (
                    data.insights.map((insight) => (
                      <InsightCard key={insight.id} {...insight} />
                    ))
                  )}
                </div>
              </ChartCard>

              <ChartCard
                title="Recent Papers"
                description="Latest additions to the corpus."
                className="lg:col-span-2"
                action={
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/papers">View all</Link>
                  </Button>
                }
              >
                {!data.recentPapers || data.recentPapers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No papers uploaded yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.recentPapers.map((paper) => (
                      <li key={paper.id}>
                        <Link
                          to="/papers/$paperId"
                          params={{ paperId: paper.id }}
                          className="flex items-start justify-between gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-accent"
                        >
                          <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-medium">{paper.title}</p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                              {paper.authors.join(", ")} · {paper.year} · {paper.topic}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 gap-1">
                            <Activity className="size-3" aria-hidden />
                            {paper.similarity}%
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </ChartCard>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
