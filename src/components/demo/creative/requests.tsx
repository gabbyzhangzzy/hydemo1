import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ArrowUpDown, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Empty, Pill } from "@/components/demo/bits";
import { actions, useDemo, type State } from "@/lib/demo/store";
import { REQUEST_VIEWS, STATUS_TONE, SUMMARY_CARDS, requestStatus, type CreativeRequest, type JobStatus, type RequestStatus } from "@/lib/demo/creative-ops";
import { cn } from "@/lib/utils";

export function RequestStatusPill({ status }: { status: RequestStatus }) {
  return <Pill tone={STATUS_TONE[status]} dot={status === "In Production"}>{status}</Pill>;
}
const JOB_TONE: Record<JobStatus, "success" | "warning" | "info" | "danger" | "muted"> = { Queued: "muted", Running: "info", Succeeded: "success", Failed: "danger", Cancelled: "muted", "Outcome Unknown": "warning" };
export function JobStatusPill({ status }: { status: JobStatus }) {
  return <Pill tone={JOB_TONE[status]} dot={status === "Running"}>{status}</Pill>;
}
export function visibleClientIds(s: State) {
  return s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.filter((c) => c.biz === s.biz).map((c) => c.id) : [s.clientId];
}
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

type SortKey = "name" | "deadline" | "updated" | "status";
export function RequestsView({ onNew }: { onNew: () => void }) {
  const s = useDemo();
  const ids = visibleClientIds(s);
  const rows = useMemo(() => s.creativeRequests.filter((r) => ids.includes(r.clientId)).map((r) => ({ r, status: requestStatus(s, r) })), [s, ids]);
  const [view, setView] = useState("All Requests");
  const [card, setCard] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "updated", dir: -1 });
  const viewDef = REQUEST_VIEWS.find((v) => v.label === view);
  const cardDef = SUMMARY_CARDS.find((c) => c.label === card);
  const list = rows
    .filter(({ r, status: st }) =>
      (!viewDef?.statuses || viewDef.statuses.includes(st)) &&
      (!cardDef || cardDef.statuses.includes(st)) &&
      (status === "all" || st === status) &&
      (!query || `${r.id} ${r.name} ${r.brief.objective ?? ""} ${r.owner}`.toLowerCase().includes(query.toLowerCase())))
    .sort((a, b) => {
      const k = sort.key;
      const va = k === "name" ? a.r.name : k === "deadline" ? a.r.brief.deadline ?? "" : k === "status" ? a.status : a.r.updatedAt;
      const vb = k === "name" ? b.r.name : k === "deadline" ? b.r.brief.deadline ?? "" : k === "status" ? b.status : b.r.updatedAt;
      return va.localeCompare(vb) * sort.dir;
    });
  const clientName = (cid: string) => s.clients.find((c) => c.id === cid)?.name ?? cid;
  const SortBtn = ({ k, children }: { k: SortKey; children: string }) => (
    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((x) => ({ key: k, dir: x.key === k ? (x.dir === 1 ? -1 : 1) : 1 }))}>{children}<ArrowUpDown className="size-3" /></button>
  );
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SUMMARY_CARDS.map((c) => {
          const n = rows.filter((x) => c.statuses.includes(x.status)).length;
          const active = card === c.label;
          return (
            <button key={c.label} aria-pressed={active} onClick={() => setCard(active ? null : c.label)} className={cn("card-surface p-4 text-left transition-colors hover:border-brand/50", active && "border-brand ring-1 ring-brand/40")}>
              <div className="text-xs font-medium text-muted-foreground">{c.label}</div>
              <div className={cn("mt-1 font-display text-2xl font-semibold", c.label === "Failed / Blocked" && n > 0 && "text-danger")}>{n}</div>
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Request views">
          {REQUEST_VIEWS.map((v) => (
            <Button key={v.label} role="tab" aria-selected={view === v.label} variant="ghost" size="sm" className={cn("rounded-none border-b-2 py-4", view === v.label ? "border-brand text-foreground" : "border-transparent text-muted-foreground")} onClick={() => setView(v.label)}>{v.label}</Button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search requests" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search requests, owners or objectives" className="pl-9" /></div>
        <select aria-label="Request status filter" value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border border-input bg-card px-2 text-xs">
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_TONE) as RequestStatus[]).map((x) => <option key={x}>{x}</option>)}
        </select>
        {(card || status !== "all" || query) && <Button size="sm" variant="ghost" onClick={() => { setCard(null); setStatus("all"); setQuery(""); }}>Clear</Button>}
      </div>
      {list.length === 0 ? (
        <Empty title="No creative requests match">Start one with <Button size="sm" variant="outline" className="ml-1" onClick={onNew}><Plus />New Creative Request</Button></Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="p-3"><SortBtn k="name">Request Name</SortBtn></th><th className="p-3">Client / Brand</th><th className="p-3">Objective</th><th className="p-3">Channel</th><th className="p-3">Format</th><th className="p-3">Qty</th><th className="p-3">Owner</th><th className="p-3"><SortBtn k="status">Status</SortBtn></th><th className="p-3"><SortBtn k="deadline">Deadline</SortBtn></th><th className="p-3"><SortBtn k="updated">Last Updated</SortBtn></th><th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(({ r, status: st }) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="p-3"><Link to="/creative/requests/$requestId" params={{ requestId: r.id }} className="font-semibold text-foreground hover:text-brand">{r.name}</Link><div className="font-mono text-[11px] text-muted-foreground">{r.id} · {r.source}</div></td>
                  <td className="p-3">{clientName(r.clientId)}</td>
                  <td className="p-3">{r.brief.objective ?? <span className="text-warning">Missing</span>}</td>
                  <td className="p-3">{r.brief.platform ?? "—"}</td>
                  <td className="p-3">{r.brief.format ?? "—"}</td>
                  <td className="p-3">{r.brief.quantity ?? "—"}</td>
                  <td className="p-3">{r.owner}<div className="text-[11px] text-muted-foreground">by {r.requestedBy}</div></td>
                  <td className="p-3"><RequestStatusPill status={st} /></td>
                  <td className="p-3">{r.brief.deadline ?? <span className="text-warning">Missing</span>}</td>
                  <td className="p-3 text-muted-foreground">{fmtDate(r.updatedAt)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" asChild><Link to="/creative/requests/$requestId" params={{ requestId: r.id }}>Open</Link></Button>
                      {!r.submitted && <Button size="sm" variant="ghost" asChild><Link to="/creative/requests/$requestId" params={{ requestId: r.id }} search={{ tab: "brief", edit: true }}>Edit</Link></Button>}
                      {r.submitted && <Button size="sm" variant="ghost" asChild><Link to="/creative/requests/$requestId" params={{ requestId: r.id }} search={{ tab: "deliverables" }}>Assets</Link></Button>}
                      {r.taskId && <Button size="sm" variant="ghost" asChild><Link to="/tasks">{r.taskId}</Link></Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const EXAMPLES = [
  "Prepare three video concepts for Freebeat's next campaign.",
  "Two retargeting statics for Meta by Friday, avoid discount messaging.",
];
export function NewRequestDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useDemo();
  const navigate = useNavigate();
  const clients = s.clients.filter((c) => (s.biz === "direct" ? c.id === "direct" : c.biz === s.biz));
  const [cid, setCid] = useState(s.biz === "direct" ? "direct" : s.clientId === "all" ? "freebeat" : s.clientId);
  const [text, setText] = useState("");
  const editable = s.role === "admin" || s.role === "member";
  const owner = s.biz === "direct" ? "AI AM" : "Creative Agent";
  const submit = () => {
    const rid = actions.createCreativeRequest(cid, text, { source: "Creative page" });
    if (!rid) return;
    setText("");
    onClose();
    void navigate({ to: "/creative/requests/$requestId", params: { requestId: rid } });
  };
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100%-24px)] max-w-xl">
        <DialogHeader>
          <DialogTitle>New Creative Request</DialogTitle>
          <DialogDescription>Describe what you need in your own words. {owner} reads the client's brand context, asks only for missing essentials, and prepares a brief for you to confirm. Nothing is generated until you submit.</DialogDescription>
        </DialogHeader>
        <label className="text-xs font-semibold text-muted-foreground">Client / Brand
          <select aria-label="Request client" value={cid} onChange={(e) => setCid(e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-sm font-normal text-foreground">
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <Textarea aria-label="Describe your creative request" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Three 9:16 UGC videos for Meta retargeting, due Friday" />
        <div className="flex flex-wrap gap-2">{EXAMPLES.map((x) => <Button key={x} size="sm" variant="outline" className="h-auto whitespace-normal text-left text-xs" onClick={() => setText(x)}>{x}</Button>)}</div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="brand" disabled={!editable || !text.trim()} onClick={submit}><Sparkles />Start brief with {owner}</Button>
        </div>
        {!editable && <p className="text-xs text-muted-foreground">Only Admins and Members can create requests.</p>}
      </DialogContent>
    </Dialog>
  );
}
export type { CreativeRequest };
