import { createFileRoute, Link } from "@tanstack/react-router";
import { Demo, Empty, PageHeader, Pill, Section } from "@/components/demo/bits";
import { LaunchPanel, ProposalCard, ReadinessPanel } from "@/components/demo/campaign";
import { STATIC_CAMPAIGNS, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_shell/campaigns")({
  head: () => pageHead("Campaigns", "Campaign proposals, revisions, approvals and verified launch status."),
  component: Campaigns,
});

function Campaigns() {
  const s = useDemo();
  const ids = s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.map((c) => c.id) : [s.clientId];
  const showFb = ids.includes("freebeat");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Marketing" title="Campaigns" sub="Proposals here are the same objects the agents work on in the workspace." />
      {showFb && (
        s.campaign ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <ProposalCard />
              <Section title="Launch status" right={<Demo>Simulated launch</Demo>}><LaunchPanel /></Section>
              <Section title="Revision history">
                <ul className="divide-y divide-border text-sm">
                  {[...s.campaign.revisions].reverse().map((r) => (
                    <li key={r.rev} className="flex justify-between py-2"><span>Rev {r.rev} · {r.change}</span><span className="text-muted-foreground">{r.by}{s.campaign?.approvedRevision === r.rev && <Pill tone="success" className="ml-2">Approved</Pill>}</span></li>
                  ))}
                </ul>
              </Section>
            </div>
            <Section title="Account readiness"><ReadinessPanel /></Section>
          </div>
        ) : (
          <Empty title="No Freebeat proposal yet">
            Ask Clayton to prepare one. <Button size="sm" variant="outline" className="ml-2" asChild><Link to="/workspace">Open workspace</Link></Button>
          </Empty>
        )
      )}
      <Section title="Other campaigns" right={<Demo />}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Campaign</th><th>Platform</th><th>Status</th><th className="text-right">Spend</th><th className="text-right">CPM</th></tr></thead>
          <tbody className="divide-y divide-border">
            {STATIC_CAMPAIGNS.filter((c) => ids.includes(c.clientId)).map((c) => (
              <tr key={c.id}><td className="py-2.5 font-medium">{c.name}</td><td>{c.platform}</td><td><Pill>{c.status}</Pill></td><td className="text-right">${c.spend.toLocaleString()}</td><td className="text-right">{c.cpm ? `$${c.cpm.toFixed(2)}` : "—"}</td></tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}
