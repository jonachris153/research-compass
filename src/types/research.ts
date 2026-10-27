export type PaperStatus = "ready" | "processing" | "analyzed" | "failed";

export interface PaperMetadata {
  pages: number;
  sizeMb: number;
  journal: string;
  doi?: string;
  citations: number;
  references: number;
  demo?: boolean;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  topic: string;
  domain: string;
  algorithms: string[];
  datasets: string[];
  keywords: string[];
  similarity: number;
  status: PaperStatus;
  abstract: string;
  methodology: string;
  results: string;
  limitations: string[];
  futureWork: string[];
  opportunities: string[];
  metadata: PaperMetadata;
  relevanceCategory?: "relevant" | "borderline" | "low";
  relevanceScore?: number;
}

export interface ResearchTopic {
  id: string;
  name: string;
  paperCount: number;
  keywords: string[];
  topAlgorithm: string;
  representativePapers: string[];
  growth: number;
}

export interface ResearchLandscape {
  papersAnalyzed: number;
  topicsIdentified: number;
  algorithmsDetected: number;
  datasetsDetected: number;
  topicDistribution: { name: string; value: number }[];
  evolution: { year: string; papers: number; deepLearning: number; classical: number }[];
  algorithmAdoption: { name: string; value: number }[];
  datasetConcentration: { name: string; value: number }[];
  domains: { name: string; value: number }[];
  keywordCloud: { text: string; weight: number }[];
  clusters: ResearchTopic[];
  insights: Insight[];
}

export interface Insight {
  id: string;
  title: string;
  detail: string;
  sources: number;
  tone: "positive" | "neutral" | "warning";
}

export type GapCategory = "algorithm" | "dataset" | "methodology" | "application" | "future-work";

export interface GapEvidence {
  paperId: string;
  paperTitle: string;
  quote: string;
  signal: string;
}

export interface ResearchGap {
  id: string;
  title: string;
  description: string;
  category: GapCategory;
  gapScore: number;
  impactScore: number;
  confidence: number;
  coverage: number;
  evidenceCount: number;
  affectedPapers: number;
  trend: "rising" | "steady" | "declining";
  reasons: string[];
  signals: {
    underrepresentation: number;
    futureWorkSignal: number;
    methodConcentration: number;
    datasetConcentration: number;
    crossTopicOpportunity: number;
  };
  algorithms: string[];
  datasets: string[];
  relatedTopics: string[];
  evidence: GapEvidence[];
}

export interface ResearchIdea {
  id: string;
  title: string;
  problemStatement: string;
  proposedSolution: string;
  researchGap: string;
  techniques: string[];
  noveltyScore: number;
  impactScore: number;
  feasibilityScore: number;
  confidence: number;
  supportingPapers: number;
  supportingGaps: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  supportingPaperIds?: string[];
  supportingGapIds?: string[];
}

export interface SimilarityResult {
  paperId: string;
  title: string;
  authors: string[];
  year: number;
  topic: string;
  algorithms: string[];
  snippet: string;
  similarity: number;
  whySimilar: string[];
  matchedTopics: string[];
  matchedConcepts: string[];
  publisher?: string;
  journal?: string;
  citations?: number;
  domain?: string;
  datasets?: string[];
}

export interface MLModelResult {
  id: string;
  name: string;
  family: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  trainingTimeSec: number;
  description: string;
  confusionMatrix: number[][];
  featureImportance: { name: string; value: number }[];
  curve: { epoch: number; train: number; validation: number }[];
  labelClasses?: string[];
}

export interface UnsupervisedCluster {
  id?: string;
  name: string;
  paperCount: number;
  keywords: string[];
  topAlgorithm: string;
  representativePapers: string[];
  intraSimilarity?: number | null;
}

export interface InterClusterSimilarity {
  clusterA: string;
  clusterB: string;
  similarity: number;
}

export interface UnsupervisedAnalysis {
  available: boolean;
  numClusters?: number;
  totalRelevantPapers?: number;
  silhouetteScore?: number;
  silhouetteInterpretation?: string;
  clusters?: UnsupervisedCluster[];
  interClusterSimilarity?: InterClusterSimilarity[];
}

export interface WeakLabelSummary {
  status: string;
  totalLabelled?: number;
  labelDistribution?: Record<string, number>;
  bestModelId?: string;
  taxonomy?: string;
  reason?: string;
}

export interface ModelLabResults {
  supervised: MLModelResult[];
  unsupervised?: UnsupervisedAnalysis;
  weakLabelSummary?: WeakLabelSummary;
}

export interface DashboardStats {
  totalPapers: number;
  researchTopics: number;
  potentialGaps: number;
  generatedIdeas: number;
  averageSimilarity: number;
  activity: { month: string; papers: number; ideas: number }[];
  topicDistribution: { name: string; value: number }[];
  algorithmUsage: { name: string; value: number }[];
  domainDistribution: { name: string; value: number }[];
  insights: Insight[];
  recentPapers: Paper[];
}

export interface UploadItem {
  id: string;
  name: string;
  pages: number;
  sizeMb: number;
  status: PaperStatus;
  title?: string;
  authors?: string[];
  year?: number;
  journal?: string;
  abstract?: string;
  algorithms?: string[];
  datasets?: string[];
  error?: string;
}

export interface ModelPredictionProbability {
  topic: string;
  probability: number;
}

export interface ModelPredictionFeature {
  name: string;
  value: number;
}

export interface ModelPredictionResult {
  predictedTopic: string;
  confidence: number;
  probabilities: ModelPredictionProbability[];
  topFeatures: ModelPredictionFeature[];
  latencyMs: number;
  modelName: string;
}

export interface GlobalSearchResults {
  papers: Paper[];
  topics: ResearchTopic[];
  gaps: ResearchGap[];
  ideas: ResearchIdea[];
}
