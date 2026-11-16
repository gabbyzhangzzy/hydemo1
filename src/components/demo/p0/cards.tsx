import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Bot, Check, CheckCircle2, ChevronDown, ChevronRight, Circle, Clock, Loader2, Lock, RotateCcw, ShieldAlert, Sparkles, Wand2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Demo, Pill } from "@/components/demo/bits";
import { CREATIVE_PREVIEWS } from "@/lib/demo/creative-seed";
import { actions, useDemo } from "@/lib/demo/store";
import * as f from "@/lib/demo/p0-flow";
import type { CheckStatus, ExecMode, P0Card, P0Event, P0State, Platform } from "@/lib/demo/p0-flow";
import { cn } from "@/lib/utils";

export type DrawerKind = "proposal" | "gallery" | "exec" | "report" | null;
const run = (fn: (p: P0State) => unknown) => actions.p0(fn);
const money = (n: number, d = 2) => `$${n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`;

/* ---------------- Shared card frame ---------------- */
function CardShell({ title, kind, id, version, status, children, actions: act, collapsed, onToggle }: {
  title: string; kind: string; id: string; version?: string; status: ReactNode; children: ReactNode; actions?: ReactNode; collapsed?: boolean; onToggle?: () => void;
}) {
  return (
    <section className="max-w-3xl overflow-hidden rounded-xl border border-ai-panel-border bg-card text-card-foreground" aria-label={title}>
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
        <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">{kind}</span>
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h3>
        <span className="font-mono text-[10px] text-muted-foreground">{id}</span>
        {version && <Pill tone="info" className="text-[10px]">{version}</Pill>}
        {status}
        {onToggle && (
          <button onClick={onToggle} className="text-muted-foreground hover:text-foreground" aria-label={collapsed ? "Show details" : "Collapse"}>
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        )}
      </header>
      {!collapsed && <div className="px-4 py-3 text-sm">{children}</div>}
      {!collapsed && act && <footer className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-2.5">{act}</footer>}
    </section>
  );
}
/** Completed cards start collapsed but stay expandable with their latest state. */
function useCollapse(done: boolean) {
  const [open, setOpen] = useState<boolean | null>(null);
  const collapsed = open === null ? done : !open;
  return { collapsed, onToggle: () => setOpen(collapsed) };
}
function KV({ k, v }: { k: string; v: ReactNode }) {
  return <div><div className="text-[11px] text-muted-foreground">{k}</div><div className="font-medium">{v}</div></div>;
}
function InlineAsk({ placeholder, initial, cta, onSend, onCancel }: { placeholder: string; initial: string; cta: string; onSend: (t: string) => void; onCancel: () => void }) {
  const [t, setT] = useState(initial);
  return (
    <div className="w-full space-y-2">
      <Textarea rows={2} value={t} onChange={(e) => setT(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      <div className="flex gap-2"><Button size="sm" variant="brand" onClick={() => t.trim() && onSend(t.trim())}>{cta}</Button><Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button></div>
    </div>
  );
}

/* ---------------- Brief summary (step 1) ---------------- */
function BriefSummary({ p }: { p: P0State }) {
  const done = !!p.brief.conversionEvent;
  const c = useCollapse(f.completedSteps(p) > 2);
  return (
    <CardShell kind="Brief" title="Freebeat — Marketing Brief" id="T-2001" status={done ? <Pill tone="success">Complete</Pill> : <Pill tone="warning">2 items missing</Pill>} {...c}
      actions={!done && <Button size="sm" variant="outline" onClick={() => run((x) => f.answerBrief(x))}>Answer with sample: “{f.SAMPLE_ANSWER}”</Button>}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KV k="Goal" v="App installs" /><KV k="Markets" v="US / Canada" /><KV k="Budget" v={`$${f.DAILY}/day · ${f.DAYS} days`} /><KV k="Channels" v="Meta, TikTok" />
        <KV k="Creatives" v="2 uploaded + new AI concepts" />
        <KV k="Conversion event" v={p.brief.conversionEvent ?? <span className="text-warning">Needed</span>} />
        <KV k="Target CPI" v={p.brief.targetCpi != null ? money(p.brief.targetCpi) : <span className="text-warning">Needed</span>} />
      </div>
      {!done && <p className="mt-2 text-xs text-muted-foreground">Reply in the composer or use the sample answer.</p>}
    </CardShell>
  );
}

/* ---------------- C1 ProposalCard ---------------- */
export function ProposalCard({ p, onOpen }: { p: P0State; onOpen: () => void }) {
  const [asking, setAsking] = useState(false);
  const pr = p.proposal;
  const approved = pr.status === "approved";
  const c = useCollapse(f.completedSteps(p) > 3);
  const meta = pr.metaPct;
  return (
    <CardShell kind="C1 · Proposal" title="Freebeat — App Install Campaign Proposal" id="T-2001 · PR-77" version={`v${pr.revision}`} {...c}
      status={approved ? <Pill tone="success">Approved v{pr.approvedRevision} · prep only</Pill> : <Pill tone="warning">Awaiting approval</Pill>}
      actions={approved ? <><Button size="sm" variant="outline" onClick={onOpen}>View Full Proposal</Button><span className="text-[11px] text-muted-foreground">Plan approval authorizes preparation only — not live spend.</span></> : asking ? (
        <InlineAsk placeholder="Describe the change for UA Agent" initial={f.SAMPLE_CHANGE} cta="Send to UA Agent" onCancel={() => setAsking(false)} onSend={(t) => { run((x) => f.requestProposalChanges(x, t)); setAsking(false); }} />
      ) : <>
        <Button size="sm" variant="brand" onClick={() => run((x) => f.approveProposal(x))}><CheckCircle2 /> Approve Plan v{pr.revision}</Button>
        <Button size="sm" variant="outline" onClick={() => setAsking(true)}>Request Changes</Button>
        <Button size="sm" variant="ghost" onClick={onOpen}>View Full Proposal</Button>
      </>}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KV k="Objective" v="App Installs" /><KV k="Target event" v={p.brief.conversionEvent} /><KV k="Markets" v="US / Canada" /><KV k="Duration" v={`${f.DAYS} days`} />
        <KV k="Daily budget" v={money(f.DAILY, 0)} /><KV k="Total cap" v={money(f.TOTAL_CAP, 0)} />
        <KV k="Allocation" v={`Meta ${meta}% · TikTok ${100 - meta}%`} />
        <KV k="Target CPI" v={<>{money(p.brief.targetCpi ?? 2.3)} <span className="text-[10px] text-muted-foreground">(customer target, not guaranteed)</span></>} />
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted" aria-label="Channel allocation"><div className="bg-info" style={{ width: `${meta}%` }} /><div className="bg-chart-3" style={{ width: `${100 - meta}%` }} /></div>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div><span className="font-semibold">Estimated:</span> {Math.round(f.TOTAL_CAP / 2.6).toLocaleString()}–{Math.round(f.TOTAL_CAP / 2.1).toLocaleString()} installs <Pill tone="muted" className="ml-1 text-[9px]">Low confidence · estimate</Pill></div>
        <div className="flex flex-wrap gap-1.5"><Pill tone="success" className="text-[10px]">Policy: no issues found</Pill><Pill tone="warning" className="text-[10px]">Tracking: TikTok event unverified</Pill></div>
        <div className="sm:col-span-2 text-muted-foreground">Creatives: 2 uploaded + 3 proposed AI concepts. Structure: 1 campaign per platform, creative A/B at ad level.</div>
      </div>
    </CardShell>
  );
}

/* ---------------- Creative brief + production (step 3) ---------------- */
function CreativeBriefCard({ p }: { p: P0State }) {
  const [asking, setAsking] = useState(false);
  const b = p.cbrief;
  const c = useCollapse(f.completedSteps(p) > 3);
  return (
    <CardShell kind="Brief" title="Freebeat — Creative Brief" id="CB-31" version={`rev ${b.revision}`} {...c}
      status={b.status === "approved" ? <Pill tone="success">Approved</Pill> : <Pill tone="warning">Needs review</Pill>}
      actions={b.status === "approved" ? undefined : asking ? (
        <InlineAsk placeholder="What should change?" initial="Make the hooks shorter — under 2 seconds." cta="Send to Creative Agent" onCancel={() => setAsking(false)} onSend={(t) => { run((x) => f.requestCreativeChanges(x, t)); setAsking(false); }} />
      ) : <>
        <Button size="sm" variant="brand" onClick={() => run((x) => f.approveCreativeBrief(x))}><CheckCircle2 /> Approve Brief & Produce</Button>
        <Button size="sm" variant="outline" onClick={() => setAsking(true)}>Request Creative Changes</Button>
      </>}>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div><span className="font-semibold">Audience:</span> 18–34 music lovers & short-video creators, US/CA</div>
        <div><span className="font-semibold">Value prop:</span> Turn any song into a shareable video in seconds</div>
        <div className="sm:col-span-2"><span className="font-semibold">Directions:</span> A · POV hook · B · Beat-sync loop · C · Lifestyle story</div>
        <div><span className="font-semibold">Hooks / CTA:</span> “Your song. Your video.” · CTA “Install free”</div>
        <div><span className="font-semibold">Formats:</span> 9:16 video (Reels, TikTok), 1:1 & 4:5 (Meta feed)</div>
        <div><span className="font-semibold">References:</span> top 2 uploaded ads (demo)</div>
        <div><span className="font-semibold">Brand rules:</span> orange accent, no licensed-artist names</div>
        {b.notes.map((n) => <div key={n} className="sm:col-span-2 text-info">Change applied: {n}</div>)}
      </div>
    </CardShell>
  );
}
function ProductionCard({ p }: { p: P0State }) {
  useEffect(() => {
    if (p.production !== "generating") return;
    const t = setTimeout(() => run((x) => f.finishProduction(x)), 3500);
    return () => clearTimeout(t);
  }, [p.production]);
  const gen = p.production === "generating";
  return (
    <div className="flex max-w-3xl items-center gap-3 rounded-xl border border-ai-panel-border bg-ai-panel-elevated px-4 py-3 text-sm">
      {gen ? <Loader2 className="size-4 animate-spin text-brand" /> : <CheckCircle2 className="size-4 text-success" />}
      <span className="text-ai-panel-muted">{gen ? "Generating 3 concepts · rendering 9:16 and 4:5 variants · running brand QA (simulated)…" : "Production complete · 3 concepts passed brand QA"}</span>
      {gen && <Button size="sm" variant="ai" className="ml-auto" onClick={() => run((x) => f.finishProduction(x))}>Skip wait</Button>}
    </div>
  );
}

/* ---------------- C2 CreativeReviewCard ---------------- */
const VTONE = { "Pending Review": "warning", Approved: "success", "Changes Requested": "danger" } as const;
function Thumb({ i, className }: { i: number; className?: string }) {
  return <img src={CREATIVE_PREVIEWS[i] ?? CREATIVE_PREVIEWS[0]} alt="" className={cn("aspect-square w-full rounded-lg object-cover", className)} loading="lazy" />;
}
export function CreativeReviewCard({ p, onOpen }: { p: P0State; onOpen: () => void }) {
  const ready = f.approvedCreatives(p).length;
  const c = useCollapse(p.handedOff && f.completedSteps(p) > 5);
  return (
    <CardShell kind="C2 · Creative Review" title="Freebeat — Creative Review" id="CR-418" {...c}
      status={p.handedOff ? <Pill tone="success">{ready} handed to UA</Pill> : <Pill tone="warning">{ready}/5 approved</Pill>}
      actions={<>
        <Button size="sm" variant="outline" onClick={onOpen}>View All Creatives</Button>
        {!p.handedOff && <>
          <Button size="sm" variant="brand" onClick={() => run((x) => f.approveSelected(x))}><CheckCircle2 /> Approve Selected</Button>
          <Button size="sm" variant="outline" onClick={onOpen}>Request Revision</Button>
          {ready > 0 && <Button size="sm" variant="ai" onClick={() => run((x) => f.handOff(x))}>Send {ready} approved to UA Agent →</Button>}
        </>}
      </>}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {p.creatives.map((cr) => { const v = f.cur(cr); return (
          <label key={cr.id} className={cn("relative cursor-pointer rounded-lg border p-1.5 text-[11px]", cr.selected ? "border-brand" : "border-border opacity-70")}>
            <input type="checkbox" className="absolute left-2.5 top-2.5 size-4 accent-current" checked={cr.selected} disabled={p.handedOff} onChange={() => run((x) => f.toggleSelect(x, cr.id))} aria-label={`Select ${cr.name}`} />
            <Thumb i={cr.preview} />
            <div className="mt-1 truncate font-semibold">{cr.name}</div>
            <div className="truncate text-muted-foreground">{cr.source} · v{v.n}</div>
            <Pill tone={VTONE[v.status]} className="mt-1 text-[9px]">{v.status}</Pill>
          </label>
        ); })}
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Only selected and approved versions move to campaign drafts.</p>
    </CardShell>
  );
}
function Gallery({ p }: { p: P0State }) {
  const [rev, setRev] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      {p.creatives.map((cr) => { const v = f.cur(cr); return (
        <div key={cr.id} className="rounded-xl border border-border p-3">
          <div className="flex gap-3">
            <Thumb i={cr.preview} className="w-24 shrink-0" />
            <div className="min-w-0 flex-1 text-xs">
              <div className="text-sm font-semibold">{cr.name} <span className="font-mono text-[10px] text-muted-foreground">{cr.id}</span></div>
              <div className="text-muted-foreground">{cr.concept}</div>
              <div className="mt-1 flex flex-wrap gap-1"><Pill tone={cr.source === "Uploaded" ? "muted" : "brand"} className="text-[9px]">{cr.source}</Pill><Pill tone="muted" className="text-[9px]">{cr.format}</Pill><Pill tone="muted" className="text-[9px]">{cr.placement}</Pill></div>
              <ol className="mt-2 space-y-0.5">
                {cr.versions.map((x) => <li key={x.n} className="flex items-center gap-2"><span className="font-mono">v{x.n}</span><span className="truncate text-muted-foreground">{x.note}</span><Pill tone={VTONE[x.status]} className="ml-auto text-[9px]">{x.status}</Pill></li>)}
              </ol>
            </div>
          </div>
          {!p.handedOff && (rev === cr.id ? (
            <div className="mt-2"><InlineAsk placeholder={`Revision for v${v.n}`} initial="Show the app UI in the first second." cta={`Request revision of v${v.n}`} onCancel={() => setRev(null)} onSend={(t) => { run((x) => f.requestRevision(x, cr.id, t)); setRev(null); }} /></div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => run((x) => f.toggleSelect(x, cr.id))}>{cr.selected ? "Deselect" : "Select"}</Button>
              {v.status === "Pending Review" && <Button size="sm" variant="outline" onClick={() => setRev(cr.id)}>Request Revision of v{v.n}</Button>}
            </div>
          ))}
        </div>
      ); })}
    </div>
  );
}

/* ---------------- C3 ExecutionReviewCard ---------------- */
const MODES: { id: ExecMode; label: string; purpose: string }[] = [
  { id: "scale", label: "Scale", purpose: "Expand into a new market while reusing approved creatives." },
  { id: "ab_audience", label: "A/B Test — Audience", purpose: "Same campaign; ad sets differ only by audience." },
  { id: "ab_creative", label: "A/B Test — Creative", purpose: "Same campaign and targeting; ads differ only by creative version." },
];
type Cell = { t: string; changed?: boolean };
export function execTable(p: P0State, pf: Platform): { row: string; cells: [Cell, Cell, Cell] }[] {
  const mode = p.exec.mode;
  const meta = pf === "Meta";
  const share = meta ? p.proposal.metaPct : 100 - p.proposal.metaPct;
  const daily = (f.DAILY * share) / 100;
  const set = meta ? "Ad Set" : "Ad Group";
  const creatives = f.approvedCreatives(p).map((c) => `${c.id} v${f.cur(c).n}`).join(", ");
  const s = mode === "scale", a = mode === "ab_audience", c = mode === "ab_creative";
  const I = (t: string): Cell => ({ t }), C = (t: string): Cell => ({ t, changed: true });
  const st = (lvl: "campaign" | "adset" | "ad") => { const it = p.exec.items.filter((i) => i.platform === pf && i.level === lvl); const bad = it.filter((i) => i.status !== "created").length; return bad ? C(`${it.length - bad}/${it.length} created · ${bad} failed/blocked`) : I(`${it.length} draft${it.length > 1 ? "s" : ""} created`); };
  return [
    { row: "Campaign", cells: [s ? C(`New: Freebeat ${pf} · CA Expansion`) : I(`Existing: Freebeat ${pf} · App Install`), I("—"), I("—")] },
    { row: "Objective", cells: [I(meta ? "App Promotion" : "App Promotion · App Install"), I("—"), I("—")] },
    { row: "GEO", cells: [I("—"), s ? C("Canada (new market)") : I("US / Canada"), I("Inherited")] },
    { row: "Conversion Event", cells: [I("—"), I(`${p.brief.conversionEvent} (${meta ? "SDK" : "MMP"})`), I("Inherited")] },
    { row: "Audience", cells: [I("—"), a ? C("Variant 1: Broad 18–34 · Variant 2: Music creators LAL") : s ? C("Broad 18–34, CA") : I("Broad 18–34 (constant)"), I("Inherited")] },
    { row: "Placement", cells: [I("—"), I(meta ? "Advantage+ placements" : "TikTok feed (Pangle off)"), I("Inherited")] },
    { row: "Budget", cells: meta ? [I(`Campaign budget (CBO) ${money(daily, 0)}/day`), a ? I("Split evenly by CBO") : I("Managed by campaign"), I("—")] : [I("No campaign budget"), a ? C(`${money(daily / 2, 0)}/day per ad group`) : I(`${money(daily, 0)}/day ad group budget`), I("—")] },
    { row: "Schedule", cells: [I(`${f.DAYS} days · starts on approval`), I("Inherited"), I("Inherited")] },
    { row: "Creative", cells: [I("—"), I("—"), c ? C(`One ad per version: ${creatives}`) : s ? I(`Reused approved: ${creatives}`) : I("Held constant: best approved ad")] },
    { row: "Tracking", cells: [I("—"), I(meta ? "Meta SDK · verified" : "TikTok Events · pending verification"), I("UTM + MMP link")] },
    { row: "Status", cells: [st("campaign"), st("adset"), st("ad")] },
  ];
}
function ModeSwitch({ p }: { p: P0State }) {
  const locked = p.launch.status === "approved";
  return (
    <div role="radiogroup" aria-label="Batch mode" className="inline-flex flex-wrap rounded-lg border border-border p-0.5 text-xs">
      {MODES.map((m) => (
        <button key={m.id} role="radio" aria-checked={p.exec.mode === m.id} disabled={locked} onClick={() => run((x) => f.setMode(x, m.id))}
          className={cn("rounded-md px-2.5 py-1 font-medium", p.exec.mode === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground disabled:opacity-50")}>{m.label}</button>
      ))}
    </div>
  );
}
function ExecTableView({ p }: { p: P0State }) {
  const [pf, setPf] = useState<Platform>("Meta");
  const rows = execTable(p, pf);
  return (
    <div className="space-y-3">
      <ModeSwitch p={p} />
      <p className="text-xs text-muted-foreground">{MODES.find((m) => m.id === p.exec.mode)?.purpose}</p>
      <div className="flex gap-1">{(["Meta", "TikTok"] as Platform[]).map((x) => <Button key={x} size="sm" variant={pf === x ? "default" : "outline"} onClick={() => setPf(x)}>{x}</Button>)}</div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] text-xs">
          <thead className="bg-muted/60 text-left"><tr><th className="px-3 py-2">Attribute</th><th className="px-3 py-2">Campaign Level</th><th className="px-3 py-2">{pf === "Meta" ? "Ad Set Level" : "Ad Group Level"}</th><th className="px-3 py-2">Ad Level</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.row} className="border-t border-border align-top">
                <th scope="row" className="px-3 py-1.5 text-left font-semibold">{r.row}</th>
                {r.cells.map((c, i) => <td key={i} className={cn("px-3 py-1.5", c.changed ? "bg-brand-soft font-semibold text-foreground" : "text-muted-foreground")}>{c.t}{c.changed && <span className="ml-1 text-[9px] font-bold uppercase text-brand">changed</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-muted-foreground">Highlighted cells differ from the approved base; others are inherited. {pf === "Meta" ? "Meta uses campaign budget optimization across ad sets." : "TikTok budgets live at the ad group level; there is no campaign-level CBO here."} Read-only in P0 — ask UA Agent to change anything.</p>
    </div>
  );
}
export function ExecutionReviewCard({ p, onOpen, final }: { p: P0State; onOpen: () => void; final?: boolean }) {
  const [asking, setAsking] = useState(false);
  const k = f.execCounts(p);
  const bad = k.failed + k.blocked;
  const c = useCollapse(!final && f.completedSteps(p) > 5);
  if (final) return <LaunchAuthorization p={p} onOpen={onOpen} />;
  return (
    <CardShell kind="C3 · Execution Review" title="Freebeat — Batch Campaign Review" id="EX-902" version={`rev ${p.exec.revision}`} {...c}
      status={bad ? <Pill tone="danger">{bad} need retry</Pill> : p.exec.continued ? <Pill tone="success">Sent to launch checks</Pill> : <Pill tone="info">Drafts ready</Pill>}
      actions={asking ? (
        <InlineAsk placeholder="Instruction for UA Agent" initial="Move 10% of TikTok budget into Meta Reels placements." cta="Send to UA Agent" onCancel={() => setAsking(false)} onSend={(t) => { run((x) => f.modifyExec(x, t)); setAsking(false); }} />
      ) : <>
        <Button size="sm" variant="outline" onClick={onOpen}>Review Configuration</Button>
        {p.launch.status !== "approved" && <Button size="sm" variant="outline" onClick={() => setAsking(true)}>Ask UA to Modify</Button>}
        {bad > 0 && <Button size="sm" variant="outline" onClick={() => run((x) => f.retryExec(x))}><RotateCcw /> Retry failed ({bad})</Button>}
        {!p.exec.continued && <Button size="sm" variant="brand" disabled={bad > 0} title={bad ? "Retry failed items first" : undefined} onClick={() => run((x) => f.continueToChecks(x))}>Continue to Launch Checks</Button>}
      </>}>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        <KV k="Campaigns" v={k.campaigns} /><KV k="Ad sets / groups" v={k.adsets} /><KV k="Ads" v={k.ads} />
        <KV k="Created" v={<span className="text-success">{k.created}</span>} /><KV k="Failed" v={<span className={k.failed ? "text-danger" : ""}>{k.failed}</span>} /><KV k="Blocked" v={<span className={k.blocked ? "text-warning" : ""}>{k.blocked}</span>} />
      </div>
      <div className="mt-3 grid gap-1 text-xs sm:grid-cols-2">
        <div><span className="font-semibold">Accounts:</span> Meta act_8812 · TikTok 7301-FB</div>
        <div><span className="font-semibold">Budget exposure:</span> {money(f.TOTAL_CAP, 0)} cap (Meta {p.proposal.metaPct}% / TikTok {100 - p.proposal.metaPct}%)</div>
        <div><span className="font-semibold">Mode:</span> {MODES.find((m) => m.id === p.exec.mode)?.label}</div>
        <div><span className="font-semibold">Creatives:</span> {f.approvedCreatives(p).map((x) => `${x.id} v${f.cur(x).n}`).join(", ")}</div>
        {p.exec.attempts > 1 && <div className="text-muted-foreground">Attempt {p.exec.attempts} · successful items kept, no duplicates</div>}
        {p.exec.items.filter((i) => i.error).map((i) => <div key={i.id} className="text-danger sm:col-span-2">{i.platform} {i.name}: {i.error}</div>)}
        {p.launch.invalidated && <div className="text-warning sm:col-span-2">{p.launch.invalidated} — launch checks must run again.</div>}
        {p.exec.notes.map((n) => <div key={n} className="text-info sm:col-span-2">UA change applied: {n}</div>)}
      </div>
      <div className="mt-3"><ModeSwitch p={p} /></div>
    </CardShell>
  );
}

/* ---------------- C5 ActionRequiredCard ---------------- */
const CK: Record<CheckStatus, { label: string; tone: "success" | "danger" | "warning" | "info"; Icon: typeof Check; cls: string }> = {
  ready: { label: "Ready", tone: "success", Icon: CheckCircle2, cls: "text-success" },
  blocked: { label: "Blocked", tone: "danger", Icon: XCircle, cls: "text-danger" },
  pending: { label: "Pending Verification", tone: "warning", Icon: Clock, cls: "text-warning" },
  review: { label: "Under Review", tone: "info", Icon: ShieldAlert, cls: "text-info" },
};
export function ActionRequiredCard({ p }: { p: P0State }) {
  const pass = f.checksPass(p);
  const c = useCollapse(pass && f.completedSteps(p) > 6);
  if (!p.checks.length) return <div className="max-w-3xl rounded-xl border border-dashed border-ai-panel-border px-4 py-2 text-xs text-ai-panel-muted">These checks were invalidated by a configuration change. Continue to Launch Checks again from the batch review.</div>;
  return (
    <CardShell kind="C5 · Action Required" title="Freebeat — Pre-launch Checks" id="LC-55" version={`run ${p.checksRun}`} {...c}
      status={pass ? <Pill tone="success">All checks passed</Pill> : <Pill tone="danger">{p.checks.filter((x) => x.status !== "ready").length} not ready</Pill>}
      actions={!pass && <><Button size="sm" variant="brand" onClick={() => run((x) => f.recheck(x))}><RotateCcw /> Recheck</Button><span className="text-[11px] text-muted-foreground">Policy, financial and permission gates cannot be bypassed.</span></>}>
      <ul className="divide-y divide-border">
        {p.checks.map((ck) => { const m = CK[ck.status]; return (
          <li key={ck.id} className="py-2">
            <div className="flex items-center gap-2"><m.Icon className={cn("size-4", m.cls)} /><span className="font-medium">{ck.label}</span><Pill tone={m.tone} className="ml-auto text-[10px]">{m.label}</Pill></div>
            {ck.status !== "ready" && ck.issue && (
              <div className="mt-1.5 rounded-lg bg-muted p-2.5 text-xs">
                <div>{ck.issue}</div>
                <dl className="mt-1 grid gap-x-3 text-muted-foreground sm:grid-cols-3"><div>Affected: <span className="text-foreground">{ck.resources ?? "—"}</span></div><div>Owner: <span className="text-foreground">{ck.owner}</span></div><div>Next: <span className="text-foreground">{ck.next}</span></div></dl>
                {ck.status !== "review" && <div className="mt-2 flex flex-wrap gap-2">
                  {ck.resolved ? <Pill tone="info" className="text-[10px]">Fixed (demo) — recheck to verify</Pill> : <Button size="sm" variant="outline" onClick={() => run((x) => f.resolveIssue(x, ck.id))}><Wand2 /> Resolve Issue (demo)</Button>}
                  <Button size="sm" variant="ghost" disabled={ck.opsRequested} onClick={() => run((x) => f.requestOps(x, ck.id))}>{ck.opsRequested ? "Ops notified" : "Request Ops Help"}</Button>
                </div>}
              </div>
            )}
          </li>
        ); })}
      </ul>
    </CardShell>
  );
}

/* ---------------- Final launch authorization (C3 final section) ---------------- */
function LaunchAuthorization({ p, onOpen }: { p: P0State; onOpen: () => void }) {
  const g = f.canLaunch(p);
  const done = p.launch.status === "approved";
  const [asking, setAsking] = useState(false);
  if (!f.checksPass(p) && !done) return <div className="max-w-3xl rounded-xl border border-dashed border-ai-panel-border px-4 py-2 text-xs text-ai-panel-muted">Launch authorization withdrawn — configuration changed after checks passed.</div>;
  return (
    <CardShell kind="C3 · Launch Authorization" title="Freebeat — Final Launch Approval" id="EX-902" version={`rev ${p.exec.revision}`}
      status={done ? <Pill tone="success">Launch approved</Pill> : <Pill tone="warning">Admin approval required</Pill>}
      actions={done ? <span className="text-xs text-muted-foreground">Approved by {p.launch.approvedBy}. Binding: {p.launch.binding}</span> : asking ? (
        <InlineAsk placeholder="Instruction for UA Agent" initial="Lower the Meta daily budget by $20." cta="Send to UA Agent" onCancel={() => setAsking(false)} onSend={(t) => { run((x) => f.modifyExec(x, t)); setAsking(false); }} />
      ) : <>
        <Button size="sm" variant="brand" disabled={!g.ok} onClick={() => run((x) => f.approveLaunch(x))}><Lock /> Approve & Launch</Button>
        <Button size="sm" variant="outline" onClick={() => setAsking(true)}>Request Changes</Button>
        <Button size="sm" variant="ghost" onClick={onOpen}>Review Configuration</Button>
        <div className="ml-auto flex items-center gap-1 text-[11px]">
          <span className="text-muted-foreground">Demo role:</span>
          {(["admin", "member"] as const).map((r) => <button key={r} onClick={() => run((x) => { x.role = r; })} className={cn("rounded px-1.5 py-0.5 font-semibold", p.role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{r === "admin" ? "Maya · Admin" : "Member"}</button>)}
        </div>
        {!g.ok && g.reason && <div className="w-full text-xs text-warning" role="status">{g.reason}</div>}
      </>}>
      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div><span className="font-semibold">Configuration:</span> {MODES.find((m) => m.id === p.exec.mode)?.label} · {f.execCounts(p).campaigns} campaigns / {f.execCounts(p).ads} ads</div>
        <div><span className="font-semibold">Accounts:</span> Meta act_8812 · TikTok 7301-FB</div>
        <div><span className="font-semibold">Budget:</span> {money(f.DAILY, 0)}/day · spending cap {money(f.TOTAL_CAP, 0)}</div>
        <div><span className="font-semibold">Proposal:</span> v{p.proposal.approvedRevision} (approved for prep)</div>
        <div className="sm:col-span-2"><span className="font-semibold">Creative versions:</span> {f.approvedCreatives(p).map((x) => `${x.name} v${f.cur(x).n}`).join(" · ")}</div>
        <div className="sm:col-span-2 text-muted-foreground">This is the only approval that authorizes live spend. It is separate from plan approval and creative approval.</div>
      </div>
    </CardShell>
  );
}

/* ---------------- C4 TaskCampaignStatusCard ---------------- */
export function TaskCampaignStatusCard({ p }: { p: P0State }) {
  const l = p.lifecycle;
  const live = l.stage >= f.LIFECYCLE.length - 1;
  useEffect(() => {
    if (p.launch.status !== "approved" || l.failed || live) return;
    const t = setTimeout(() => run((x) => f.advanceLifecycle(x)), 2500);
    return () => clearTimeout(t);
  }, [l.stage, l.failed, live, p.launch.status]);
  const campaigns = p.exec.items.filter((i) => i.level === "campaign");
  const c = useCollapse(p.perf.shown);
  return (
    <CardShell kind="C4 · Task & Campaign Status" title="Freebeat — Launch Status" id="T-2001" {...c}
      status={l.failed ? <Pill tone="danger">Action needed</Pill> : live ? <Pill tone="success">Live Verified</Pill> : <Pill tone="info" dot>{f.LIFECYCLE[l.stage]}</Pill>}
      actions={<>
        {l.failed && <Button size="sm" variant="brand" onClick={() => run((x) => f.retryLifecycle(x))}><RotateCcw /> Retry failed step</Button>}
        {!l.failed && !live && <Button size="sm" variant="outline" onClick={() => run((x) => f.advanceLifecycle(x))}>Fetch platform update (simulated)</Button>}
        <Button size="sm" variant="ghost" asChild><Link to="/campaigns">Open Campaigns</Link></Button>
      </>}>
      <ol className="flex flex-wrap items-center gap-1 text-[11px]" aria-label="Lifecycle">
        {f.LIFECYCLE.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-1", i > l.stage && "opacity-45")} aria-current={i === l.stage ? "step" : undefined}>
            {i < l.stage || (i === l.stage && live) ? <CheckCircle2 className="size-3.5 text-success" /> : i === l.stage ? (l.failed ? <AlertTriangle className="size-3.5 text-danger" /> : <Loader2 className="size-3.5 animate-spin text-brand" />) : <Circle className="size-3.5" />}
            <span className={cn(i === l.stage && "font-semibold")}>{s}</span>{i < f.LIFECYCLE.length - 1 && <span className="text-muted-foreground">→</span>}
          </li>
        ))}
      </ol>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <KV k="Submitted / accepted" v={`${campaigns.length} / ${l.stage >= 3 ? campaigns.length : 0}`} />
        <KV k="Pending / failed ops" v={l.failed ? "1 failed" : live ? "0" : `${f.LIFECYCLE.length - 1 - l.stage} steps pending`} />
        <KV k="Last verified" v={l.lastVerified ?? "Not yet"} />
        <KV k="Responsible" v={<span className="inline-flex items-center gap-1"><Bot className="size-3" /> UA Agent</span>} />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{campaigns.map((x) => x.name).join(" · ")}{l.retries > 0 && ` · ${l.retries} retry, no duplicate campaigns`}</div>
      {l.failed && <div className="mt-2 rounded-lg bg-danger/10 p-2 text-xs text-danger">{l.failed}</div>}
    </CardShell>
  );
}

/* ---------------- C6 PerformanceCard ---------------- */
export function PerformanceCard({ p, onOpen }: { p: P0State; onOpen: () => void }) {
  const r = f.perfReport(p.proposal.metaPct);
  const target = p.brief.targetCpi ?? 2.3;
  return (
    <CardShell kind="C6 · Performance" title="Freebeat — Day-7 Performance Report" id="RP-7" status={<Demo />}
      actions={<>
        <Button size="sm" variant="outline" onClick={onOpen}>View Full Report</Button>
        <Button size="sm" variant="outline" disabled={p.perf.why} onClick={() => run((x) => f.askWhy(x))}><Sparkles /> Ask AI Why</Button>
        <Button size="sm" variant="outline" disabled={p.perf.next} onClick={() => run((x) => f.discussNext(x))}>Discuss Next Steps</Button>
      </>}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <KV k="Spend (7d)" v={money(r.spend)} /><KV k="Installs" v={r.installs.toLocaleString()} />
        <KV k="CPI vs target" v={<span className={r.cpi <= target ? "text-success" : "text-warning"}>{money(r.cpi)} / {money(target)}</span>} />
        <KV k="Clicks · CTR" v={`${r.clicks.toLocaleString()} · ${((r.clicks / r.impressions) * 100).toFixed(2)}%`} />
        <KV k="CPI change" v={`${(r.change * 100).toFixed(0)}% vs days 1–3`} />
      </div>
      <table className="mt-3 w-full text-xs"><thead className="text-left text-muted-foreground"><tr><th className="py-1">Platform</th><th className="text-right">Spend</th><th className="text-right">Installs</th><th className="text-right">CPI</th><th className="text-right">CTR</th></tr></thead>
        <tbody>{r.platforms.map((x) => <tr key={x.name} className="border-t border-border"><td className="py-1 font-medium">{x.name}</td><td className="text-right">{money(x.spend)}</td><td className="text-right">{x.installs}</td><td className="text-right">{money(x.cpi)}</td><td className="text-right">{(x.ctr * 100).toFixed(2)}%</td></tr>)}</tbody>
      </table>
      <div className="mt-2 text-xs"><span className="font-semibold">AI summary:</span> Meta is beating the CPI target; TikTok is above it. Next: test a stronger TikTok hook before shifting budget.</div>
      <div className="mt-1 text-[11px] text-muted-foreground">Source: Meta & TikTok reporting via MMP (simulated) · last sync 38 min ago · Limitations: installs attributed with 7-day click window; iOS SKAN data delayed up to 48h.</div>
    </CardShell>
  );
}
function FollowUp({ p }: { p: P0State }) {
  return (
    <div className="flex max-w-3xl flex-wrap items-center gap-2 rounded-xl border border-ai-panel-border bg-ai-panel-elevated px-4 py-3 text-sm">
      <Sparkles className="size-4 text-brand" /><span className="text-ai-panel-muted">Optional follow-up · new TikTok creator hook test</span>
      {p.perf.followUpTaskId ? <Pill tone="success" className="ml-auto">Task {p.perf.followUpTaskId} created</Pill> : <Button size="sm" variant="brand" className="ml-auto" onClick={() => actions.p0FollowUpTask()}>Create follow-up task</Button>}
    </div>
  );
}

/* ---------------- Card dispatcher ---------------- */
export function P0CardView({ card, p, open }: { card: P0Card; p: P0State; open: (k: DrawerKind) => void }) {
  switch (card) {
    case "brief": return <BriefSummary p={p} />;
    case "proposal": return <ProposalCard p={p} onOpen={() => open("proposal")} />;
    case "cbrief": return <CreativeBriefCard p={p} />;
    case "production": return <ProductionCard p={p} />;
    case "creative": return <CreativeReviewCard p={p} onOpen={() => open("gallery")} />;
    case "exec": return <ExecutionReviewCard p={p} onOpen={() => open("exec")} />;
    case "action": return <ActionRequiredCard p={p} />;
    case "launch": return <ExecutionReviewCard final p={p} onOpen={() => open("exec")} />;
    case "status": return <TaskCampaignStatusCard p={p} />;
    case "perf": return <PerformanceCard p={p} onOpen={() => open("report")} />;
    case "followup": return <FollowUp p={p} />;
  }
}

/* ---------------- Detail drawer ---------------- */
export function P0Drawer({ kind, onClose }: { kind: DrawerKind; onClose: () => void }) {
  const p = useDemo().p0;
  const title = { proposal: "Full Proposal", gallery: "Creative Gallery", exec: "Batch Configuration Review", report: "Day-7 Report" } as const;
  return (
    <Sheet open={!!kind} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {kind && <>
          <SheetHeader><SheetTitle>Freebeat — {title[kind]}</SheetTitle><SheetDescription>Simulated demo data · #freebeat-growth · T-2001</SheetDescription></SheetHeader>
          <div className="space-y-4 px-4 pb-8 text-sm">
            {kind === "proposal" && <>
              <ProposalCard p={p} onOpen={() => {}} />
              <div><div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Revision history</div>
                <ul className="space-y-1 text-xs">{p.proposal.history.map((h) => <li key={h.revision} className="flex gap-2"><span className="font-mono">v{h.revision}</span><span>Meta {h.metaPct}% / TikTok {100 - h.metaPct}%</span><span className="text-muted-foreground">— {h.note}</span>{p.proposal.approvedRevision === h.revision && <Pill tone="success" className="text-[9px]">Approved</Pill>}</li>)}</ul></div>
              <div className="text-xs"><div className="mb-1 font-semibold">Audience approach & assumptions</div><ul className="list-disc space-y-0.5 pl-4 text-muted-foreground"><li>Broad 18–34 with Advantage+ on Meta; interest + creator lookalike on TikTok.</li><li>Assumes app store pages are live in US/CA and SDK events fire within 24h.</li><li>Learning phase ~3 days; CPI estimates unreliable before day 4.</li></ul></div>
            </>}
            {kind === "gallery" && <Gallery p={p} />}
            {kind === "exec" && <ExecTableView p={p} />}
            {kind === "report" && <PerformanceCard p={p} onOpen={() => {}} />}
          </div>
        </>}
      </SheetContent>
    </Sheet>
  );
}

/* ---------------- Progress strip (Guided Demo controls) ---------------- */
export function P0Progress() {
  const p = useDemo().p0;
  const done = f.completedSteps(p);
  const finished = done >= 9;
  return (
    <div className="shrink-0 border-b border-ai-panel-border bg-ai-panel-elevated/60 px-3 py-2 md:px-6" aria-label="Guided demo progress">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        <span className="flex items-center gap-1 font-semibold text-brand"><Wand2 className="size-3.5" /> Guided Demo</span>
        <ol className="flex items-center gap-1" aria-label={`${done} of 9 steps complete`}>
          {f.STEP_LABELS.map((l, i) => <li key={l} title={l} className={cn("h-1.5 w-5 rounded-full", i < done ? "bg-success" : i === done && p.active ? "bg-brand" : "bg-ai-panel-border")} />)}
        </ol>
        <span className="min-w-0 truncate text-ai-panel-muted">{finished ? "Complete — Day-7 report delivered" : p.active ? `Step ${done + 1}/9 · ${f.STEP_LABELS[done]}` : "P0 card workflow · 9 steps"}</span>
        <div className="ml-auto flex gap-1">
          {!finished && <Button size="sm" variant="brand" className="h-7" onClick={() => run((x) => f.next(x))}>{p.active ? "Next Step" : "Start Demo"} →</Button>}
          {p.active && <Button size="sm" variant="ghost" className="h-7 text-ai-panel-muted hover:bg-ai-panel-elevated hover:text-ai-panel-foreground" onClick={() => actions.p0Reset()}><RotateCcw /> Reset Demo</Button>}
        </div>
      </div>
    </div>
  );
}

export type { P0Event };
