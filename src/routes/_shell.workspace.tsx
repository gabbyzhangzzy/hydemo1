import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AtSign, BarChart3, Bot, Check, CheckCircle2, ChevronDown, Circle, Hash, Layers, ListChecks, Loader2, Lock, MoreHorizontal, Play, RotateCcw, Send, Slack, Smartphone, Sparkles, User, Users, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Demo, Phase, Pill, TaskPill } from "@/components/demo/bits";
import { DemoControls, MobileNav, Notifications, useShellUtils } from "@/components/demo/shell";
import { LaunchPanel, ProposalCard, ReadinessPanel, ReportSummary } from "@/components/demo/campaign";
import { actions, AI_TEAM, can, channelName, MAIN_PROMPT, MAIN_TASK_ID, MENTIONABLES, PEOPLE, personFor, taskView, UA_ANALYSIS, useDemo, type Msg, type MsgFrom, type PersonId, type State, type Task } from "@/lib/demo/store";
import { pageHead } from "@/lib/demo/head";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/workspace")({
  head: () => pageHead("Agent Workspace", "A shared agency channel where BlueFocus humans and AI teammates collaborate on a client's campaigns."),
  component: Workspace,
});

const WHO: Record<MsgFrom, { name: string; cls: string; ai?: boolean }> = {
  user: { name: "You", cls: "bg-brand text-brand-foreground" },
  sarah: { name: "Sarah · Account Manager", cls: "bg-brand text-brand-foreground" },
  alex: { name: "Alex · Media Buyer", cls: "bg-info text-primary-foreground" },
  david: { name: "David · Creative Strategist", cls: "bg-chart-3 text-primary-foreground" },
  bfa: { name: "Maya Chen · Admin", cls: "bg-primary text-primary-foreground" },
  clayton: { name: "Clayton · AI Team Lead", cls: "bg-primary text-primary-foreground", ai: true },
  ua: { name: "UA Agent", cls: "bg-info text-primary-foreground", ai: true },
  creative: { name: "Creative Agent", cls: "bg-chart-3 text-primary-foreground", ai: true },
  system: { name: "System", cls: "bg-muted text-muted-foreground" },
  aiam: { name: "AI AM", cls: "bg-primary text-primary-foreground", ai: true },
};

const MENTION_RE = /@(Clayton|UA Agent|Creative Agent|Sarah|Alex|David|BlueFocus Admin)/g;

function RichText({ text }: { text: string }) {
  const parts = text.split(MENTION_RE);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} className="rounded bg-brand/20 px-1 font-semibold text-brand">@{p}</span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Channel switcher (replaces the permanent channel column)            */
/* ------------------------------------------------------------------ */
function ChannelSwitcher({ s, cid }: { s: State; cid: string }) {
  const channels = s.clients.filter((c) => c.biz === "bluefocus");
  const client = s.clients.find((c) => c.id === cid);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 text-left outline-none hover:bg-ai-panel-elevated focus-visible:ring-2 focus-visible:ring-brand" aria-label="Switch channel">
        <div className="min-w-0">
          <div className="flex items-center gap-1 font-display text-base font-semibold"><Hash className="size-4 shrink-0 text-brand" /><span className="truncate">{channelName(s, cid)}</span><ChevronDown className="size-4 shrink-0 text-ai-panel-muted" /></div>
          <div className="flex items-center gap-1 truncate text-[11px] text-ai-panel-muted"><Lock className="size-3 shrink-0" /> Internal · BlueFocus / {client?.name}</div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>BlueFocus client channels</DropdownMenuLabel>
        {channels.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => actions.setClient(c.id)}>
            <Hash /> <span className="truncate">{channelName(s, c.id)}</span>
            <span className="text-[10px] text-muted-foreground">{c.name}</span>
            {cid === c.id && <Check className="ml-auto" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem disabled><Users /> Agency Overview <Phase p="P2" /></DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground">Each channel is a separate client workspace. Messages, tasks and data never mix.</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------------------------------------------ */
/* Members popover + person switcher                                   */
/* ------------------------------------------------------------------ */
function AvatarStack() {
  return (
    <div className="flex -space-x-1.5">
      {PEOPLE.slice(0, 3).map((p) => (
        <div key={p.id} title={p.full} className="grid size-7 place-items-center rounded-full border-2 border-ai-panel bg-brand text-[10px] font-bold text-brand-foreground">{p.initials}</div>
      ))}
      {AI_TEAM.map((a) => (
        <div key={a.id} title={a.name} className="grid size-7 place-items-center rounded-full border-2 border-ai-panel bg-ai-panel-elevated text-[10px] font-bold text-brand"><Bot className="size-3.5" /></div>
      ))}
    </div>
  );
}

function MembersPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-ai-panel-elevated" aria-label="Members"><AvatarStack /></button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Agency team</div>
        <ul className="space-y-1.5">
          {PEOPLE.map((p) => (
            <li key={p.id} className="flex items-center gap-2.5 text-sm">
              <span className="grid size-7 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">{p.initials}</span>
              <span className="font-medium">{p.full}</span>
              <span className="text-xs text-muted-foreground">· {p.title}</span>
              {p.role === "admin" && <Pill tone="primary" className="ml-auto text-[9px]">Admin</Pill>}
            </li>
          ))}
        </ul>
        <div className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">AI team</div>
        <ul className="space-y-1.5">
          {AI_TEAM.map((a) => (
            <li key={a.id} className="flex items-center gap-2.5 text-sm">
              <span className="grid size-7 place-items-center rounded-full bg-ai-panel-elevated text-brand"><Bot className="size-3.5" /></span>
              <span className="font-medium">{a.name}</span>
              <span className="text-xs text-muted-foreground">· {a.title}</span>
              <Pill tone="brand" className="ml-auto text-[9px]">AI</Pill>
            </li>
          ))}
        </ul>
        <p className="mt-3 border-t border-border pt-2 text-[10px] text-muted-foreground">Internal BlueFocus workspace — Freebeat's team is not here. The client sees only the Client Portal.</p>
      </PopoverContent>
    </Popover>
  );
}

