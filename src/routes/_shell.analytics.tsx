import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarClock, Check, Lock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Demo, Empty, PageHeader, Pill, Section, Stat, money } from "@/components/demo/bits";
import { actions, can, REPORT_METRICS, STATIC_CAMPAIGNS, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/analytics")({
  head: () => pageHead("Analytics & Reports", "Daily performance updates, agency review and client publishing."),
  component: Analytics,
});

function Analytics() {
  const s = useDemo();
  const m = REPORT_METRICS;
  const ids = s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.map((c) => c.id) : [s.clientId];
  const hist = STATIC_CAMPAIGNS.filter((c) => ids.includes(c.clientId) && c.spend > 0).map((c) => ({ name: c.name.split("—")[1]?.trim() ?? c.name, CPM: c.cpm, Frequency: c.freq }));
  const editor = can.editDraft(s.role);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Marketing" title="Analytics & Reports" right={<Demo>Fictional metrics</Demo>} />
      {ids.includes("freebeat") && (
        s.report.status === "none" ? (
          <Empty title="No report yet">The Daily Performance Update appears once the Freebeat campaign is Live Verified.</Empty>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-semibold">Freebeat — US Awareness · Daily Performance Update</h2>
              <Pill tone={s.report.status === "published" ? "success" : s.report.status === "ready" ? "info" : "warning"}>{s.report.status === "published" ? "Published to Client Portal" : s.report.status === "ready" ? "Ready to Share" : "Internal draft"}</Pill>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
              <Stat label="Spend" value={money(m.spend)} />
              <Stat label="Impressions" value={m.impressions.toLocaleString()} />
              <Stat label="Reach" value={m.reach.toLocaleString()} />
              <Stat label="CPM" value={money(m.cpm)} hint="spend ÷ impr × 1000" />
              <Stat label="Frequency" value={m.frequency.toFixed(2)} hint="impr ÷ reach" />
              <Stat label="Data freshness" value={<span className="text-sm">{m.freshness}</span>} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Section title="Internal agent draft (not shared)">
                <ul className="space-y-1.5 text-sm">
                  <li>• Reels delivering 64% of impressions at lowest CPM.</li>
                  <li>• CPM $6.00 vs Spring Launch $7.10 — early, low-volume signal.</li>
                  <li>• Frequency 1.20 — healthy; cap at 2.0.</li>
                </ul>
                <div className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Recommended next steps</div>
                <ul className="mt-1 space-y-1 text-sm"><li>• Keep budget; review after 3 days.</li><li>• Prepare A-02 variant if CTR drops.</li></ul>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3 text-sm"><CalendarClock className="size-4" /> Day-7 Readout · <b>Scheduled</b> — not enough data yet</div>
              </Section>
              <Section title="External-facing summary">
                <Textarea rows={6} value={s.report.external} disabled={!editor || s.report.status === "published"} onChange={(e) => actions.setReport({ external: e.target.value, status: s.report.status === "ready" ? "draft" : s.report.status })} />
                <div className="mt-3 flex flex-wrap gap-2">
                  {editor ? (
                    <>
                      <Button variant="outline" disabled={s.report.status !== "draft"} onClick={() => actions.setReport({ status: "ready" })}><Check /> Mark Ready to Share</Button>
                      <Button variant="brand" disabled={s.report.status !== "ready"} onClick={() => actions.setReport({ status: "published" })}><Send /> Publish to Client Portal</Button>
                    </>
                  ) : <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Lock className="size-4" /> Agency AM review only.</span>}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Only this summary and the headline metrics are published. Internal drafts never auto-publish.</p>
              </Section>
            </div>
          </>
        )
      )}
      <Section title="Historical campaigns · CPM & frequency" right={<Demo />}>
        {hist.length === 0 ? <Empty title="No historical data for this client" /> : (
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={hist}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="CPM" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Frequency" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>
    </div>
  );
}
