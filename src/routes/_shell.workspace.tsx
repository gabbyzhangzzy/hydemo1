import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bot, CheckCircle2, Circle, Loader2, Play, Send, Sparkles, User, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Empty, Pill, TaskPill } from "@/components/demo/bits";
import { LaunchPanel, ProposalCard, ReadinessPanel, ReportSummary } from "@/components/demo/campaign";
import { actions, MAIN_PROMPT, MAIN_TASK_ID, taskView, useDemo, type Msg } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/workspace")({
  head: () => pageHead("Agent Workspace", "Work with Clayton, the UA Agent and Creative on a client's campaigns in one conversation."),
  component: Workspace,
});

const WHO: Record<Msg["from"], { name: string; cls: string }> = {
  user: { name: "You", cls: "bg-brand text-brand-foreground" },
  clayton: { name: "Clayton · AI Team Lead", cls: "bg-primary text-primary-foreground" },
  ua: { name: "UA Agent", cls: "bg-info text-primary-foreground" },
  creative: { name: "Creative", cls: "bg-chart-3 text-primary-foreground" },
  system: { name: "System", cls: "bg-muted text-muted-foreground" },
  aiam: { name: "AI AM", cls: "bg-primary text-primary-foreground" },
};

function StagesCard({ onInspect }: { onInspect: () => void }) {
  const s = useDemo();
  const t = s.tasks.find((x) => x.id === MAIN_TASK_ID);
  if (!t) return null;
  return (
    <div className="rounded-xl border border-ai-panel-border bg-ai-panel-elevated p-4">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold">Task {t.id} · work log</span>
        <button className="font-semibold text-brand hover:underline" onClick={onInspect}>Inspect UA contribution →</button>
      </div>
      <ol className="space-y-2.5">
        {t.stages.map((st, i) => {
          const done = i < t.stage;
          const cur = i === t.stage && t.stage < t.stages.length;
          return (
            <li key={st.stage} className={cn("flex gap-3 text-sm", !done && !cur && "opacity-45")}>
              {done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : cur ? <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-brand" /> : <Circle className="mt-0.5 size-4 shrink-0" />}
              <div className="min-w-0">
                <div className="font-medium">{i + 1}. {st.stage} <span className="text-xs font-normal text-ai-panel-muted">· {st.agent}</span></div>
                {done && (
                  <div className="mt-1 grid gap-x-4 text-xs text-ai-panel-muted sm:grid-cols-2">
                    <span>Checked: {st.checked}</span>
                    <span>Tool: {st.tool}</span>
                    <span>Data: {st.data}</span>
                    <span className="text-ai-panel-foreground">Result: {st.result}</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Workspace() {
  const s = useDemo();
  const [input, setInput] = useState("");
  const [view, setView] = useState<"main" | "ua">("main");
  const end = useRef<HTMLDivElement>(null);
  const cid = s.biz === "direct" ? "direct" : s.clientId;
  const client = s.clients.find((c) => c.id === cid);
  const msgs = s.messages.filter((m) => m.clientId === cid);
  const main = s.tasks.find((t) => t.id === MAIN_TASK_ID);
  const clientTasks = s.tasks.filter((t) => t.clientId === cid);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [msgs.length]);

  if (cid === "all") {
    return (
      <div className="mx-auto max-w-lg py-16">
        <Empty title="Pick a client to open its workspace">
          <div className="mt-3 flex justify-center gap-2">
            {s.clients.filter((c) => c.biz === "bluefocus").map((c) => <Button key={c.id} size="sm" variant="outline" onClick={() => actions.setClient(c.id)}>{c.name}</Button>)}
          </div>
        </Empty>
      </div>
    );
  }

  const send = (text: string) => {
    if (!text.trim()) return;
    if (cid === "freebeat" && !main) actions.startMainTask();
    else actions.startGenericTask(cid, text.length > 48 ? text.slice(0, 48) + "…" : text, cid === "direct" ? "AI AM" : "UA Agent", text);
    setInput("");
  };
  const ua = main?.stages.filter((st, i) => st.agent !== "Clayton" && i < main.stage) ?? [];
  const agents = s.biz === "direct" ? [{ n: "AI AM", d: "Your account manager" }] : [{ n: "Clayton", d: "AI Team Lead" }, { n: "UA Agent", d: "Campaigns" }, { n: "Creative", d: s.creativeLevel === "limited" ? "Approved assets only" : "Enabled" }];

  return (
    <div className="mx-auto grid max-w-[1400px] gap-5 xl:grid-cols-[1fr_380px]">
      <div className="ai-surface flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-ai-panel-border px-5 py-3.5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-ai-panel-muted">Client workspace</div>
            <div className="font-display text-lg font-semibold">{client?.name}</div>
          </div>
          <div className="ml-auto flex flex-wrap gap-1.5">
            {agents.map((a) => (
              <button key={a.n} onClick={() => setView(a.n === "UA Agent" ? "ua" : "main")} className={cn("flex items-center gap-2 rounded-full border border-ai-panel-border px-3 py-1 text-xs", (view === "ua") === (a.n === "UA Agent") && "bg-ai-panel-elevated")}>
                <Bot className="size-3.5 text-brand" /> {a.n} <span className="text-ai-panel-muted">· {a.d}</span>
              </button>
            ))}
          </div>
        </div>

        {view === "ua" ? (
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <Button size="sm" variant="ai" onClick={() => setView("main")}><ArrowLeft /> Back to conversation with Clayton</Button>
            <h2 className="text-lg font-semibold">UA Agent — specialist view</h2>
            {ua.length === 0 ? <p className="text-sm text-ai-panel-muted">No UA contribution yet for this client.</p> : ua.map((st) => (
              <div key={st.stage} className="rounded-xl border border-ai-panel-border bg-ai-panel-elevated p-4 text-sm">
                <div className="mb-2 flex justify-between"><b>{st.stage}</b><Pill tone="muted">{st.agent}</Pill></div>
                <dl className="grid gap-1 text-xs text-ai-panel-muted sm:grid-cols-2">
                  <div>What was checked: <span className="text-ai-panel-foreground">{st.checked}</span></div>
                  <div>Tool / capability: <span className="text-ai-panel-foreground">{st.tool}</span></div>
                  <div>Relevant data: <span className="text-ai-panel-foreground">{st.data}</span></div>
                  <div>Result: <span className="text-ai-panel-foreground">{st.result}</span></div>
                  <div>Next action: <span className="text-ai-panel-foreground">{st.next}</span></div>
                </dl>
              </div>
            ))}
            <p className="text-xs text-ai-panel-muted">Work log shows checks, data, tools and results — not private model reasoning.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {msgs.length === 0 && (
              <div className="mx-auto max-w-lg py-10 text-center">
                <Sparkles className="mx-auto mb-3 size-8 text-brand" />
                <h2 className="text-xl font-semibold">{s.biz === "direct" ? "Ask your AI AM anything" : `What should the team do for ${client?.name}?`}</h2>
                <p className="mt-1 text-sm text-ai-panel-muted">Agent runs are deterministic simulations.</p>
                {cid === "freebeat" && (
                  <button onClick={() => send(MAIN_PROMPT)} className="mt-5 w-full rounded-xl border border-ai-panel-border bg-ai-panel-elevated p-4 text-left text-sm hover:border-brand">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand"><Wand2 className="size-3.5" /> Suggested</div>
                    {MAIN_PROMPT}
                  </button>
                )}
                {cid !== "freebeat" && (
                  <button onClick={() => send("Give me a quick performance review for this week")} className="mt-5 w-full rounded-xl border border-ai-panel-border bg-ai-panel-elevated p-4 text-left text-sm hover:border-brand">Give me a quick performance review for this week</button>
                )}
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={cn("flex gap-3", m.from === "user" && "flex-row-reverse")}>
                <div className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold", WHO[m.from].cls)}>{m.from === "user" ? <User className="size-4" /> : WHO[m.from].name[0]}</div>
                <div className={cn("min-w-0 max-w-[85%] space-y-2", m.from === "user" && "text-right")}>
                  <div className="text-[11px] text-ai-panel-muted">{WHO[m.from].name}</div>
                  <div className={cn("inline-block rounded-2xl px-4 py-2.5 text-left text-sm", m.from === "user" ? "bg-brand text-brand-foreground" : m.from === "system" ? "border border-dashed border-ai-panel-border text-ai-panel-muted" : "bg-ai-panel-elevated")}>{m.text}</div>
                  {m.card === "stages" && <StagesCard onInspect={() => setView("ua")} />}
                  {m.card === "proposal" && <ProposalCard compact dark />}
                  {m.card === "readiness" && <div className="rounded-xl bg-card p-3 text-card-foreground"><ReadinessPanel /></div>}
                  {m.card === "resume" && !s.resumed && <Button variant="brand" size="sm" onClick={() => actions.resumeTask()}><Play /> Resume T-1024</Button>}
                  {m.card === "report" && <ReportSummary />}
                </div>
              </div>
            ))}
            <div ref={end} />
          </div>
        )}
        <form className="flex gap-2 border-t border-ai-panel-border p-3" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <Textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)} placeholder={s.role === "ops" ? "Ops can view; messaging as agency user disabled" : `Message ${s.biz === "direct" ? "AI AM" : "Clayton"}…`} disabled={s.role === "ops"} className="min-h-10 resize-none border-ai-panel-border bg-ai-panel-elevated text-ai-panel-foreground placeholder:text-ai-panel-muted" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
          <Button type="submit" variant="brand" disabled={s.role === "ops"}><Send /></Button>
        </form>
      </div>

      <aside className="space-y-4">
        <div className="card-surface p-4">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold">Tasks for {client?.name} <Link to="/tasks" className="text-xs text-info">All →</Link></div>
          {clientTasks.length === 0 ? <div className="text-sm text-muted-foreground">No tasks yet.</div> : (
            <ul className="space-y-2">
              {clientTasks.map((t) => { const v = taskView(s, t); return (
                <li key={t.id} className="rounded-lg border border-border p-2.5 text-sm">
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] text-muted-foreground">{t.id}</span><TaskPill status={v.status} /></div>
                  <div className="mt-1 font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{v.detail}</div>
                  {t.id === MAIN_TASK_ID && s.pageAccess === "connected" && !s.resumed && <Button size="sm" className="mt-2" variant="brand" onClick={() => actions.resumeTask()}><Play /> Resume</Button>}
                </li>
              ); })}
            </ul>
          )}
        </div>
        {cid === "freebeat" && s.campaign && (
          <>
            <div className="card-surface p-4"><div className="mb-3 text-sm font-semibold">Account readiness</div><ReadinessPanel /></div>
            <div className="card-surface p-4"><div className="mb-3 text-sm font-semibold">Launch</div><LaunchPanel /></div>
          </>
        )}
        <div className="card-surface p-4 text-sm">
          <div className="mb-2 font-semibold">Context</div>
          <div className="text-muted-foreground">Brand: {s.brands[cid]?.name ?? "Not set"} ({s.brands[cid]?.status ?? "missing"})</div>
          <div className="text-muted-foreground">Market: {s.brands[cid]?.market ?? "—"}</div>
          <Link to="/brand" className="mt-2 inline-block text-xs font-semibold text-info">Brand & Tracking →</Link>
        </div>
      </aside>
    </div>
  );
}