function PersonSwitcher({ s }: { s: State }) {
  const p = personFor(s);
  if (!p) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="ghost" className="text-ai-panel-muted hover:bg-ai-panel-elevated hover:text-ai-panel-foreground" title="Change who you're posting as">
          <span className="grid size-6 place-items-center rounded-full bg-brand text-[10px] font-bold text-brand-foreground">{p.initials}</span>
          <span className="hidden md:inline">{p.name}</span> <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>View & post as…</DropdownMenuLabel>
        {PEOPLE.map((x) => (
          <DropdownMenuItem key={x.id} onClick={() => actions.setPerson(x.id)}>
            <span className="grid size-6 place-items-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground">{x.initials}</span>
            <span>{x.full} <span className="text-xs text-muted-foreground">· {x.title}</span></span>
            {s.person === x.id && <CheckCircle2 className="ml-auto size-4 text-success" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground">Same shared conversation and tasks — only the sender and permissions change.</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ------------------------------------------------------------------ */
/* Guided collaboration demo                                           */
/* ------------------------------------------------------------------ */
const GUIDED_LABELS = [
  "Start as Sarah",
  "Clayton delegates to UA",
  "View UA Analysis",
  "Clayton delegates to Creative",
  "View Creative Brief",
  "Reply as David",
  "Ask as Alex",
  "View Clayton's Summary",
  "Approve Internal Work",
];

function GuidedDemo({ s, cid }: { s: State; cid: string }) {
  if (cid !== "freebeat" || !can.agency(s.role)) return null;
  const step = s.collab.step;
  const done = step >= 9;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost" className="text-brand hover:bg-ai-panel-elevated hover:text-brand" title="Guided collaboration demo">
          <Wand2 /> <span className="hidden xl:inline">Guided demo</span> <span className="text-[10px] text-ai-panel-muted">{Math.min(step, 9)}/9</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <div className="text-sm font-semibold">Experience Agency + AI Collaboration</div>
        <ol className="space-y-1 text-xs">
          {GUIDED_LABELS.map((l, i) => (
            <li key={l} className={cn("flex items-center gap-2", i < step ? "text-muted-foreground line-through" : i === step ? "font-semibold" : "text-muted-foreground")}>
              {i < step ? <CheckCircle2 className="size-3.5 text-success" /> : <Circle className={cn("size-3.5", i === step && "text-brand")} />} {l}
            </li>
          ))}
        </ol>
        {!done ? (
          <Button size="sm" variant="brand" className="w-full" onClick={() => actions.collabNext()}>{GUIDED_LABELS[step]} →</Button>
        ) : (
          <Pill tone="success">Demo complete — deliverable approved internally</Pill>
        )}
        {step > 0 && <Button size="sm" variant="ghost" className="w-full" onClick={() => actions.resetCollab()}><RotateCcw /> Reset Collaboration Demo</Button>}
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* Message cards                                                       */
/* ------------------------------------------------------------------ */
function ProgressCard({ text, onOpenTask }: { text: string; onOpenTask: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-ai-panel-border bg-ai-panel-elevated px-4 py-3 text-sm">
      <Loader2 className="size-4 animate-spin text-brand" />
      <span className="text-ai-panel-muted">{text}</span>
      <button onClick={onOpenTask} className="ml-auto text-xs font-semibold text-brand hover:underline">Task drawer →</button>
    </div>
  );
}

function AnalysisCard({ onOpenTask, onFollowUp }: { onOpenTask: () => void; onFollowUp: () => void }) {
  const a = UA_ANALYSIS;
  return (
    <div className="overflow-hidden rounded-xl border border-ai-panel-border bg-card text-card-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
        <div className="text-sm font-semibold">Performance Analysis · {a.window}</div>
        <div className="flex gap-1.5"><Demo /><Pill tone="muted" className="text-[9px]">{a.freshness}</Pill></div>
      </div>
      <div className="grid grid-cols-3 gap-2 px-4 py-3 text-sm">
        {[["Spend", `$${a.spend.toLocaleString()}`], ["Blended CPM", `$${a.cpm.toFixed(2)}`], ["Feed frequency", a.feedFreq.toFixed(1)]].map(([k, v]) => (
          <div key={k}><div className="text-[11px] text-muted-foreground">{k}</div><div className="font-semibold">{v}</div></div>
        ))}
      </div>
      <table className="w-full border-t border-border text-xs">
        <tbody>
          {a.rows.map((r, i) => (
            <tr key={i} className={cn("border-b border-border last:border-0", i === 0 && "text-muted-foreground")}>
              {r.map((c, j) => <td key={j} className={cn("px-4 py-1.5", j > 0 && "text-right")}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2.5">
        <Button size="sm" variant="outline" onClick={onOpenTask}>View Detailed Analysis</Button>
        <Button size="sm" variant="outline" asChild><Link to="/analytics">Open Analytics</Link></Button>
        <Button size="sm" variant="ghost" onClick={onFollowUp}><AtSign /> Ask Follow-up</Button>
      </div>
    </div>
  );
}

function BriefCard() {
  const s = useDemo();
  const [open, setOpen] = useState(false);
  const b = s.briefs.find((x) => x.taskId === MAIN_TASK_ID);
  if (!b) return null;
  return (
    <div className="overflow-hidden rounded-xl border border-ai-panel-border bg-card text-card-foreground">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
        <div className="text-sm font-semibold">{b.id} · {b.title}</div>
        <div className="flex gap-1.5">
          <Pill tone="info">Revision {b.revision}</Pill>
          <Pill tone={b.status === "shared" ? "success" : b.status === "approved_internal" ? "primary" : "muted"}>{b.status === "shared" ? "Shared with client" : b.status === "approved_internal" ? "Approved internally" : "Internal draft"}</Pill>
        </div>
      </div>
      <div className="px-4 py-3 text-sm">
        <ol className="list-decimal space-y-1 pl-4">
          {b.concepts.map((c) => <li key={c}>{c}</li>)}
        </ol>
        {open && <p className="mt-2 rounded-lg bg-muted p-2.5 text-xs text-muted-foreground">{b.note}</p>}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2.5">
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>{open ? "Hide" : "View"} Concepts</Button>
        <Button size="sm" variant="outline" asChild><Link to="/creative">Open Creative</Link></Button>
      </div>
    </div>
  );
}

function SummaryCard({ onOpenTask }: { onOpenTask: () => void }) {
  const s = useDemo();
  const t = s.tasks.find((x) => x.id === MAIN_TASK_ID);
  const b = s.briefs.find((x) => x.taskId === MAIN_TASK_ID);
  const approved = t?.status === "completed";
  return (
    <div className="overflow-hidden rounded-xl border border-ai-panel-border bg-card text-card-foreground">
      <div className="border-b border-border bg-secondary/60 px-4 py-2.5 text-sm font-semibold">T-1024 Summary · Review & Creative Planning</div>
      <div className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-2">
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-success">Completed</div>
          <ul className="space-y-1 text-xs">
            <li>✓ Performance review (UA Agent)</li>
            <li>✓ Creative recommendations (Creative Agent)</li>
            <li>✓ Creative brief revision (Rev {b?.revision ?? 1})</li>
          </ul>
        </div>
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-warning">Needs human review</div>
          <ul className="space-y-1 text-xs">
            <li>• Final creative selection</li>
            <li>• Whether to proceed with the next campaign test</li>
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border px-4 py-2.5">
        <Button size="sm" variant="outline" onClick={onOpenTask}>Review Deliverables</Button>
        {!s.campaign && <Button size="sm" variant="outline" disabled={!can.editDraft(s.role)} onClick={() => actions.createCampaignDraft()}>Create Campaign Draft</Button>}
        {s.campaign && <Button size="sm" variant="outline" asChild><Link to="/campaigns">Open Campaign Draft</Link></Button>}
        <Button size="sm" variant="ghost" onClick={() => actions.setPerson("sarah")}>Assign to Human</Button>
        {!approved && <Button size="sm" variant="brand" onClick={() => actions.approveInternalDeliverable()}><CheckCircle2 /> Approve Internal Work</Button>}
        {approved && b?.status === "approved_internal" && (
          <Button size="sm" variant="brand" onClick={() => actions.shareDeliverable()}><Send /> Share with Client</Button>
        )}
        {approved && b?.status === "shared" && <Pill tone="success">Shared with Freebeat · visible in Client Portal</Pill>}
      </div>
      {approved && b?.status === "approved_internal" && (
        <div className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Internal approval does not publish anything to the end client. “Share with Client” is a separate, explicit action.</div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Task drawer                                                         */
/* ------------------------------------------------------------------ */
function TaskDrawer({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const s = useDemo();
  const t = s.tasks.find((x) => x.id === taskId);
  const v = t ? taskView(s, t) : null;
  const brief = s.briefs.find((b) => b.taskId === taskId);
  const agents = t ? [...new Set(t.stages.map((st) => st.agent))] : [];
  return (
    <Sheet open={!!t} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {t && v && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">{t.id} <TaskPill status={v.status} /></SheetTitle>
              <SheetDescription>{t.title}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 px-4 pb-8 text-sm">
              {s.creativeRequests.filter((r) => r.taskId === t.id).map((r) => (
                <Button key={r.id} size="sm" variant="outline" asChild><Link to="/creative/requests/$requestId" params={{ requestId: r.id }}>Open Creative Request {r.id}</Link></Button>
              ))}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border p-3 text-xs">
                <div><dt className="text-muted-foreground">Client</dt><dd className="font-medium">{s.clients.find((c) => c.id === t.clientId)?.name}</dd></div>
                <div><dt className="text-muted-foreground">Task owner</dt><dd className="font-medium">{t.agent}</dd></div>
                <div><dt className="text-muted-foreground">Assigned agents</dt><dd className="font-medium">{agents.join(", ")}</dd></div>
                <div><dt className="text-muted-foreground">Created</dt><dd className="font-medium">{t.createdAt}</dd></div>
                <div className="col-span-2"><dt className="text-muted-foreground">Status detail</dt><dd className="font-medium">{v.detail}</dd></div>
              </dl>

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Work steps</div>
                <ol className="space-y-2.5">
                  {t.stages.map((st, i) => {
                    const doneStep = i < t.stage;
                    const cur = i === t.stage && t.status === "running";
                    return (
                      <li key={st.stage} className={cn("flex gap-2.5", !doneStep && !cur && "opacity-45")}>
                        {doneStep ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> : cur ? <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-brand" /> : <Circle className="mt-0.5 size-4 shrink-0" />}
                        <div className="min-w-0">
                          <div className="font-medium">{i + 1}. {st.stage} <span className="text-xs font-normal text-muted-foreground">· {st.agent}</span></div>
                          {doneStep && (
                            <dl className="mt-1 grid gap-x-4 text-xs text-muted-foreground sm:grid-cols-2">
                              <div>Checked: <span className="text-foreground">{st.checked}</span></div>
                              <div>Tool: <span className="text-foreground">{st.tool}</span></div>
                              <div>Data source: <span className="text-foreground">{st.data}</span></div>
                              <div>Result: <span className="text-foreground">{st.result}</span></div>
                            </dl>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-2 text-[10px] text-muted-foreground">Work log shows checks, data, tools and results — never private model reasoning.</p>
              </div>

              {v.status === "blocked" && (
                <div className="rounded-xl border border-danger/25 bg-danger/5 p-3 text-xs">
                  <div className="mb-1 font-semibold text-danger">Blocking issue</div>
                  {v.detail}
                  {t.caseId && <div className="mt-1">Support case: <Link to="/ops" className="font-semibold text-info" onClick={onClose}>{t.caseId} · Andy</Link></div>}
                </div>
              )}
              {v.status === "waiting_approval" && (
                <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs">
                  <div className="mb-1 font-semibold text-warning">Approval requirement</div>
                  {s.campaign?.status === "awaiting_approval" ? `A BlueFocus Admin must approve campaign Revision ${s.campaign.revision}.` : "A human must review and approve the internal deliverables."}
                </div>
              )}

              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Linked objects</div>
                <div className="flex flex-wrap gap-2">
                  {t.campaignId && s.campaign && <Button size="sm" variant="outline" asChild onClick={onClose}><Link to="/campaigns">Campaign {t.campaignId}</Link></Button>}
                  {brief && <Button size="sm" variant="outline" asChild onClick={onClose}><Link to="/creative">Brief {brief.id} · Rev {brief.revision}</Link></Button>}
                  {s.report.status !== "none" && t.id === MAIN_TASK_ID && <Button size="sm" variant="outline" asChild onClick={onClose}><Link to="/analytics">Report · {s.report.status}</Link></Button>}
                  {t.caseId && <Button size="sm" variant="outline" asChild onClick={onClose}><Link to="/ops">Case {t.caseId}</Link></Button>}
                  {!t.campaignId && !brief && !t.caseId && <span className="text-xs text-muted-foreground">None yet.</span>}
                </div>
              </div>

              {t.status === "failed" && <Button size="sm" variant="outline" onClick={() => actions.retryTask(t.id)}>Retry task</Button>}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */
/* Message list                                                        */
/* ------------------------------------------------------------------ */
const SUGGESTIONS = [
  { icon: BarChart3, label: "Review campaign performance", text: "@UA Agent give me a quick performance review for this week" },
  { icon: Layers, label: "Plan a new campaign", text: "@Clayton plan a new campaign test for next month" },
  { icon: Sparkles, label: "Request new creatives", text: "@Creative Agent, prepare three video concepts for Freebeat's next campaign." },
  { icon: Sparkles, label: "Research creative opportunities", text: "@Creative Agent research creative opportunities based on our top ads" },
];

/** Direct Customer starters — natural language only, never specialist @mentions. */
const DIRECT_SUGGESTIONS = [
  { icon: BarChart3, label: "Review performance", text: "How did my campaigns perform over the last seven days?" },
  { icon: Layers, label: "Plan a campaign", text: "Help me plan a new campaign for my business." },
  { icon: Sparkles, label: "Creative ideas", text: "What new creative ideas should we test?" },
  { icon: ListChecks, label: "Check campaign status", text: "What's happening with my current campaigns?" },
];

function EmptyState({ s, cid }: { s: State; cid: string }) {
  const name = s.clients.find((c) => c.id === cid)?.name ?? "your";
  const direct = cid === "direct";
  const brandMissing = !direct && s.brands[cid]?.status !== "confirmed";
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-14 text-center md:py-20">
      <div className="grid size-12 place-items-center rounded-2xl bg-brand/15 text-brand"><Sparkles className="size-6" /></div>
      <h2 className="mt-4 font-display text-2xl font-semibold md:text-3xl">{direct ? `Welcome to ${name}'s AI Account Manager` : `Welcome to ${name}'s Growth Workspace`}</h2>
      <p className="mt-2 text-sm text-ai-panel-muted">{direct ? "One AI teammate for your marketing — ask for campaigns, creative or a performance check." : "Work together with Clayton, your AI specialists and the rest of your team."}</p>
      <div className="mt-8 grid w-full gap-2.5 text-left">
        {cid === "freebeat" && (
          <button onClick={() => { actions.setPerson("sarah"); actions.sendChannelMessage(cid, MAIN_PROMPT); }} className="rounded-xl border border-brand/40 bg-brand/10 p-4 text-sm transition-colors hover:border-brand">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand"><Wand2 className="size-3.5" /> Suggested · posted as Sarah</div>
            {MAIN_PROMPT}
          </button>
        )}
        <div className={cn("grid gap-2.5", direct ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
          {(direct ? DIRECT_SUGGESTIONS : SUGGESTIONS).map((x) => (
            <button key={x.label} onClick={() => actions.sendChannelMessage(cid, x.text)} className="rounded-xl border border-ai-panel-border bg-ai-panel-elevated/60 p-3.5 text-sm transition-colors hover:border-brand">
              <x.icon className="mb-2 size-4 text-brand" />
              <div className="font-medium">{x.label}</div>
            </button>
          ))}
        </div>
      </div>
      {brandMissing && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs">
          Brand context isn't confirmed yet — agents will work with limited context. <Link to="/brand" className="font-semibold text-brand hover:underline">Set up brand →</Link>
        </div>
      )}
    </div>
  );
}

function MessageList({ s, cid, msgs, onOpenTask, onFollowUp }: { s: State; cid: string; msgs: Msg[]; onOpenTask: (id: string) => void; onFollowUp: () => void }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs.length]);
  const openTask = (m: Msg) => onOpenTask(m.taskId ?? MAIN_TASK_ID);
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      {msgs.length === 0 ? <EmptyState s={s} cid={cid} /> : (
        <div className="mx-auto max-w-4xl space-y-1 px-4 py-6 md:px-8">
          {msgs.map((m) => {
            const who = WHO[m.from];
            const isMe = m.from === personFor(s)?.id || m.from === "user";
            const [name, role] = who.name.split(" · ");
            const system = m.from === "system";
            return (
              <div key={m.id} className="group flex gap-3 rounded-xl px-2 py-2.5 hover:bg-ai-panel-elevated/30">
                <div className={cn("grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold", who.cls, isMe && "ring-2 ring-brand/60 ring-offset-2 ring-offset-ai-panel")}>
                  {who.ai ? <Bot className="size-4" /> : m.from === "user" ? <User className="size-4" /> : (PEOPLE.find((p) => p.id === m.from)?.initials ?? who.name[0])}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-1.5 text-xs">
                    <span className="font-semibold text-ai-panel-foreground">{name}{isMe && <span className="font-normal text-ai-panel-muted"> (you)</span>}</span>
                    {role && <span className="text-ai-panel-muted">{role}</span>}
                    {who.ai && <span className="rounded bg-brand/15 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">AI</span>}
                    <span className="text-[10px] text-ai-panel-muted/70">{m.at}</span>
                    {m.taskId && <button onClick={() => openTask(m)} className="text-[11px] font-semibold text-brand hover:underline">{m.taskId}</button>}
                  </div>
                  <div className={cn("max-w-2xl text-sm leading-relaxed", system ? "rounded-lg border border-dashed border-ai-panel-border px-3 py-2 text-ai-panel-muted" : "text-ai-panel-foreground/95")}>
                    <RichText text={m.text} />
                    {m.requestId && <Button variant="link" size="sm" className="h-auto whitespace-normal px-0 text-brand" asChild><Link to="/creative/requests/$requestId" params={{ requestId: m.requestId }}>Open Creative Request {m.requestId}</Link></Button>}
                    {m.creativeId && <Button variant="link" size="sm" className="h-auto whitespace-normal px-0 text-brand" asChild><Link to="/creative" search={{asset:m.creativeId,...(m.creativeVersion?{version:m.creativeVersion}:{})}}>Open creative · V{m.creativeVersion}</Link></Button>}
                  </div>
                  {m.card === "progress" && <div className="max-w-2xl"><ProgressCard text={m.text} onOpenTask={() => openTask(m)} /></div>}
                  {m.card === "analysis" && <AnalysisCard onOpenTask={() => openTask(m)} onFollowUp={onFollowUp} />}
                  {m.card === "brief" && <BriefCard />}
                  {m.card === "summary" && <SummaryCard onOpenTask={() => openTask(m)} />}
                  {m.card === "stages" && <Button size="sm" variant="ai" onClick={() => openTask(m)}>Open work log in task drawer →</Button>}
                  {m.card === "proposal" && <ProposalCard compact dark />}
                  {m.card === "readiness" && <div className="rounded-xl border-l-4 border-danger bg-card p-3 text-card-foreground"><ReadinessPanel /></div>}
                  {m.card === "resume" && !s.resumed && <Button variant="brand" size="sm" onClick={() => actions.resumeTask()}><Play /> Resume T-1024</Button>}
                  {m.card === "report" && <ReportSummary />}
                </div>
              </div>
            );
          })}
          <div ref={end} />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* On-demand drawers (replace the permanent right column)              */
/* ------------------------------------------------------------------ */
function TasksSheet({ s, cid, open, onOpenChange, onOpenTask }: { s: State; cid: string; open: boolean; onOpenChange: (o: boolean) => void; onOpenTask: (id: string) => void }) {
  const client = s.clients.find((c) => c.id === cid);
  const clientTasks = s.tasks.filter((t) => t.clientId === cid);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Tasks · {client?.name}</SheetTitle>
          <SheetDescription><Link to="/tasks" className="text-info">Open all tasks →</Link></SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-8">
          {clientTasks.length === 0 ? <div className="py-6 text-center text-sm text-muted-foreground">No tasks yet. Mention @Clayton in the channel to start one.</div> : (
            <ul className="space-y-2">
              {clientTasks.map((t) => { const v = taskView(s, t); return (
                <li key={t.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-[11px] text-muted-foreground">{t.id}</span><TaskPill status={v.status} /></div>
                  <div className="mt-1 font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{v.detail}</div>
                  <div className="mt-2 flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => { onOpenChange(false); onOpenTask(t.id); }}>Open task</Button>
                    {t.id === MAIN_TASK_ID && s.pageAccess === "connected" && !s.resumed && <Button size="sm" variant="brand" onClick={() => actions.resumeTask()}><Play /> Resume</Button>}
                  </div>
                </li>
              ); })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ContextSheet({ s, cid, open, onOpenChange }: { s: State; cid: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const brand = s.brands[cid];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Context · {s.clients.find((c) => c.id === cid)?.name}</SheetTitle>
          <SheetDescription>Brand, account readiness and campaign status the agents use.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-8 text-sm">
          <div className="rounded-xl border border-border p-4">
            <div className="mb-2 font-semibold">Brand context</div>
            {brand ? (
              <>
                <div className="text-muted-foreground">Brand: {brand.name} ({brand.status})</div>
                <div className="text-muted-foreground">Market: {brand.market ?? "—"}</div>
              </>
            ) : <div className="text-muted-foreground">No brand set up yet.</div>}
            <Link to="/brand" className="mt-2 inline-block text-xs font-semibold text-info">Brand & Tracking →</Link>
          </div>
          {cid === "freebeat" && s.campaign ? (
            <>
              <div className="rounded-xl border border-border p-4"><div className="mb-3 font-semibold">Account readiness</div><ReadinessPanel /></div>
              <div className="rounded-xl border border-border p-4"><div className="mb-3 font-semibold">Launch</div><LaunchPanel /></div>
              <Button size="sm" variant="outline" asChild><Link to="/campaigns">Open Campaign →</Link></Button>
            </>
          ) : <div className="text-xs text-muted-foreground">Account readiness and launch status appear once a campaign proposal exists.</div>}
        </div>
      </SheetContent>
    </Sheet>
  );
}

const hdrBtn = "text-ai-panel-muted hover:bg-ai-panel-elevated hover:text-ai-panel-foreground";

function OverflowMenu() {
  const u = useShellUtils();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className={hdrBtn} aria-label="More"><MoreHorizontal /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Prototype previews</DropdownMenuLabel>
        <DropdownMenuItem onClick={u.openSlack}><Slack /> Slack preview</DropdownMenuItem>
        <DropdownMenuItem onClick={u.openMobile}><Smartphone /> Mobile preview</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={u.openScenario}>Current scenario</DropdownMenuItem>
        <DropdownMenuItem onClick={u.openChecks}>Acceptance checks</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/tasks"><ListChecks /> All tasks</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/analytics"><BarChart3 /> Analytics</Link></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Immersive, chat-first frame shared by the agency channel and the direct 1:1 chat. */
function ImmersiveFrame({ s, cid, title, extra }: { s: State; cid: string; title: React.ReactNode; extra?: React.ReactNode }) {
  const [drawer, setDrawer] = useState<string | null>(null);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(false);
  const followUpRef = useRef<() => void>(() => {});
  const u = useShellUtils();
  const msgs = s.messages.filter((m) => m.clientId === cid);
  const taskCount = s.tasks.filter((t) => t.clientId === cid).length;
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-ai-panel text-ai-panel-foreground">
      <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-ai-panel-border px-2 md:px-4">
        <MobileNav className="border-ai-panel-border bg-transparent text-ai-panel-foreground hover:bg-ai-panel-elevated" />
        {title}
        <div className="ml-auto flex items-center gap-0.5">
          {extra}
          <Button size="sm" variant="ghost" className={hdrBtn} onClick={() => setTasksOpen(true)} title="Tasks"><ListChecks /> <span className="hidden md:inline">Tasks</span>{taskCount > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] font-bold text-brand-foreground">{taskCount}</span>}</Button>
          <Button size="sm" variant="ghost" className={hdrBtn} onClick={() => setCtxOpen(true)} title="Context"><Layers /> <span className="hidden md:inline">Context</span></Button>
          <Notifications className={hdrBtn} />
          <DemoControls compact onChecks={u.openChecks} onScenario={u.openScenario} />
          <OverflowMenu />
        </div>
      </header>
      <MessageList s={s} cid={cid} msgs={msgs} onOpenTask={setDrawer} onFollowUp={() => followUpRef.current()} />
      <ComposerBridge s={s} cid={cid} followUpRef={followUpRef} />
      <TasksSheet s={s} cid={cid} open={tasksOpen} onOpenChange={setTasksOpen} onOpenTask={setDrawer} />
      <ContextSheet s={s} cid={cid} open={ctxOpen} onOpenChange={setCtxOpen} />
      <TaskDrawer taskId={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Workspace                                                           */
/* ------------------------------------------------------------------ */
function Workspace() {
  const s = useDemo();
  const cid = s.biz === "direct" ? "direct" : s.clientId;

  if (s.biz === "direct") {
    const company = s.clients.find((c) => c.id === "direct")?.name ?? "Northwind Coffee";
    return (
      <ImmersiveFrame s={s} cid="direct" title={
        <div className="min-w-0 px-2">
          <div className="flex items-center gap-2 font-display text-base font-semibold">
            AI Account Manager
            <span className="hidden items-center gap-1 rounded-full bg-ai-panel-elevated px-2 py-0.5 text-[10px] font-medium text-ai-panel-muted sm:flex"><Lock className="size-3" /> Private conversation</span>
          </div>
          <div className="truncate text-[11px] text-ai-panel-muted">Your AI growth teammate · {company}</div>
        </div>
      } />
    );
  }
  if (cid === "all") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 bg-ai-panel p-6 text-center text-ai-panel-foreground">
        <Hash className="size-8 text-brand" />
        <h2 className="font-display text-xl font-semibold">Pick a client channel to open its shared workspace</h2>
        <div className="flex flex-wrap justify-center gap-2">
          {s.clients.filter((c) => c.biz === "bluefocus").map((c) => <Button key={c.id} size="sm" variant="ai" onClick={() => actions.setClient(c.id)}># {channelName(s, c.id)}</Button>)}
        </div>
      </div>
    );
  }
  return (
    <ImmersiveFrame s={s} cid={cid} title={<ChannelSwitcher s={s} cid={cid} />} extra={
      <>
        <GuidedDemo s={s} cid={cid} />
        <div className="hidden sm:block"><MembersPopover /></div>
        <PersonSwitcher s={s} />
      </>
    } />
  );
}

/** Lets the Analysis card prefill an @UA Agent follow-up in the composer. */
function ComposerBridge({ s, cid, followUpRef }: { s: State; cid: string; followUpRef: React.MutableRefObject<() => void> }) {
  const [prefill, setPrefill] = useState(0);
  followUpRef.current = () => setPrefill((n) => n + 1);
  return <ComposerInner key={prefill} s={s} cid={cid} prefill={prefill > 0} />;
}

function ComposerInner({ s, cid, prefill }: { s: State; cid: string; prefill: boolean }) {
  // Consume a pending prompt set elsewhere (e.g. Campaigns → "Plan with Clayton").
  // Capture it once at mount so clearing the store doesn't remount the composer empty.
  const pending = s.pendingPrompt;
  const [captured] = useState(pending);
  useEffect(() => {
    if (pending) actions.consumePendingPrompt();
  }, [pending]);
  const direct = s.biz === "direct" || cid === "direct";
  return <ComposerWithPrefill key={captured ?? "default"} s={s} cid={cid} initial={captured ?? (prefill && !direct ? "@UA Agent " : "")} />;
}

function ComposerWithPrefill({ s, cid, initial }: { s: State; cid: string; initial: string }) {
  const [input, setInput] = useState(initial);
  const [mentionQ, setMentionQ] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const disabled = s.role === "ops";
  const direct = s.biz === "direct" || cid === "direct";

  const onChange = (v: string) => {
    setInput(v);
    if (direct) { setMentionQ(null); return; } // Direct Customers never mention specialist agents
    const m = v.slice(0, taRef.current?.selectionStart ?? v.length).match(/@([\w ]*)$/);
    setMentionQ(m ? (m[1] ?? "") : null);
  };
  const insertMention = (label: string) => {
    const pos = taRef.current?.selectionStart ?? input.length;
    const before = input.slice(0, pos).replace(/@[\w ]*$/, `@${label} `);
    setInput(before + input.slice(pos));
    setMentionQ(null);
    taRef.current?.focus();
  };
  const send = () => {
    if (!input.trim()) return;
    actions.sendChannelMessage(cid, input);
    setInput("");
    setMentionQ(null);
  };
  const options = mentionQ != null ? MENTIONABLES.filter((m) => m.label.toLowerCase().includes(mentionQ.toLowerCase())) : [];

  return (
    <div className="relative mx-auto w-full max-w-4xl shrink-0 px-4 pb-4 pt-2 md:px-8">
      {options.length > 0 && (
        <div className="absolute bottom-full left-4 mb-1 w-64 md:left-8 overflow-hidden rounded-xl border border-ai-panel-border bg-card text-card-foreground shadow-xl">
          <div className="border-b border-border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mention</div>
          {options.map((o) => (
            <button key={o.id} onClick={() => insertMention(o.label)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted">
              {o.kind === "ai" ? <Bot className="size-3.5 text-brand" /> : <User className="size-3.5 text-muted-foreground" />}
              <span className="font-medium">@{o.label}</span>
              <span className="text-[10px] text-muted-foreground">{o.kind === "ai" ? "AI teammate" : "Agency team"}</span>
            </button>
          ))}
        </div>
      )}
      <form className="flex items-end gap-2 rounded-2xl border border-ai-panel-border bg-ai-panel-elevated p-2 focus-within:border-brand/60" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Textarea
          ref={taRef}
          rows={1}
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder={disabled ? "Ops can view; messaging as agency user disabled" : direct ? "Ask your AI AM anything about your marketing…" : `Message #${channelName(s, cid)} — type @ to mention`}
          disabled={disabled}
          className="min-h-10 resize-none border-0 bg-transparent text-ai-panel-foreground shadow-none placeholder:text-ai-panel-muted focus-visible:ring-0"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } if (e.key === "Escape") setMentionQ(null); }}
        />
        <Button type="submit" variant="brand" disabled={disabled}><Send /></Button>
      </form>
    </div>
  );
}
