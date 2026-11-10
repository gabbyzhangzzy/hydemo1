import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  BarChart3, Bell, Briefcase, Building2, Check, ChevronsUpDown, ClipboardCheck, FlaskConical, Headset, Home, Image as ImageIcon, LayoutGrid, MessageSquare, Palette, PanelLeftClose, PanelLeftOpen, Plus, RotateCcw, Slack, Smartphone, Sparkles, Users, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { actions, directUser, hydrateDemo, mainTaskView, personFor, STATUS_LABEL, USERS, useDemo, type Role } from "@/lib/demo/store";
import { cn } from "@/lib/utils";
import { Pill, TaskPill } from "./bits";

type NavItem = { to: string; label: string; icon: typeof Home };
const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Home", items: [{ to: "/overview", label: "Overview", icon: Home }] },
  { group: "Marketing", items: [{ to: "/campaigns", label: "Campaigns", icon: Briefcase }, { to: "/creative", label: "Creative", icon: ImageIcon }, { to: "/analytics", label: "Analytics", icon: BarChart3 }] },
  { group: "Business", items: [{ to: "/brand", label: "Brand & Tracking", icon: Palette }, { to: "/wallet", label: "Accounts & Wallet", icon: Wallet }] },
  { group: "Settings", items: [{ to: "/team", label: "Organization & Team", icon: Users }] },
];

export const CHECKS: [string, string][] = [
  ["c1", "BD-assisted onboarding preserves existing Brand information"],
  ["c2", "A new user can complete an AI-guided onboarding flow"],
  ["c3", "Selecting a Client updates the relevant context"],
  ["c4", "Member can create Draft but cannot finalize Launch"],
  ["c5", "Admin can fund the simulated Wallet and approve"],
  ["c6", "Missing authorization blocks Launch"],
  ["c7", "Human Handoff creates an Ops Case"],
  ["c8", "The authorization issue is routed to Andy"],
  ["c9", "Account opening issues are routed to Anita"],
  ["c10", "Resolving a Case alone does not bypass access verification"],
  ["c11", "Once verified, the original Task can resume"],
  ["c12", "Editing a Proposal invalidates prior approval"],
  ["c13", "Repeated clicks cannot trigger duplicate launch operations"],
  ["c14", "Campaign is not Live until simulated delivery confirmation"],
  ["c15", "Agency can review and publish a report"],
  ["c16", "End Client cannot see internal drafts or Agent collaboration"],
  ["c17", "Agent Tasks are visible across the relevant Web screens"],
  ["c18", "Slack and Mobile previews reflect shared Task status"],
  ["c19", "@mentioning Clayton in the shared channel creates a shared Task"],
  ["c20", "Specialist agents reply under their own identity"],
  ["c21", "Human-to-human @mention notifies without creating an AI task"],
  ["c22", "Internal approval is separate from sharing with the End Client"],
  ["c23", "Direct Customer chats only with one AI Account Manager"],
  ["c24", "Specialist @mentions in Direct mode route through AI AM"],
  ["c25", "AI AM drafts a Campaign Proposal for a Direct Customer"],
  ["c26", "Direct Campaigns/Analytics AI actions route through AI AM"],
];

function TaskRunner() {
  useEffect(() => {
    hydrateDemo();
    const i = setInterval(() => actions.tick(), 1400);
    return () => clearInterval(i);
  }, []);
  return null;
}

