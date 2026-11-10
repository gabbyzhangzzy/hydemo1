import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Lightbulb, Megaphone, PieChart, Sparkles, Database } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/demo/bits";
import { actions } from "@/lib/demo/store";
import { computeInsights, rangeLabel, useAnalyticsFilters, type Insight } from "@/lib/demo/analytics-data";

const CAT_ICON = { Opportunity: Lightbulb, Warning: AlertTriangle, Creative: Sparkles, Budget: PieChart, "Data quality": Database, Info: Database } as const;
const CAT_TONE = { Opportunity: "success", Warning: "warning", Creative: "brand", Budget: "info", "Data quality": "danger", Info: "muted" } as const;

export function InsightsSection({ clientIds, onOpenCampaign }: { clientIds: string[]; onOpenCampaign: (id: string) => void }) {
  const f = useAnalyticsFilters();
  const navigate = useNavigate();
  const insights = computeInsights(clientIds, f);
  const clientId = clientIds.length === 1 ? clientIds[0]! : "freebeat";

  const act = (ins: Insight) => {
    if (ins.actionKind === "campaign" && ins.campaignId) {
      onOpenCampaign(ins.campaignId);
      return;
    }
    if (ins.id === "nodata" || ins.id === "thin") {
      toast("Adjust the filters to widen the dataset.");
      return;
    }
    const direct = clientId === "direct";
    const agent = direct ? "AI AM" : ins.actionKind === "creative" ? "Creative Agent" : "UA Agent";
    const title = `Analytics: ${ins.headline}`.slice(0, 80);
    const prompt = [
      direct ? `From the Analytics dashboard (${rangeLabel(f)}):` : `@${agent} — from the Analytics dashboard (${rangeLabel(f)}):`,
      `Insight: ${ins.headline}`,
      `Evidence: ${ins.evidence.join(" · ")}`,
      `Filters: channel=${f.channel}, country=${f.country}, device=${f.device}, objective=${f.objective}`,
      "Please investigate and recommend next steps. Do not change budgets or campaigns without approval.",
    ].join("\n");
    actions.startGenericTask(clientId, title, agent, prompt);
    toast(`${agent} task created`, { description: "The insight, filters and date range were passed to the workspace." });
    void navigate({ to: "/workspace" });
  };

  return (
    <section>
      <div className="mb-3">
        <h2 className="font-display text-lg font-semibold">Performance Insights</h2>
        <p className="text-sm text-muted-foreground">Important changes, opportunities, and recommended actions across your campaigns.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((ins) => {
          const Icon = CAT_ICON[ins.category];
          return (
            <div key={ins.id} className="card-surface flex flex-col p-4">
              <div className="flex items-center justify-between gap-2">
                <Pill tone={CAT_TONE[ins.category]}><Icon className="size-3" /> {ins.category}</Pill>
                <span className="text-[10px] text-muted-foreground">{ins.confidence}</span>
              </div>
              <div className="mt-2 text-sm font-semibold leading-snug">{ins.headline}</div>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {ins.evidence.map((e) => <li key={e}>• {e}</li>)}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{ins.why}</p>
              <div className="mt-auto pt-3">
                <Button size="sm" variant="outline" className="w-full" onClick={() => act(ins)}>
                  {ins.actionLabel} <ArrowRight />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
