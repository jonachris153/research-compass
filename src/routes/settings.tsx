import { createFileRoute } from "@tanstack/react-router";
import { Save, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/primitives";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Research Compass AI" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [apiUrl, setApiUrl] = useState("/api");
  const [corpusName, setCorpusName] = useState("Human Activity Recognition Literature");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved.");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Project Settings"
          subtitle="Configure local backend endpoints and corpus metadata."
        />

        <form onSubmit={handleSave} className="panel p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Backend API Endpoint</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Default is /api (proxied to http://localhost:8000).
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Corpus Display Name</label>
            <input
              type="text"
              value={corpusName}
              onChange={(e) => setCorpusName(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface p-2.5 text-sm"
            />
          </div>

          <div className="pt-2">
            <Button type="submit">
              <Save className="mr-1.5 size-4" /> Save Settings
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
