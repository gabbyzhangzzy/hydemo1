import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, FileText, Lock, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Demo, Pill, Section } from "@/components/demo/bits";
import { actions, can, useDemo } from "@/lib/demo/store";
import {
  agg, campaignTable, computeInsights, filteredRows, fmtMoney, fmtNum, fmtPct,
  rangeLabel, useAnalyticsFilters,
} from "@/lib/demo/analytics-data";

const SUGGESTED = [
  "Why did our CPA increase last week?",
  "Which countries are underperforming?",
  "Where should we investigate budget allocation?",
  "Compare Meta and TikTok performance.",
  "Which creatives should we iterate?",
  "Summarize the biggest performance changes this month.",
];

const CHART_OPTIONS = ["Daily spend", "Performance trend", "Country breakdown", "Channel breakdown", "Device breakdown", "Campaign efficiency", "Creative performance"];

export function AiReportSection({ clientIds }: { clientIds: string[] }) {
  const s = useDemo();
  const f = useAnalyticsFilters();
  const navigate = useNavigate();
  const clientId = clientIds.length === 1 ? clientIds[0]! : "freebeat";
  const editor = can.editDraft(s.role);
  const reports = s.perfReports.filter((r) => clientIds.includes(r.clientId));
  const [openId, setOpenId] = useState<string | null>(null);

  const ask = (q: string) => {
    const prompt = [
      `@UA Agent — from the Analytics dashboard (${rangeLabel(f)}):`,
      q,
      `Context: client=${clientId}, channel=${f.channel}, country=${f.country}, device=${f.device}, objective=${f.objective}, status=${f.status}.`,
      "Structure the answer as: Observations / Possible explanations / Recommended next steps / Missing data or uncertainty. Correlation is not causation.",
    ].join("\n");
    actions.startGenericTask(clientId, q.slice(0, 60), "UA Agent", prompt);
    toast("UA Agent task created", { description: "Your question and the current filters were passed to the workspace." });
    void navigate({ to: "/workspace" });
  };

  const createReport = () => {
    const total = agg(filteredRows(clientIds, f));
    const table = campaignTable(clientIds, f);
    const insights = computeInsights(clientIds, f).filter((i) => i.id !== "nodata" && i.id !== "thin");
    const clientName = s.clients.find((c) => c.id === clientId)?.name ?? clientId;
    const narrative = [
      `${clientName} spent ${fmtMoney(total.spend)} in the ${rangeLabel(f).toLowerCase()}, delivering ${fmtNum(total.impressions)} impressions and ${fmtNum(total.clicks)} clicks (CTR ${fmtPct(total.ctr)}, CPM ${fmtMoney(total.cpm)}).`,
      total.conversions > 0 ? `Attributed results: ${fmtNum(total.conversions)} at ${total.cpa != null ? fmtMoney(total.cpa) : "N/A"} per result${total.roas != null ? `, ROAS ${total.roas.toFixed(2)}×` : ""}.` : "Conversion data is unavailable for part of this selection; CPA/ROAS are shown as N/A where untracked.",
      table[0] ? `Largest campaign: “${table[0].meta.name}” at ${fmtMoney(table[0].spend)} (${total.spend > 0 ? ((table[0].spend / total.spend) * 100).toFixed(0) : 0}% of spend).` : "",
      "Suggested next steps are listed below; no campaign changes have been made.",
    ].join(" ");
    const rid = actions.createPerfReport({
      clientId,
      title: `${clientName} — Performance Report · ${rangeLabel(f)}`,
      rangeLabel: rangeLabel(f),
      narrative,
      charts: ["Daily spend", "Country breakdown", "Channel breakdown"],
      comment: "",
      metrics: [
        { label: "Spend", value: fmtMoney(total.spend) },
        { label: "Impressions", value: fmtNum(total.impressions) },
        { label: "Clicks", value: fmtNum(total.clicks) },
        { label: "CTR", value: fmtPct(total.ctr) },
        { label: "CPM", value: fmtMoney(total.cpm) },
        { label: "Results", value: total.conversions > 0 ? fmtNum(total.conversions) : "N/A" },
        { label: "CPA", value: total.cpa != null ? fmtMoney(total.cpa) : "N/A" },
        { label: "ROAS", value: total.roas != null ? `${total.roas.toFixed(2)}×` : "N/A" },
      ],
      insights: insights.map((i) => `${i.category}: ${i.headline}`),
    });
    setOpenId(rid);
    toast("Report draft created", { description: "Review and edit before sharing with the client." });
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Section title="Ask your AI Growth Team" right={<Demo />}>
        <p className="mb-3 text-xs text-muted-foreground">Analysis requests route to Clayton / UA with your current filters and client context. Answers separate observations, possible explanations, next steps and uncertainty.</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((q) => (
            <Button key={q} size="sm" variant="outline" onClick={() => ask(q)}><Sparkles className="size-3.5" /> {q}</Button>
          ))}
        </div>
      </Section>

      <Section title="Performance Reports" right={editor ? <Button size="sm" variant="brand" onClick={createReport}><FileText /> Create Performance Report</Button> : <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="size-3.5" /> Agency members only</span>}>
        {reports.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No reports yet. Create a draft from the current filters, review it internally, then publish to the Client Portal.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const open = openId === r.id;
              return (
                <div key={r.id} className="rounded-xl border border-border p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] text-muted-foreground">{r.id}</span>{" "}
                      <span className="text-sm font-semibold">{r.title}</span>
                      <div className="text-[11px] text-muted-foreground">By {r.createdBy} · {r.createdAt} · {r.rangeLabel}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={r.status === "published" ? "success" : r.status === "ready" ? "info" : "warning"}>{r.status === "published" ? "Published to Client Portal" : r.status === "ready" ? "Ready to Share" : "Internal draft"}</Pill>
                      <Button size="sm" variant="ghost" onClick={() => setOpenId(open ? null : r.id)}>{open ? "Hide" : "Review"}</Button>
                    </div>
                  </div>
                  {open && (
                    <div className="mt-3 space-y-3 border-t border-border pt-3">
                      <div className="grid grid-cols-4 gap-2 text-center text-xs">
                        {r.metrics.map((m) => <div key={m.label} className="rounded-lg bg-muted p-2"><div className="text-muted-foreground">{m.label}</div><div className="font-semibold">{m.value}</div></div>)}
                      </div>
                      {r.insights.length > 0 && (
                        <ul className="space-y-1 text-xs text-muted-foreground">{r.insights.map((i) => <li key={i}>• {i}</li>)}</ul>
                      )}
                      <div>
                        <div className="mb-1 text-xs font-semibold">Narrative (editable)</div>
                        <Textarea rows={4} value={r.narrative} disabled={!editor || r.status === "published"} onChange={(e) => actions.updatePerfReport(r.id, { narrative: e.target.value })} />
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-semibold">Charts to include</div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                          {CHART_OPTIONS.map((c) => (
                            <label key={c} className="flex items-center gap-1.5 text-xs">
                              <Checkbox checked={r.charts.includes(c)} disabled={!editor || r.status === "published"} onCheckedChange={(v) => actions.updatePerfReport(r.id, { charts: v ? [...r.charts, c] : r.charts.filter((x) => x !== c) })} />
                              {c}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-semibold">Internal comment (never shared)</div>
                        <Textarea rows={2} value={r.comment} disabled={!editor || r.status === "published"} onChange={(e) => actions.updatePerfReport(r.id, { comment: e.target.value })} placeholder="Note for the agency team…" />
                      </div>
                      {editor && r.status !== "published" && (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" disabled={r.status !== "draft"} onClick={() => actions.updatePerfReport(r.id, { status: "ready" })}><Check /> Mark Ready to Share</Button>
                          <Button size="sm" variant="brand" disabled={r.status !== "ready"} onClick={() => actions.updatePerfReport(r.id, { status: "published" })}><Send /> Publish to Client Portal</Button>
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">Only published reports appear in the Client Portal. Internal drafts and comments are never shared.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </section>
  );
}
