import { createFileRoute } from "@tanstack/react-router";
import { Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Demo, Empty, PageHeader, Phase, Pill, Section } from "@/components/demo/bits";
import { CREATIVES, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/creative")({
  head: () => pageHead("Creative Library", "Approved creative assets per client, used by the Creative capability."),
  component: Creative,
});

function Creative() {
  const s = useDemo();
  const ids = s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.map((c) => c.id) : [s.clientId];
  const list = CREATIVES.filter((a) => ids.includes(a.clientId));
  const briefs = s.briefs.filter((b) => ids.includes(b.clientId));
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader eyebrow="Marketing" title="Creative" sub={`Capability: ${s.creativeLevel === "limited" ? "approved existing assets only" : "enabled"}`} right={<><Demo /><Button variant="outline" onClick={() => toast("Bulk generation not enabled", { description: "P1 — requires Creative capability upgrade by Ops." })}>Generate new <Phase p="P1" /></Button></>} />
      {list.length === 0 ? <Empty title="No assets for this client" /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <div key={a.id} className="card-surface overflow-hidden">
              <div className="grid aspect-video place-items-center bg-secondary"><ImageIcon className="size-8 text-muted-foreground" /></div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] text-muted-foreground">{a.id}</span><Pill tone={a.status === "Approved" ? "success" : "warning"}>{a.status}</Pill></div>
                <div className="mt-1 font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.kind} · {s.clients.find((c) => c.id === a.clientId)?.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      {briefs.length > 0 && (
        <Section title="Creative briefs" right={<Demo />}>
          <div className="space-y-3">
            {briefs.map((b) => (
              <div key={b.id} className="rounded-xl border border-border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><span className="font-mono text-[11px] text-muted-foreground">{b.id}</span> <span className="font-semibold">{b.title}</span></div>
                  <div className="flex gap-1.5">
                    <Pill tone="info">Revision {b.revision}</Pill>
                    <Pill tone={b.status === "shared" ? "success" : b.status === "approved_internal" ? "primary" : "muted"}>{b.status === "shared" ? "Shared with client" : b.status === "approved_internal" ? "Approved internally" : "Internal draft"}</Pill>
                  </div>
                </div>
                <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm">{b.concepts.map((c) => <li key={c}>{c}</li>)}</ol>
                <p className="mt-2 text-xs text-muted-foreground">{b.note} · Linked task {b.taskId}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
