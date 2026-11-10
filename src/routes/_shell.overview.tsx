import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Bot, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader, Phase, Pill, Section, Stat, TaskPill } from "@/components/demo/bits";
import { statusTone } from "@/components/demo/campaign";
import { actions, readiness, STATIC_CAMPAIGNS, STATUS_LABEL, taskView, useDemo } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/overview")({
  head: () => pageHead("Agency Overview", "Clients, campaigns, running AI tasks, approvals and blockers across your agency."),
  component: Overview,
});

function Overview() {
  const s = useDemo();
  const ids = s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.filter((c) => c.biz === "bluefocus").map((c) => c.id) : [s.clientId];
  const tasks = s.tasks.filter((t) => ids.includes(t.clientId)).map((t) => ({ t, v: taskView(s, t) }));
  const fbLive = s.campaign?.status === "live_verified";
  const active = STATIC_CAMPAIGNS.filter((c) => ids.includes(c.clientId) && c.status.startsWith("Live")).length + (ids.includes("freebeat") && fbLive ? 1 : 0);
  const approvals = s.campaign?.status === "awaiting_approval" && ids.includes("freebeat") ? 1 : 0;
  const blockers = ids.includes("freebeat") && s.campaign ? readiness(s).filter((r) => !r.ok) : [];
  const caseBlockers = s.cases.filter((c) => ids.includes(c.clientId) && !["Resolved", "Closed"].includes(c.status));
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        eyebrow={<>Home · <Phase p="P0" /></>}
        title={s.biz === "direct" ? "Northwind Coffee" : s.clientId === "all" ? "All Clients · Agency portfolio" : "Good afternoon, BlueFocus"}
        sub={s.biz === "direct" ? "Your AI AM handles campaigns and creative for you." : s.clientId === "all" ? "Aggregated view across your authorized clients, with per-client breakdowns." : "What your AI team and accounts need from you today."}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Current clients" value={s.biz === "direct" ? 1 : s.clients.filter((c) => c.biz === "bluefocus").length} />
        <Stat label="Active campaigns" value={active} hint="Demo data" />
        <Stat label="Running tasks" value={tasks.filter((x) => x.v.status === "running").length} />
        <Stat label="Approvals" value={approvals} tone={approvals ? "brand" : undefined} />
        <Stat label="Blockers" value={blockers.length + caseBlockers.length} tone={blockers.length ? "danger" : undefined} />
      </div>

      {s.biz === "bluefocus" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {s.clients.filter((c) => c.biz === "bluefocus").map((c) => {
            const ct = s.tasks.filter((t) => t.clientId === c.id);
            const camp = c.id === "freebeat" && s.campaign ? `${s.campaign.name} · ${STATUS_LABEL[s.campaign.status]}` : STATIC_CAMPAIGNS.find((x) => x.clientId === c.id)?.name ?? "No campaigns yet";
            return (
              <div key={c.id} className="card-surface p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-lg font-semibold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.industry}</div>
                  </div>
                  <Pill tone={s.clientId === c.id ? "brand" : "muted"}>{s.clientId === c.id ? "Selected" : c.tagline}</Pill>
                </div>
                <div className="mt-3 text-sm">{camp}</div>
                <div className="mt-1 text-xs text-muted-foreground">{ct.length} task(s) · {s.brands[c.id]?.status === "confirmed" ? "Brand confirmed" : s.brands[c.id] ? "Brand draft" : "No brand yet"}</div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" asChild onClick={() => actions.setClient(c.id)}><Link to="/workspace"><MessageSquare /> Workspace</Link></Button>
                  <Button size="sm" variant="ghost" onClick={() => actions.setClient(c.id)}>Set as current</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Section title="Recent agent activity" className="lg:col-span-2" right={<Link to="/tasks" className="text-xs font-semibold text-info">All tasks →</Link>}>
          {tasks.length === 0 ? <Empty title="No agent activity yet">Start a task in the Agent Workspace.</Empty> : (
            <ul className="divide-y divide-border">
              {tasks.slice(0, 6).map(({ t, v }) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <div className="flex items-center gap-2.5"><Bot className="size-4 text-primary" /><span className="font-mono text-xs text-muted-foreground">{t.id}</span>{t.title}</div>
                  <div className="flex items-center gap-2"><span className="hidden text-xs text-muted-foreground md:inline">{v.detail}</span><TaskPill status={v.status} /></div>
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Account & authorization blockers">
          {blockers.length + caseBlockers.length === 0 ? <Empty title="No blockers" /> : (
            <ul className="space-y-2 text-sm">
              {blockers.map((b) => (<li key={b.key} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 text-danger" /><span><b>Freebeat</b> · {b.label}: {b.value}</span></li>))}
              {caseBlockers.map((c) => (<li key={c.id} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 text-warning" /><span>{c.id} · {c.type} · Owner {c.owner} · {c.status}</span></li>))}
            </ul>
          )}
        </Section>
        <Section title="Approvals requiring attention">
          {approvals ? (
            <div className="text-sm">
              <div className="font-medium">{s.campaign?.name}</div>
              <div className="text-xs text-muted-foreground">Revision {s.campaign?.revision} · ${s.campaign?.dailyBudget}/day</div>
              <Button size="sm" className="mt-3" asChild><Link to="/campaigns">Review</Link></Button>
            </div>
          ) : <Empty title="Nothing waiting" />}
        </Section>
        <Section title="Campaign status">
          <ul className="space-y-2 text-sm">
            {ids.includes("freebeat") && s.campaign && <li className="flex justify-between gap-2"><span>{s.campaign.name}</span><Pill tone={statusTone(s.campaign.status)}>{STATUS_LABEL[s.campaign.status]}</Pill></li>}
            {STATIC_CAMPAIGNS.filter((c) => ids.includes(c.clientId)).map((c) => <li key={c.id} className="flex justify-between gap-2"><span>{c.name}</span><Pill>{c.status}</Pill></li>)}
          </ul>
        </Section>
        <Section title="Latest client updates">
          <ul className="space-y-2 text-sm">
            {s.report.status === "published" && <li>Daily Performance Update published to Freebeat portal.</li>}
            {s.portalRequests.map((r, i) => <li key={i}>Freebeat asked: “{r}”</li>)}
            {s.report.status !== "published" && s.portalRequests.length === 0 && <li className="text-muted-foreground">No client-facing updates shared yet.</li>}
          </ul>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Phase p="P1" /> Portfolio analytics across clients</div>
        </Section>
      </div>
    </div>
  );
}
