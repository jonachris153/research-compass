import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, HelpCircle } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/primitives";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [{ title: "Help & Docs — Research Compass AI" }],
  }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Help & Documentation"
          subtitle="Guide to using Research Compass AI for literature intelligence, gap detection, and novel direction generation."
        />

        <div className="space-y-6">
          <div className="panel p-6 space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="size-5 text-primary" /> How Research Compass AI Works
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Research Compass AI analyzes open-access research PDFs uploaded by the user. Using
              PyMuPDF text extraction, TF-IDF, Sentence Transformer embeddings (
              <code>all-MiniLM-L6-v2</code>), and scikit-learn ML models, it extracts key metadata,
              clusters topics, detects corpus gaps, and suggests research directions.
            </p>
          </div>

          <div className="panel p-6 space-y-4">
            <h2 className="text-base font-semibold">Critical PDF & Data Rules</h2>
            <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2">
              <li>
                <strong>Open-Access Only:</strong> Only upload PDFs from open-access sources such as
                arXiv, PubMed Central, DOAJ, or institutional repositories.
              </li>
              <li>
                <strong>No Automatic Paid Scraping:</strong> The tool will never require paid
                IEEE/Springer/ScienceDirect subscriptions or scrape paywalled sites.
              </li>
              <li>
                <strong>Corpus-Grounded Evidence:</strong> Gaps and novel directions are derived
                strictly from your uploaded corpus. Evidence quotes point back to your papers.
              </li>
              <li>
                <strong>Terminology:</strong> Scores are labeled as{" "}
                <em>"Corpus-based Gap Score"</em> and <em>"Potentially Novel Direction"</em> — they
                reflect corpus underexploration rather than absolute global proofs.
              </li>
            </ul>
          </div>

          <div className="panel p-6 space-y-4">
            <h2 className="text-base font-semibold">Frequently Asked Questions</h2>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-foreground">
                  Q: Why am I getting a scanned PDF warning?
                </p>
                <p className="text-muted-foreground mt-0.5">
                  A: When a PDF contains only scanned images rather than selectable text, PyMuPDF
                  cannot extract full text. The system warns you while preserving what text could be
                  extracted.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground">Q: How are gap scores computed?</p>
                <p className="text-muted-foreground mt-0.5">
                  A: Gap scores incorporate 5 corpus signals: topic underrepresentation,
                  future-work/limitation text matches, method concentration (HHI), dataset
                  concentration (HHI), and cross-topic opportunity.
                </p>
              </div>

              <div>
                <p className="font-semibold text-foreground">
                  Q: How do I run the Python FastAPI backend?
                </p>
                <p className="text-muted-foreground mt-0.5">
                  A: Navigate to <code>backend/</code>, run{" "}
                  <code>pip install -r requirements.txt</code>, and start server with{" "}
                  <code>uvicorn main:app --reload --port 8000</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
