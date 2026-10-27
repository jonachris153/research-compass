import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
  PageHeader,
} from "@/components/common/primitives";
import {
  CHART_COLORS,
  CHART_AXIS_PROPS,
  CHART_GRID_PROPS,
  CHART_LEGEND_PROPS,
  CustomChartTooltip,
} from "@/components/common/chart-theme";
import { Badge } from "@/components/ui/badge";
import { getLandscape } from "@/services/api";

export const Route = createFileRoute("/landscape")({
  head: () => ({
    meta: [
      { title: "Research Landscape — Research Compass AI" },
      {
        name: "description",
        content: "Explore topics, algorithm adoption, and dataset concentration over time.",
      },
    ],
  }),
  component: LandscapePage,
});

function LandscapePage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["landscape"],
    queryFn: getLandscape,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Research Landscape"
          subtitle="Structural insights across publication years, algorithms, and benchmark datasets."
        />

        {isError ? (
          <ErrorState message="Research landscape could not be loaded." onRetry={() => refetch()} />
        ) : isLoading || !data ? (
          <LoadingSkeleton rows={6} />
        ) : (
          <>
            {/* Top row insights */}
            <div className="grid gap-4 sm:grid-cols-3">
              {data.insights.map((ins) => (
                <InsightCard key={ins.id} {...ins} />
              ))}
            </div>

            {/* Algorithm Adoption & Dataset Concentration */}
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Algorithm Adoption"
                description="Total mentions in analysed papers."
              >
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.algorithmAdoption}
                      layout="vertical"
                      margin={{ left: 10, right: 20, top: 10, bottom: 5 }}
                    >
                      <CartesianGrid {...CHART_GRID_PROPS} horizontal={false} />
                      <XAxis type="number" {...CHART_AXIS_PROPS} />
                      <YAxis type="category" dataKey="name" {...CHART_AXIS_PROPS} width={100} />
                      <Tooltip
                        content={<CustomChartTooltip />}
                        cursor={{ fill: "rgba(51, 65, 85, 0.3)" }}
                      />
                      <Bar
                        dataKey="value"
                        name="Mentions"
                        fill="#38BDF8"
                        radius={[0, 6, 6, 0]}
                        barSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard
                title="Dataset Concentration"
                description="Over-reliance on primary benchmark datasets."
              >
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <Pie
                        data={data.datasetConcentration}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={88}
                        paddingAngle={3}
                        stroke="#0F172A"
                      >
                        {data.datasetConcentration.map((entry, i) => (
                          <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend {...CHART_LEGEND_PROPS} />
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            {/* Keyword cloud */}
            <div className="panel p-6 space-y-3">
              <h2 className="text-base font-semibold">Corpus Keyword Cloud</h2>
              <p className="text-xs text-muted-foreground">
                Weighted frequency of terms across paper abstracts and metadata.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                {data.keywordCloud.map((kw) => (
                  <span
                    key={kw.text}
                    className="rounded-lg border border-border bg-surface px-3 py-1 text-xs font-medium transition-colors hover:border-primary/50 text-foreground"
                    style={{ opacity: Math.max(0.65, kw.weight / 100) }}
                  >
                    {kw.text}{" "}
                    <span className="ml-1 text-[10px] text-muted-foreground font-mono">
                      ({Math.round(kw.weight)})
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Clusters */}
            <div className="space-y-3">
              <h2 className="text-base font-semibold">Discovered Topic Clusters</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.clusters.map((cluster) => (
                  <div key={cluster.id} className="panel p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{cluster.name}</h3>
                      <Badge variant="secondary">{cluster.paperCount} papers</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Top Algo:{" "}
                      <span className="font-medium text-foreground">{cluster.topAlgorithm}</span>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {cluster.keywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
