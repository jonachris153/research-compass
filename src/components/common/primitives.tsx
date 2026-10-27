import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  delta?: string;
  hint?: string;
}) {
  return (
    <div className="panel group relative overflow-hidden p-5 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="rounded-lg border border-border bg-elevated p-2 text-primary transition-transform group-hover:scale-105">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      {delta ? <p className="mt-1 text-xs text-success">{delta}</p> : null}
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("panel flex flex-col p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function InsightCard({
  title,
  detail,
  sources,
  tone = "neutral",
}: {
  title: string;
  detail: string;
  sources: number;
  tone?: "positive" | "neutral" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "bg-success/15 text-success"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-primary/15 text-primary";
  return (
    <article className="rounded-lg border border-border bg-elevated/60 p-4">
      <div className="flex items-center gap-2">
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", toneClass)}>
          Insight
        </span>
        <span className="text-[11px] text-muted-foreground">{sources} sources</span>
      </div>
      <h3 className="mt-2 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p>
    </article>
  );
}

export function ScoreBar({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 py-14 text-center">
      {Icon ? (
        <span className="mb-3 rounded-xl border border-border bg-elevated p-3 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
      ) : null}
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm">
      <p className="font-medium text-destructive">Something went wrong</p>
      <p className="mt-1 text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-elevated/50 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
