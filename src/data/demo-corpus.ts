import type {
  DashboardStats,
  Insight,
  MLModelResult,
  Paper,
  ResearchGap,
  ResearchIdea,
  ResearchLandscape,
  ResearchTopic,
} from "@/types/research";

export const DEFAULT_PROJECT = {
  name: "Human Activity Recognition Literature",
  domain: "Human Activity Recognition",
  papers: 0,
  storagePercent: 0,
};

const TOPICS = [
  "Sensor-based HAR",
  "Vision-based HAR",
  "Explainable AI",
  "Federated Learning",
  "TinyML & Edge",
  "Feature Selection",
  "Transformer Models",
  "Privacy-preserving HAR",
];

const ALGOS = [
  "CNN",
  "LSTM",
  "SVM",
  "Random Forest",
  "Transformer",
  "MLP",
  "KNN",
  "Naïve Bayes",
  "Decision Tree",
  "Logistic Regression",
];

const DATASETS = ["UCI HAR", "WISDM", "PAMAP2", "Opportunity", "MHEALTH", "USC-HAD", "mHealth-X"];

const AUTHOR_POOL = [
  "A. Rehman",
  "M. Okafor",
  "L. Fontana",
  "S. Nakamura",
  "P. Iyer",
  "D. Kovács",
  "J. Mwangi",
  "E. Lindqvist",
  "R. Da Silva",
  "K. Petrova",
];

function pick<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(arr[(seed * (i + 3) + i * 7) % arr.length]!);
  return Array.from(new Set(out));
}

const TITLE_FRAGMENTS = [
  "Lightweight Deep Learning for Wearable Activity Recognition",
  "Attention-Based Temporal Modelling of Inertial Signals",
  "Comparative Study of Classical Classifiers for Activity Sensing",
  "Cross-Subject Generalization in Human Activity Recognition",
  "Explainability Assessment of Sensor-Based Activity Models",
  "Federated Training of Activity Recognition Models on Edge Devices",
  "Feature Selection Strategies for Multi-Sensor Activity Data",
  "Hybrid CNN-LSTM Architectures for Daily Living Activities",
  "Privacy-Preserving Representations for Wearable Sensing",
  "Transformer Encoders for Long-Horizon Activity Segmentation",
  "Data Augmentation for Imbalanced Activity Datasets",
  "On-Device Inference Trade-offs for TinyML Activity Models",
  "Benchmarking Random Forests Against Deep Models in HAR",
  "Sensor Placement Effects on Recognition Accuracy",
  "Semi-Supervised Learning for Sparsely Labelled Activity Streams",
  "Multimodal Fusion of Vision and Inertial Activity Cues",
];

function buildPaper(i: number): Paper {
  const year = 2017 + (i % 9);
  const topic = TOPICS[i % TOPICS.length]!;
  const algorithms = pick(ALGOS, 2 + (i % 2), i + 1);
  const datasets = pick(DATASETS, 1 + (i % 2), i + 5);
  const title = `${TITLE_FRAGMENTS[i % TITLE_FRAGMENTS.length]!}${i >= TITLE_FRAGMENTS.length ? ` (Study ${Math.floor(i / TITLE_FRAGMENTS.length) + 1})` : ""}`;
  return {
    id: `paper-${i + 1}`,
    title,
    authors: pick(AUTHOR_POOL, 2 + (i % 2), i + 2),
    year,
    topic,
    domain:
      i % 5 === 0
        ? "Healthcare Monitoring"
        : i % 3 === 0
          ? "Smart Environments"
          : "Wearable Sensing",
    algorithms,
    datasets,
    keywords: [topic, ...algorithms, datasets[0]!, "human activity recognition"],
    similarity: 62 + ((i * 13) % 36),
    status: i % 11 === 0 ? "processing" : i % 17 === 0 ? "ready" : "analyzed",
    abstract:
      "Demo Research Paper. This synthetic abstract describes an approach to human activity recognition using " +
      `${algorithms.join(" and ")} evaluated on the ${datasets.join(", ")} benchmark${datasets.length > 1 ? "s" : ""}. ` +
      "It is illustrative demo metadata used to exercise the interface and does not reference a real publication.",
    methodology:
      "Signals are segmented with sliding windows, normalised per-channel, and passed to the classifier. " +
      "Hyper-parameters are tuned with grid search under subject-wise cross-validation.",
    results: `Reported demo accuracy of ${(84 + ((i * 7) % 12)).toFixed(1)}% with macro F1 of ${(0.81 + (i % 12) / 100).toFixed(2)}.`,
    limitations: [
      "Evaluation limited to a single public benchmark.",
      "Model decisions are not interpretable to end users.",
      "Cross-user generalization degrades on unseen subjects.",
    ],
    futureWork: [
      "Extend evaluation to multi-dataset, cross-domain settings.",
      "Introduce explanation quality metrics alongside accuracy.",
      "Explore on-device and federated deployment.",
    ],
    opportunities: [
      "Explanation-quality benchmarking for wearable classifiers.",
      "Personalisation layers for cross-subject robustness.",
    ],
    metadata: {
      pages: 8 + (i % 9),
      sizeMb: Number((1.2 + (i % 7) * 0.45).toFixed(1)),
      journal:
        i % 3 === 0
          ? "Demo Journal of Intelligent Sensing"
          : i % 3 === 1
            ? "Demo Conference on Applied Machine Learning"
            : "Demo Transactions on Pervasive Computing",
      citations: 4 + ((i * 11) % 140),
      references: 22 + ((i * 5) % 40),
      demo: true,
    },
  };
}

