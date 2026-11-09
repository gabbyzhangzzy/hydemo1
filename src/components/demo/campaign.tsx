import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Check, CheckCircle2, CircleDashed, Eye, Image as ImageIcon, LifeBuoy, Lock, Pencil, Rocket, RotateCcw, Send, ShieldCheck, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { actions, can, CREATIVES, isReady, readiness, REPORT_METRICS, STATUS_FLOW, STATUS_LABEL, useDemo, type CampaignStatus } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { Demo, money, Pill } from "./bits";

export function statusTone(s: CampaignStatus) {
  if (s === "live_verified") return "success" as const;
  if (s === "draft") return "muted" as const;
  if (s === "awaiting_approval") return "warning" as const;
  return "info" as const;
}

export function ProposalCard({ compact, dark }: { compact?: boolean; dark?: boolean }) {
  const s = useDemo();
  const c = s.campaign;
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [audOpen, setAudOpen] = useState(false);
  const [assetOpen, setAssetOpen] = useState(false);
  const [showReady, setShowReady] = useState(false);
  const [daily, setDaily] = useState("200");
  const [cap, setCap] = useState("2000");
  const [aud, setAud] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  if (!c) return null;
  const locked = STATUS_FLOW.indexOf(c.status) >= STATUS_FLOW.indexOf("submitted");
  const editable = can.editDraft(s.role) && !locked;
  const rows: [string, string][] = [
    ["Platform", c.platform],
    ["Objective", c.objective],
    ["Geography", c.geo],
    ["Daily budget", money(c.dailyBudget)],
    ["Total budget cap", money(c.totalCap)],
    ["Creative", `${c.assets} approved assets`],
    ["Client", "Freebeat"],
  ];
  return (
    <div className={cn("overflow-hidden rounded-xl border", dark ? "border-ai-panel-border bg-card text-card-foreground" : "card-surface")}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/60 px-4 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Campaign Proposal · Revision {c.revision}</div>
          <div className="font-display text-base font-semibold">{c.name}</div>
        </div>
        <div className="flex items-center gap-2">
          {c.approvedRevision && <Pill tone="success">Approved Rev {c.approvedRevision}</Pill>}
          <Pill tone={statusTone(c.status)}>{STATUS_LABEL[c.status]}</Pill>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3 text-sm sm:grid-cols-4">
        {rows.map(([k, v]) => (
          <div key={k}>
            <div className="text-[11px] text-muted-foreground">{k}</div>
            <div className="font-medium">{v}</div>
          </div>
        ))}
        {!compact && (
          <div className="col-span-2 sm:col-span-4">
            <div className="text-[11px] text-muted-foreground">Audience & placements</div>
            <div className="font-medium">{c.audience}</div>
            <div className="text-xs text-muted-foreground">{c.placements.join(" · ")}</div>
          </div>
        )}
      </div>
      {c.changesRequested && (
        <div className="mx-4 mb-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
          <b>Admin requested changes:</b> {c.changesRequested}
        </div>
      )}
      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
        <Button size="sm" variant="outline" disabled={!editable} onClick={() => { setDaily(String(c.dailyBudget)); setCap(String(c.totalCap)); setBudgetOpen(true); }}>
          <Pencil /> Edit budget
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setAud(c.audience); setAudOpen(true); }}>
          <Users /> Audience & placement
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAssetOpen(true)}>
          <ImageIcon /> Creative assets
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowReady((v) => !v)}>
          <ShieldCheck /> {showReady ? "Hide readiness" : "Check readiness"}
        </Button>
        {c.status === "draft" && (
          <Button size="sm" variant="brand" disabled={!can.editDraft(s.role)} onClick={() => actions.submitForApproval()}>
            <Send /> Submit for approval
          </Button>
        )}
        {!can.editDraft(s.role) && <span className="self-center text-xs text-muted-foreground">Read-only for {s.role === "ops" ? "Ops" : "this role"}.</span>}
        {locked && <span className="self-center text-xs text-muted-foreground"><Lock className="mr-1 inline size-3" />Locked after launch submission.</span>}
      </div>
      {c.status === "awaiting_approval" && (
        <div className="border-t border-border bg-warning/5 px-4 py-3">
          {can.approve(s.role) ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold">Admin review — you are approving exactly Revision {c.revision} ({money(c.dailyBudget)}/day, cap {money(c.totalCap)}, account act_DEMO_88231)</div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => actions.approve()}>
                  <Check /> Approve Rev {c.revision}
                </Button>
                <Input className="h-8 max-w-xs text-xs" placeholder="Change request note" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
                <Button size="sm" variant="outline" onClick={() => { actions.requestChanges(rejectNote); setRejectNote(""); }}>
                  <X /> Request changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground"><Lock className="mr-1 inline size-3" />Waiting for a BlueFocus Admin to approve Revision {c.revision}. Members cannot approve.</div>
          )}
        </div>
      )}
      {showReady && (
        <div className="border-t border-border p-4">
          <ReadinessPanel />
        </div>
      )}

      <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit budget</DialogTitle>
            <DialogDescription>Saving creates Revision {c.revision + 1}. Any existing approval will be invalidated.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Daily budget ($)</Label><Input type="number" value={daily} onChange={(e) => setDaily(e.target.value)} /></div>
            <div><Label>Total cap ($)</Label><Input type="number" value={cap} onChange={(e) => setCap(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                const d = Number(daily), t = Number(cap);
                if (!(d > 0) || !(t >= d)) { toast.error("Daily budget must be > 0 and cap ≥ daily."); return; }
                actions.editCampaign({ dailyBudget: d, totalCap: t }, `Budget ${money(d)}/day, cap ${money(t)}`);
                setBudgetOpen(false);
              }}
            >
              Save as new revision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={audOpen} onOpenChange={setAudOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audience & placement</DialogTitle>
            <DialogDescription>Recommended by UA Agent from Spring Launch learnings (demo).</DialogDescription>
          </DialogHeader>
          <Label>Audience</Label>
          <Textarea value={aud} onChange={(e) => setAud(e.target.value)} disabled={!editable} />
          <div className="text-xs text-muted-foreground">Placements: {c.placements.join(", ")}</div>
          <DialogFooter>
            {editable ? (
              <Button onClick={() => { if (aud !== c.audience) actions.editCampaign({ audience: aud }, "Audience updated"); setAudOpen(false); }}>Save</Button>
            ) : (
              <Button variant="outline" onClick={() => setAudOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={assetOpen} onOpenChange={setAssetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approved creative assets</DialogTitle>
            <DialogDescription>Only client-approved assets are used. New bulk generation is not enabled for this scenario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {CREATIVES.filter((a) => a.clientId === "freebeat" && a.status === "Approved").map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <div><div className="font-medium">{a.name}</div><div className="text-xs text-muted-foreground">{a.id} · {a.kind}</div></div>
                <Pill tone="success">Approved</Pill>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ReadinessPanel({ showActions = true }: { showActions?: boolean }) {
  const s = useDemo();
  const items = readiness(s);
  const [askOpen, setAskOpen] = useState(false);
  return (
    <div className="space-y-2">
      {items.map((r) => (
        <div key={r.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
          <div className="flex items-center gap-2.5 text-sm">
            {r.ok ? <CheckCircle2 className="size-4 text-success" /> : r.key === "page" && s.pageAccess === "pending_support" ? <CircleDashed className="size-4 text-warning" /> : <AlertTriangle className="size-4 text-danger" />}
            <span className="font-medium">{r.label}</span>
            <span className="text-muted-foreground">· {r.value}</span>
          </div>
          {showActions && r.key === "page" && s.pageAccess === "required" && can.editDraft(s.role) && (
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => toast("Authorization request drafted", { description: "Simulated: would open Meta Business permission flow. Access is NOT marked connected." })}>Request Authorization</Button>
              <Button size="sm" variant="ghost" onClick={() => setAskOpen(true)}>Ask Account Owner</Button>
              <Button size="sm" variant="brand" onClick={() => actions.requestHumanHelp()}>
                <LifeBuoy /> Request Human Help
              </Button>
            </div>
          )}
          {showActions && r.key === "page" && s.pageAccess === "pending_support" && (
            <Link to="/ops" className="text-xs font-semibold text-info hover:underline">CASE-2041 · Andy</Link>
          )}
          {showActions && r.key === "wallet" && !r.ok && (
            <Link to="/wallet" className="text-xs font-semibold text-info hover:underline">{can.fund(s.role) ? "Add funds →" : "Admin must fund →"}</Link>
          )}
          {showActions && r.key === "brand" && !r.ok && (
            <Link to="/brand" className="text-xs font-semibold text-info hover:underline">Confirm brand →</Link>
          )}
        </div>
      ))}
      <Dialog open={askOpen} onOpenChange={setAskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask colleague / account owner</DialogTitle>
            <DialogDescription>P1 preview — sends a simulated permission request to Freebeat's Page owner. Nothing is sent.</DialogDescription>
          </DialogHeader>
          <Textarea defaultValue="Hi! Please share the Freebeat Facebook Page with BlueFocus Business Manager (ADVERTISE permission)." />
          <DialogFooter>
            <Button onClick={() => { setAskOpen(false); toast("Simulated request drafted — not sent", { description: "For the P0 demo, use Request Human Help." }); }}>Save draft request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function LaunchPanel() {
  const s = useDemo();
  const c = s.campaign;
  if (!c) return null;
  const idx = STATUS_FLOW.indexOf(c.status);
  const ready = isReady(s);
  const approvedCurrent = c.status === "approved" && c.approvedRevision === c.revision;
  const reasons: string[] = [];
  if (!approvedCurrent && idx < 3) reasons.push(c.status === "awaiting_approval" ? "Awaiting Admin approval" : "Current revision is not approved");
  if (!ready) readiness(s).filter((r) => !r.ok).forEach((r) => reasons.push(`${r.label}: ${r.value}`));
  if (!can.launch(s.role)) reasons.push("Only a BlueFocus Admin can finalize launch");
  const canClick = approvedCurrent && ready && can.launch(s.role);
  const simulate = idx >= 3 && c.status !== "live_verified" && (s.role === "ops" || s.role === "admin");
  const next = STATUS_FLOW[idx + 1] ?? "live_verified";
  return (
    <div className="space-y-4">
      <ol className="grid grid-cols-4 gap-2 md:grid-cols-8">
        {STATUS_FLOW.map((st, i) => (
          <li key={st} className="flex flex-col gap-1.5">
            <div className={cn("h-1.5 rounded-full", i < idx ? "bg-success" : i === idx ? (st === "live_verified" ? "bg-success" : "bg-brand") : "bg-border")} />
            <span className={cn("text-[11px] leading-tight", i === idx ? "font-semibold text-foreground" : "text-muted-foreground")}>{STATUS_LABEL[st]}</span>
          </li>
        ))}
      </ol>
      {idx < 3 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="brand" disabled={!canClick && !s.launch.inFlight} onClick={() => actions.launch()}>
            <Rocket /> {s.launch.inFlight ? "Submitting… (click again to test)" : `Launch Revision ${c.revision}`}
          </Button>
          {s.launch.inFlight && <span className="text-xs text-muted-foreground">Request {s.launch.requestId} in flight</span>}
          {s.launch.dupBlocked > 0 && <Pill tone="info">{s.launch.dupBlocked} duplicate submit(s) blocked</Pill>}
        </div>
      )}
      {reasons.length > 0 && idx < 3 && !s.launch.inFlight && (
        <ul className="space-y-1 rounded-lg border border-danger/20 bg-danger/5 p-3 text-xs">
          <li className="font-semibold text-danger">Launch disabled</li>
          {reasons.map((r) => <li key={r}>• {r}</li>)}
        </ul>
      )}
      {s.launch.error && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-danger/25 bg-danger/5 p-3 text-sm">
          <span className="text-danger">{s.launch.error}</span>
          <Button size="sm" variant="outline" onClick={() => actions.retryLaunch()}><RotateCcw /> Dismiss & retry</Button>
        </div>
      )}
      {simulate && (
        <div className="rounded-lg border border-dashed border-brand/40 bg-brand-soft/40 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Demo>Simulated external steps</Demo> No real Meta API is called.</div>
          <div className="flex flex-wrap items-end gap-2">
            {next === "provider_accepted" && (
              <>
                <div><Label className="text-[11px]">Mock Meta Campaign ID</Label><Input className="h-8 w-44 text-xs" value={s.launch.providerId} onChange={(e) => actions.setLaunch({ providerId: e.target.value })} /></div>
                <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" checked={s.launch.failNext} onChange={(e) => actions.setLaunch({ failNext: e.target.checked })} /> Simulate provider error</label>
              </>
            )}
            {next === "live_verified" && (
              <Button size="sm" variant="outline" disabled={s.launch.firstSpend != null} onClick={() => actions.setLaunch({ firstSpend: 18.42 })}>
                {s.launch.firstSpend != null ? `First spend confirmed: ${money(s.launch.firstSpend)}` : "Confirm first spend $18.42 (demo)"}
              </Button>
            )}
            <Button size="sm" onClick={() => actions.advanceLaunch()}>Advance → {STATUS_LABEL[next]}</Button>
          </div>
        </div>
      )}
      {c.status === "live_verified" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-success/25 bg-success/5 p-3 text-sm">
          <CheckCircle2 className="size-4 text-success" /> Live Verified · Provider ID <b>{s.launch.providerId}</b> · First spend <b>{money(s.launch.firstSpend ?? 0)}</b> <Demo />
        </div>
      )}
    </div>
  );
}

export function ReportSummary() {
  const s = useDemo();
  if (s.report.status === "none") return null;
  const m = REPORT_METRICS;
  return (
    <div className="card-surface p-4 text-card-foreground">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-display text-sm font-semibold">Daily Performance Update · Day 1</div>
        <div className="flex gap-1.5"><Demo /><Pill tone={s.report.status === "published" ? "success" : "warning"}>{s.report.status === "published" ? "Published" : s.report.status === "ready" ? "Ready to Share" : "Internal draft"}</Pill></div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm sm:grid-cols-5">
        {[["Spend", money(m.spend)], ["Impressions", m.impressions.toLocaleString()], ["Reach", m.reach.toLocaleString()], ["CPM", money(m.cpm)], ["Frequency", m.frequency.toFixed(2)]].map(([k, v]) => (
          <div key={k}><div className="text-[11px] text-muted-foreground">{k}</div><div className="font-semibold">{v}</div></div>
        ))}
      </div>
      <Link to="/analytics" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-info hover:underline"><Eye className="size-3" /> Review & share in Analytics</Link>
    </div>
  );
}
