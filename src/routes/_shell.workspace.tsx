import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AtSign, Bot, CheckCircle2, ChevronDown, Circle, Hash, Loader2, Lock, Play, RotateCcw, Send, Sparkles, User, Users, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Demo, Empty, Phase, Pill, TaskPill } from "@/components/demo/bits";
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
/* Channel rail                                                        */
/* ------------------------------------------------------------------ */
function ChannelRail({ s, cid }: { s: State; cid: string }) {
  const channels = s.clients.filter((c) => c.biz === "bluefocus");
  return (
    <div className="ai-surface hidden w-52 shrink-0 flex-col rounded-2xl p-3 xl:flex">
      <div className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-ai-panel-muted"><Users className="size-3.5" /> BlueFocus</div>
      <div className="space-y-0.5">
        {channels.map((c) => {
          const active = cid === c.id;
          return (
            <button key={c.id} onClick={() => actions.setClient(c.id)} className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm", active ? "bg-ai-panel-elevated font-semibold text-ai-panel-foreground" : "text-ai-panel-muted hover:bg-ai-panel-elevated/60")}>
              <Hash className="size-3.5 shrink-0" /> <span className="truncate">{channelName(s, c.id)}</span>
            </button>
          );
        })}
        <div className="flex items-center gap-2 px-2.5 py-2 text-sm text-ai-panel-muted/60">
          <Users className="size-3.5 shrink-0" /> Agency Overview <Phase p="P2" />
        </div>
      </div>
      <div className="mt-auto px-2 pt-3 text-[10px] leading-relaxed text-ai-panel-muted">Each channel is a separate client workspace. Messages, tasks and data never mix.</div>
    </div>
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
        <Button size="sm" variant="ai"><Users /> Members</Button>
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
        <Button size="sm" variant="ai">
          <span className="grid size-5 place-items-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground">{p.initials}</span>
          Acting as {p.name} <ChevronDown className="size-3.5" />
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
    <div className="flex flex-wrap items-center gap-3 border-b border-ai-panel-border bg-ai-panel-elevated/50 px-5 py-2.5">
      <div className="flex items-center gap-2 text-xs font-semibold text-brand"><Wand2 className="size-3.5" /> Experience Agency + AI Collaboration</div>
      <div className="flex items-center gap-1">
        {GUIDED_LABELS.map((_, i) => (
          <span key={i} className={cn("h-1.5 w-4 rounded-full", i < step ? "bg-success" : i === step && !done ? "bg-brand" : "bg-ai-panel-border")} />
        ))}
      </div>
      {!done ? (
        <Button size="sm" variant="brand" onClick={() => actions.collabNext()}>{GUIDED_LABELS[step]} →</Button>
      ) : (
        <Pill tone="success">Demo complete — deliverable approved internally</Pill>
      )}
      {step > 0 && (
        <Button size="sm" variant="ghost" className="text-ai-panel-muted" onClick={() => actions.resetCollab()}><RotateCcw /> Reset Collaboration Demo</Button>
      )}
    </div>
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
        <div className="text-sm font-semibold">Performance Analysis · Freebeat Meta</div>
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
/* Composer with @mention autocomplete                                 */
/* ------------------------------------------------------------------ */
function Composer({ s, cid, disabled }: { s: State; cid: string; disabled: boolean }) {
  const [input, setInput] = useState("");
  const [mentionQ, setMentionQ] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const onChange = (v: string) => {
    setInput(v);
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
    <div className="relative border-t border-ai-panel-border p-3">
      {options.length > 0 && (
        <div className="absolute bottom-full left-3 mb-1 w-64 overflow-hidden rounded-xl border border-ai-panel-border bg-card text-card-foreground shadow-xl">
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
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Textarea
          ref={taRef}
          rows={1}
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder={disabled ? "Ops can view; messaging as agency user disabled" : `Message #${channelName(s, cid)} — type @ to mention`}
          disabled={disabled}
          className="min-h-10 resize-none border-ai-panel-border bg-ai-panel-elevated text-ai-panel-foreground placeholder:text-ai-panel-muted"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } if (e.key === "Escape") setMentionQ(null); }}
        />
        <Button type="submit" variant="brand" disabled={disabled}><Send /></Button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Message list                                                        */
/* ------------------------------------------------------------------ */
function MessageList({ s, cid, msgs, onOpenTask, onFollowUp }: { s: State; cid: string; msgs: Msg[]; onOpenTask: (id: string) => void; onFollowUp: () => void }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs.length]);
  const openTask = (m: Msg) => onOpenTask(m.taskId ?? MAIN_TASK_ID);
  return (
    <div className="flex-1 space-y-5 overflow-y-auto p-5">
      {msgs.length === 0 && (
        <div className="mx-auto max-w-lg py-10 text-center">
          <Sparkles className="mx-auto mb-3 size-8 text-brand" />
          <h2 className="text-xl font-semibold">What should the team do for {s.clients.find((c) => c.id === cid)?.name}?</h2>
          <p className="mt-1 text-sm text-ai-panel-muted">This is a shared agency channel. Mention @Clayton or a specialist — agent runs are deterministic simulations.</p>
          {cid === "freebeat" && (
            <button onClick={() => { actions.setPerson("sarah"); actions.sendChannelMessage(cid, MAIN_PROMPT); }} className="mt-5 w-full rounded-xl border border-ai-panel-border bg-ai-panel-elevated p-4 text-left text-sm hover:border-brand">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-brand"><Wand2 className="size-3.5" /> Suggested · posted as Sarah</div>
              {MAIN_PROMPT}
            </button>
          )}
          {cid !== "freebeat" && (
            <button onClick={() => actions.sendChannelMessage(cid, "Give me a quick performance review for this week")} className="mt-5 w-full rounded-xl border border-ai-panel-border bg-ai-panel-elevated p-4 text-left text-sm hover:border-brand">Give me a quick performance review for this week</button>
          )}
        </div>
      )}
      {msgs.map((m) => {
        const who = WHO[m.from];
        const isMe = m.from === personFor(s)?.id || m.from === "user";
        return (
          <div key={m.id} className={cn("flex gap-3", isMe && "flex-row-reverse")}>
            <div className={cn("grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold", who.cls)}>
              {who.ai ? <Bot className="size-4" /> : m.from === "user" ? <User className="size-4" /> : (PEOPLE.find((p) => p.id === m.from)?.initials ?? who.name[0])}
            </div>
            <div className={cn("min-w-0 max-w-[85%] space-y-2", isMe && "text-right")}>
              <div className="text-[11px] text-ai-panel-muted">
                {who.name}
                {who.ai && <span className="ml-1.5 rounded bg-ai-panel-elevated px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand">AI</span>}
                <span className="ml-1.5">· {m.at}</span>
                {m.taskId && <button onClick={() => openTask(m)} className="ml-1.5 font-semibold text-brand hover:underline">· {m.taskId}</button>}
              </div>
              <div className={cn("inline-block rounded-2xl px-4 py-2.5 text-left text-sm", m.from === "system" ? "border border-dashed border-ai-panel-border text-ai-panel-muted" : isMe ? "bg-brand text-brand-foreground" : "bg-ai-panel-elevated")}>
                <RichText text={m.text} />
              </div>
              {m.card === "progress" && <ProgressCard text={m.text} onOpenTask={() => openTask(m)} />}
              {m.card === "analysis" && <AnalysisCard onOpenTask={() => openTask(m)} onFollowUp={onFollowUp} />}
              {m.card === "brief" && <BriefCard />}
              {m.card === "summary" && <SummaryCard onOpenTask={() => openTask(m)} />}
              {m.card === "stages" && <Button size="sm" variant="ai" onClick={() => openTask(m)}>Open work log in task drawer →</Button>}
              {m.card === "proposal" && <ProposalCard compact dark />}
              {m.card === "readiness" && <div className="rounded-xl bg-card p-3 text-card-foreground"><ReadinessPanel /></div>}
              {m.card === "resume" && !s.resumed && <Button variant="brand" size="sm" onClick={() => actions.resumeTask()}><Play /> Resume T-1024</Button>}
              {m.card === "report" && <ReportSummary />}
            </div>
          </div>
        );
      })}
      <div ref={end} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Right aside                                                         */
/* ------------------------------------------------------------------ */
function Aside({ s, cid, onOpenTask }: { s: State; cid: string; onOpenTask: (id: string) => void }) {
  const client = s.clients.find((c) => c.id === cid);
  const clientTasks = s.tasks.filter((t) => t.clientId === cid);
  return (
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
                <div className="mt-2 flex gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => onOpenTask(t.id)}>Open task</Button>
                  {t.id === MAIN_TASK_ID && s.pageAccess === "connected" && !s.resumed && <Button size="sm" variant="brand" onClick={() => actions.resumeTask()}><Play /> Resume</Button>}
                </div>
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
  );
}

/* ------------------------------------------------------------------ */
/* Direct-customer 1:1 (unchanged concept)                             */
/* ------------------------------------------------------------------ */
function DirectChat({ s }: { s: State }) {
  const msgs = s.messages.filter((m) => m.clientId === "direct");
  const [drawer, setDrawer] = useState<string | null>(null);
  return (
    <div className="mx-auto grid max-w-[1200px] gap-5 xl:grid-cols-[1fr_360px]">
      <div className="ai-surface flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl">
        <div className="border-b border-ai-panel-border px-5 py-3.5">
          <div className="text-[11px] uppercase tracking-wider text-ai-panel-muted">Private 1:1 · not a shared channel</div>
          <div className="font-display text-lg font-semibold">Ask AI AM</div>
        </div>
        <MessageList s={s} cid="direct" msgs={msgs} onOpenTask={setDrawer} onFollowUp={() => {}} />
        <Composer s={s} cid="direct" disabled={s.role === "ops"} />
      </div>
      <Aside s={s} cid="direct" onOpenTask={setDrawer} />
      <TaskDrawer taskId={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Workspace                                                           */
/* ------------------------------------------------------------------ */
function Workspace() {
  const s = useDemo();
  const [drawer, setDrawer] = useState<string | null>(null);
  const cid = s.biz === "direct" ? "direct" : s.clientId;
  const client = s.clients.find((c) => c.id === cid);
  const msgs = s.messages.filter((m) => m.clientId === cid);
  const followUpRef = useRef<() => void>(() => {});

  if (s.biz === "direct") return <DirectChat s={s} />;
  if (cid === "all") {
    return (
      <div className="mx-auto max-w-lg py-16">
        <Empty title="Pick a client channel to open its shared workspace">
          <div className="mt-3 flex justify-center gap-2">
            {s.clients.filter((c) => c.biz === "bluefocus").map((c) => <Button key={c.id} size="sm" variant="outline" onClick={() => actions.setClient(c.id)}># {channelName(s, c.id)}</Button>)}
          </div>
        </Empty>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1500px] gap-5">
      <ChannelRail s={s} cid={cid} />
      <div className="grid min-w-0 flex-1 gap-5 xl:grid-cols-[1fr_340px]">
        <div className="ai-surface flex min-h-[calc(100vh-8rem)] flex-col overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-center gap-3 border-b border-ai-panel-border px-5 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-display text-lg font-semibold"><Hash className="size-4 text-brand" /> {channelName(s, cid)}</div>
              <div className="text-[11px] text-ai-panel-muted">Internal agency workspace · BlueFocus / {client?.name} <Lock className="ml-1 inline size-3" /> Not visible to the end client</div>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <AvatarStack />
              <MembersPopover />
              <PersonSwitcher s={s} />
            </div>
          </div>
          <GuidedDemo s={s} cid={cid} />
          <MessageList s={s} cid={cid} msgs={msgs} onOpenTask={setDrawer} onFollowUp={() => followUpRef.current()} />
          <ComposerBridge s={s} cid={cid} followUpRef={followUpRef} />
        </div>
        <Aside s={s} cid={cid} onOpenTask={setDrawer} />
      </div>
      <TaskDrawer taskId={drawer} onClose={() => setDrawer(null)} />
    </div>
  );
}

/** Lets the Analysis card prefill an @UA Agent follow-up in the composer. */
function ComposerBridge({ s, cid, followUpRef }: { s: State; cid: string; followUpRef: React.MutableRefObject<() => void> }) {
  const [prefill, setPrefill] = useState(0);
  followUpRef.current = () => setPrefill((n) => n + 1);
  return <ComposerInner key={prefill} s={s} cid={cid} prefill={prefill > 0} />;
}

function ComposerInner({ s, cid, prefill }: { s: State; cid: string; prefill: boolean }) {
  return <ComposerWithPrefill s={s} cid={cid} initial={prefill ? "@UA Agent " : ""} />;
}

function ComposerWithPrefill({ s, cid, initial }: { s: State; cid: string; initial: string }) {
  const [input, setInput] = useState(initial);
  const [mentionQ, setMentionQ] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const disabled = s.role === "ops";

  const onChange = (v: string) => {
    setInput(v);
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
    <div className="relative border-t border-ai-panel-border p-3">
      {options.length > 0 && (
        <div className="absolute bottom-full left-3 mb-1 w-64 overflow-hidden rounded-xl border border-ai-panel-border bg-card text-card-foreground shadow-xl">
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
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Textarea
          ref={taRef}
          rows={1}
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder={disabled ? "Ops can view; messaging as agency user disabled" : `Message #${channelName(s, cid)} — type @ to mention`}
          disabled={disabled}
          className="min-h-10 resize-none border-ai-panel-border bg-ai-panel-elevated text-ai-panel-foreground placeholder:text-ai-panel-muted"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } if (e.key === "Escape") setMentionQ(null); }}
        />
        <Button type="submit" variant="brand" disabled={disabled}><Send /></Button>
      </form>
    </div>
  );
}
