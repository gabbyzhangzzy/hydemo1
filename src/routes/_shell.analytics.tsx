import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Check, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Demo, Empty, PageHeader, Pill, Section, money } from "@/components/demo/bits";
import { actions, can, REPORT_METRICS, STATUS_LABEL, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { campaignTable, filteredRows, useAnalyticsFilters } from "@/lib/demo/analytics-data";
import { FiltersBar } from "@/components/demo/analytics/filters-bar";
import { InsightsSection } from "@/components/demo/analytics/insights";
import { KpiSummary } from "@/components/demo/analytics/kpi";
import { TrendsSection } from "@/components/demo/analytics/trends";
import { CampaignEfficiency, ChannelBreakdown, CountryBreakdown, CreativeBreakdown, DeviceBreakdown } from "@/components/demo/analytics/breakdowns";
import { AdDrawer, CampaignDetail, CampaignTable } from "@/components/demo/analytics/tables";
import { AiReportSection } from "@/components/demo/analytics/ai-report";

export const Route = createFileRoute("/_shell/analytics")({
  head: () => pageHead("Analytics & Reports", "Professional advertising performance dashboard: insights, KPIs, trends, breakdowns and client reporting."),
  component: Analytics,
});

function Analytics() {
  const s = useDemo();
  const f = useAnalyticsFilters();
  const ids = s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.filter((c) => c.biz === "bluefocus").map((c) => c.id) : [s.clientId];
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);
  const [adSel, setAdSel] = useState<{ campaignId: string; adId: string } | null>(null);
  const editor = can.editDraft(s.role);
  const m = REPORT_METRICS;

  const hasData = filteredRows(ids, f).length > 0;
  const showFreebeatDaily = ids.includes("freebeat") && s.report.status !== "none";
  const newCampaignPending = ids.includes("freebeat") && s.campaign && s.campaign.status !== "live_verified";

  const openAd = (campaignId: string, adId: string) => setAdSel({ campaignId, adId });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="Analytics & Reports"
        sub="Performance monitoring, diagnostic analysis and AI-powered recommendations — all from one demo dataset."
        right={<Demo>Demo data</Demo>}
      />

      {/* New campaign lifecycle honesty: no fictional live results before Live Verified. */}
      {newCampaignPending && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-info/25 bg-info/10 px-4 py-3 text-sm">
          <span>
            <b>{s.campaign!.name}</b> is <b>{STATUS_LABEL[s.campaign!.status]}</b> — it has no performance data yet. Historical campaigns are shown below; its reporting starts once Live Verified with confirmed first spend.
          </span>
          <Pill tone="info">Lifecycle: {STATUS_LABEL[s.campaign!.status]}</Pill>
        </div>
      )}

      {!hasData ? (
        <Empty title="No advertising data for this selection">
          This client has no campaigns with delivery in the selected filters. Try clearing filters or switching client.
        </Empty>
      ) : (
        <>
          {/* A — Actionable insights */}
          <InsightsSection clientIds={ids} onOpenCampaign={setOpenCampaign} />

          {/* B — Global filters */}
          <FiltersBar clientIds={ids} />

          {/* C — Executive KPI summary */}
          <KpiSummary clientIds={ids} />

          {/* D — Performance trends */}
          <TrendsSection clientIds={ids} />

          {/* E — Performance breakdowns */}
          <section className="grid gap-4 lg:grid-cols-2">
            <CountryBreakdown clientIds={ids} />
            <ChannelBreakdown clientIds={ids} />
            <DeviceBreakdown clientIds={ids} />
            <CampaignEfficiency clientIds={ids} onOpenCampaign={setOpenCampaign} />
            <div className="lg:col-span-2"><CreativeBreakdown clientIds={ids} onOpenAd={openAd} /></div>
          </section>

          {/* F — Campaign table + drilldown */}
          {openCampaign && (
            <CampaignDetail clientIds={ids} campaignId={openCampaign} onClose={() => setOpenCampaign(null)} onOpenAd={openAd} />
          )}
          <CampaignTable clientIds={ids} onOpenCampaign={setOpenCampaign} />

          {/* G — AI analysis & reporting */}
          <AiReportSection clientIds={ids} />
        </>
      )}

      {/* Existing flow: Daily Performance Update for the new Freebeat campaign (post Live Verified). */}
      {showFreebeatDaily && (
        <Section title="Daily Performance Update — Freebeat US Awareness (new campaign)" right={<Pill tone={s.report.status === "published" ? "success" : s.report.status === "ready" ? "info" : "warning"}>{s.report.status === "published" ? "Published to Client Portal" : s.report.status === "ready" ? "Ready to Share" : "Internal draft"}</Pill>}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {[["Spend", money(m.spend)], ["Impressions", m.impressions.toLocaleString()], ["Reach", m.reach.toLocaleString()], ["CPM", money(m.cpm)], ["Frequency", m.frequency.toFixed(2)], ["Freshness", m.freshness]].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border p-3 text-sm"><div className="text-xs text-muted-foreground">{k}</div><div className="font-semibold">{v}</div></div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Internal agent draft (not shared)</div>
              <ul className="space-y-1"><li>• Reels delivering 64% of impressions at lowest CPM.</li><li>• CPM $6.00 vs Spring Launch $7.10 — early, low-volume signal.</li><li>• Frequency 1.20 — healthy; cap at 2.0.</li></ul>
              <div className="mt-3 flex items-center gap-2 text-sm"><CalendarClock className="size-4" /> Day-7 Readout · <b>Scheduled</b> — not enough data yet</div>
            </div>
            <div>
              <Textarea rows={5} value={s.report.external} disabled={!editor || s.report.status === "published"} onChange={(e) => actions.setReport({ external: e.target.value, status: s.report.status === "ready" ? "draft" : s.report.status })} />
              <div className="mt-2 flex flex-wrap gap-2">
                {editor ? (
                  <>
                    <Button size="sm" variant="outline" disabled={s.report.status !== "draft"} onClick={() => actions.setReport({ status: "ready" })}><Check /> Mark Ready to Share</Button>
                    <Button size="sm" variant="brand" disabled={s.report.status !== "ready"} onClick={() => actions.setReport({ status: "published" })}><Send /> Publish to Client Portal</Button>
                  </>
                ) : <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Lock className="size-4" /> Agency AM review only.</span>}
              </div>
            </div>
          </div>
        </Section>
      )}

      <AdDrawer clientIds={ids} campaignId={adSel?.campaignId ?? null} adId={adSel?.adId ?? null} onClose={() => setAdSel(null)} />
    </div>
  );
}
