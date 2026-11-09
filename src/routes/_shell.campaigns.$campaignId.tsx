import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, BarChart3, Bot, ChevronDown, ChevronRight, ClipboardList, FileText, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Demo, Empty, PageHeader, Pill, Section, Stat } from "@/components/demo/bits";
import { LaunchPanel, ProposalCard, ReadinessPanel, statusTone } from "@/components/demo/campaign";
import { AdDrawer } from "@/components/demo/analytics/tables";
import { CreativePreview } from "@/components/demo/creative/preview";
import { actions, can, findProposal, REPORT_METRICS, STATUS_FLOW, STATUS_LABEL, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { adBreakdown, agg, campaignById, dailySeries, filteredRows, fmtMoney, fmtNum, groupAgg, setAnalyticsFilters, useAnalyticsFilters, type AdRow, type CampaignMeta } from "@/lib/demo/analytics-data";
import { effectiveApproval } from "@/lib/demo/creative-model";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/campaigns/$campaignId")({
  head: () => pageHead("Campaign Detail", "Campaign status, structure, creatives, performance and approval history."),
  component: CampaignDetailPage,
});

function CampaignDetailPage() {
  const { campaignId } = Route.useParams();
  const s = useDemo();
  const f = useAnalyticsFilters();
  const navigate = useNavigate();
  const proposal = findProposal(s, campaignId);
  const meta = campaignById(campaignId);
  const ids = s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.map((c) => c.id) : [s.clientId];
  const [adSel, setAdSel] = useState<string | null>(null);

  if (!proposal && !meta) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Button variant="ghost" size="sm" asChild><Link to="/campaigns"><ArrowLeft /> Back to Campaigns</Link></Button>
        <Empty title="Campaign not found">It may belong to a different client context. <Button size="sm" variant="outline" className="ml-2" asChild><Link to="/campaigns">All campaigns</Link></Button></Empty>
      </div>
    );
  }

  const clientId = proposal?.clientId ?? meta!.clientId;
  const clientName = s.clients.find((c) => c.id === clientId)?.name ?? clientId;
  const name = proposal?.name ?? meta!.name;
  const channel = proposal?.platform ?? meta!.channel;
  const objective = proposal?.objective ?? meta!.objective;
  const budget = proposal ? `$${proposal.dailyBudget}/day · cap $${proposal.totalCap.toLocaleString()}` : `$${meta!.dailyBudget}/day`;
  const isMain = proposal && s.campaign?.id === proposal.id;

  const askAgent = (agent: "UA Agent" | "Creative Agent" | "Clayton", kind: string) => {
    const prompts: Record<string, string> = {
      investigate: `@UA Agent — investigate campaign “${name}” (${campaignId}, ${channel}). Diagnose delivery and performance, and recommend next steps. Do not change budgets, targeting or creatives without approval.`,
      readiness: `@Clayton — check launch readiness for “${name}” (${campaignId}). Summarize missing requirements and next steps.`,
      brief: `@Creative Agent — prepare a creative brief for “${name}” (${campaignId}, ${objective}). Use approved brand assets only; new creative follows the normal review and approval flow.`,
      report: `@UA Agent — generate a performance review for “${name}” (${campaignId}) for the current date range. Prepare it as an internal reporting task.`,
    };
    actions.startGenericTask(clientId, `${kind}: ${name}`.slice(0, 80), agent, prompts[kind] ?? prompts["investigate"]!);
    toast(`${agent} task created`, { description: `Context for ${campaignId} was passed to the workspace.` });
    void navigate({ to: "/workspace" });
  };

  const openAnalytics = () => {
    if (meta) setAnalyticsFilters({ campaignId: meta.id });
    toast(meta ? "Analytics filtered to this campaign" : "Opening Analytics", { description: meta ? "Client and date range preserved." : "Proposals show performance only after Live Verified." });
    void navigate({ to: "/analytics" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild><Link to="/campaigns"><ArrowLeft /> Campaigns</Link></Button>
        <PageHeader
          eyebrow={<>{clientName} · {channel} · {objective}</>}
          title={name}
          sub={
            <>
              <span className="font-mono text-xs">{campaignId}</span> · Account act_DEMO_88231 (demo) · Budget {budget} · Updated {proposal ? `Revision ${proposal.revision}` : meta!.updated}
            </>
          }
          right={
            <div className="flex flex-wrap items-center gap-2">
              {proposal && <Pill tone={statusTone(proposal.status)}>{proposal.status === "draft" && proposal.changesRequested ? "Changes Requested" : STATUS_LABEL[proposal.status]}</Pill>}
              {meta && <Pill tone={meta.status === "Active" ? "success" : meta.status === "Paused" ? "warning" : "muted"} dot={meta.status === "Active"}>{meta.status}</Pill>}
              <Button size="sm" variant="outline" onClick={openAnalytics}><BarChart3 /> View Analytics</Button>
              <Button size="sm" variant="outline" onClick={() => askAgent("UA Agent", "investigate")}><Bot /> Ask UA Agent</Button>
            </div>
          }
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="creatives">Creatives</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity & Approvals</TabsTrigger>
        </TabsList>

        {/* ------------------------------ Overview ------------------------------ */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          {proposal ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <ProposalCard campaignId={proposal.id} />
                {isMain && (
                  <Section title="Launch status" right={<Demo>Simulated launch</Demo>}>
                    <LaunchPanel />
                  </Section>
                )}
                {!isMain && proposal.status === "approved" && (
                  <div className="rounded-lg border border-info/25 bg-info/10 px-4 py-3 text-sm">
                    Approved — launch execution for this demo proposal is handled in the main Freebeat launch flow. <Demo />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => askAgent("Clayton", "readiness")}><ShieldCheck /> Check Launch Readiness</Button>
                  <Button size="sm" variant="outline" onClick={() => askAgent("Creative Agent", "brief")}><FileText /> Create Creative Brief</Button>
                </div>
              </div>
              <Section title="Account readiness">{isMain ? <ReadinessPanel /> : <p className="text-sm text-muted-foreground">Readiness checks (brand, account, authorization, funding, creative) run on the primary launch flow. This proposal must be approved before preflight.</p>}</Section>
            </div>
          ) : (
            <DeliveryOverview meta={meta!} ids={ids} onAsk={(kind) => askAgent(kind === "report" ? "UA Agent" : "UA Agent", kind)} />
          )}
        </TabsContent>

        {/* ------------------------------ Structure ----------------------------- */}
        <TabsContent value="structure" className="mt-4">
          {meta ? (
            <StructureTab meta={meta} ids={ids} onOpenAd={(adId) => setAdSel(adId)} onAsk={(ad) => {
              const rows = filteredRows(ids, { ...f, campaignId: meta.id });
              const a = adBreakdown(meta.id, rows).find((x) => x.ad.id === ad.id);
              actions.startGenericTask(meta.clientId, `Ad analysis: ${ad.name}`.slice(0, 80), "UA Agent",
                `@UA Agent — analyze ad “${ad.name}” (${ad.id}) in ad set “${ad.adset}” of “${meta.name}”.${a ? ` Spend ${fmtMoney(a.spend)}, CTR ${a.ctr.toFixed(2)}%, CPM ${fmtMoney(a.cpm)}.` : ""} Recommend next steps; do not change anything without approval.`);
              toast("UA Agent task created", { description: `Context for ${ad.id} was passed to the workspace.` });
              void navigate({ to: "/workspace" });
            }} />
          ) : (
            <Section title="Planned structure" right={<Demo />}>
              <p className="mb-3 text-sm text-muted-foreground">This proposal has not launched, so it has no live Ad Sets or Ads yet. The planned placements below become the campaign structure at launch.</p>
              <ul className="space-y-2 text-sm">
                {proposal!.placements.map((p) => (
                  <li key={p} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <span className="font-medium">{p}</span>
                    <Pill>Planned</Pill>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </TabsContent>

        {/* ------------------------------ Creatives ----------------------------- */}
        <TabsContent value="creatives" className="mt-4">
          <CreativesTab campaignId={campaignId} meta={meta} clientId={clientId} onAskBrief={() => askAgent("Creative Agent", "brief")} />
        </TabsContent>

        {/* ----------------------------- Performance ---------------------------- */}
        <TabsContent value="performance" className="mt-4">
          {meta ? (
            <PerformanceTab meta={meta} ids={ids} onOpenAnalytics={openAnalytics} />
          ) : proposal!.status === "live_verified" ? (
            <Section title="First-day delivery" right={<Demo />}>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {[["Spend", fmtMoney(REPORT_METRICS.spend)], ["Impressions", REPORT_METRICS.impressions.toLocaleString()], ["Reach", REPORT_METRICS.reach.toLocaleString()], ["CPM", fmtMoney(REPORT_METRICS.cpm)], ["Frequency", REPORT_METRICS.frequency.toFixed(2)]].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-border p-3 text-sm"><div className="text-xs text-muted-foreground">{k}</div><div className="font-semibold">{v}</div></div>
                ))}
              </div>
              <Button size="sm" variant="outline" className="mt-3" onClick={openAnalytics}><BarChart3 /> Open in Analytics</Button>
            </Section>
          ) : (
            <Empty title="No performance data yet">
              This proposal is <b>{STATUS_LABEL[proposal!.status]}</b>. Reporting starts only after Live Verified with confirmed first spend — no simulated numbers are shown before real delivery.
            </Empty>
          )}
        </TabsContent>

        {/* ------------------------ Activity & Approvals ------------------------ */}
        <TabsContent value="activity" className="mt-4">
          <ActivityTab campaignId={campaignId} proposal={proposal} meta={meta} />
        </TabsContent>
      </Tabs>

      <AdDrawer clientIds={ids} campaignId={meta ? campaignId : null} adId={adSel} onClose={() => setAdSel(null)} />
    </div>
  );
}

/* ------------------------- Delivery overview ------------------------ */
function DeliveryOverview({ meta, ids, onAsk }: { meta: CampaignMeta; ids: string[]; onAsk: (kind: string) => void }) {
  const f = useAnalyticsFilters();
  const rows = filteredRows(ids, { ...f, campaignId: meta.id });
  const a = agg(rows);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={`Spend · Last ${f.days}d`} value={fmtMoney(a.spend)} hint={`${fmtNum(a.impressions)} impressions`} />
        <Stat label="CTR" value={`${a.ctr.toFixed(2)}%`} hint={`${fmtNum(a.clicks)} clicks`} />
        <Stat label="CPM" value={fmtMoney(a.cpm)} hint={`Frequency ${a.frequency.toFixed(2)}`} />
        <Stat label={meta.objective === "Awareness" ? "Reach" : meta.objective === "Traffic" ? "Clicks" : "Results"} value={meta.objective === "Awareness" ? fmtNum(a.reach) : meta.objective === "Traffic" ? fmtNum(a.clicks) : meta.conversionsAvailable ? fmtNum(a.conversions) : "N/A"} hint={meta.conversionsAvailable ? `CPA ${a.cpa == null ? "N/A" : fmtMoney(a.cpa)}` : "Conversion tracking unavailable"} />
      </div>
      <Section title="AI insights & next actions" right={<Demo />}>
        <ul className="space-y-2 text-sm">
          <li className="rounded-lg border border-border px-3 py-2">• Observation: {meta.channel} delivery is {meta.status === "Active" ? "pacing normally" : meta.status.toLowerCase()} — frequency {a.frequency.toFixed(2)} across the selected range.</li>
          <li className="rounded-lg border border-border px-3 py-2">• Recommendation: review the Structure tab for ad-level CTR spread before changing budgets.</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onAsk("investigate")}><Bot /> Ask UA Agent to Investigate</Button>
          <Button size="sm" variant="outline" onClick={() => onAsk("report")}><ClipboardList /> Generate Performance Review</Button>
        </div>
      </Section>
    </div>
  );
}

/* ----------------------------- Structure ---------------------------- */
function StructureTab({ meta, ids, onOpenAd, onAsk }: { meta: CampaignMeta; ids: string[]; onOpenAd: (adId: string) => void; onAsk: (ad: AdRow["ad"]) => void }) {
  const f = useAnalyticsFilters();
  const rows = filteredRows(ids, { ...f, campaignId: meta.id });
  const ads = adBreakdown(meta.id, rows);
  const groupLabel = meta.channel === "Meta" ? "Ad Set" : "Ad Group";
  const groups = useMemo(() => {
    const map = new Map<string, AdRow[]>();
    for (const a of ads) {
      const arr = map.get(a.ad.adset) ?? [];
      arr.push(a);
      map.set(a.ad.adset, arr);
    }
    return [...map.entries()];
  }, [ads]);
  const [open, setOpen] = useState<Set<string>>(() => new Set(groups.map(([g]) => g)));

  return (
    <Section title={`Campaign structure · ${groups.length} ${groupLabel.toLowerCase()}s`} right={<Demo>Simulated delivery data</Demo>}>
      <div className="space-y-3">
        {groups.map(([g, gAds]) => {
          const gAgg = { spend: gAds.reduce((x, a) => x + a.spend, 0), impressions: gAds.reduce((x, a) => x + a.impressions, 0), clicks: gAds.reduce((x, a) => x + a.clicks, 0) };
          const expanded = open.has(g);
          return (
            <div key={g} className="overflow-hidden rounded-lg border border-border">
              <button className="flex w-full flex-wrap items-center gap-3 bg-secondary/50 px-3 py-2.5 text-left" onClick={() => setOpen((prev) => { const n = new Set(prev); if (n.has(g)) n.delete(g); else n.add(g); return n; })}>
                {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                <span className="text-sm font-semibold">{groupLabel}: {g}</span>
                <span className="text-xs text-muted-foreground">{gAds.length} ads · {fmtMoney(gAgg.spend)} · {fmtNum(gAgg.impressions)} impr · CTR {gAgg.impressions > 0 ? ((gAgg.clicks / gAgg.impressions) * 100).toFixed(2) : "0.00"}%</span>
              </button>
              {expanded && (
                <div className="divide-y divide-border/60">
                  {gAds.map((a) => (
                    <div key={a.ad.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-xs">
                      <button className="min-w-0 flex-1 text-left" onClick={() => onOpenAd(a.ad.id)}>
                        <div className="truncate font-medium hover:underline">{a.ad.name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{a.ad.id} · {a.ad.format}</div>
                      </button>
                      <Pill tone={a.ad.status === "Active" ? "success" : "muted"}>{a.ad.status}</Pill>
                      <span className="tabular-nums text-muted-foreground">{fmtMoney(a.spend)}</span>
                      <span className="tabular-nums text-muted-foreground">CTR {a.ctr.toFixed(2)}%</span>
                      <span className="tabular-nums text-muted-foreground">CPM {fmtMoney(a.cpm)}</span>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onOpenAd(a.ad.id)}>Details</Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onAsk(a.ad)}><Bot className="size-3" /> Ask UA</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ----------------------------- Creatives ---------------------------- */
function CreativesTab({ campaignId, meta, clientId, onAskBrief }: { campaignId: string; meta: CampaignMeta | undefined; clientId: string; onAskBrief: () => void }) {
  const s = useDemo();
  // Version-pinned associations: explicit usage records + dataset creativeId links.
  const usage = s.creativeUsage.filter((u) => u.campaignId === campaignId);
  const linked = (meta?.ads ?? []).filter((ad) => ad.creativeId && !usage.some((u) => u.adId === ad.id));
  const items = [
    ...usage.map((u) => ({ creativeId: u.creativeId, version: u.version, adId: u.adId })),
    ...linked.map((ad) => ({ creativeId: ad.creativeId!, version: undefined as number | undefined, adId: ad.id })),
  ];
  return (
    <Section title="Creative versions in this campaign" right={<Button size="sm" variant="outline" onClick={onAskBrief}><Sparkles /> Ask Creative Agent for Variations</Button>}>
      {items.length === 0 ? (
        <Empty title="No creative versions assigned">Assign approved versions from the Creative Library, or ask the Creative Agent for a brief.</Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => {
            const asset = s.creativeAssets.find((a) => a.id === it.creativeId);
            const v = asset?.versions.find((x) => x.number === (it.version ?? asset.current));
            if (!asset || !v) return null;
            const approved = effectiveApproval(asset, v);
            return (
              <div key={i} className="overflow-hidden rounded-lg border border-border">
                <CreativePreview version={v} />
                <div className="space-y-1.5 p-3">
                  <Button variant="link" className="h-auto whitespace-normal p-0 text-left" asChild>
                    <Link to="/creative" search={{ asset: asset.id, version: v.number }}>{asset.name} · V{v.number}</Link>
                  </Button>
                  <div className="text-xs text-muted-foreground">{asset.id} · {v.format} · {v.ratio} · {asset.source}{it.adId ? ` · ${it.adId}` : " · Assigned · not launched"}</div>
                  <div className="flex gap-1.5">
                    <Pill tone={approved ? "success" : "warning"}>{approved ? "Approved" : v.review}</Pill>
                    {asset.clientRequired && <Pill tone={v.clientApproved ? "success" : "warning"}>{v.clientApproved ? "Client approved" : "Client review pending"}</Pill>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">Replacing a version never modifies an already launched ad — new assignments apply to future delivery only. Client: {clientId}.</p>
    </Section>
  );
}

/* ---------------------------- Performance --------------------------- */
function PerformanceTab({ meta, ids, onOpenAnalytics }: { meta: CampaignMeta; ids: string[]; onOpenAnalytics: () => void }) {
  const f = useAnalyticsFilters();
  const rows = filteredRows(ids, { ...f, campaignId: meta.id });
  const series = dailySeries(rows, f);
  const countries = groupAgg(rows, "country");
  const a = agg(rows);
  return (
    <div className="space-y-6">
      <Section title={`Delivery · Last ${f.days} days`} right={<Button size="sm" variant="outline" onClick={onOpenAnalytics}><BarChart3 /> View Detailed Analytics</Button>}>
        <div className="h-44">
          <ResponsiveContainer>
            <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" fontSize={10} interval="preserveStartEnd" />
              <YAxis fontSize={10} tickFormatter={(v: number) => `$${fmtNum(v)}`} width={48} />
              <Tooltip formatter={(v: number) => [fmtMoney(v), "Spend"]} />
              <Area type="monotone" dataKey="spend" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div><div className="text-muted-foreground">Spend</div><div className="font-semibold">{fmtMoney(a.spend)}</div></div>
          <div><div className="text-muted-foreground">CTR</div><div className="font-semibold">{a.ctr.toFixed(2)}%</div></div>
          <div><div className="text-muted-foreground">CPM</div><div className="font-semibold">{fmtMoney(a.cpm)}</div></div>
          <div><div className="text-muted-foreground">ROAS</div><div className="font-semibold">{a.roas == null ? "N/A" : `${a.roas.toFixed(2)}×`}</div></div>
        </div>
      </Section>
      <Section title="By country">
        <ul className="space-y-1 text-sm">
          {countries.map((g) => <li key={g.name} className="flex justify-between"><span>{g.name}</span><span className="tabular-nums text-muted-foreground">{fmtMoney(g.a.spend)} · CTR {g.a.ctr.toFixed(2)}%</span></li>)}
        </ul>
      </Section>
    </div>
  );
}

/* ------------------------- Activity & Approvals --------------------- */
function ActivityTab({ campaignId, proposal, meta }: { campaignId: string; proposal: ReturnType<typeof findProposal>; meta: CampaignMeta | undefined }) {
  const s = useDemo();
  const events = s.activity.filter((e) => e.campaignId === campaignId);
  const revisions = proposal ? [...proposal.revisions].reverse() : [];
  const relatedTasks = s.tasks.filter((t) => t.campaignId === campaignId || t.title.includes(proposal?.name ?? meta?.name ?? "∅"));
  const demoHistory: { at: string; actor: string; kind: string; action: string; outcome?: string }[] = meta
    ? [
        { at: meta.updated, actor: "System", kind: "System", action: `Delivery ${meta.status.toLowerCase()}`, outcome: `${meta.channel} · ${meta.geo}` },
        { at: "Campaign setup", actor: "BlueFocus", kind: "Human", action: "Campaign created on " + meta.channel, outcome: `${meta.ads.length} ads across ${new Set(meta.ads.map((a) => a.adset)).size} ${meta.channel === "Meta" ? "ad sets" : "ad groups"}` },
      ]
    : [];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Timeline" right={<Demo>Simulated events labeled</Demo>}>
        {events.length === 0 && demoHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet — approvals, edits, launch events and agent tasks will appear here as you work.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-4">
            {events.map((e) => (
              <li key={e.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{e.action}</span>
                  <Pill tone={e.kind === "Agent" ? "brand" : e.kind === "Ops" ? "info" : e.kind === "System" ? "muted" : "primary"}>{e.kind}</Pill>
                  {e.simulated && <Demo />}
                </div>
                <div className="text-xs text-muted-foreground">{e.at} · {e.actor}{e.outcome ? ` · ${e.outcome}` : ""}</div>
              </li>
            ))}
            {demoHistory.map((e, i) => (
              <li key={i} className="text-sm">
                <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{e.action}</span><Pill tone="muted">{e.kind}</Pill><Demo /></div>
                <div className="text-xs text-muted-foreground">{e.at} · {e.actor}{e.outcome ? ` · ${e.outcome}` : ""}</div>
              </li>
            ))}
          </ol>
        )}
      </Section>
      <div className="space-y-6">
        {proposal && (
          <Section title="Approval history">
            <ul className="divide-y divide-border text-sm">
              {revisions.map((r) => (
                <li key={r.rev} className="flex justify-between gap-2 py-2">
                  <span>Rev {r.rev} · {r.change}</span>
                  <span className="text-muted-foreground">{r.by}{proposal.approvedRevision === r.rev && <Pill tone="success" className="ml-2">Approved</Pill>}</span>
                </li>
              ))}
            </ul>
            {proposal.changesRequested && <p className="mt-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs"><b>Changes requested:</b> {proposal.changesRequested}</p>}
            <p className="mt-2 text-[11px] text-muted-foreground">Approval applies to one exact revision — any material edit invalidates it.</p>
          </Section>
        )}
        <Section title="Related agent tasks">
          {relatedTasks.length === 0 ? <p className="text-sm text-muted-foreground">No agent tasks reference this campaign yet.</p> : (
            <ul className="space-y-2 text-sm">
              {relatedTasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
                  <span className="min-w-0 truncate">{t.id} · {t.title}</span>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild><Link to="/tasks">Open</Link></Button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
