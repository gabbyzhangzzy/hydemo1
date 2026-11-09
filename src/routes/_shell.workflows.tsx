import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Phase, Pill } from "@/components/demo/bits";
import { actions, MAIN_TASK_ID, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/workflows")({
  head: () => pageHead("Workflows", "Reusable agent workflows: campaign launch, daily review, creative research, weekly reports."),
  component: Workflows,
});

function Workflows() {
  const s = useDemo();
  const nav = useNavigate();
  const cid = s.biz === "direct" ? "direct" : s.clientId === "all" ? "freebeat" : s.clientId;
  const name = s.clients.find((c) => c.id === cid)?.name;
  const wf = [
    { n: "New Campaign Launch", d: "Brief → proposal → readiness → approval → verified launch.", p: "P0" as const, run: () => { actions.setClient("freebeat"); if (!s.tasks.some((t) => t.id === MAIN_TASK_ID)) actions.startMainTask(); nav({ to: "/workspace" }); } },
    { n: "Daily Campaign Review", d: "UA checks pacing, frequency and anomalies every morning.", p: "P1" as const, run: () => { actions.startGenericTask(cid, "Daily campaign review", "UA Agent"); toast(`Daily review started for ${name}`); nav({ to: "/tasks" }); } },
    { n: "Creative Research", d: "Competitor ad library scan and hook ideas. No wallet needed.", p: "P1" as const, run: () => { actions.startGenericTask(cid, "Creative research", "Creative"); toast(`Creative research started for ${name}`); nav({ to: "/tasks" }); } },
    { n: "Weekly Client Report", d: "Agency-reviewed weekly summary shared to the client portal.", p: "P1" as const, planned: true },
  ];
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="AI Workspace" title="Workflows" sub={`Runs for: ${name}`} />
      <div className="grid gap-4 md:grid-cols-2">
        {wf.map((w) => (
          <div key={w.n} className="card-surface flex flex-col p-5">
            <div className="flex items-center justify-between"><div className="font-display text-lg font-semibold">{w.n}</div><Phase p={w.p} /></div>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{w.d}</p>
            <div className="mt-4">
              {w.planned ? <Pill>Planned — not runnable in this prototype</Pill> : <Button size="sm" variant={w.p === "P0" ? "brand" : "outline"} onClick={w.run} disabled={s.role === "client" || s.role === "ops"}><Play /> Run workflow</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
