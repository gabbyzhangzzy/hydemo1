import { createFileRoute, Link } from "@tanstack/react-router";
import { Demo, Empty, PageHeader, Pill, Section } from "@/components/demo/bits";
import { LaunchPanel, ProposalCard, ReadinessPanel } from "@/components/demo/campaign";
import { STATIC_CAMPAIGNS, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { Button } from "@/components/ui/button";
import { CAMPAIGNS } from "@/lib/demo/analytics-data";
import { CreativePreview } from "@/components/demo/creative/preview";

export const Route = createFileRoute("/_shell/campaigns")({
  validateSearch: (s: Record<string, unknown>): { campaign?: string } => typeof s['campaign'] === "string" ? { campaign: s['campaign'] } : {},
  head: () => pageHead("Campaigns", "Campaign proposals, revisions, approvals and verified launch status."),
  component: Campaigns,
});

function Campaigns() {
  const s = useDemo();
  const search = Route.useSearch();
  const ids = s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.map((c) => c.id) : [s.clientId];
  const showFb = ids.includes("freebeat");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Marketing" title="Campaigns" sub="Proposals here are the same objects the agents work on in the workspace." />
      {search.campaign && CAMPAIGNS.some(c=>c.id===search.campaign&&ids.includes(c.clientId)) && <Section title={CAMPAIGNS.find(c=>c.id===search.campaign)?.name ?? "Campaign detail"} right={<Demo />}>
        <div className="mb-4 flex flex-wrap gap-3 text-sm"><Pill>{CAMPAIGNS.find(c=>c.id===search.campaign)?.status}</Pill><span>{CAMPAIGNS.find(c=>c.id===search.campaign)?.channel}</span><Button size="sm" variant="outline" asChild><Link to="/analytics">View Analytics</Link></Button></div>
        <h3 className="mb-3 text-sm font-semibold">Linked creative versions</h3><div className="grid gap-3 sm:grid-cols-3">{s.creativeUsage.filter(u=>u.campaignId===search.campaign).map((u,i)=>{const a=s.creativeAssets.find(a=>a.id===u.creativeId&&ids.includes(a.clientId));const v=a?.versions.find(v=>v.number===u.version);if(!a||!v)return null;return <div key={i} className="overflow-hidden rounded-lg border border-border"><CreativePreview version={v}/><div className="p-3"><Button variant="link" className="h-auto whitespace-normal p-0 text-left" asChild><Link to="/creative" search={{asset:a.id,version:v.number}}>{a.name} · V{v.number}</Link></Button><p className="mt-1 text-xs text-muted-foreground">{u.adId??'Assigned · not launched'}</p></div></div>;})}</div>
      </Section>}
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
      <Section title="Performance campaigns" right={<Demo />}><div className="divide-y divide-border">{CAMPAIGNS.filter(c=>ids.includes(c.clientId)).map(c=><div key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><Button variant="link" className="h-auto whitespace-normal p-0 text-left" asChild><Link to="/campaigns" search={{campaign:c.id}}>{c.name}</Link></Button><Pill>{c.status}</Pill></div>)}</div></Section>
    </div>
  );
}
