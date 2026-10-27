import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  FileText,
  HelpCircle,
  Layers,
  Lightbulb,
  Network,
  RefreshCw,
  Sparkles,
  Tag,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import {
  ChartCard,
  ErrorState,
  LoadingSkeleton,
  MetricCard,
  PageHeader,
} from "@/components/common/primitives";
import {
  CHART_AXIS_PROPS,
  CHART_GRID_PROPS,
  CustomChartTooltip,
} from "@/components/common/chart-theme";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzePapers, getAnalyzedPapers, getModelResults, getPapers, predictPaperTopic } from "@/services/api";
import type {
  InterClusterSimilarity,
  MLModelResult,
  ModelLabResults,
  ModelPredictionResult,
  Paper,
  UnsupervisedCluster,
} from "@/types/research";

export const Route = createFileRoute("/model-lab")({
  head: () => ({
    meta: [
      { title: "Model Lab — Research Compass AI" },
      {
        name: "description",
        content: "Compare supervised and unsupervised ML methods for research-topic analysis.",
      },
    ],
  }),
  component: ModelLabPage,
});

type TabKey = "unsupervised" | "supervised";

function ModelLabPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("unsupervised");
  const [selectedModelId, setSelectedModelId] = useState<string>("rf");

  // Live Playground State
  const [testMode, setTestMode] = useState<"corpus" | "custom">("corpus");
  const [selectedTestPaperId, setSelectedTestPaperId] = useState<string>("");
  const [customTestText, setCustomTestText] = useState<string>("");
  const [liveTesterModelId, setLiveTesterModelId] = useState<string>("rf");
  const [predictionResult, setPredictionResult] = useState<ModelPredictionResult | null>(null);
  const [showAllCorpus, setShowAllCorpus] = useState<boolean>(false);

  // Queries
  const {
    data: modelData,
    isLoading,
    isError,
    refetch,
  } = useQuery<ModelLabResults>({
    queryKey: ["model-results"],
    queryFn: getModelResults,
  });

  // Fetch only the paper(s) uploaded and analyzed at this instant
  const { data: instantPapersData } = useQuery<Paper[]>({
    queryKey: ["model-lab-analyzed-papers"],
    queryFn: getAnalyzedPapers,
  });
  const instantPapers = useMemo(() => instantPapersData || [], [instantPapersData]);

  // Optional full corpus fallback query if user explicitly toggles
  const { data: allPapersData } = useQuery({
    queryKey: ["model-lab-all-papers-list"],
    queryFn: () => getPapers({ pageSize: 50 }),
    enabled: showAllCorpus,
  });

  // Default strictly to the paper uploaded at this instant
  const papers = useMemo(() => {
    if (showAllCorpus && allPapersData?.items?.length) {
      return allPapersData.items;
    }
    return instantPapers;
  }, [showAllCorpus, allPapersData?.items, instantPapers]);

  // Auto-select the paper uploaded at this instant
  useEffect(() => {
    if (papers.length > 0) {
      const exists = papers.some((p) => p.id === selectedTestPaperId);
      if (!exists) {
        setSelectedTestPaperId(papers[0]?.id || "");
      }
    }
  }, [papers, selectedTestPaperId]);

  // Live prediction mutation
  const predictMutation = useMutation({
    mutationFn: (params: { text?: string; paperId?: string; modelId?: string }) =>
      predictPaperTopic(params),
    onSuccess: (data) => {
      setPredictionResult(data);
    },
    onError: () => {
      toast.error("Prediction failed. Try again with a different paper or text.");
    },
  });

  // No auto-run: prediction only fires when user clicks "Run Live Topic Inference"

  // Re-calibrate / Re-analyze mutation
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const handleRecalibrate = async () => {
    setIsRecalibrating(true);
    toast.info("Recalibrating models across corpus with cross-validation...");
    try {
      const activeIds = instantPapers.map((p) => p.id).filter(Boolean);
      await analyzePapers(undefined, activeIds.length > 0 ? activeIds : undefined);
      await qc.invalidateQueries({ queryKey: ["model-results"] });
      await qc.invalidateQueries({ queryKey: ["model-lab-analyzed-papers"] });
      toast.success("Models recalibrated successfully! Updated benchmark metrics & percentages.");
    } catch {
      toast.error("Recalibration failed.");
    } finally {
      setIsRecalibrating(false);
    }
  };

  const handleRunTest = (targetModelId?: string) => {
    const activeModelId = targetModelId || liveTesterModelId;
    if (testMode === "corpus") {
      if (!selectedTestPaperId) {
        toast.warning("Please select a paper from the corpus.");
        return;
      }
      const paper = papers.find((p) => p.id === selectedTestPaperId);
      predictMutation.mutate(
        paper
          ? {
              paperId: selectedTestPaperId,
              text: `${paper.title} ${paper.abstract}`,
              modelId: activeModelId,
            }
          : { paperId: selectedTestPaperId, modelId: activeModelId },
      );
    } else {
      if (!customTestText.trim()) {
        toast.warning("Please enter research text or an abstract.");
        return;
      }
      predictMutation.mutate({ text: customTestText, modelId: activeModelId });
    }
  };

  const models: MLModelResult[] = modelData?.supervised || [];
  const unsupervised = modelData?.unsupervised;
  const weakSummary = modelData?.weakLabelSummary;

  const selectedModel = models.find((m: MLModelResult) => m.id === selectedModelId) || models[0];
  const bestModel =
    models.find((m: MLModelResult) => m.id === weakSummary?.bestModelId) || models[0];
  const currentTestingPaper = papers.find((p) => p.id === selectedTestPaperId);


  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PageHeader
            title="Model Lab"
            subtitle="Compare supervised and unsupervised ML methods for research-topic analysis."
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleRecalibrate}
            disabled={isRecalibrating}
            className="gap-1.5 shadow-sm"
          >
            <RefreshCw
              className={`size-3.5 ${isRecalibrating ? "animate-spin text-primary" : ""}`}
            />
            {isRecalibrating ? "Recalibrating Models…" : "Recalibrate All Models"}
          </Button>
        </div>

        {/* Top-Level Navigation Tabs */}
        <div className="flex border-b border-border gap-2">
          <button
            onClick={() => setActiveTab("unsupervised")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "unsupervised"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Brain className="size-4" />
            Unsupervised Analysis
          </button>
          <button
            onClick={() => setActiveTab("supervised")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "supervised"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Cpu className="size-4" />
            Weakly Supervised Classification
          </button>
        </div>

        {isError ? (
          <ErrorState
            message="Model results could not be loaded. Please run corpus analysis."
            onRetry={() => refetch()}
          />
        ) : isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <>
            {/* ========================================================================= */}
            {/* TAB 1: UNSUPERVISED ANALYSIS (K-MEANS)                                    */}
            {/* ========================================================================= */}
            {activeTab === "unsupervised" && (
              <div className="space-y-6">
                {/* High-level metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    label="Number of Clusters"
                    value={unsupervised?.numClusters ? `${unsupervised.numClusters}` : "0"}
                    hint="Discovered K-Means clusters"
                  />
                  <MetricCard
                    label="Clustered Papers"
                    value={
                      unsupervised?.totalRelevantPapers
                        ? `${unsupervised.totalRelevantPapers}`
                        : "0"
                    }
                    hint="Domain-relevant corpus"
                  />
                  <MetricCard
                    label="Silhouette Score"
                    value={
                      unsupervised?.silhouetteScore !== null &&
                      unsupervised?.silhouetteScore !== undefined
                        ? `${unsupervised.silhouetteScore}`
                        : "N/A"
                    }
                    hint="Range: -1.0 to +1.0"
                  />
                  <MetricCard
                    label="Clustering Quality"
                    value={
                      unsupervised?.silhouetteScore !== null &&
                      unsupervised?.silhouetteScore !== undefined
                        ? unsupervised.silhouetteScore >= 0.5
                          ? "Well-Separated"
                          : unsupervised.silhouetteScore >= 0.25
                            ? "Moderate Separation"
                            : "Low Separation"
                        : "Calibrating"
                    }
                    hint="Embedding separation metric"
                  />
                </div>

                {/* Cluster cards grid */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Network className="size-4 text-primary" /> Discovered Topic Clusters
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {unsupervised?.clusters?.map((cluster: UnsupervisedCluster) => (
                      <div key={cluster.id || cluster.name} className="panel p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold text-foreground text-sm">
                              {cluster.name}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <span className="font-semibold text-primary">Cluster Size:</span>{" "}
                              {cluster.paperCount} paper{cluster.paperCount !== 1 ? "s" : ""}
                              {typeof cluster.intraSimilarity === "number"
                                ? ` • Intra-cluster similarity: ${(cluster.intraSimilarity * 100).toFixed(1)}%`
                                : ""}
                            </p>
                          </div>
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary shrink-0">
                            {cluster.topAlgorithm || "Inertial"}
                          </span>
                        </div>

                        {/* Keywords */}
                        <div className="space-y-1">
                          <p className="text-[11px] font-medium text-slate-400">
                            Representative Keywords:
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {cluster.keywords.map((kw: string, i: number) => (
                              <span
                                key={i}
                                className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] text-slate-200"
                              >
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Representative papers */}
                        {cluster.representativePapers &&
                          cluster.representativePapers.length > 0 && (
                            <div className="space-y-1 pt-1 border-t border-border/50">
                              <p className="text-[11px] font-medium text-slate-400">
                                Representative Papers:
                              </p>
                              <ul className="list-inside list-disc text-xs text-muted-foreground space-y-0.5">
                                {cluster.representativePapers.map((p: string, i: number) => (
                                  <li key={i} className="truncate">
                                    {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inter-Cluster Semantic Similarity Matrix */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="size-4 text-primary" /> Inter-Cluster Similarity
                  </h3>
                  {unsupervised?.interClusterSimilarity &&
                  unsupervised.interClusterSimilarity.length > 0 ? (
                    <div className="panel p-5 space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Pairwise cosine similarity between cluster centroids in dense
                        Sentence-Transformer embedding space.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {unsupervised.interClusterSimilarity.map(
                          (item: InterClusterSimilarity, idx: number) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-border bg-surface/60 p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs gap-2">
                                <span className="font-semibold text-foreground truncate">
                                  {item.clusterA}
                                </span>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  ↔
                                </span>
                                <span className="font-semibold text-foreground truncate text-right">
                                  {item.clusterB}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] font-mono">
                                  <span className="text-muted-foreground">Similarity:</span>
                                  <span className="font-bold text-primary">
                                    {(item.similarity * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{
                                      width: `${Math.max(4, Math.min(100, item.similarity * 100))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="panel p-5 text-center text-xs text-muted-foreground">
                      Need ≥ 2 discovered topic clusters to compute pairwise inter-cluster
                      similarity.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: WEAKLY SUPERVISED CLASSIFICATION                                   */}
            {/* ========================================================================= */}
            {activeTab === "supervised" && (
              <div className="space-y-8">
                {/* Weak label summary panel */}
                <div className="panel p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Tag className="size-4 text-primary" /> Transparent Corpus-Based Weak Labels
                        & Benchmarks
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Rule-based labels are assigned from distinctive HAR topic definitions
                        (Zero-Shot Learning, Self-Supervised Learning, Explainable AI,
                        Lightweight/Efficient HAR, Transformer-Based HAR, Domain Adaptation,
                        Wearable Sensor Classification) to benchmark supervised classifiers.
                      </p>
                    </div>
                    {bestModel && bestModel.f1 > 0 && (
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-right shrink-0">
                        <p className="text-[10px] uppercase font-bold text-emerald-400 flex items-center justify-end gap-1">
                          <Award className="size-3" /> Best Model (F1)
                        </p>
                        <p className="font-semibold text-white text-xs mt-0.5">{bestModel.name}</p>
                        <p className="text-[11px] font-mono text-emerald-300">
                          F1: {bestModel.f1}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Fallback warning if insufficient labelled samples */}
                  {weakSummary?.status === "insufficient" && (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300 flex items-center gap-2">
                      <HelpCircle className="size-4 shrink-0" />
                      <span>
                        Not enough labelled samples in the current corpus to reliably compute
                        supervised metrics (requires ≥ 2 distinct classes). Upload more papers or
                        run analysis.
                      </span>
                    </div>
                  )}

                  {/* Label distribution tags */}
                  {weakSummary?.labelDistribution && (
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-[11px] font-medium text-slate-400 mb-1.5">
                        Corpus Label Distribution:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(weakSummary.labelDistribution).map(([label, count]) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-1 rounded bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-200"
                          >
                            <span>{label}:</span>
                            <span className="font-bold text-primary font-mono">
                              {String(count)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Model selector tabs */}
                <div className="flex flex-wrap gap-2">
                  {models.map((model: MLModelResult) => (
                    <Button
                      key={model.id}
                      variant={selectedModel?.id === model.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedModelId(model.id)}
                    >
                      {model.name} {model.f1 > 0 ? `(F1: ${model.f1}%)` : ""}
                    </Button>
                  ))}
                </div>

                {selectedModel && (
                  <div className="space-y-6">
                    {/* Description */}
                    <div className="panel p-5 space-y-2">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">
                          {selectedModel.name}
                        </h2>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {selectedModel.family} Family
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedModel.description}</p>
                    </div>

                    {/* Metrics */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                      <MetricCard
                        label="Accuracy"
                        value={
                          selectedModel.accuracy > 0
                            ? `${selectedModel.accuracy}%`
                            : "Not enough labelled samples"
                        }
                        hint="Cross-validated test split"
                      />
                      <MetricCard
                        label="Precision"
                        value={
                          selectedModel.precision > 0
                            ? `${selectedModel.precision}%`
                            : "Not enough labelled samples"
                        }
                        hint="Macro-averaged"
                      />
                      <MetricCard
                        label="Recall"
                        value={
                          selectedModel.recall > 0
                            ? `${selectedModel.recall}%`
                            : "Not enough labelled samples"
                        }
                        hint="Macro-averaged"
                      />
                      <MetricCard
                        label="F1 Score"
                        value={
                          selectedModel.f1 > 0
                            ? `${selectedModel.f1}%`
                            : "Not enough labelled samples"
                        }
                        hint="Harmonic mean"
                      />
                      <MetricCard
                        label="Train Time"
                        value={`${selectedModel.trainingTimeSec}s`}
                        hint="CPU training duration"
                      />
                    </div>

                    {/* Confusion matrix & Feature Importance */}
                    <div className="grid gap-6 lg:grid-cols-2">
                      <ChartCard
                        title="Confusion Matrix"
                        description="Actual vs. Predicted topic assignments on held-out data."
                      >
                        <div className="flex flex-col items-center justify-center p-4">
                          <div
                            className="grid gap-2"
                            style={{
                              gridTemplateColumns: `repeat(${selectedModel.confusionMatrix.length || 2}, minmax(0, 1fr))`,
                            }}
                          >
                            {selectedModel.confusionMatrix.flatMap((row: number[], r: number) =>
                              row.map((val: number, c: number) => (
                                <div
                                  key={`${r}-${c}`}
                                  className="flex size-14 flex-col items-center justify-center rounded-lg border border-border bg-elevated font-mono text-xs"
                                  style={{
                                    opacity: r === c ? 1 : 0.6,
                                    backgroundColor:
                                      r === c ? "rgba(56, 189, 248, 0.25)" : undefined,
                                    borderColor: r === c ? "#38BDF8" : undefined,
                                    color: r === c ? "#FFFFFF" : "#94A3B8",
                                  }}
                                >
                                  <span className="font-bold tabular-nums">{val}</span>
                                </div>
                              )),
                            )}
                          </div>
                          <p className="mt-4 text-xs text-muted-foreground">
                            Diagonal entries represent correct topic predictions across validation
                            folds.
                          </p>
                        </div>
                      </ChartCard>

                      <ChartCard
                        title="Feature Importance"
                        description="Mathematically valid feature contributions driving model decisions."
                      >
                        {selectedModel.featureImportance &&
                        selectedModel.featureImportance.length > 0 ? (
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={selectedModel.featureImportance}
                                layout="vertical"
                                margin={{ left: 10, right: 20, top: 10, bottom: 5 }}
                              >
                                <CartesianGrid {...CHART_GRID_PROPS} horizontal={false} />
                                <XAxis type="number" {...CHART_AXIS_PROPS} />
                                <YAxis
                                  type="category"
                                  dataKey="name"
                                  {...CHART_AXIS_PROPS}
                                  width={130}
                                />
                                <Tooltip
                                  content={<CustomChartTooltip />}
                                  cursor={{ fill: "rgba(51, 65, 85, 0.3)" }}
                                />
                                <Bar
                                  dataKey="value"
                                  name="Importance"
                                  fill="#38BDF8"
                                  radius={[0, 4, 4, 0]}
                                  barSize={16}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="h-64 w-full flex items-center justify-center text-xs text-muted-foreground text-center p-6">
                            Feature importance is non-linear or mathematically undefined for this
                            classifier family ({selectedModel.family}).
                          </div>
                        )}
                      </ChartCard>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* LIVE INTERACTIVE CLASSIFIER INFERENCE PLAYGROUND                          */}
                {/* ========================================================================= */}
                <div className="panel p-6 space-y-5 border-t-2 border-t-primary/30">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Sparkles className="size-4 text-primary" /> Live Research Topic Predictor &
                        Percentage Analyzer
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Select an uploaded paper or enter custom text to test any classifier and
                        dynamically inspect output probabilities.
                      </p>
                    </div>

                  </div>

                  {/* Input Mode Toggle */}
                  <div className="flex rounded-lg border border-border bg-elevated p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTestMode("corpus");
                        setPredictionResult(null);
                      }}
                      className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                        testMode === "corpus"
                          ? "bg-primary text-primary-foreground shadow"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Select Analyzed Paper
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTestMode("custom");
                        setPredictionResult(null);
                      }}
                      className={`px-3 py-1 text-xs rounded font-medium transition-all ${
                        testMode === "custom"
                          ? "bg-primary text-primary-foreground shadow"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Custom Text / Idea
                    </button>
                  </div>

                  {/* Input Selectors */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Left: Corpus paper selector OR custom text */}
                    <div className="space-y-3">
                      {testMode === "corpus" ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <span>Select Analyzed Paper:</span>
                              <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] font-normal py-0">
                                {showAllCorpus ? "All Corpus Papers" : "Uploaded at this Instant"}
                              </Badge>
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowAllCorpus(!showAllCorpus)}
                              className="text-[11px] text-muted-foreground hover:text-primary underline transition-colors"
                            >
                              {showAllCorpus ? "Show only instant upload" : "Show all previous papers"}
                            </button>
                          </div>
                          {papers.length === 0 ? (
                            <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                              No analyzed paper found for this instant. Upload a paper and run analysis first.
                            </p>
                          ) : (
                            <select
                              value={selectedTestPaperId}
                              onChange={(e) => {
                                setSelectedTestPaperId(e.target.value);
                                setPredictionResult(null);
                              }}
                              className="w-full rounded-xl border border-primary/40 bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none shadow-sm font-medium"
                            >
                              {papers.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {showAllCorpus ? "" : "⚡ [Instant Upload] "}
                                  {p.title} ({p.authors[0] || "Author"} · {p.year})
                                </option>
                              ))}
                            </select>
                          )}

                          {currentTestingPaper && (
                            <div className="rounded-lg bg-background/60 p-3 border border-border/50 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-foreground truncate">
                                  {currentTestingPaper.title}
                                </p>
                                <span className="text-[10px] font-mono text-primary font-semibold shrink-0 ml-2">
                                  {currentTestingPaper.topic || "HAR Topic"}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                {currentTestingPaper.abstract}
                              </p>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {currentTestingPaper.algorithms?.slice(0, 4).map((algo) => (
                                  <span
                                    key={algo}
                                    className="rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 px-1.5 py-0.5 text-[10px]"
                                  >
                                    {algo}
                                  </span>
                                ))}
                                <span className="rounded bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 text-[10px]">
                                  {currentTestingPaper.year}
                                </span>
                                <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 text-[10px]">
                                  {predictMutation.isPending ? "Analyzing now…" : "Active Analysis Target"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-foreground">
                            Enter Research Idea, Abstract, or Method:
                          </label>
                          <textarea
                            rows={5}
                            value={customTestText}
                            onChange={(e) => setCustomTestText(e.target.value)}
                            placeholder="e.g. A vision transformer architecture with spatial-temporal self-attention applied to multi-axial accelerometer sensors for wearable activity classification..."
                            className="w-full rounded-xl border border-border bg-surface p-3 text-xs placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Right: Model Selection & Trigger */}
                    <div className="space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground">
                          Select Classification Algorithm:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "rf", name: "Random Forest", desc: "Ensemble Trees" },
                            { id: "svm", name: "SVM (RBF Kernel)", desc: "Margin-based" },
                            { id: "lr", name: "Logistic Regression", desc: "Linear Logit" },
                            { id: "nb", name: "Naïve Bayes", desc: "Probabilistic" },
                            { id: "dt", name: "Decision Tree", desc: "Transparent Rules" },
                            { id: "mlp", name: "MLP Neural Net", desc: "Deep Perceptron" },
                            { id: "knn", name: "KNN (Cosine)", desc: "Instance-based" },
                          ].map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setLiveTesterModelId(m.id);
                                setPredictionResult(null);
                              }}
                              className={`p-2.5 rounded-lg border text-left transition-all ${
                                liveTesterModelId === m.id
                                  ? "border-primary bg-primary/15 text-foreground ring-1 ring-primary/50"
                                  : "border-border bg-surface/50 text-muted-foreground hover:bg-surface/80 hover:text-foreground"
                              }`}
                            >
                              <p className="text-xs font-bold leading-none">{m.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">{m.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleRunTest(liveTesterModelId)}
                        disabled={predictMutation.isPending}
                        className="w-full py-5 text-xs font-bold gap-2 shadow-md"
                      >
                        <Zap
                          className={`size-4 ${predictMutation.isPending ? "animate-spin" : ""}`}
                        />
                        {predictMutation.isPending
                          ? "Analyzing & Computing Probabilities…"
                          : "Run Live Topic Inference"}
                      </Button>
                    </div>
                  </div>

                  {/* Ready state when inference hasn't been triggered yet */}
                  {!predictionResult && (
                    <div className="panel p-6 border-dashed border-border/80 text-center py-8 space-y-2 bg-surface/20">
                      <Zap className="size-6 text-primary/70 mx-auto" />
                      <p className="text-xs font-semibold text-foreground">
                        Ready for Topic Inference
                      </p>
                      <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                        Select an algorithm above and click &ldquo;Run Live Topic Inference&rdquo; to evaluate the selected paper.
                      </p>
                    </div>
                  )}

                  {/* Dynamic Prediction Results Display */}
                  {predictionResult && (
                    <div className="panel p-6 space-y-5 animate-in fade-in bg-surface/40">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-xs">
                              Prediction Complete
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              Latency: {predictionResult.latencyMs}ms
                            </span>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-primary font-medium">
                              Model: {predictionResult.modelName}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-foreground">
                            Predicted Topic:{" "}
                            <span className="text-primary">{predictionResult.predictedTopic}</span>
                          </h3>
                        </div>

                        <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 text-right">
                          <p className="text-[10px] uppercase font-bold text-primary">
                            Top Confidence
                          </p>
                          <p className="text-2xl font-mono font-bold text-white mt-0.5">
                            {predictionResult.confidence}%
                          </p>
                        </div>
                      </div>

                      {/* Probability distribution breakdown bars */}
                      <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <BarChart3 className="size-3.5 text-primary" /> Topic Probability
                            Distribution (Dynamic Percentages)
                          </h4>
                          <div className="space-y-2.5">
                            {predictionResult.probabilities.map((item, idx) => {
                              const isTop = item.topic === predictionResult.predictedTopic;
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-xs font-medium">
                                    <span
                                      className={
                                        isTop ? "text-primary font-bold" : "text-slate-300"
                                      }
                                    >
                                      {item.topic}
                                    </span>
                                    <span className="font-mono text-slate-200">
                                      {item.probability}%
                                    </span>
                                  </div>
                                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 rounded-full ${
                                        isTop ? "bg-primary" : "bg-slate-600"
                                      }`}
                                      style={{ width: `${Math.max(2, item.probability)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Top Driving Features */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Layers className="size-3.5 text-sky-400" /> Active Decision Features
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            Weighted keyword signals influencing this classifier's probability
                            output:
                          </p>
                          <div className="space-y-1.5">
                            {predictionResult.topFeatures.map((feat, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border/50 text-xs"
                              >
                                <span className="font-mono font-medium text-sky-300">
                                  {feat.name}
                                </span>
                                <span className="font-mono text-muted-foreground">
                                  {(feat.value * 100).toFixed(1)}% weight
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