export const PAPERS: Paper[] = Array.from({ length: 128 }, (_, i) => buildPaper(i));

const INSIGHTS: Insight[] = [
  {
    id: "ins-1",
    title: "Transformer adoption is accelerating",
    detail:
      "Transformer-based approaches have increased sharply across the most recent publication years in this corpus.",
    sources: 19,
    tone: "positive",
  },
  {
    id: "ins-2",
    title: "Dataset concentration is high",
    detail:
      "A small number of benchmarks account for the majority of evaluations, limiting external validity.",
    sources: 31,
    tone: "warning",
  },
  {
    id: "ins-3",
    title: "Explainability is stated but rarely implemented",
    detail:
      "Explainability appears frequently in future-work sections but is underrepresented in implemented methodologies.",
    sources: 22,
    tone: "neutral",
  },
  {
    id: "ins-4",
    title: "Classical baselines remain competitive",
    detail:
      "SVM and Random Forest baselines stay within a few points of deep models on smaller sensor corpora.",
    sources: 14,
    tone: "neutral",
  },
];

export const DASHBOARD: DashboardStats = {
  totalPapers: 0,
  researchTopics: 0,
  potentialGaps: 0,
  generatedIdeas: 0,
  averageSimilarity: 0,
  activity: [
    { month: "Jan", papers: 6, ideas: 2 },
    { month: "Feb", papers: 9, ideas: 3 },
    { month: "Mar", papers: 14, ideas: 4 },
    { month: "Apr", papers: 11, ideas: 3 },
    { month: "May", papers: 18, ideas: 6 },
    { month: "Jun", papers: 21, ideas: 5 },
    { month: "Jul", papers: 24, ideas: 7 },
    { month: "Aug", papers: 25, ideas: 6 },
  ],
  topicDistribution: [
    { name: "Sensor-based HAR", value: 34 },
    { name: "Vision-based HAR", value: 22 },
    { name: "Explainable AI", value: 14 },
    { name: "Federated Learning", value: 12 },
    { name: "TinyML & Edge", value: 10 },
    { name: "Other", value: 8 },
  ],
  algorithmUsage: [
    { name: "CNN", value: 61 },
    { name: "LSTM", value: 48 },
    { name: "SVM", value: 39 },
    { name: "Random Forest", value: 33 },
    { name: "Transformer", value: 27 },
    { name: "MLP", value: 19 },
  ],
  domainDistribution: [
    { name: "Wearable Sensing", value: 58 },
    { name: "Healthcare Monitoring", value: 31 },
    { name: "Smart Environments", value: 24 },
    { name: "Sports Analytics", value: 9 },
    { name: "Industrial Safety", value: 6 },
  ],
  insights: INSIGHTS,
  recentPapers: PAPERS.slice(0, 6),
};

