import { createFileRoute, Link } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Phase, Pill, Section } from "@/components/demo/bits";
import { useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/agents")({
  head: () => pageHead("Agents", "Clayton, UA and Creative — the AI teammates enabled for your organization."),
  component: Agents,
});

function Agents() {
  const s = useDemo();
  const list = s.biz === "direct"
    ? [{ n: "AI AM", r: "Your account manager", d: "Plans, runs and reports campaigns for you, pulling in specialists behind the scenes.", st: "Enabled" }]
    : [
        { n: "Clayton", r: "AI Team Lead", d: "Coordinates specialists, keeps context, and reports back. AM coordination is included by default.", st: "Included" },
        { n: "UA Agent", r: "Campaign specialist", d: "Analyzes performance, builds proposals, monitors pacing.", st: "Enabled" },
        { n: "Creative", r: "Creative capability", d: s.creativeLevel === "limited" ? "Uses approved existing assets. Bulk generation not enabled." : "Research & new creative generation enabled.", st: s.creativeLevel === "limited" ? "Limited" : "Enabled" },
      ];
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader eyebrow="AI Workspace" title="Agents" sub="Access is based on entitlements, not ad spend." right={<Button variant="outline" asChild><Link to="/capabilities">View entitlements</Link></Button>} />
      <div className="grid gap-4 md:grid-cols-3">
        {list.map((a) => (
          <div key={a.n} className="card-surface p-5">
            <div className="flex items-center justify-between"><div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Bot /></div><Pill tone="success">{a.st}</Pill></div>
            <div className="mt-3 font-display text-lg font-semibold">{a.n}</div>
            <div className="text-xs text-muted-foreground">{a.r}</div>
            <p className="mt-2 text-sm">{a.d}</p>
            <div className="mt-3 text-xs text-muted-foreground">Tasks: {s.tasks.filter((t) => t.agent.includes(a.n.split(" ")[0] ?? a.n)).length}</div>
            <Button size="sm" variant="outline" className="mt-3" asChild><Link to="/workspace">Open in workspace</Link></Button>
          </div>
        ))}
      </div>
      <Section title={<span className="flex items-center gap-2">Client-facing AI AM <Phase p="P2" /></span>}>
        <p className="text-sm text-muted-foreground">Not shown to End Clients by default. {s.clientAiAm ? "Preview enabled." : "Disabled."}</p>
      </Section>
    </div>
  );
}
