import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BadgeHelp,
  Bell,
  Compass,
  Download,
  FlaskConical,
  Github,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Radar,
  ScanSearch,
  Settings,
  Sparkles,
  Telescope,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { toast } from "sonner";

import { getDashboard } from "@/services/api";

import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { UploadModal } from "@/components/upload/UploadModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DEFAULT_PROJECT } from "@/data/demo-corpus";
import { cn } from "@/lib/utils";

const NAV_TOP = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/papers", label: "All Papers", icon: Telescope },
  { to: "/landscape", label: "Research Landscape", icon: Radar },
  { to: "/gaps", label: "Gap Analysis", icon: ScanSearch },
  { to: "/ideas", label: "Novel Ideas", icon: Lightbulb },
  { to: "/similar", label: "Similar Papers", icon: Sparkles },
  { to: "/model-lab", label: "Model Lab", icon: FlaskConical },
] as const;

const FOOTER_NAV = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: BadgeHelp },
] as const;

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-9 place-items-center rounded-xl border border-border bg-elevated",
        className,
      )}
      aria-hidden
    >
      <Compass className="size-5 text-primary" />
      <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-cyan" />
    </span>
  );
}

function SidebarContent({
  onNavigate,
  onUpload,
}: {
  onNavigate?: () => void;
  onUpload: () => void;
}) {
  const { data: dash } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });
  const totalPapers = dash?.totalPapers ?? 0;
  const storagePercent =
    totalPapers > 0 ? Math.min(100, Math.round((totalPapers / 50) * 100)) : 0;

  return (
    <div className="flex h-full flex-col">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4"
      >
        <BrandMark />
        <span className="leading-tight">
          <span className="block text-sm font-semibold">Research Compass AI</span>
          <span className="block text-[11px] text-muted-foreground">Research intelligence</span>
        </span>
      </Link>

      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_TOP.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            }}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}

        {/* Upload Papers button — opens modal */}
        <button
          type="button"
          onClick={() => {
            onUpload();
            onNavigate?.();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent text-left"
        >
          <Upload className="size-4 shrink-0" aria-hidden />
          Upload Papers
        </button>

        <div className="my-3 h-px bg-sidebar-border" />

        {FOOTER_NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            activeProps={{
              className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            }}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current project</p>
        <p className="mt-1 text-sm font-medium leading-snug">{DEFAULT_PROJECT.name}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Papers</span>
          <span className="font-medium text-foreground">{totalPapers}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Storage</span>
          <span className="font-medium text-foreground">{storagePercent}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${storagePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // When navigated to /upload (from dashboard button), auto-open modal and redirect back
  useEffect(() => {
    if (pathname === "/upload") {
      setUploadOpen(true);
      navigate({ to: "/dashboard", replace: true });
    }
  }, [pathname, navigate]);

  const crumb = useMemo(() => {
    const all = [...NAV_TOP, ...FOOTER_NAV];
    const found = all.find((n) => pathname.startsWith(n.to));
    if (pathname.startsWith("/papers/")) return "All Papers / Paper Details";
    return found?.label ?? "Overview";
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent onUpload={() => setUploadOpen(true)} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-sidebar">
            <button
              aria-label="Close navigation"
              className="absolute right-3 top-4 rounded-md p-1.5 hover:bg-sidebar-accent"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" aria-hidden />
            </button>
            <SidebarContent
              onNavigate={() => setOpen(false)}
              onUpload={() => {
                setOpen(false);
                setUploadOpen(true);
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" aria-hidden />
          </Button>

          <p className="hidden min-w-0 truncate text-sm text-muted-foreground md:block">
            Research Compass AI <span className="px-1 text-border">/</span>
            <span className="text-foreground"> {crumb}</span>
          </p>

          <div className="mx-auto w-full max-w-md">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              onClick={() =>
                toast("3 new analysis notifications", { description: "Demo notification feed." })
              }
            >
              <Bell className="size-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Help"
              onClick={() => navigate({ to: "/help" })}
            >
              <BadgeHelp className="size-4" aria-hidden />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() =>
                toast.success("Export started", {
                  description: "A demo JSON export was downloaded.",
                })
              }
            >
              <Download className="size-4" aria-hidden />
              Export
            </Button>
            <Avatar className="ml-1 size-8 border border-border">
              <AvatarFallback className="bg-elevated text-xs">RC</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Demo corpus · Scores are corpus-based indicators, not proofs of global novelty.
            </span>
            <span className="inline-flex items-center gap-1">
              <Github className="size-3.5" aria-hidden /> Academic project — Intelligent Computing
              using Machine Learning
            </span>
          </div>
        </footer>
      </div>

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} />
      <Toaster richColors position="top-right" />
    </div>
  );
}