export const CLUSTERS: ResearchTopic[] = [
  {
    id: "topic-1",
    name: "Sensor-based HAR",
    paperCount: 34,
    keywords: ["accelerometer", "sliding window", "IMU", "segmentation"],
    topAlgorithm: "CNN",
    representativePapers: [PAPERS[0]!.title, PAPERS[7]!.title],
    growth: 12,
  },
  {
    id: "topic-2",
    name: "Explainable AI",
    paperCount: 14,
    keywords: ["saliency", "SHAP", "interpretability", "trust"],
    topAlgorithm: "Random Forest",
    representativePapers: [PAPERS[4]!.title, PAPERS[12]!.title],
    growth: 41,
  },
  {
    id: "topic-3",
    name: "Federated Learning",
    paperCount: 12,
    keywords: ["client drift", "aggregation", "privacy", "on-device"],
    topAlgorithm: "MLP",
    representativePapers: [PAPERS[5]!.title, PAPERS[21]!.title],
    growth: 33,
  },
  {
    id: "topic-4",
    name: "TinyML & Edge",
    paperCount: 10,
    keywords: ["quantisation", "latency", "microcontroller", "energy"],
    topAlgorithm: "CNN",
    representativePapers: [PAPERS[11]!.title, PAPERS[27]!.title],
    growth: 27,
  },
  {
    id: "topic-5",
    name: "Transformer Models",
    paperCount: 17,
    keywords: ["self-attention", "long horizon", "pretraining", "tokens"],
    topAlgorithm: "Transformer",
    representativePapers: [PAPERS[9]!.title, PAPERS[25]!.title],
    growth: 48,
  },
  {
    id: "topic-6",
    name: "Feature Selection",
    paperCount: 11,
    keywords: ["mutual information", "wrapper", "dimensionality", "ranking"],
    topAlgorithm: "SVM",
    representativePapers: [PAPERS[6]!.title, PAPERS[18]!.title],
    growth: 6,
  },
];

export const LANDSCAPE: ResearchLandscape = {
  papersAnalyzed: 128,
  topicsIdentified: 18,
  algorithmsDetected: 27,
  datasetsDetected: 14,
  topicDistribution: DASHBOARD.topicDistribution,
  evolution: [
    { year: "2017", papers: 6, deepLearning: 2, classical: 4 },
    { year: "2018", papers: 9, deepLearning: 4, classical: 5 },
    { year: "2019", papers: 13, deepLearning: 7, classical: 6 },
    { year: "2020", papers: 16, deepLearning: 10, classical: 6 },
    { year: "2021", papers: 21, deepLearning: 15, classical: 6 },
    { year: "2022", papers: 24, deepLearning: 18, classical: 6 },
    { year: "2023", papers: 19, deepLearning: 15, classical: 4 },
    { year: "2024", papers: 20, deepLearning: 17, classical: 3 },
  ],
  algorithmAdoption: [
    { name: "CNN", value: 61 },
    { name: "LSTM", value: 48 },
    { name: "SVM", value: 39 },
    { name: "Random Forest", value: 33 },
    { name: "Transformer", value: 27 },
    { name: "KNN", value: 15 },
  ],
  datasetConcentration: [
    { name: "UCI HAR", value: 44 },
    { name: "WISDM", value: 31 },
    { name: "PAMAP2", value: 25 },
    { name: "Opportunity", value: 17 },
    { name: "MHEALTH", value: 12 },
    { name: "USC-HAD", value: 7 },
  ],
  domains: DASHBOARD.domainDistribution,
  keywordCloud: [
    { text: "human activity recognition", weight: 100 },
    { text: "CNN", weight: 82 },
    { text: "wearable sensors", weight: 76 },
    { text: "LSTM", weight: 70 },
    { text: "explainability", weight: 62 },
    { text: "feature selection", weight: 58 },
    { text: "transformer", weight: 55 },
    { text: "federated learning", weight: 50 },
    { text: "edge inference", weight: 45 },
    { text: "cross-subject", weight: 42 },
    { text: "data augmentation", weight: 38 },
    { text: "privacy", weight: 36 },
    { text: "SVM", weight: 34 },
    { text: "random forest", weight: 30 },
    { text: "quantisation", weight: 26 },
    { text: "segmentation", weight: 24 },
    { text: "class imbalance", weight: 22 },
    { text: "multimodal fusion", weight: 20 },
  ],
  clusters: CLUSTERS,
  insights: [
    {
      id: "l-1",
      title: "Deep learning shift since 2021",
      detail: "Research activity has shifted toward deep-learning approaches since 2021.",
      sources: 42,
      tone: "positive",
    },
    {
      id: "l-2",
      title: "Benchmark concentration",
      detail: "Most papers remain concentrated around a small number of datasets.",
      sources: 61,
      tone: "warning",
    },
    {
      id: "l-3",
      title: "Explainability emerging",
      detail: "Explainability appears as an emerging theme with rapid year-on-year growth.",
      sources: 22,
      tone: "neutral",
    },
  ],
};

