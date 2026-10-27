import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ANALYSIS_STEPS, analyzePapers, uploadPapers } from "@/services/api";
import type { UploadItem } from "@/types/research";

const ACCEPTED = ".pdf,application/pdf";
const MAX_FILES = 20;

type Phase = "idle" | "uploading" | "ready_to_analyze" | "analyzing" | "done";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadModal({ open, onOpenChange }: UploadModalProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [items, setItems] = useState<(UploadItem & { error?: string })[]>([]);
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const resetState = () => {
    setPhase("idle");
    setItems([]);
    setStep(0);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (phase === "done" || phase === "ready_to_analyze")) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const handleFiles = useCallback(async (files: File[]) => {
    const pdfs = files.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (!pdfs.length) {
      toast.error("Please select PDF files only.");
      return;
    }
    if (pdfs.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files per upload.`);
      return;
    }

    setPhase("uploading");
    setItems([]);
    setStep(0);

    try {
      const uploaded = await uploadPapers(pdfs);
      setItems(uploaded as (UploadItem & { error?: string })[]);

      const failed = uploaded.filter((u) => u.status === "failed");
      const ok = uploaded.filter((u) => u.status !== "failed");

      if (failed.length) {
        toast.warning(`${failed.length} file(s) failed validation.`);
      }

      if (!ok.length) {
        setPhase("idle");
        return;
      }

      // Transition to ready_to_analyze so user can review and click "Start Analysis"
      setPhase("ready_to_analyze");
    } catch (err) {
      toast.error("Upload failed. Is the backend running on port 8000?");
      setPhase("idle");
    }
  }, []);

  const startAnalysis = async () => {
    setPhase("analyzing");
    setStep(0);

    try {
      // Collect IDs of papers that were successfully uploaded in this session
      const paperIds = items
        .filter((u) => u.status !== "failed")
        .map((u) => u.id)
        .filter(Boolean);

      await analyzePapers((s) => setStep(s), paperIds);

      // Invalidate all cached queries so dashboard & pages reload with real analyzed data
      await qc.invalidateQueries();
      setPhase("done");
      const okCount = items.filter((u) => u.status !== "failed").length;
      toast.success(`${okCount || 1} paper(s) analyzed successfully!`);
    } catch (err) {
      toast.error("Analysis failed. Please try again.");
      setPhase("ready_to_analyze");
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (next.length === 0) {
        setPhase("idle");
      }
      return next;
    });
  };

  const progressPct =
    phase === "analyzing"
      ? Math.round(((step + 1) / ANALYSIS_STEPS.length) * 100)
      : phase === "done"
        ? 100
        : 0;

  const validItems = items.filter((u) => u.status !== "failed");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border bg-sidebar p-6 text-sidebar-foreground shadow-2xl sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Upload className="size-5 text-primary" aria-hidden />
            Upload Research Papers
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload open-access PDFs from arXiv, PubMed Central, DOAJ, or institutional repositories.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Drop zone (idle or ready_to_analyze) */}
          {(phase === "idle" || phase === "ready_to_analyze") && (
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop zone for PDF upload"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                dragging
                  ? "border-primary bg-primary/10"
                  : "border-border bg-surface/50 hover:border-primary/50 hover:bg-surface/80"
              }`}
            >
              <span className="rounded-xl border border-border bg-elevated p-3.5 text-primary shadow-sm">
                <Upload className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Drop PDFs here, or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Up to {MAX_FILES} files · Max 50 MB each · PDF format only
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                Browse files
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED}
                multiple
                className="hidden"
                onChange={onInputChange}
                aria-hidden
              />
            </div>
          )}

          {/* Uploading progress indicator */}
          {phase === "uploading" && (
            <div className="rounded-xl border border-border bg-surface/60 p-6 space-y-4 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Uploading & extracting text…
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Validating PDF format, checking duplicates, and extracting structured sections.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Analyzing progress indicator */}
          {phase === "analyzing" && (
            <div className="rounded-xl border border-border bg-surface/60 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 animate-spin text-primary shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {ANALYSIS_STEPS[step] || "Processing…"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Step {step + 1} of {ANALYSIS_STEPS.length}
                  </p>
                </div>
                <span className="font-mono text-xs text-primary font-semibold">{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-2" />
            </div>
          )}

          {/* Done banner */}
          {phase === "done" && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-400">
              <CheckCircle className="size-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Analysis Complete!</p>
                <p className="text-xs text-muted-foreground">
                  The papers have been analyzed and your dashboard is up to date.
                </p>
              </div>
            </div>
          )}

          {/* Extracted Structured Paper Cards */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Extracted Paper Metadata & Details ({items.length})
                </p>
                <span className="text-[11px] text-primary">Ready for Corpus Selection</span>
              </div>
              <ul className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-border/80 bg-surface/90 p-4 space-y-2.5 shadow-sm transition-all hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span
                          className={`shrink-0 rounded-lg p-2 mt-0.5 ${
                            item.status === "failed"
                              ? "bg-destructive/15 text-destructive"
                              : item.status === "analyzed"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-primary/15 text-primary"
                          }`}
                        >
                          {item.status === "failed" ? (
                            <X className="size-4" aria-hidden />
                          ) : (
                            <FileText className="size-4" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-foreground leading-snug">
                            {item.title || item.name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                            {item.authors && item.authors.length > 0 ? (
                              <span className="font-medium text-slate-300">
                                {item.authors.join(", ")}
                              </span>
                            ) : null}
                            {item.year ? <span>· {item.year}</span> : null}
                            {item.journal ? (
                              <span className="rounded bg-primary/10 border border-primary/25 px-1.5 py-0.2 text-[10px] font-medium text-primary">
                                {item.journal}
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                            item.status === "analyzed"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : item.status === "failed"
                                ? "bg-destructive/15 text-destructive border border-destructive/30"
                                : "bg-primary/15 text-primary border border-primary/30"
                          }`}
                        >
                          {item.status}
                        </span>
                        {phase === "ready_to_analyze" || phase === "done" ? (
                          <button
                            onClick={() => removeItem(item.id)}
                            aria-label="Remove file"
                            className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                          >
                            <X className="size-3.5" aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Extracted Abstract & Features */}
                    {item.abstract && (
                      <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2 bg-background/50 p-2 rounded-lg border border-border/50">
                        {item.abstract}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {item.algorithms?.map((algo) => (
                        <span
                          key={algo}
                          className="rounded bg-sky-500/10 border border-sky-500/25 px-1.5 py-0.5 text-[10px] font-medium text-sky-300"
                        >
                          {algo}
                        </span>
                      ))}
                      {item.datasets?.map((ds) => (
                        <span
                          key={ds}
                          className="rounded bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300"
                        >
                          {ds}
                        </span>
                      ))}
                      {item.pages > 0 && (
                        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                          {item.pages} pp · {item.sizeMb} MB
                        </span>
                      )}
                    </div>

                    {item.error && (
                      <p
                        className={`text-[11px] pt-1 ${
                          item.status === "failed"
                            ? "text-destructive font-medium"
                            : "text-amber-400"
                        }`}
                      >
                        {item.error}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          {phase === "ready_to_analyze" && validItems.length > 0 && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" onClick={resetState}>
                Cancel
              </Button>
              <Button size="sm" onClick={startAnalysis} className="gap-1.5 shadow-md">
                <Sparkles className="size-3.5" aria-hidden />
                Start Analysis ({validItems.length} {validItems.length === 1 ? "paper" : "papers"})
              </Button>
            </div>
          )}

          {phase === "done" && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={resetState}>
                Upload More Papers
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleOpenChange(false);
                  navigate({ to: "/dashboard" });
                }}
              >
                Done & View Dashboard
              </Button>
            </div>
          )}

          {/* Info guidelines */}
          {phase === "idle" && (
            <div className="rounded-lg border border-border/80 bg-surface/30 p-3.5 text-xs text-muted-foreground space-y-1.5">
              <p className="font-medium text-foreground text-xs">PDF guidelines</p>
              <ul className="list-inside list-disc space-y-0.5 text-[11px]">
                <li>
                  Download from arXiv.org, PubMed Central, DOAJ, or institutional open repositories
                </li>
                <li>Scanned / image-only PDFs are flagged and text extraction may be limited</li>
                <li>Duplicate files (by SHA-256 hash) are detected and can be re-analyzed</li>
                <li>Open-access literature only — no paywalled sources</li>
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
