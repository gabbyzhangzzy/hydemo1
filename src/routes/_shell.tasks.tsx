import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader, Section, TASK_LABEL, TaskPill } from "@/components/demo/bits";
import { actions, MAIN_TASK_ID, STATUS_LABEL, taskView, useDemo, type TaskStatus } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";

export const Route = createFileRoute("/_shell/tasks")({
  head: () => pageHead("Agent Tasks", "Every AI task by status, linked to client, agent, campaign and support case."),
  component: Tasks,
});

const ORDER: TaskStatus[] = ["running", "waiting_approval", "blocked", "completed", "failed"];

function Tasks() {
  const s = useDemo();
  const hasMain = s.tasks.some((t) => t.id === MAIN_TASK_ID);
  useEffect(() => { if (hasMain) actions.markCheck("c17"); }, [hasMain]);
  const ids = s.biz === "direct" ? ["direct"] : s.clientId === "all" ? s.clients.filter((c) => c.biz === "bluefocus").map((c) => c.id) : [s.clientId];
  const rows = s.tasks.filter((t) => ids.includes(t.clientId)).map((t) => ({ t, v: taskView(s, t) }));
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader eyebrow="AI Workspace" title="Tasks" sub="Status is shared with the workspace, Slack and Mobile previews." />
      {rows.length === 0 && <Empty title="No tasks for this client yet" />}
      {ORDER.map((st) => {
        const list = rows.filter((r) => r.v.status === st);
        if (!list.length) return null;
        return (
          <Section key={st} title={`${TASK_LABEL[st]} · ${list.length}`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr><th className="pb-2">Task</th><th>Client</th><th>Agent</th><th>Campaign</th><th>Result</th><th>Case</th><th /></tr></thead>
                <tbody className="divide-y divide-border">
                  {list.map(({ t, v }) => (
                    <tr key={t.id} className="align-top">
                      <td className="py-2.5"><div className="font-mono text-[11px] text-muted-foreground">{t.id}</div><div className="font-medium">{t.title}</div></td>
                      <td>{s.clients.find((c) => c.id === t.clientId)?.name}</td>
                      <td>{t.agent}</td>
                      <td>{t.campaignId && s.campaign ? <Link to="/campaigns" className="text-info">{STATUS_LABEL[s.campaign.status]}</Link> : "—"}</td>
                      <td className="max-w-[240px] text-xs text-muted-foreground">{v.detail}</td>
                      <td>{t.caseId ? <Link to="/ops" className="text-info">{t.caseId}</Link> : "—"}</td>
                      <td className="text-right">
                        <TaskPill status={v.status} />
                        {t.status === "failed" && <Button size="sm" variant="outline" className="ml-2" onClick={() => actions.retryTask(t.id)}>Retry</Button>}
                        {t.id === MAIN_TASK_ID && <Button size="sm" variant="ghost" className="ml-1" asChild onClick={() => actions.setClient("freebeat")}><Link to="/workspace">Open</Link></Button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        );
      })}
    </div>
  );
}