function gapEvidence(indices: number[], signal: string): ResearchGap["evidence"] {
  return indices.map((i) => {
    const paper = PAPERS[i]!;
    return {
      paperId: paper.id,
      paperTitle: paper.title,
      quote: paper.futureWork[i % paper.futureWork.length]!,
      signal,
    };
  });
}

export const GAPS: ResearchGap[] = [
  {
    id: "gap-1",
    title: "Explainable AI for Human Activity Recognition",
    description:
      "Corpus papers overwhelmingly rely on black-box models while naming explainability as future work, with almost no evaluation of explanation quality.",
    category: "methodology",
    gapScore: 91,
    impactScore: 89,
    confidence: 87,
    coverage: 18,
    evidenceCount: 7,
    affectedPapers: 22,
    trend: "rising",
    reasons: [
      "Most papers use black-box models",
      "Explainability is frequently identified as future work",
      "Few papers evaluate explanation quality",
    ],
    signals: {
      underrepresentation: 88,
      futureWorkSignal: 93,
      methodConcentration: 74,
      datasetConcentration: 52,
      crossTopicOpportunity: 81,
    },
    algorithms: ["CNN", "LSTM", "Random Forest"],
    datasets: ["UCI HAR", "PAMAP2"],
    relatedTopics: ["Explainable AI", "Sensor-based HAR"],
    evidence: gapEvidence([4, 12, 20, 28, 33, 41, 57], "future-work mention"),
  },
  {
    id: "gap-2",
    title: "Cross-dataset generalization beyond UCI HAR",
    description:
      "Evaluation is concentrated on a handful of benchmarks; cross-dataset transfer is rarely measured.",
    category: "dataset",
    gapScore: 86,
    impactScore: 84,
    confidence: 90,
    coverage: 26,
    evidenceCount: 9,
    affectedPapers: 44,
    trend: "steady",
    reasons: [
      "44 of 128 papers evaluate only on UCI HAR",
      "Transfer protocols are inconsistently reported",
      "Few papers publish cross-corpus splits",
    ],
    signals: {
      underrepresentation: 72,
      futureWorkSignal: 66,
      methodConcentration: 48,
      datasetConcentration: 94,
      crossTopicOpportunity: 70,
    },
    algorithms: ["CNN", "SVM"],
    datasets: ["UCI HAR", "WISDM", "Opportunity"],
    relatedTopics: ["Sensor-based HAR", "Feature Selection"],
    evidence: gapEvidence([1, 9, 15, 23, 31], "dataset concentration"),
  },
  {
    id: "gap-3",
    title: "Energy-aware TinyML activity models",
    description:
      "On-device latency is reported occasionally, but energy cost per inference is almost never quantified.",
    category: "application",
    gapScore: 83,
    impactScore: 80,
    confidence: 78,
    coverage: 12,
    evidenceCount: 6,
    affectedPapers: 10,
    trend: "rising",
    reasons: [
      "Energy metrics missing from edge deployment studies",
      "Quantisation trade-offs reported without power budget",
      "No shared measurement protocol in corpus",
    ],
    signals: {
      underrepresentation: 91,
      futureWorkSignal: 71,
      methodConcentration: 55,
      datasetConcentration: 44,
      crossTopicOpportunity: 76,
    },
    algorithms: ["CNN", "MLP"],
    datasets: ["WISDM", "MHEALTH"],
    relatedTopics: ["TinyML & Edge", "Privacy-preserving HAR"],
    evidence: gapEvidence([11, 27, 39, 46], "underrepresentation"),
  },
  {
    id: "gap-4",
    title: "Personalisation for cross-subject robustness",
    description:
      "Subject-wise accuracy drops are acknowledged but personalisation strategies are seldom implemented or compared.",
    category: "algorithm",
    gapScore: 80,
    impactScore: 82,
    confidence: 84,
    coverage: 21,
    evidenceCount: 8,
    affectedPapers: 26,
    trend: "rising",
    reasons: [
      "Cross-subject degradation reported in most studies",
      "Few adaptive or few-shot personalisation baselines",
      "No standard personalisation evaluation split",
    ],
    signals: {
      underrepresentation: 79,
      futureWorkSignal: 85,
      methodConcentration: 68,
      datasetConcentration: 49,
      crossTopicOpportunity: 73,
    },
    algorithms: ["LSTM", "Transformer", "KNN"],
    datasets: ["PAMAP2", "USC-HAD"],
    relatedTopics: ["Sensor-based HAR", "Federated Learning"],
    evidence: gapEvidence([3, 14, 22, 35], "future-work mention"),
  },
  {
    id: "gap-5",
    title: "Privacy budgets in federated activity recognition",
    description:
      "Federated setups are proposed without differential-privacy budgets or leakage evaluation.",
    category: "methodology",
    gapScore: 77,
    impactScore: 79,
    confidence: 75,
    coverage: 14,
    evidenceCount: 5,
    affectedPapers: 12,
    trend: "rising",
    reasons: [
      "Privacy claimed but not quantified",
      "No membership-inference evaluation in corpus",
      "Aggregation protocols rarely compared",
    ],
    signals: {
      underrepresentation: 84,
      futureWorkSignal: 69,
      methodConcentration: 61,
      datasetConcentration: 40,
      crossTopicOpportunity: 66,
    },
    algorithms: ["MLP", "CNN"],
    datasets: ["MHEALTH", "Opportunity"],
    relatedTopics: ["Federated Learning", "Privacy-preserving HAR"],
    evidence: gapEvidence([5, 21, 44], "future-work mention"),
  },
  {
    id: "gap-6",
    title: "Reporting standards for class-imbalanced activities",
    description:
      "Rare activities are under-reported; accuracy is used where macro-F1 or per-class recall would be informative.",
    category: "future-work",
    gapScore: 74,
    impactScore: 71,
    confidence: 82,
    coverage: 30,
    evidenceCount: 7,
    affectedPapers: 37,
    trend: "steady",
    reasons: [
      "Accuracy-only reporting is common",
      "Rare-class recall rarely disclosed",
      "Augmentation effects not ablated",
    ],
    signals: {
      underrepresentation: 63,
      futureWorkSignal: 58,
      methodConcentration: 52,
      datasetConcentration: 57,
      crossTopicOpportunity: 48,
    },
    algorithms: ["Random Forest", "SVM", "CNN"],
    datasets: ["WISDM", "UCI HAR"],
    relatedTopics: ["Feature Selection", "Sensor-based HAR"],
    evidence: gapEvidence([10, 24, 36], "underrepresentation"),
  },
  {
    id: "gap-7",
    title: "Multimodal fusion of vision and inertial cues",
    description:
      "Vision and sensor communities publish in parallel with few fused benchmarks inside the corpus.",
    category: "algorithm",
    gapScore: 72,
    impactScore: 76,
    confidence: 70,
    coverage: 16,
    evidenceCount: 4,
    affectedPapers: 15,
    trend: "rising",
    reasons: [
      "Cross-topic overlap is low",
      "Fusion baselines absent from most comparisons",
      "Synchronisation protocols undocumented",
    ],
    signals: {
      underrepresentation: 77,
      futureWorkSignal: 61,
      methodConcentration: 59,
      datasetConcentration: 46,
      crossTopicOpportunity: 88,
    },
    algorithms: ["CNN", "Transformer"],
    datasets: ["Opportunity", "USC-HAD"],
    relatedTopics: ["Vision-based HAR", "Sensor-based HAR"],
    evidence: gapEvidence([15, 30, 52], "cross-topic opportunity"),
  },
  {
    id: "gap-8",
    title: "Interpretable feature selection pipelines",
    description:
      "Feature selection is used for accuracy gains, rarely to produce human-readable activity descriptors.",
    category: "methodology",
    gapScore: 69,
    impactScore: 68,
    confidence: 74,
    coverage: 23,
    evidenceCount: 5,
    affectedPapers: 18,
    trend: "steady",
    reasons: [
      "Selection reported as preprocessing only",
      "Selected features rarely interpreted",
      "Stability of selection seldom measured",
    ],
    signals: {
      underrepresentation: 66,
      futureWorkSignal: 55,
      methodConcentration: 71,
      datasetConcentration: 43,
      crossTopicOpportunity: 57,
    },
    algorithms: ["SVM", "Random Forest", "Logistic Regression"],
    datasets: ["UCI HAR", "PAMAP2"],
    relatedTopics: ["Feature Selection", "Explainable AI"],
    evidence: gapEvidence([6, 18, 40], "method concentration"),
  },
];

