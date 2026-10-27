"""
PDF processing pipeline:
  - Validate file (magic bytes, size)
  - Deduplicate by SHA-256
  - Extract text with PyMuPDF
  - Detect scanned/image-only PDFs
  - Segment text into paper sections
  - Parse clean metadata (title, authors, year, keywords)
  - Controlled algorithm and dataset vocabulary
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from typing import Optional

try:
    import pymupdf as fitz  # PyMuPDF
    PYMUPDF_OK = True
except ImportError:
    PYMUPDF_OK = False

MAX_SIZE_MB = 50
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

# Controlled vocabulary for algorithms
CONTROLLED_ALGORITHMS = {
    "SVM": [r"\bsvm\b", r"\bsupport\s+vector\s+machines?\b"],
    "CNN": [r"\bcnn\b", r"\bconvolutional\s+neural\s+networks?\b", r"\bconvnet\b"],
    "LSTM": [r"\blstm\b", r"\blong\s+short[\s-]term\s+memory\b"],
    "GRU": [r"\bgru\b", r"\bgated\s+recurrent\s+units?\b"],
    "Transformer": [r"\btransformers?\b", r"\bself-attention\b"],
    "ViT": [r"\bvit\b", r"\bvision\s+transformers?\b"],
    "BERT": [r"\bbert\b", r"\broberta\b"],
    "Random Forest": [r"\brandom\s+forests?\b"],
    "Decision Tree": [r"\bdecision\s+trees?\b"],
    "KNN": [r"\bknn\b", r"\bk-nearest\s+neighbors?\b"],
    "Naive Bayes": [r"\bnaive\s+bayes\b", r"\bnaïve\s+bayes\b"],
    "MLP": [r"\bmlp\b", r"\bmulti[\s-]layer\s+perceptrons?\b", r"\bfeedforward\s+neural\s+networks?\b"],
    "GAN": [r"\bgan\b", r"\bgenerative\s+adversarial\s+networks?\b"],
    "Autoencoder": [r"\bautoencoders?\b", r"\bvariational\s+autoencoders?\b"],
    "XGBoost": [r"\bxgboost\b", r"\bgradient\s+boosting\b"],
}

# Controlled vocabulary for datasets in HAR and ML
CONTROLLED_DATASETS = {
    "UCI HAR": [r"\buci[\s-]har\b", r"\buci\s+activity\b", r"\buci\s+dataset\b"],
    "WISDM": [r"\bwisdm\b"],
    "PAMAP2": [r"\bpamap2?\b"],
    "Opportunity": [r"\bopportunity\s+(dataset|benchmark|activity)\b", r"\bopportunity\s+har\b"],
    "MHEALTH": [r"\bmhealth\b"],
    "USC-HAD": [r"\busc[\s-]had\b"],
    "mHealth-X": [r"\bmhealth[\s-]x\b"],
    "ImageNet": [r"\bimagenet\b"],
    "CIFAR-10": [r"\bcifar[\s-]10\b"],
    "COCO": [r"\bms[\s-]coco\b", r"\bcoco\s+dataset\b"],
}

NOISE_KEYWORDS = {
    "research", "data", "model", "models", "test", "testing", "method", "methods",
    "result", "results", "framework", "encoder", "decoder", "udf", "eff", "null",
    "study", "studies", "approach", "approaches", "based", "performance", "system",
    "systems", "paper", "papers", "proposed", "analysis", "using", "used", "show", "shows",
    "time", "evaluation", "learning", "dataset", "datasets", "figure", "table",
    "accuracy", "deep", "machine", "algorithm", "algorithms", "author", "authors",
    "university", "department", "conference", "journal", "abstract", "introduction",
    "conclusion", "experiment", "experiments", "task", "tasks", "work", "works",
    "state", "art", "different", "various", "high", "low", "new", "novel", "scene",
    "et", "al", "also", "one", "two", "well", "number", "values", "score", "value"
}


@dataclass
class ExtractedPaper:
    filename: str
    raw_text: str
    title: str
    authors: list[str]
    year: int
    abstract: str
    methodology: str
    results_text: str
    limitations: list[str]
    future_work: list[str]
    keywords: list[str]
    algorithms: list[str]
    datasets: list[str]
    domain: str
    pages: int
    size_mb: float
    is_scanned: bool = False
    warnings: list[str] = field(default_factory=list)


class PDFValidationError(Exception):
    pass


def validate_file(filename: str, data: bytes) -> None:
    """Raise PDFValidationError for invalid files."""
    if len(data) > MAX_SIZE_BYTES:
        raise PDFValidationError(
            f"File exceeds {MAX_SIZE_MB} MB limit "
            f"({len(data) / 1024 / 1024:.1f} MB)."
        )
    if not data.startswith(b"%PDF"):
        raise PDFValidationError("File does not appear to be a valid PDF.")


def extract_text_from_bytes(data: bytes) -> tuple[str, int]:
    """Return (full_text, page_count). Requires PyMuPDF."""
    if not PYMUPDF_OK:
        raise RuntimeError("PyMuPDF is not installed. Run: pip install pymupdf")
    doc = fitz.open(stream=data, filetype="pdf")
    pages = len(doc)
    texts = []
    for page in doc:
        texts.append(page.get_text("text"))
    doc.close()
    return "\n".join(texts), pages


def _clean_text(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    # Remove non-printable characters while preserving newlines and tabs
    text = re.sub(r"[^\x20-\x7e\n\r\t]", " ", text)
    # Collapse multiple horizontal spaces
    text = re.sub(r"[ \t\f\v]+", " ", text)
    # Normalize carriage returns
    text = re.sub(r"\r\n|\r", "\n", text)
    # Collapse 3+ newlines
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _find_section(text: str, headers: list[str], next_headers: list[str], max_chars: int = 3000) -> str:
    """Extract a named section from text using header keyword heuristics."""
    pattern = r"(?i)\b(?:" + "|".join(re.escape(h) for h in headers) + r")\b"
    match = re.search(pattern, text)
    if not match:
        return ""
    start = match.end()
    stop = len(text)
    if next_headers:
        np = r"(?i)\b(?:" + "|".join(re.escape(h) for h in next_headers) + r")\b"
        nm = re.search(np, text[start:])
        if nm:
            stop = start + nm.start()
    chunk = text[start:stop].strip()
    return chunk[:max_chars]


def _extract_title(text: str, filename: str) -> str:
    """Extract a clean paper title, stripping arXiv metadata, headers, or author lists."""
    # 1. MDPI / Frontiers citation line:
    # "Citation: Zeng, F.; Guo, M.; Tan, L.; Guo, F.; Liu, X. Wearable Sensor-Based Residual Multifeature... Sensors 2024"
    m_cit = re.search(
        r"Citation:\s*[^.]+\.\s*([A-Z][^.\n]{15,220}?)\.\s*(?:Sensors|Frontiers|Nature|IEEE|[A-Z][a-z]+ \d{4})",
        text,
        re.IGNORECASE,
    )
    if m_cit:
        c_tit = m_cit.group(1).strip()
        if len(c_tit) > 15:
            return c_tit

    # 2. Springer / Nature pattern: Title followed by Author names before Received:
    m_springer = re.search(
        r"(?:https?://doi\.org/\S+\s+)?([A-Z][A-Za-z0-9\s:,\-–—]{15,180}?)\s+(?:[A-Z][A-Za-z\s\.,&0-9\-*†‡]{6,120}?)\s+Received:",
        text,
    )
    if m_springer:
        cand = m_springer.group(1).strip()
        if len(cand) > 15 and not cand.startswith("RESEARCH"):
            return cand

    # 3. Nature / Scientific Reports pattern
    m_nat = re.search(
        r"(?:www\.nature\.com\S*|Scientific Reports\s*\|\s*\(?\d+\)?\s*[\d:]+)\s+([A-Z][A-Za-z0-9\s:,\-–—]{15,200}?)\s+[A-Z][a-z]+",
        text,
    )
    if m_nat:
        cand = m_nat.group(1).strip()
        if len(cand) > 15:
            return cand

    # 4. Standard line-based scan in first 25 non-empty lines
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    cleaned_lines = []
    for l in lines[:25]:
        # Skip common arXiv or journal headers
        if re.search(
            r"(?i)(arxiv:\d+\.\d+|accepted in|published in|proceedings of|ieee|springer|acm|vol\.|volume|under review|open access|type original research)",
            l,
        ):
            continue
        if re.search(r"(?i)^(abstract|introduction|keywords|key words)\b", l):
            break
        if 4 <= len(l.split()) <= 25:
            cleaned_lines.append(l)

    if cleaned_lines:
        title = cleaned_lines[0]
        # Clean title of email addresses or trailing footnote markers
        title = re.sub(r"[0-9*†‡,]+\s*$", "", title)
        title = re.sub(r"\s+", " ", title).strip()
        if len(title) > 10:
            return title

    # Fallback to readable filename
    clean_fn = re.sub(r"[-_]", " ", filename.replace(".pdf", ""))
    return clean_fn.title()


def _extract_authors(text: str) -> list[str]:
    """Extract real author names from paper headers, citation blocks, or metadata."""
    # 1. MDPI / Frontiers citation line:
    # "Citation: Zeng, F.; Guo, M.; Tan, L.; Guo, F.; Liu, X."
    m_cit = re.search(r"Citation:\s*([^.\n]+)", text, re.IGNORECASE)
    if m_cit:
        raw = m_cit.group(1).strip()
        parts = [p.strip() for p in re.split(r"[;]", raw) if p.strip()]
        authors = []
        for p in parts:
            p_clean = re.sub(r"[\d*†‡]", "", p).strip()
            if "," in p_clean:
                last_first = [x.strip() for x in p_clean.split(",", 1)]
                authors.append(f"{last_first[1]} {last_first[0]}".strip())
            elif 2 <= len(p_clean) <= 40:
                authors.append(p_clean)
        if authors:
            return authors[:6]

    # 2. Text right before "Received:" or "Accepted:" (e.g. Springer, Nature, Elsevier)
    m_rec = re.search(r"([A-Z][A-Za-z\s\.,&0-9\-*†‡]{8,150}?)(?=\s*(?:Received:|Accepted:|Published online:))", text)
    if m_rec:
        raw = m_rec.group(1).strip()
        raw = re.sub(r"https?://\S+", "", raw)
        raw = re.sub(r"\b\d{4}\b", "", raw)
        raw = re.sub(r"[\d*†‡]", "", raw)
        parts = [p.strip() for p in re.split(r"\s{2,}|,\s*|\s+and\s+", raw) if len(p.strip()) > 2]
        cleaned = [
            p for p in parts
            if 2 <= len(p) <= 35 and not re.search(r"(?i)(journal|letters|vol|springer|ieee|review|received|copyright|license|doi|open access)", p)
        ]
        if cleaned:
            return cleaned[:6]

    # 3. Line-based search in top 35 lines
    lines = [l.strip() for l in text.split("\n")[:35] if l.strip()]
    for line in lines:
        if re.search(r"(?i)(abstract|arxiv|university|department|email|institute|school|proceedings|accepted in|published|doi|contents)", line):
            continue
        if 8 < len(line) < 180 and ("," in line or " and " in line or " & " in line):
            parts = re.split(r"[,&;]|\s+and\s+", line)
            cleaned = [re.sub(r"[\d*†‡\[\]0-9]", "", p).strip() for p in parts]
            valid = [
                p for p in cleaned
                if 2 < len(p) < 40 and not re.search(r"(?i)(vol|report|nature|press|ieee|elsevier|springer|faculty|laboratory)", p)
            ]
            if valid and len(valid) >= 1:
                return valid[:6]

    # 4. Search for author name patterns after title or authored by
    m_after_title = re.search(r"\b(?:by|authored by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)", text[:1500])
    if m_after_title:
        return [m_after_title.group(1).strip()]

    # 5. Fallback to clean team indicator
    return ["Research Team"]


def _extract_year(text: str) -> int:
    """Find the publication year in range 2010–2026."""
    matches = re.findall(r"\b(20[12]\d)\b", text[:2000])
    if matches:
        years = [int(y) for y in matches if 2012 <= int(y) <= 2026]
        if years:
            return max(set(years), key=years.count)
    return 2023


def _extract_keywords(text: str, existing: list[str]) -> list[str]:
    """Extract domain keywords while filtering out generic stop words and noise."""
    candidates = []
    kw_match = re.search(r"(?i)\bkey\s*words?\b[:\s—]+(.{10,350}?)(?:\n\n|\.|\Z)", text)
    if kw_match:
        raw = kw_match.group(1)
        parts = re.split(r"[;,·•]\s*|\n", raw)
        for p in parts:
            cand = re.sub(r"[^a-zA-Z0-9\s-]", "", p).strip().lower()
            if 3 < len(cand) < 40 and cand not in NOISE_KEYWORDS:
                candidates.append(cand)

    for item in existing:
        item_lower = item.lower()
        if item_lower not in NOISE_KEYWORDS and len(item_lower) > 2:
            candidates.append(item_lower)

    return list(dict.fromkeys(candidates))[:10]


def _detect_algorithms(text: str) -> list[str]:
    """Strict controlled algorithm detection."""
    text_lower = text.lower()
    detected = []
    for algo_name, patterns in CONTROLLED_ALGORITHMS.items():
        for pat in patterns:
            if re.search(pat, text_lower):
                detected.append(algo_name)
                break
    return list(dict.fromkeys(detected))


def _detect_datasets(text: str) -> list[str]:
    """Strict controlled dataset detection."""
    text_lower = text.lower()
    detected = []
    for ds_name, patterns in CONTROLLED_DATASETS.items():
        for pat in patterns:
            if re.search(pat, text_lower):
                detected.append(ds_name)
                break
    return list(dict.fromkeys(detected))


def _detect_domain(text: str, algorithms: list[str]) -> str:
    text_lower = text.lower()
    if any(k in text_lower for k in ["activity recognition", "har", "inertial sensor", "wearable"]):
        return "Human Activity Recognition"
    if any(k in text_lower for k in ["medical", "clinical", "patient", "health", "biomedical"]):
        return "Healthcare"
    if any(k in text_lower for k in ["autonomous", "driving", "vehicle", "lidar"]):
        return "Autonomous Systems"
    if any(k in text_lower for k in ["quantum", "qubit", "hamiltonian", "entanglement", "many-body"]):
        return "Quantum Computing"
    if any(k in text_lower for k in ["nlp", "language model", "text classification", "sentiment"]):
        return "Natural Language Processing"
    if any(k in text_lower for k in ["image classification", "object detection", "vision"]):
        return "Computer Vision"
    return "Machine Learning"


def _split_list_section(text: str) -> list[str]:
    """Turn clean sentences into list items."""
    if not text:
        return []
    sentences = re.split(r"(?<=[.!?])\s+", text)
    results = []
    for s in sentences:
        s = s.strip(" •-·*")
        s = re.sub(r"^[\d]+[.)]\s*", "", s).strip()
        if 20 < len(s) < 250:
            results.append(s)
    return results[:5]


def process_pdf(filename: str, data: bytes) -> ExtractedPaper:
    """
    Full pipeline: validate -> extract -> clean -> parse with controlled vocabularies.
    """
    validate_file(filename, data)
    raw_text, pages = extract_text_from_bytes(data)
    clean = _clean_text(raw_text)

    warnings: list[str] = []
    is_scanned = len(clean.strip()) < 200
    if is_scanned:
        warnings.append(
            "This PDF appears to be scanned or image-only. Text extraction may be incomplete."
        )

    title = _extract_title(clean, filename)
    authors = _extract_authors(clean)
    year = _extract_year(clean)
    algorithms = _detect_algorithms(clean)
    datasets = _detect_datasets(clean)
    domain = _detect_domain(clean, algorithms)

    abstract = _find_section(
        clean,
        ["abstract"],
        ["introduction", "1. introduction", "keywords", "key words", "1 "],
        1800,
    ) or clean[:500]

    methodology = _find_section(
        clean,
        ["methodology", "methods", "proposed method", "our approach", "system model"],
        ["experiments", "results", "evaluation", "discussion"],
        2500,
    )

    results_text = _find_section(
        clean,
        ["results and discussion", "experimental results", "evaluation results", "results"],
        ["conclusion", "conclusions", "limitations", "future work"],
        1800,
    )

    lim_raw = _find_section(
        clean,
        ["limitations", "threats to validity", "limitation"],
        ["future work", "conclusion", "references"],
        1000,
    )
    fut_raw = _find_section(
        clean,
        ["future work", "future directions", "future research"],
        ["acknowledgment", "acknowledgements", "references"],
        1000,
    )

    limitations = _split_list_section(lim_raw)
    future_work = _split_list_section(fut_raw)

    keywords = _extract_keywords(clean, algorithms + datasets)
    size_mb = round(len(data) / (1024 * 1024), 2)

    return ExtractedPaper(
        filename=filename,
        raw_text=clean,
        title=title,
        authors=authors,
        year=year,
        abstract=abstract,
        methodology=methodology,
        results_text=results_text,
        limitations=limitations,
        future_work=future_work,
        keywords=keywords,
        algorithms=algorithms,
        datasets=datasets,
        domain=domain,
        pages=pages,
        size_mb=size_mb,
        is_scanned=is_scanned,
        warnings=warnings,
    )
