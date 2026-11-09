import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, BarChart3, Bot, CheckCircle2, ChevronDown, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Demo, PageHeader, Pill, Section, Stat } from "@/components/demo/bits";
import { actions, can, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { attentionItems, unifiedCampaigns, type UnifiedCampaign } from "@/lib/demo/campaign-hub";
import { agg, CHANNELS, filteredRows, fmtMoney, fmtNum, OBJECTIVES, setAnalyticsFilters, useAnalyticsFilters } from "@/lib/demo/analytics-data";
import { effectiveApproval } from "@/lib/demo/creative-model";
import { CreativePreview } from "@/components/demo/creative/preview";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/campaigns")({
  head: () => pageHead("Campaigns", "Manage campaign delivery, approvals and performance across your advertising channels."),
  component: Campaigns,
});

type Tab = "all" | "active" | "draft" | "attention" | "completed";
const TABS: [Tab, string][] = [["all", "All Campaigns"], ["active", "Active"], ["draft", "Drafts"], ["attention", "Needs Attention"], ["completed", "Completed"]];
type SortKey = "name" | "status" | "spend" | "results" | "cost" | "ctr" | "cpm";
const PAGE_SIZE = 8;

function Campaigns() {
  const s = useDemo();
  const f = useAnalyticsFilters();
  const navigate = useNavigate();
  const ids = s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.filter((c) => c.biz === "bluefocus").map((c) => c.id) : [s.clientId];
  const org = s.biz === "direct" ? "Northwind Coffee" : "BlueFocus";
  const clientName = s.clientId === "all" ? "All Clients" : s.clients.find((c) => c.id === s.clientId)?.name ?? "—";

  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [channel, setChannel] = useState("all");
  const [objective, setObjective] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const all = useMemo(() => unifiedCampaigns(s, ids, f), [s, ids, f]);
  const attention = useMemo(() => attentionItems(s, ids), [s, ids]);

  const rows = useMemo(() => {
    let t = all;
    if (tab === "active") t = t.filter((r) => r.group === "active");
    if (tab === "draft") t = t.filter((r) => r.group === "draft");
    if (tab === "completed") t = t.filter((r) => r.group === "completed");
    if (tab === "attention") t = t.filter((r) => r.attention.length > 0);
    if (q.trim()) t = t.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()) || r.id.toLowerCase().includes(q.trim().toLowerCase()));
    if (channel !== "all") t = t.filter((r) => r.channel === channel);
    if (objective !== "all") t = t.filter((r) => r.objective === objective);
    if (status !== "all") t = t.filter((r) => r.statusLabel === status);
    const val = (r: UnifiedCampaign): number | string => {
      switch (sortKey) {
        case "name": return r.name;
        case "status": return r.statusLabel;
        case "spend": return r.agg?.spend ?? -1;
        case "ctr": return r.agg?.ctr ?? -1;
        case "cpm": return r.agg?.cpm ?? -1;
        case "results": return r.agg ? (r.objective === "Awareness" ? r.agg.reach : r.objective === "Traffic" ? r.agg.clicks : r.agg.conversions) : -1;
        case "cost": return r.agg?.cpa ?? r.agg?.cpc ?? -1;
      }
    };
    return [...t].sort((a, b) => {
      const va = val(a), vb = val(b);
      const cmp = typeof va === "string" ? va.localeCompare(vb as string) : va - vb;
      return cmp * sortDir;
    });
  }, [all, tab, q, channel, objective, status, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const statuses = [...new Set(all.map((r) => r.statusLabel))];

  // KPIs from the shared analytics dataset under the current filters.
  const totals = agg(filteredRows(ids, f));
  const activeCount = all.filter((r) => r.group === "active").length;
  const attentionCount = all.filter((r) => r.attention.length > 0).length;
  const objectives = new Set(all.filter((r) => r.kind === "delivery").map((r) => r.objective));
  const mixedObjectives = objectives.size > 1;

  const sortBtn = (key: SortKey, label: string, right = true) => (
    <button className={cn("inline-flex items-center gap-0.5 font-medium", right && "w-full justify-end")} onClick={() => { if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1)); else { setSortKey(key); setSortDir(-1); } setPage(0); }}>
      {label} {sortKey === key ? (sortDir === -1 ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />) : <ArrowUpDown className="size-3 opacity-40" />}
    </button>
  );

  const planWithClayton = () => {
    const cid = s.clientId === "all" ? "freebeat" : s.clientId;
    actions.planWithClayton(cid);
    toast("Opening the Agent Workspace", { description: "A planning request for Clayton is prefilled in the composer." });
    void navigate({ to: "/workspace" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        eyebrow={<>{org} / {clientName}</>}
        title="Campaigns"
        sub="Manage campaign delivery, approvals and performance across your advertising channels."
        right={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="brand" disabled={!can.editDraft(s.role)}><Plus /> New Campaign <ChevronDown /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={planWithClayton}><Sparkles className="text-brand" /> Plan with Clayton</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCreateOpen(true)}><Plus /> Create Manually</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* B — Needs Your Attention */}
      {attention.length > 0 ? (
        <Section title={<span className="flex items-center gap-2"><AlertTriangle className="size-4 text-warning" /> Needs Your Attention</span>} right={<Pill tone="warning">{attention.length}</Pill>}>
          <div className="grid gap-2 sm:grid-cols-2">
            {attention.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2.5">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{a.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.detail}</div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  {a.to === "/creative"
                    ? <Link to="/creative">{a.actionLabel}</Link>
                    : a.campaignId
                      ? <Link to="/campaigns/$campaignId" params={{ campaignId: a.campaignId }}>{a.actionLabel}</Link>
                      : <Link to="/campaigns">{a.actionLabel}</Link>}
                </Button>
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/5 px-4 py-2.5 text-sm">
          <CheckCircle2 className="size-4 text-success" /> Nothing needs attention — all campaigns are on track for {clientName}.
        </div>
      )}

      {/* C — Campaign Overview KPIs */}
      <div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={`Total Ad Spend · Last ${f.days}d`} value={fmtMoney(totals.spend)} hint={`${fmtNum(totals.impressions)} impressions`} />
          <Stat label="Active Campaigns" value={activeCount} hint={`${all.length} total in scope`} />
          <Stat
            label={mixedObjectives ? "Results (mixed objectives)" : "Results / Conversions"}
            value={mixedObjectives ? "See breakdown" : fmtNum(totals.conversions)}
            hint={mixedObjectives ? "Awareness, Traffic and Conversion results are not added together" : `${fmtNum(totals.conversions)} conversions · CPA ${totals.cpa == null ? "N/A" : fmtMoney(totals.cpa)}`}
          />
          <Stat label="Needs Attention" value={attentionCount} tone={attentionCount > 0 ? "danger" : undefined} hint={attentionCount > 0 ? "Approvals, blockers or creative reviews" : "All clear"} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Metrics use the shared Analytics dataset · Last {f.days} days</span>
          <Link to="/analytics" className="inline-flex items-center gap-1 font-semibold text-info hover:underline"><BarChart3 className="size-3" /> View Detailed Analytics</Link>
        </div>
      </div>

      {/* D — Unified campaign table */}
      <Section
        title="Campaigns"
        right={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search name or ID" className="h-8 w-52 pl-8 text-xs" />
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 rounded-lg border border-border p-0.5">
            {TABS.map(([k, label]) => (
              <button key={k} onClick={() => { setTab(k); setPage(0); }} className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", tab === k ? "bg-brand-soft text-brand" : "text-muted-foreground hover:text-foreground")}>
                {label}{k === "attention" && attentionCount > 0 ? ` (${attentionCount})` : ""}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <Select value={String(f.days)} onValueChange={(v) => setAnalyticsFilters({ days: Number(v) })}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[7, 30, 90].map((d) => <SelectItem key={d} value={String(d)}>Last {d} days</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={channel} onValueChange={(v) => { setChannel(v); setPage(0); }}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={objective} onValueChange={(v) => { setObjective(v); setPage(0); }}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Objective" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All objectives</SelectItem>
                {OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statuses.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {pageRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">No campaigns match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3">{sortBtn("name", "Campaign", false)}</th>
                  <th className="py-2 pr-3 font-medium">Channel</th>
                  <th className="py-2 pr-3 font-medium">Objective</th>
                  <th className="py-2 pr-3">{sortBtn("status", "Status", false)}</th>
                  <th className="py-2 pr-3 font-medium">Budget</th>
                  <th className="py-2 pr-3 text-right">{sortBtn("spend", "Spend")}</th>
                  <th className="py-2 pr-3 text-right">{sortBtn("results", "Results")}</th>
                  <th className="py-2 pr-3 text-right">{sortBtn("cost", "Cost / Result")}</th>
                  <th className="py-2 pr-3 text-right">{sortBtn("ctr", "CTR")}</th>
                  <th className="py-2 pr-3 text-right">{sortBtn("cpm", "CPM")}</th>
                  <th className="py-2 pr-3 font-medium">Updated</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.id} className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50" onClick={() => void navigate({ to: "/campaigns/$campaignId", params: { campaignId: r.id } })}>
                    <td className="py-2.5 pr-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{r.id}{r.kind === "proposal" ? " · proposal" : ""}</div>
                    </td>
                    <td className="py-2.5 pr-3">{r.channel}</td>
                    <td className="py-2.5 pr-3">{r.objective}</td>
                    <td className="py-2.5 pr-3">
                      <Pill tone={r.statusTone} dot={r.statusLabel === "Active" || r.statusLabel === "Live Verified"}>{r.statusLabel}</Pill>
                      {r.attention.length > 0 && <div className="mt-0.5 flex items-center gap-1 text-[10px] text-warning"><AlertTriangle className="size-2.5" />{r.attention.length} issue{r.attention.length > 1 ? "s" : ""}</div>}
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{r.budget}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{r.agg ? fmtMoney(r.agg.spend) : <span title="No delivery yet — proposals show performance only after Live Verified">—</span>}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{r.result ? <span title={r.result.label}>{r.result.value}</span> : "—"}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{r.result ? <span title={r.result.costLabel}>{r.result.cost}</span> : "—"}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{r.agg ? `${r.agg.ctr.toFixed(2)}%` : "—"}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{r.agg ? fmtMoney(r.agg.cpm) : "—"}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{r.updated}</td>
                    <td className="py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" asChild><Link to="/campaigns/$campaignId" params={{ campaignId: r.id }}>View</Link></Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => askAgent(r, s.clientId === "all" ? r.clientId : r.clientId, navigate)}>
                          <Bot className="size-3" /> Ask UA
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{rows.length} campaigns · page {page + 1} of {pages}</span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Section>

      <ManualCampaignDialog open={createOpen} onOpenChange={setCreateOpen} defaultClient={s.clientId === "all" ? "freebeat" : s.clientId} />
    </div>
  );
}

function askAgent(r: UnifiedCampaign, clientId: string, navigate: ReturnType<typeof useNavigate>) {
  const prompt = [
    `@UA Agent — campaign review request from the Campaigns hub:`,
    `Campaign “${r.name}” (${r.id}) · ${r.channel} · ${r.objective} · status ${r.statusLabel}.`,
    r.agg ? `Performance (current filters): spend ${fmtMoney(r.agg.spend)}, CTR ${r.agg.ctr.toFixed(2)}%, CPM ${fmtMoney(r.agg.cpm)}.` : "No delivery yet — this is a proposal.",
    "Analyze and recommend next steps. Do not change budgets, targeting or creatives without approval.",
  ].join("\n");
  actions.startGenericTask(clientId, `Campaign review: ${r.name}`.slice(0, 80), "UA Agent", prompt);
  toast("UA Agent task created", { description: `Context for ${r.id} was passed to the workspace.` });
  void navigate({ to: "/workspace" });
}

/* ------------------------- Manual creation ------------------------- */
function ManualCampaignDialog({ open, onOpenChange, defaultClient }: { open: boolean; onOpenChange: (v: boolean) => void; defaultClient: string }) {
  const s = useDemo();
  const navigate = useNavigate();
  const [clientId, setClientId] = useState(defaultClient);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Meta");
  const [objective, setObjective] = useState("Awareness");
  const [geo, setGeo] = useState("United States");
  const [daily, setDaily] = useState("150");
  const [cap, setCap] = useState("1500");
  const [audience, setAudience] = useState("");
  const [creatives, setCreatives] = useState<string[]>([]);

  const approvedCreatives = s.creativeAssets
    .filter((a) => a.clientId === clientId)
    .flatMap((a) => a.versions.filter((v) => effectiveApproval(a, v)).map((v) => ({ asset: a, v })));

  const save = () => {
    const d = Number(daily), t = Number(cap);
    if (!name.trim()) { toast.error("Campaign name is required."); return; }
    if (!(d > 0) || !(t >= d)) { toast.error("Daily budget must be > 0 and cap ≥ daily."); return; }
    actions.createManualCampaign({
      clientId, name, platform, objective, geo, dailyBudget: d, totalCap: t,
      audience: audience || "To be refined with UA Agent",
      placements: platform === "Meta" ? ["Instagram Reels", "Facebook Feed"] : platform === "TikTok Ads" ? ["TikTok Feed"] : ["Search"],
      creativeIds: creatives,
    });
    toast.success("Draft created", { description: "It uses the same proposal model as AI-created campaigns." });
    onOpenChange(false);
    setName(""); setCreatives([]);
    void navigate({ to: "/campaigns" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Campaign Manually</DialogTitle>
          <DialogDescription>Creates the same Campaign Proposal record Clayton would — Draft → Review → Approval → Preflight → Launch. <Demo /></DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Client / Brand</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {s.clients.filter((c) => s.biz === "direct" ? c.biz === "direct" : c.biz === "bluefocus").map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2"><Label>Campaign name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Freebeat — Winter Push" /></div>
          <div>
            <Label>Channel</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Objective</Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{OBJECTIVES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Geography</Label><Input value={geo} onChange={(e) => setGeo(e.target.value)} /></div>
          <div><Label>Ad account</Label><Input value="act_DEMO_88231 (demo)" disabled /></div>
          <div><Label>Daily budget ($)</Label><Input type="number" value={daily} onChange={(e) => setDaily(e.target.value)} /></div>
          <div><Label>Total cap ($)</Label><Input type="number" value={cap} onChange={(e) => setCap(e.target.value)} /></div>
          <div className="col-span-2"><Label>Audience</Label><Textarea rows={2} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. US · 18–34 · music creation interests" /></div>
          <div className="col-span-2">
            <Label>Approved creative versions ({creatives.length} selected)</Label>
            {approvedCreatives.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">No approved creative versions for this client yet.</p>
            ) : (
              <div className="mt-1 max-h-44 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                {approvedCreatives.map(({ asset, v }) => {
                  const key = `${asset.id}@${v.number}`;
                  const on = creatives.includes(key);
                  return (
                    <label key={key} className={cn("flex cursor-pointer items-center gap-2.5 rounded-md border px-2 py-1.5 text-xs", on ? "border-brand/50 bg-brand-soft/40" : "border-border")}>
                      <input type="checkbox" className="accent-brand" checked={on} onChange={() => setCreatives((cs) => on ? cs.filter((c) => c !== key) : [...cs, key])} />
                      <div className="w-10 shrink-0 overflow-hidden rounded"><CreativePreview version={v} /></div>
                      <span className="min-w-0 flex-1 truncate font-medium">{asset.name} · V{v.number}</span>
                      <span className="text-muted-foreground">{v.format} · {v.ratio} · {asset.source}</span>
                      <Pill tone="success">Approved</Pill>
                    </label>
                  );
                })}
              </div>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">Only effectively approved versions can be selected — unapproved creative cannot silently pass launch readiness.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="brand" onClick={save}>Save Draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