export const IDEAS: ResearchIdea[] = [
  {
    id: "idea-1",
    title: "Adaptive Explainable Human Activity Recognition Using Hybrid Machine Learning",
    problemStatement:
      "Wearable activity classifiers are accurate but opaque, and their accuracy degrades on unseen users.",
    proposedSolution:
      "Combine a compact feature-selection front-end with an SVM/Random Forest ensemble and an explanation layer that scores per-activity feature attributions, adapting thresholds per user.",
    researchGap: "Limited explainability and poor cross-user generalization.",
    techniques: ["SVM", "Random Forest", "Feature Selection", "Explainable AI"],
    noveltyScore: 92,
    impactScore: 88,
    feasibilityScore: 95,
    confidence: 89,
    supportingPapers: 14,
    supportingGaps: 3,
    difficulty: "Intermediate",
  },
  {
    id: "idea-2",
    title: "Energy-Budgeted TinyML Benchmark for On-Device Activity Recognition",
    problemStatement:
      "Edge HAR studies report latency but not energy per inference, making deployment comparisons unreliable.",
    proposedSolution:
      "Define a measurement protocol and compare quantised CNN/MLP models under fixed energy budgets across microcontroller classes.",
    researchGap: "Energy-aware evaluation is missing from edge deployment studies.",
    techniques: ["CNN", "MLP", "Quantisation", "Benchmarking"],
    noveltyScore: 87,
    impactScore: 84,
    feasibilityScore: 90,
    confidence: 82,
    supportingPapers: 9,
    supportingGaps: 2,
    difficulty: "Intermediate",
  },
  {
    id: "idea-3",
    title: "Cross-Dataset Transfer Protocol for Sensor-Based Activity Models",
    problemStatement:
      "Benchmarks are siloed, so reported gains rarely transfer to a different corpus or sensor placement.",
    proposedSolution:
      "Build a leave-one-dataset-out protocol with harmonised label maps and evaluate classical and deep baselines under it.",
    researchGap: "Dataset concentration limits external validity.",
    techniques: ["Random Forest", "CNN", "Domain Adaptation"],
    noveltyScore: 84,
    impactScore: 86,
    feasibilityScore: 88,
    confidence: 85,
    supportingPapers: 17,
    supportingGaps: 2,
    difficulty: "Advanced",
  },
  {
    id: "idea-4",
    title: "Privacy-Quantified Federated Activity Recognition on Wearables",
    problemStatement:
      "Federated HAR claims privacy without measuring leakage or reporting a privacy budget.",
    proposedSolution:
      "Train federated MLP/CNN clients with differential privacy and report accuracy against epsilon plus membership-inference resistance.",
    researchGap: "Privacy claims are unquantified in federated setups.",
    techniques: ["Federated Learning", "MLP", "Differential Privacy"],
    noveltyScore: 89,
    impactScore: 83,
    feasibilityScore: 76,
    confidence: 78,
    supportingPapers: 11,
    supportingGaps: 2,
    difficulty: "Advanced",
  },
  {
    id: "idea-5",
    title: "Interpretable Feature Descriptors for Rare Activity Classes",
    problemStatement:
      "Rare activities are misclassified and their errors are hidden behind aggregate accuracy.",
    proposedSolution:
      "Pair stability-selected features with per-class recall reporting and produce human-readable descriptors for each rare activity.",
    researchGap: "Class-imbalance reporting and interpretable selection are both weak.",
    techniques: ["Feature Selection", "Logistic Regression", "Explainable AI"],
    noveltyScore: 81,
    impactScore: 77,
    feasibilityScore: 93,
    confidence: 80,
    supportingPapers: 8,
    supportingGaps: 2,
    difficulty: "Beginner",
  },
  {
    id: "idea-6",
    title: "Attention-Fused Vision and Inertial Recognition of Daily Living Activities",
    problemStatement:
      "Vision and inertial pipelines are evaluated separately despite complementary error profiles.",
    proposedSolution:
      "Use a lightweight transformer encoder to fuse synchronised video keypoints and IMU windows, ablating each modality.",
    researchGap: "Cross-topic fusion opportunity between vision and sensor HAR.",
    techniques: ["Transformer", "CNN", "Multimodal Fusion"],
    noveltyScore: 90,
    impactScore: 85,
    feasibilityScore: 72,
    confidence: 76,
    supportingPapers: 12,
    supportingGaps: 2,
    difficulty: "Advanced",
  },
];

