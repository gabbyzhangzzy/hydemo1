import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lock, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Empty, PageHeader, Pill, Section } from "@/components/demo/bits";
import { actions, useDemo, type CaseStatus } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/ops")({
  head: () => pageHead("Ops Queue", "Hellyeah Ops human handoff queue: authorization and account opening cases."),
  component: Ops,
});

const STATUSES: CaseStatus[] = ["Open", "In Progress", "Waiting for Customer", "Resolved", "Closed"];
const tone = (s: CaseStatus) => (s === "Open" ? "danger" : s === "Resolved" || s === "Closed" ? "success" : "warning") as "danger";

function Ops() {
  const s = useDemo();
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const c = s.cases.find((x) => x.id === openId);
  if (s.role !== "ops") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <Lock className="mx-auto mb-3 size-6 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Restricted to Hellyeah Ops</h1>
        <p className="mt-2 text-sm text-muted-foreground">Switch role to “Hellyeah Ops” in Prototype Demo Controls.</p>
        <Button className="mt-4" onClick={() => actions.setRole("ops")}>Switch to Hellyeah Ops</Button>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Hellyeah internal" title="Human Handoff · Ops Queue" sub="Routing: Meta authorization → Andy · Account opening → Anita." />
      <Section title={`Cases · ${s.cases.length}`}>
        {s.cases.length === 0 ? <Empty title="No cases" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Case ID</th><th>Client</th><th>Issue type</th><th>Owner</th><th>Related task</th><th>Status</th><th>Last updated</th><th /></tr></thead>
              <tbody className="divide-y divide-border">
                {s.cases.map((x) => (
                  <tr key={x.id}>
                    <td className="py-2.5 font-mono text-xs">{x.id}</td>
                    <td>{s.clients.find((k) => k.id === x.clientId)?.name}</td>
                    <td>{x.type}</td>
                    <td className="font-semibold">{x.owner}</td>
                    <td className="font-mono text-xs">{x.taskId}</td>
                    <td><Pill tone={tone(x.status)}>{x.status}</Pill></td>
                    <td className="text-muted-foreground">{x.updated}</td>
                    <td className="text-right"><Button size="sm" variant="outline" onClick={() => { setOpenId(x.id); setNote(""); actions.openCase(x.id); }}>Open</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <Sheet open={!!c} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {c && (
            <>
              <SheetHeader>
                <SheetTitle>{c.id} · {c.type}</SheetTitle>
                <SheetDescription>Owner {c.owner} · Task {c.taskId} · {s.clients.find((k) => k.id === c.clientId)?.name}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-4 pb-8 text-sm">
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Diagnostics</div>
                  <ul className="space-y-1.5">{c.diagnostics.map((d) => <li key={d} className="rounded-md bg-muted px-3 py-1.5">{d}</li>)}</ul>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><ShieldAlert className="size-3.5" /> Private customer conversation and credentials are not exposed to Ops.</div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</div>
                  <Select value={c.status} onValueChange={(v) => actions.updateCase(c.id, { status: v as CaseStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Resolution notes</div>
                  <ul className="mb-2 space-y-1">{c.notes.map((n, i) => <li key={i} className="rounded-md border border-border px-3 py-1.5">{n}</li>)}</ul>
                  <Textarea placeholder="e.g. Customer shared Page with BlueFocus BM via screen-share." value={note} onChange={(e) => setNote(e.target.value)} />
                  <Button size="sm" className="mt-2" disabled={!note.trim()} onClick={() => { actions.updateCase(c.id, {}, note); setNote(""); }}>Add note</Button>
                </div>
                {c.type === "Meta Page Authorization" && (
                  <div className="rounded-lg border border-dashed border-brand/40 bg-brand-soft/40 p-3">
                    <div className="mb-2 font-semibold">Authorization recheck (simulated)</div>
                    <p className="mb-2 text-xs text-muted-foreground">Resolving the case does not mark access connected. Verify explicitly.</p>
                    <Button size="sm" variant="brand" disabled={s.pageAccess === "connected"} onClick={() => actions.verifyConnection(c.id)}><RefreshCw /> {s.pageAccess === "connected" ? "Connection verified" : "Verify Connection"}</Button>
                    {c.recheck && <div className="mt-2 text-xs">{c.recheck}</div>}
                    <div className="mt-2 text-xs">Current Page access: <b>{s.pageAccess}</b></div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
