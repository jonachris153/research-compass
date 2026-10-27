"""
Pydantic v2 models that mirror the TypeScript interfaces in src/types/research.ts
"""
from __future__ import annotations

from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class PaperStatus(str, Enum):
    ready = "ready"
    processing = "processing"
    analyzed = "analyzed"
    failed = "failed"


class RelevanceCategory(str, Enum):
    relevant = "relevant"
    borderline = "borderline"
    low = "low"


class GapCategory(str, Enum):
    algorithm = "algorithm"
    dataset = "dataset"
    methodology = "methodology"
    application = "application"
    future_work = "future-work"


class InsightTone(str, Enum):
    positive = "positive"
    neutral = "neutral"
    warning = "warning"


class Trend(str, Enum):
    rising = "rising"
    steady = "steady"
    declining = "declining"


class Difficulty(str, Enum):
    beginner = "Beginner"
    intermediate = "Intermediate"
    advanced = "Advanced"


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------

class PaperMetadata(BaseModel):
    pages: int
    sizeMb: float
    journal: str
    doi: Optional[str] = None
    citations: int = 0
    references: int = 0
    demo: bool = False


class Insight(BaseModel):
    id: str
    title: str
    detail: str
    sources: int
    tone: InsightTone


class GapEvidence(BaseModel):
    paperId: str
    paperTitle: str
    quote: str
    signal: str


class GapSignals(BaseModel):
    underrepresentation: float
    futureWorkSignal: float
    methodConcentration: float
    datasetConcentration: float
    crossTopicOpportunity: float


# ---------------------------------------------------------------------------
# Core models
# ---------------------------------------------------------------------------

class Paper(BaseModel):
    id: str
    title: str
    authors: list[str]
    year: int
    topic: str
    domain: str
    algorithms: list[str]
    datasets: list[str]
    keywords: list[str]
    similarity: float = 0.0
    relevanceScore: float = 1.0
    relevanceCategory: RelevanceCategory = RelevanceCategory.relevant
    status: PaperStatus = PaperStatus.ready
    abstract: str = ""
    methodology: str = ""
    results: str = ""
    limitations: list[str] = Field(default_factory=list)
    futureWork: list[str] = Field(default_factory=list)
    opportunities: list[str] = Field(default_factory=list)
    metadata: PaperMetadata


class ResearchTopic(BaseModel):
    id: str
    name: str
    paperCount: int
    keywords: list[str]
    topAlgorithm: str
    representativePapers: list[str]
    growth: float = 0.0


class NameValue(BaseModel):
    name: str
    value: float


class YearEvolution(BaseModel):
    year: str
    papers: int
    deepLearning: int
    classical: int


class KeywordWeight(BaseModel):
    text: str
    weight: float


class ResearchLandscape(BaseModel):
    papersAnalyzed: int
    topicsIdentified: int
    algorithmsDetected: int
    datasetsDetected: int
    topicDistribution: list[NameValue]
    evolution: list[YearEvolution]
    algorithmAdoption: list[NameValue]
    datasetConcentration: list[NameValue]
    domains: list[NameValue]
    keywordCloud: list[KeywordWeight]
    clusters: list[ResearchTopic]
    insights: list[Insight]


class ResearchGap(BaseModel):
    id: str
    title: str
    description: str
    category: GapCategory
    gapScore: float
    impactScore: float
    confidence: float
    coverage: float
    evidenceCount: int
    affectedPapers: int
    trend: Trend
    reasons: list[str]
    signals: GapSignals
    algorithms: list[str]
    datasets: list[str]
    relatedTopics: list[str]
    evidence: list[GapEvidence]


class ResearchIdea(BaseModel):
    id: str
    title: str
    problemStatement: str
    proposedSolution: str
    researchGap: str
    techniques: list[str]
    noveltyScore: float
    impactScore: float
    feasibilityScore: float
    confidence: float
    supportingPapers: int
    supportingGaps: int
    supportingPaperIds: list[str] = Field(default_factory=list)
    supportingGapIds: list[str] = Field(default_factory=list)
    difficulty: Difficulty


class SimilarityResult(BaseModel):
    paperId: str
    title: str
    authors: list[str]
    year: int
    topic: str
    algorithms: list[str]
    snippet: str
    similarity: float
    whySimilar: list[str]
    matchedTopics: list[str]
    matchedConcepts: list[str]


class FeatureImportance(BaseModel):
    name: str
    value: float


class LearningCurvePoint(BaseModel):
    epoch: int
    train: float
    validation: float


class MLModelResult(BaseModel):
    id: str
    name: str
    family: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    trainingTimeSec: float
    description: str
    confusionMatrix: list[list[int]]
    featureImportance: list[FeatureImportance]
    curve: list[LearningCurvePoint]


class ActivityPoint(BaseModel):
    month: str
    papers: int
    ideas: int


class DashboardStats(BaseModel):
    totalPapers: int
    researchTopics: int
    potentialGaps: int
    generatedIdeas: int
    averageSimilarity: float
    activity: list[ActivityPoint]
    topicDistribution: list[NameValue]
    algorithmUsage: list[NameValue]
    domainDistribution: list[NameValue]
    insights: list[Insight]
    recentPapers: list[Paper]


class UploadItem(BaseModel):
    id: str
    name: str
    pages: int
    sizeMb: float
    status: PaperStatus
    error: Optional[str] = None


class GlobalSearchResults(BaseModel):
    papers: list[Paper]
    topics: list[ResearchTopic]
    gaps: list[ResearchGap]
    ideas: list[ResearchIdea]


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------

class SimilarQuery(BaseModel):
    query: str


class AnalyzeRequest(BaseModel):
    paper_ids: Optional[list[str]] = None


class IdeaGenerationRequest(BaseModel):
    domain: str = ""
    technique: str = ""
    difficulty: str = ""
    application: str = ""
    focus: str = ""
    count: int = 6