export const MODELS: MLModelResult[] = [
  {
    id: "nb",
    name: "Naïve Bayes",
    family: "Probabilistic",
    accuracy: 89.4,
    precision: 88.1,
    recall: 87.6,
    f1: 87.8,
    trainingTimeSec: 0.4,
    description:
      "Applies Bayes' theorem with a conditional-independence assumption. Extremely fast, a strong baseline for text-derived paper features.",
    confusionMatrix: [
      [42, 3, 2, 1],
      [4, 38, 3, 2],
      [2, 4, 40, 3],
      [1, 2, 4, 41],
    ],
    featureImportance: [
      { name: "abstract tf-idf", value: 0.31 },
      { name: "keyword density", value: 0.24 },
      { name: "algorithm mentions", value: 0.2 },
      { name: "dataset mentions", value: 0.15 },
      { name: "year", value: 0.1 },
    ],
    curve: Array.from({ length: 10 }, (_, i) => ({
      epoch: i + 1,
      train: 78 + i * 1.4,
      validation: 76 + i * 1.2,
    })),
  },
  {
    id: "lr",
    name: "Logistic Regression",
    family: "Linear",
    accuracy: 91.2,
    precision: 90.4,
    recall: 90.1,
    f1: 90.2,
    trainingTimeSec: 1.1,
    description:
      "Linear decision boundaries with interpretable coefficients, useful when explainability of topic assignment matters.",
    confusionMatrix: [
      [44, 2, 1, 1],
      [3, 41, 2, 1],
      [2, 2, 43, 2],
      [1, 2, 2, 43],
    ],
    featureImportance: [
      { name: "keyword density", value: 0.3 },
      { name: "abstract tf-idf", value: 0.27 },
      { name: "algorithm mentions", value: 0.21 },
      { name: "citation count", value: 0.12 },
      { name: "dataset mentions", value: 0.1 },
    ],
    curve: Array.from({ length: 10 }, (_, i) => ({
      epoch: i + 1,
      train: 81 + i * 1.3,
      validation: 79 + i * 1.15,
    })),
  },
  {
    id: "svm",
    name: "SVM",
    family: "Margin-based",
    accuracy: 94.6,
    precision: 94.1,
    recall: 93.8,
    f1: 93.9,
    trainingTimeSec: 3.8,
    description:
      "Maximum-margin classifier with an RBF kernel; the strongest performer on this corpus' sparse high-dimensional features.",
    confusionMatrix: [
      [46, 1, 1, 0],
      [2, 44, 1, 0],
      [1, 1, 45, 2],
      [0, 1, 2, 45],
    ],
    featureImportance: [
      { name: "abstract tf-idf", value: 0.34 },
      { name: "keyword density", value: 0.26 },
      { name: "methodology n-grams", value: 0.18 },
      { name: "algorithm mentions", value: 0.13 },
      { name: "dataset mentions", value: 0.09 },
    ],
    curve: Array.from({ length: 10 }, (_, i) => ({
      epoch: i + 1,
      train: 85 + i * 1.1,
      validation: 83 + i * 1.05,
    })),
  },
  {
    id: "dt",
    name: "Decision Tree",
    family: "Tree-based",
    accuracy: 88.7,
    precision: 87.2,
    recall: 87.9,
    f1: 87.5,
    trainingTimeSec: 0.7,
    description:
      "Recursive feature splits producing directly readable rules, at the cost of variance on unseen papers.",
    confusionMatrix: [
      [41, 4, 2, 1],
      [5, 37, 3, 2],
      [3, 3, 39, 4],
      [2, 2, 4, 40],
    ],
    featureImportance: [
      { name: "algorithm mentions", value: 0.35 },
      { name: "dataset mentions", value: 0.25 },
      { name: "year", value: 0.18 },
      { name: "keyword density", value: 0.13 },
      { name: "citation count", value: 0.09 },
    ],
    curve: Array.from({ length: 10 }, (_, i) => ({
      epoch: i + 1,
      train: 84 + i * 1.6,
      validation: 76 + i * 1.0,
    })),
  },
  {
    id: "rf",
    name: "Random Forest",
    family: "Ensemble",
    accuracy: 92.8,
    precision: 92.0,
    recall: 91.7,
    f1: 91.8,
    trainingTimeSec: 5.2,
    description:
      "Bagged decision trees with feature subsampling; robust and provides usable feature-importance signals.",
    confusionMatrix: [
      [45, 2, 1, 0],
      [3, 42, 2, 1],
      [1, 2, 44, 2],
      [1, 1, 3, 44],
    ],
    featureImportance: [
      { name: "keyword density", value: 0.29 },
      { name: "abstract tf-idf", value: 0.26 },
      { name: "algorithm mentions", value: 0.22 },
      { name: "dataset mentions", value: 0.14 },
      { name: "year", value: 0.09 },
    ],
    curve: Array.from({ length: 10 }, (_, i) => ({
      epoch: i + 1,
      train: 86 + i * 1.2,
      validation: 82 + i * 1.1,
    })),
  },
  {
    id: "knn",
    name: "KNN",
    family: "Instance-based",
    accuracy: 87.9,
    precision: 86.8,
    recall: 86.2,
    f1: 86.5,
    trainingTimeSec: 0.2,
    description:
      "Non-parametric neighbourhood voting; effectively the same distance logic that powers semantic paper retrieval.",
    confusionMatrix: [
      [40, 4, 3, 1],
      [5, 36, 4, 2],
      [3, 4, 38, 4],
      [2, 3, 4, 39],
    ],
    featureImportance: [
      { name: "embedding distance", value: 0.42 },
      { name: "keyword overlap", value: 0.24 },
      { name: "topic prior", value: 0.16 },
      { name: "year proximity", value: 0.1 },
      { name: "dataset overlap", value: 0.08 },
    ],
    curve: Array.from({ length: 10 }, (_, i) => ({
      epoch: i + 1,
      train: 80 + i * 1.0,
      validation: 78 + i * 0.9,
    })),
  },
  {
    id: "mlp",
    name: "MLP Neural Network",
    family: "Neural network",
    accuracy: 93.1,
    precision: 92.6,
    recall: 92.4,
    f1: 92.5,
    trainingTimeSec: 12.6,
    description:
      "Fully connected network over dense embeddings; captures non-linear topic boundaries with the longest training time.",
    confusionMatrix: [
      [45, 2, 1, 0],
      [2, 43, 2, 1],
      [1, 2, 44, 2],
      [1, 1, 2, 45],
    ],
    featureImportance: [
      { name: "sentence embeddings", value: 0.38 },
      { name: "abstract tf-idf", value: 0.24 },
      { name: "keyword density", value: 0.18 },
      { name: "algorithm mentions", value: 0.12 },
      { name: "dataset mentions", value: 0.08 },
    ],
    curve: Array.from({ length: 10 }, (_, i) => ({
      epoch: i + 1,
      train: 83 + i * 1.5,
      validation: 81 + i * 1.25,
    })),
  },
];
