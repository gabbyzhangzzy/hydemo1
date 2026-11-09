import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Demo, Empty, Phase, Pill, Section, money } from "@/components/demo/bits";
import { actions, REPORT_METRICS, STATUS_FLOW, STATUS_LABEL, useDemo } from "@/lib/demo/store";
import { CreativePreview } from "@/components/demo/creative/preview";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/portal")({
  head: () => pageHead("Freebeat Client Portal", "Approved campaign status, published reports and requests for your BlueFocus account manager."),
  component: Portal,
});

const QA: [string, string][] = [
  ["How is the campaign doing?", "Per the published Day-1 update, the campaign reached 2,558 people at a $6.00 CPM. A full readout is scheduled after 7 days."],
  ["Can you raise the budget?", "I can't change budgets. I've drafted a request for your BlueFocus account manager, Maya Chen."],
];

function Portal() {
  const s = useDemo();
  const [contact, setContact] = useState(false);
  const [msg, setMsg] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  useEffect(() => { if (s.role === "client") actions.markCheck("c16"); }, [s.role]);
  const c = s.campaign;
  const visibleCampaign = c && STATUS_FLOW.indexOf(c.status) >= STATUS_FLOW.indexOf("approved");
  const m = REPORT_METRICS;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Freebeat · Managed by BlueFocus <Phase p="P1" /></div>
          <h1 className="text-2xl font-semibold">Your marketing at a glance</h1>
        </div>
        <Button variant="outline" onClick={() => setContact(true)}><Mail /> Contact your Account Manager</Button>
      </div>
      {s.role !== "client" && <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">Agency preview of what Freebeat sees. Switch role to “Freebeat End Client” to experience it directly.</div>}

      <Section title="Campaign" right={<Demo />}>
        {visibleCampaign ? (
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <div><div className="font-semibold">{c.name}</div><div className="text-muted-foreground">Meta · Awareness · United States · {money(c.dailyBudget)}/day</div></div>
            <Pill tone={c.status === "live_verified" ? "success" : "info"}>{c.status === "live_verified" ? "Live" : STATUS_LABEL[c.status] === "Approved" ? "Approved — launching soon" : "Launching"}</Pill>
          </div>
        ) : <Empty title="No approved campaigns yet">Your agency will share plans once approved.</Empty>}
      </Section>

      <Section title="Reports">
        {s.report.status === "published" ? (
          <div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              {[["Spend", money(m.spend)], ["Impressions", m.impressions.toLocaleString()], ["Reach", m.reach.toLocaleString()], ["CPM", money(m.cpm)], ["Frequency", m.frequency.toFixed(2)]].map(([k, v]) => <div key={k}><div className="text-xs text-muted-foreground">{k}</div><div className="font-semibold">{v}</div></div>)}
            </div>
            <p className="mt-3 rounded-lg bg-muted p-3 text-sm">{s.report.external}</p>
          </div>
        ) : <Empty title="No published reports yet" />}
        {s.perfReports.filter((r) => r.clientId === "freebeat" && r.status === "published").map((r) => (
          <div key={r.id} className="mt-4 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><span className="font-mono text-[11px] text-muted-foreground">{r.id}</span> <span className="text-sm font-semibold">{r.title}</span></div>
              <Pill tone="success">Published</Pill>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              {r.metrics.map((m2) => <div key={m2.label}><div className="text-xs text-muted-foreground">{m2.label}</div><div className="font-semibold">{m2.value}</div></div>)}
            </div>
            <p className="mt-3 rounded-lg bg-muted p-3 text-sm">{r.narrative}</p>
            {r.charts.length > 0 && <div className="mt-2 text-xs text-muted-foreground">Included charts: {r.charts.join(" · ")}</div>}
          </div>
        ))}
      </Section>

      <Section title="Approved creatives">
        <div className="grid gap-2 sm:grid-cols-3">
          {s.creativeAssets.filter(a=>a.clientId==="freebeat").flatMap(a=>a.versions.filter(v=>v.shared&&v.review==="Approved").map(v=><div key={`${a.id}-${v.number}`} className="overflow-hidden rounded-lg border border-border text-sm"><CreativePreview version={v}/><div className="space-y-2 p-3"><div className="font-medium">{a.name} · V{v.number}</div><div className="text-xs text-muted-foreground">{v.format} · {v.ratio} · Illustrative demo preview</div>{a.clientRequired&&<><Pill tone={v.clientApproved?'success':'warning'}>{v.clientApproved?'Client approved':'Awaiting your approval'}</Pill><Button size="sm" disabled={s.role!=="client"||v.clientApproved} onClick={()=>actions.clientApproveCreative(a.id,v.number)}>Approve selected version</Button></>}</div></div>))}
          {s.briefs.filter((b) => b.clientId === "freebeat" && b.status === "shared").map((b) => (
            <div key={b.id} className="rounded-lg border border-border p-3 text-sm"><div className="font-medium">{b.title}</div><div className="text-xs text-muted-foreground">Creative brief · Rev {b.revision} · {b.concepts.join(", ")}</div></div>
          ))}
        </div>
      </Section>

      <Section title="Pending actions for you">
        <ul className="space-y-2">
          {s.portalActions.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              <span className={a.done ? "text-muted-foreground line-through" : ""}>{a.text}</span>
              <Button size="sm" variant={a.done ? "ghost" : "outline"} onClick={() => actions.togglePortalAction(a.id)}>{a.done ? "Undo" : "Mark done"}</Button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={<span className="flex items-center gap-2">Client-facing AI AM <Phase p="P2" /></span>}>
        {s.clientAiAm ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Explains published reports, answers authorized status questions, and creates requests for your human AM. Cannot change budgets or commit to strategy.</p>
            <div className="flex flex-wrap gap-2">{QA.map(([q, a]) => <Button key={q} size="sm" variant="outline" onClick={() => { setAnswers((x) => [...x, `Q: ${q}\nA: ${a}`]); if (q.includes("budget")) actions.contactAm("Client asked about raising budget (via AI AM)"); }}><MessageCircle /> {q}</Button>)}</div>
            {answers.map((t, i) => <pre key={i} className="whitespace-pre-wrap rounded-lg bg-muted p-3 font-sans text-sm">{t}</pre>)}
          </div>
        ) : <p className="text-sm text-muted-foreground">Off by default. Your agency Admin can enable a future client-side assistant from Agent Capabilities.</p>}
      </Section>

      <Dialog open={contact} onOpenChange={setContact}>
        <DialogContent>
          <DialogHeader><DialogTitle>Message Maya Chen · BlueFocus</DialogTitle><DialogDescription>Delivered in-app to your agency (simulated, no email sent).</DialogDescription></DialogHeader>
          <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Your question or request" />
          <DialogFooter><Button disabled={!msg.trim()} onClick={() => { actions.contactAm(msg.trim()); setMsg(""); setContact(false); toast("Request sent to your Account Manager (simulated)"); }}>Send</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
