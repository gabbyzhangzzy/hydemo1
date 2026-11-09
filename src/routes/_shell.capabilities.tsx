import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Phase, Pill, Section } from "@/components/demo/bits";
import { actions, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/capabilities")({
  head: () => pageHead("Agent Capabilities", "Entitlements and usage configuration for AI agents — separate from ad spend."),
  component: Capabilities,
});

function Capabilities() {
  const s = useDemo();
  const rows: [string, string][] = [
    ["Customer type", s.biz === "direct" ? "Direct" : "Agency"],
    ["Service type", "Managed (demo)"],
    ["AM coordination", "Included"],
    ["UA capability", "Enabled"],
    ["Creative capability", s.creativeLevel === "limited" ? "Limited — approved assets" : "Enabled"],
    ["Usage allowance", "1,200 agent actions / month · 184 used (demo)"],
    ["Advertising spend", "Tracked separately"],
    ["Managed service fee", "Not configured in demo"],
    ["Internal agent cost", s.role === "ops" ? "$41.80 this month (Ops-only, demo)" : "Restricted to Ops"],
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow={<>Settings · <Phase p="P2" /></>} title="Agent Capabilities" sub="Advertising spend does not determine which agents a customer can access." />
      <Section title="Entitlements" right={<Pill>{s.role === "ops" ? "Ops can edit" : "Read-only"}</Pill>}>
        <dl className="divide-y divide-border text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-muted-foreground">{k}</dt><dd className="flex items-center gap-1.5 text-right font-medium">{v.startsWith("Restricted") && <Lock className="size-3.5" />}{v}</dd></div>
          ))}
        </dl>
        <div className="mt-4 rounded-lg border border-dashed border-border p-3 text-sm">
          <div className="mb-2 font-semibold">Ops capability management (simulated)</div>
          {s.role === "ops" ? (
            <div className="flex gap-2">
              <Button size="sm" variant={s.creativeLevel === "limited" ? "default" : "outline"} onClick={() => actions.setCreativeLevel("limited")}>Creative: Limited</Button>
              <Button size="sm" variant={s.creativeLevel === "enabled" ? "default" : "outline"} onClick={() => actions.setCreativeLevel("enabled")}>Creative: Enabled</Button>
            </div>
          ) : <p className="text-muted-foreground">Only Hellyeah Ops can change entitlements.</p>}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">No pricing plan shown here is a confirmed offering.</p>
      </Section>
      <Section title={<span className="flex items-center gap-2">Client-facing AI AM <Phase p="P2" /></span>}>
        <div className="flex items-center justify-between gap-4 text-sm">
          <p className="text-muted-foreground">Future capability preview. Explains published reports and routes requests to the human AM. Cannot change budgets or commit to strategy.</p>
          <Switch checked={s.clientAiAm} disabled={s.role !== "admin"} onCheckedChange={(v) => actions.setClientAiAm(v)} />
        </div>
        {s.role !== "admin" && <p className="mt-2 text-xs text-muted-foreground">Agency Admin only.</p>}
      </Section>
    </div>
  );
}