function ClientSwitcher() {
  const s = useDemo();
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const org = s.biz === "direct" ? "Northwind Coffee" : "BlueFocus";
  const current = s.clientId === "all" ? "All Clients" : s.clients.find((c) => c.id === s.clientId)?.name ?? "—";
  if (s.biz === "direct" || s.role === "client") {
    return (
      <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent px-3 py-2.5">
        <div className="grid size-8 place-items-center rounded-md bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">{s.role === "client" ? "F" : "N"}</div>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold text-sidebar-accent-foreground">{s.role === "client" ? "Freebeat" : org}</div>
          <div className="text-[11px] text-sidebar-foreground/70">{s.role === "client" ? "Client Portal · by BlueFocus" : "Direct customer"}</div>
        </div>
      </div>
    );
  }
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg bg-sidebar-accent px-3 py-2.5 text-left outline-none ring-sidebar-ring focus-visible:ring-2">
          <div className="grid size-8 place-items-center rounded-md bg-sidebar-primary font-display text-sm font-bold text-sidebar-primary-foreground">B</div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold text-sidebar-accent-foreground">{org}</div>
            <div className="truncate text-[11px] text-sidebar-foreground/70">Current Client: {current}</div>
          </div>
          <ChevronsUpDown className="size-4 text-sidebar-foreground/60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>BlueFocus clients</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => actions.setClient("all")}>
            <LayoutGrid /> All Clients {s.clientId === "all" && <Check className="ml-auto" />}
          </DropdownMenuItem>
          {s.clients.filter((c) => c.biz === "bluefocus").map((c) => (
            <DropdownMenuItem key={c.id} onClick={() => actions.setClient(c.id)}>
              <Building2 /> {c.name} {s.clientId === c.id && <Check className="ml-auto" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={s.role !== "admin"} onClick={() => setAddOpen(true)}>
            <Plus /> Add Client {s.role !== "admin" && <span className="ml-auto text-[10px]">Admin</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add client</DialogTitle>
            <DialogDescription>Creates a simulated client under BlueFocus. You can set up its brand next.</DialogDescription>
          </DialogHeader>
          <Input placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
          <DialogFooter>
            <Button disabled={!name.trim()} onClick={() => { actions.addClient(name.trim()); setName(""); setAddOpen(false); }}>Add client</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type ShellUtils = { openSlack: () => void; openMobile: () => void; openChecks: () => void; openScenario: () => void };
const ShellCtx = createContext<ShellUtils | null>(null);
/** Prototype utilities (Slack/Mobile previews, checks, scenario) for screens that render their own header. */
export function useShellUtils() {
  const c = useContext(ShellCtx);
  if (!c) throw new Error("useShellUtils must be used inside AppShell");
  return c;
}

function Sidebar({ rail, onToggle }: { rail?: boolean; onToggle?: (() => void) | undefined }) {
  const s = useDemo();
  const loc = useLocation();
  const items: { group: string; items: NavItem[] }[] =
    s.role === "client"
      ? [{ group: "Client", items: [{ to: "/portal", label: "Client Portal", icon: Sparkles }] }]
      : s.biz === "direct"
        ? [
            // Direct Customer: one AI AM, no multi-agent directory or agency workflows.
            { group: "Home", items: [{ to: "/workspace", label: "Ask AI AM", icon: MessageSquare }, { to: "/overview", label: "Overview", icon: Home }] },
            { group: "Marketing", items: [{ to: "/campaigns", label: "Campaigns", icon: Briefcase }, { to: "/creative", label: "Creative", icon: ImageIcon }, { to: "/analytics", label: "Analytics", icon: BarChart3 }] },
            { group: "Business", items: [{ to: "/brand", label: "Brand & Tracking", icon: Palette }, { to: "/wallet", label: "Accounts & Wallet", icon: Wallet }] },
            { group: "Settings", items: [{ to: "/team", label: "Organization & Team", icon: Users }] },
          ]
        : [
          NAV[0],
          { group: "AI Workspace", items: [{ to: "/workspace", label: "Agent Workspace", icon: MessageSquare }] },
          ...NAV.slice(1),
          ...(s.role === "ops" ? [{ group: "Hellyeah Internal", items: [{ to: "/ops", label: "Ops Queue", icon: Headset }] }] : []),
        ];
  const openCases = s.cases.filter((c) => c.status !== "Closed" && c.status !== "Resolved").length;
  if (rail) {
    return (
      <aside className="hidden h-full min-h-0 w-16 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground lg:flex">
        <button onClick={onToggle} title="Expand navigation" className="grid size-8 place-items-center rounded-lg bg-brand font-display text-sm font-black text-brand-foreground">H</button>
        <nav className="mt-4 flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto overscroll-contain px-2">
          {items.flatMap((g) => g.items).map((it) => {
            const active = loc.pathname === it.to;
            const Icon = it.icon;
            return (
              <Link key={it.to} to={it.to} title={it.label} aria-label={it.label} className={cn("relative grid size-10 shrink-0 place-items-center rounded-lg transition-colors", active ? "bg-sidebar-accent text-sidebar-primary" : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
                <Icon className="size-[18px]" />
                {it.to === "/ops" && openCases > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-sidebar-primary" />}
              </Link>
            );
          })}
        </nav>
        <button onClick={onToggle} title="Expand navigation" aria-label="Expand navigation" className="mt-2 grid size-10 place-items-center rounded-lg hover:bg-sidebar-accent/60"><PanelLeftOpen className="size-[18px]" /></button>
      </aside>
    );
  }
  return (
    <aside className="hidden h-full min-h-0 w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-2 px-5 pb-3 pt-5">
        <div className="grid size-7 place-items-center rounded-lg bg-brand font-display text-sm font-black text-brand-foreground">H</div>
        <span className="font-display text-[15px] font-semibold text-sidebar-accent-foreground">Hellyeah</span>
        <span className="ml-auto rounded bg-sidebar-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sidebar-primary">Prototype</span>
        {onToggle && <button onClick={onToggle} title="Collapse navigation" aria-label="Collapse navigation" className="grid size-7 place-items-center rounded-md hover:bg-sidebar-accent"><PanelLeftClose className="size-4" /></button>}
      </div>
      <div className="px-3 pb-2"><ClientSwitcher /></div>
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4">
        {items.map((g) => (
          <div key={g.group} className="mt-4">
            <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/45">{g.group}</div>
            {g.items.map((it) => {
              const active = loc.pathname === it.to;
              const Icon = it.icon;
              return (
                <Link key={it.to} to={it.to} className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground")}>
                  <Icon className={cn("size-4", active && "text-sidebar-primary")} />
                  {it.label}
                  {it.to === "/ops" && openCases > 0 && <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 text-[10px] font-bold text-sidebar-primary-foreground">{openCases}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export function DemoControls({ onChecks, onScenario, compact }: { onChecks: () => void; onScenario: () => void; compact?: boolean }) {
  const s = useDemo();
  const nav = useNavigate();
  const roles: [Role, string][] = [["admin", "BlueFocus Admin"], ["member", "BlueFocus Member"], ["ops", "Hellyeah Ops"], ["client", "Freebeat End Client"]];
  const ctx = s.biz === "direct" ? "direct" : s.clientId === "clientb" ? "clientb" : "freebeat";
  const Seg = ({ items, value, onPick }: { items: [string, string][]; value: string; onPick: (v: string) => void }) => (
    <div className="grid gap-1">
      {items.map(([v, l]) => (
        <button key={v} onClick={() => onPick(v)} className={cn("flex items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs font-medium", value === v ? "border-primary bg-accent text-accent-foreground" : "border-border hover:bg-muted")}>
          {l} {value === v && <Check className="size-3.5" />}
        </button>
      ))}
    </div>
  );
  return (
    <Popover>
      <PopoverTrigger asChild>
        {compact ? (
          <Button size="icon" variant="ghost" className="text-ai-panel-muted hover:bg-ai-panel-elevated hover:text-brand" aria-label="Prototype Demo Controls" title="Prototype Demo Controls"><FlaskConical /></Button>
        ) : (
          <Button size="sm" variant="outline" className="border-dashed border-brand/50 text-brand">
            <FlaskConical /> <span className="hidden sm:inline">Prototype Demo Controls</span><span className="sr-only sm:hidden">Prototype Demo Controls</span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-4">
        <div className="text-[11px] text-muted-foreground">Product simulation · no real auth, ads, payments or messages.</div>
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Access path</div>
          <Seg items={[["self", "Self-serve onboarding"], ["bd", "BD-assisted onboarding"]]} value={s.accessPath} onPick={(v) => { actions.setAccessPath(v as "self" | "bd"); nav({ to: "/" }); }} />
          <div className="mt-1 text-[10px] text-muted-foreground">Switching access path restarts the demo.</div>
        </div>
        {s.biz === "direct" ? (
          <div>
            <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">User role</div>
            <div className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground">{directUser(s).name} · {directUser(s).title} — Direct Customers can't impersonate agency members.</div>
          </div>
        ) : (
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">User role</div>
          <Seg items={roles} value={s.role} onPick={(v) => { actions.setRole(v as Role); if (v === "client") nav({ to: "/portal" }); else if (v === "ops") nav({ to: "/ops" }); else if (s.role === "client" || s.role === "ops") nav({ to: "/overview" }); }} />
        </div>
        )}
        <div>
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Business context</div>
          <Seg items={[["freebeat", "BlueFocus / Freebeat"], ["clientb", "BlueFocus / Demo Client B"], ["direct", "Direct Customer Demo"]]} value={ctx} onPick={(v) => actions.setContext(v as "freebeat")} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Button size="sm" variant="outline" onClick={() => { actions.reset(); nav({ to: "/" }); }}><RotateCcw /> Reset</Button>
          <Button size="sm" variant="outline" onClick={onScenario}>Scenario</Button>
          <Button size="sm" variant="outline" onClick={onChecks}><ClipboardCheck /> Checks</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function Notifications({ className }: { className?: string }) {
  const s = useDemo();
  const unread = s.notifications.filter((n) => !n.read).length;
  const visible = s.role === "client" ? s.notifications.filter((n) => n.to === "/portal") : s.notifications;
  return (
    <Popover onOpenChange={(o) => !o && unread && actions.markAllRead()}>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className={cn("relative", className)} aria-label="Notifications">
          <Bell />
          {unread > 0 && s.role !== "client" && <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-brand text-[9px] font-bold text-brand-foreground">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-2.5 text-sm font-semibold">In-app notifications <span className="text-[10px] font-normal text-muted-foreground">(simulated)</span></div>
        <div className="max-h-80 overflow-y-auto">
          {visible.length === 0 && <div className="p-4 text-sm text-muted-foreground">Nothing yet.</div>}
          {visible.map((n) => (
            <Link key={n.id} to={n.to} className="flex gap-2 border-b border-border px-4 py-2.5 text-xs hover:bg-muted">
              {!n.read && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand" />}
              <span>{n.text}</span>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SlackPreview({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useDemo();
  const v = mainTaskView(s);
  const c = s.campaign;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Slack className="size-4" /> Slack preview · #hellyeah-freebeat</SheetTitle>
          <SheetDescription>Internal Hellyeah / agency view. No messages are sent. External agency Slack: <b>Planned / Requires identity and access integration</b>.</SheetDescription>
        </SheetHeader>
        <div className="space-y-3 px-4 pb-6 text-sm">
          <SlackMsg who="Leo Park">@Clayton what's the status on the Freebeat US campaign?</SlackMsg>
          <SlackMsg who="Clayton" bot>
            {v ? (<><div className="mb-1 flex items-center gap-2">T-1024 <TaskPill status={v.status} /></div><div className="text-muted-foreground">{v.detail}</div></>) : "No Freebeat task started yet. Start one in the Agent Workspace."}
          </SlackMsg>
          {c?.status === "awaiting_approval" && <SlackMsg who="Hellyeah" bot>🔔 Approval needed: Revision {c.revision} · {c.name} · ${c.dailyBudget}/day</SlackMsg>}
          {c && c.status !== "draft" && c.status !== "awaiting_approval" && <SlackMsg who="Hellyeah" bot>Campaign status: <b>{STATUS_LABEL[c.status]}</b></SlackMsg>}
          {s.slackReplies.map((r, i) => <SlackMsg key={i} who="Clayton" bot>{r}</SlackMsg>)}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => actions.slackAsk()}>Simulate “@Clayton status?”</Button>
            <Button size="sm" asChild onClick={() => onOpenChange(false)}><Link to="/tasks">Open task on Web</Link></Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
function SlackMsg({ who, bot, children }: { who: string; bot?: boolean; children: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <div className={cn("grid size-8 shrink-0 place-items-center rounded-md text-xs font-bold", bot ? "bg-primary text-primary-foreground" : "bg-muted")}>{who[0]}</div>
      <div><div className="text-xs font-bold">{who} {bot && <span className="rounded bg-muted px-1 text-[9px] font-semibold text-muted-foreground">APP</span>}</div><div>{children}</div></div>
    </div>
  );
}

function MobilePreview({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useDemo();
  const v = mainTaskView(s);
  const c = s.campaign;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Smartphone className="size-4" /> Mobile preview</SheetTitle>
          <SheetDescription>Same shared task & campaign state as desktop.</SheetDescription>
        </SheetHeader>
        <div className="mx-auto w-[300px] rounded-[2rem] border-[6px] border-foreground/90 bg-background p-3 shadow-xl">
          <div className="mb-3 text-center text-[10px] text-muted-foreground">9:41 · Hellyeah</div>
          <div className="ai-surface mb-2 rounded-xl p-3 text-xs">
            <div className="font-semibold">Ask AI AM</div>
            <div className="mt-1 rounded-md bg-ai-panel-elevated px-2 py-1.5 text-ai-panel-muted">How is Freebeat doing today?</div>
          </div>
          <div className="mb-2 rounded-xl border border-border p-3 text-xs">
            <div className="mb-1 font-semibold">Task status</div>
            {v ? (<div className="flex items-center justify-between gap-2"><span>T-1024</span><TaskPill status={v.status} /></div>) : <span className="text-muted-foreground">No active task</span>}
            {v && <div className="mt-1 text-muted-foreground">{v.detail}</div>}
          </div>
          <div className="mb-2 rounded-xl border border-border p-3 text-xs">
            <div className="mb-1 font-semibold">Campaign update</div>
            {c ? <div className="flex justify-between"><span>US Awareness</span><Pill>{STATUS_LABEL[c.status]}</Pill></div> : <span className="text-muted-foreground">No proposal yet</span>}
          </div>
          {c?.status === "awaiting_approval" && (
            <div className="mb-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs">🔔 Approval needed · Rev {c.revision}</div>
          )}
          <Button size="sm" className="w-full" asChild onClick={() => onOpenChange(false)}><Link to="/campaigns">Open full details on Web</Link></Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ChecksDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useDemo();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scenario checklist · {s.checks.length}/{CHECKS.length}</DialogTitle>
          <DialogDescription>Items tick automatically when you exercise them in the prototype.</DialogDescription>
        </DialogHeader>
        <ol className="space-y-1.5">
          {CHECKS.map(([id, label], i) => {
            const done = s.checks.includes(id);
            return (
              <li key={id} className={cn("flex items-start gap-2.5 rounded-md border px-3 py-2 text-sm", done ? "border-success/30 bg-success/5" : "border-border")}>
                <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-bold", done ? "bg-success text-primary-foreground" : "bg-muted text-muted-foreground")}>{done ? "✓" : i + 1}</span>
                {label}
              </li>
            );
          })}
        </ol>
        <DialogFooter><Button variant="outline" onClick={() => { actions.reset(); onOpenChange(false); }}><RotateCcw /> Reset Demo</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScenarioDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useDemo();
  const v = mainTaskView(s);
  const rows: [string, string][] = [
    ["Access path", s.accessPath === "bd" ? "BD-assisted" : "Self-serve"],
    ["Role", `${USERS[s.role].name} · ${USERS[s.role].title}`],
    ["Context", s.biz === "direct" ? "Direct Customer Demo" : `BlueFocus / ${s.clients.find((c) => c.id === s.clientId)?.name ?? "All Clients"}`],
    ["Onboarded", s.onboarded ? "Yes" : "Not yet"],
    ["Main task T-1024", v ? `${v.status} — ${v.detail}` : "Not started"],
    ["Campaign", s.campaign ? `${STATUS_LABEL[s.campaign.status]} · Rev ${s.campaign.revision}` : "No proposal"],
    ["Meta Page access", s.pageAccess],
    ["Wallet", `$${s.wallet.balance.toLocaleString()}`],
    ["Report", s.report.status],
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Current scenario</DialogTitle><DialogDescription>Shared prototype state (persisted in this browser).</DialogDescription></DialogHeader>
        <dl className="divide-y divide-border text-sm">
          {rows.map(([k, val]) => (<div key={k} className="flex justify-between gap-4 py-2"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{val}</dd></div>))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const s = useDemo();
  const loc = useLocation();
  const [slack, setSlack] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [checks, setChecks] = useState(false);
  const [scenario, setScenario] = useState(false);
  const p = personFor(s);
  const u = p ? { name: p.full, title: p.title, initials: p.initials } : s.biz === "direct" ? directUser(s) : USERS[s.role];
  const openPreview = (fn: (b: boolean) => void) => {
    fn(true);
    if (s.tasks.some((t) => t.id === "T-1024")) actions.markCheck("c18");
  };
  const clientBlocked = s.role === "client" && !loc.pathname.startsWith("/portal");
  const immersive = loc.pathname === "/workspace" && !clientBlocked;
  const [railOpen, setRailOpen] = useState(false);
  const utils: ShellUtils = { openSlack: () => openPreview(setSlack), openMobile: () => openPreview(setMobile), openChecks: () => setChecks(true), openScenario: () => setScenario(true) };
  return (
    <ShellCtx.Provider value={utils}>
    <div className="flex h-screen overflow-hidden bg-background">
      <TaskRunner />
      <Sidebar rail={immersive && !railOpen} onToggle={immersive ? () => setRailOpen((v) => !v) : undefined} />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        {!immersive && <header className="z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
          <MobileNav />
          <div className="hidden text-xs text-muted-foreground md:block">{s.role === "client" ? "Freebeat · Client Portal" : s.biz === "direct" ? "Northwind Coffee" : `BlueFocus › ${s.clients.find((c) => c.id === s.clientId)?.name ?? "All Clients"}`}</div>
          <div className="ml-auto flex items-center gap-1.5">
            {s.role !== "client" && (
              <>
                <Button size="sm" variant="ghost" onClick={() => openPreview(setSlack)}><Slack /> <span className="hidden md:inline">Slack</span></Button>
                <Button size="sm" variant="ghost" onClick={() => openPreview(setMobile)}><Smartphone /> <span className="hidden md:inline">Mobile</span></Button>
              </>
            )}
            <Notifications />
            <DemoControls onChecks={() => setChecks(true)} onScenario={() => setScenario(true)} />
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <div className="grid size-8 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{u.initials}</div>
              <div className="leading-tight"><div className="text-xs font-semibold">{u.name}</div><div className="text-[10px] text-muted-foreground">{u.title}</div></div>
            </div>
          </div>
        </header>}
        <main key={loc.pathname} className={immersive ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8"}>
          {clientBlocked ? (
            <div className="mx-auto max-w-md py-20 text-center">
              <h1 className="text-xl font-semibold">Agency workspace not available</h1>
              <p className="mt-2 text-sm text-muted-foreground">End Clients only see the Client Portal. Internal agents, tasks and drafts stay with BlueFocus.</p>
              <Button className="mt-4" asChild><Link to="/portal">Go to Client Portal</Link></Button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
      <SlackPreview open={slack} onOpenChange={setSlack} />
      <MobilePreview open={mobile} onOpenChange={setMobile} />
      <ChecksDialog open={checks} onOpenChange={setChecks} />
      <ScenarioDialog open={scenario} onOpenChange={setScenario} />
    </div>
    </ShellCtx.Provider>
  );
}

export function MobileNav({ className }: { className?: string }) {
  const s = useDemo();
  const all = s.role === "client" ? [{ to: "/portal", label: "Client Portal" }] : [{ to: "/workspace", label: s.biz === "direct" ? "Ask AI AM" : "Agent Workspace" }, ...NAV.flatMap((g) => g.items), ...(s.role === "ops" ? [{ to: "/ops", label: "Ops Queue" }] : [])];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className={cn("lg:hidden", className)}>Menu</Button></DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {all.map((i) => (<DropdownMenuItem key={i.to} asChild><Link to={i.to}>{i.label}</Link></DropdownMenuItem>))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
