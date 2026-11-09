import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */
export type Role = "admin" | "member" | "ops" | "client";
export type Biz = "bluefocus" | "direct";
export type AccessPath = "self" | "bd";
export type CampaignStatus =
  | "draft"
  | "awaiting_approval"
  | "approved"
  | "submitted"
  | "ops_review"
  | "provider_accepted"
  | "delivery_pending"
  | "live_verified";
export type TaskStatus = "running" | "waiting_approval" | "blocked" | "completed" | "failed";
export type CaseStatus = "Open" | "In Progress" | "Waiting for Customer" | "Resolved" | "Closed";
export type PageAccess = "required" | "pending_support" | "connected";

export interface Client {
  id: string;
  name: string;
  biz: Biz;
  industry: string;
  tagline: string;
}
export interface Brand {
  name: string;
  description: string;
  industry: string;
  audience: string;
  market: string;
  url: string;
  assets: string[];
  status: "draft" | "confirmed";
  source: "ai" | "bd" | "manual";
}
export interface LogEntry {
  stage: string;
  agent: string;
  checked: string;
  data: string;
  tool: string;
  result: string;
  next: string;
}
export interface Task {
  id: string;
  clientId: string;
  title: string;
  agent: string;
  status: TaskStatus;
  stage: number;
  stages: LogEntry[];
  campaignId?: string;
  caseId?: string;
  result?: string | undefined;
  createdAt: string;
}
export interface Revision {
  rev: number;
  by: string;
  change: string;
}
export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  platform: string;
  objective: string;
  geo: string;
  dailyBudget: number;
  totalCap: number;
  audience: string;
  placements: string[];
  assets: number;
  revision: number;
  status: CampaignStatus;
  approvedRevision: number | null;
  changesRequested?: string | undefined;
  revisions: Revision[];
}
export interface Case {
  id: string;
  clientId: string;
  type: "Meta Page Authorization" | "Account Opening";
  owner: string;
  taskId: string;
  status: CaseStatus;
  updated: string;
  diagnostics: string[];
  notes: string[];
  recheck?: string;
}
export interface Msg {
  id: string;
  clientId: string;
  from: "user" | "clayton" | "ua" | "creative" | "system" | "aiam";
  text: string;
  card?: undefined | "stages" | "proposal" | "readiness" | "report" | "resume";
}
export interface Notif {
  id: string;
  text: string;
  to: string;
  read: boolean;
}

export interface State {
  version: number;
  accessPath: AccessPath;
  role: Role;
  biz: Biz;
  clientId: string; // "all" or a client id
  onboarded: boolean;
  onboarding: {
    step: number;
    goal?: string | undefined;
    freeText: string;
    customerType?: "own" | "agency" | undefined;
    company: string;
    clientName: string;
    url: string;
    objective: string;
    channel: string;
  };
  clients: Client[];
  brands: Record<string, Brand>;
  pageAccess: PageAccess;
  wallet: { balance: number; activity: { id: string; text: string; amount: number; by: string }[] };
  tasks: Task[];
  campaign: Campaign | null;
  resumed: boolean;
  launch: {
    inFlight: boolean;
    requestId: string | null;
    dupBlocked: number;
    error: string | null;
    failNext: boolean;
    providerId: string;
    firstSpend: number | null;
  };
  cases: Case[];
  report: { status: "none" | "draft" | "ready" | "published"; external: string };
  messages: Msg[];
  notifications: Notif[];
  checks: string[];
  clientAiAm: boolean;
  creativeLevel: "limited" | "enabled";
  portalActions: { id: string; text: string; done: boolean }[];
  portalRequests: string[];
  slackReplies: string[];
  seq: number;
}

/* ------------------------------------------------------------------ */
/* Static demo data                                                    */
/* ------------------------------------------------------------------ */
export const USERS: Record<Role, { name: string; title: string; initials: string }> = {
  admin: { name: "Maya Chen", title: "BlueFocus Admin", initials: "MC" },
  member: { name: "Leo Park", title: "BlueFocus Member", initials: "LP" },
  ops: { name: "Priya Nair", title: "Hellyeah Ops", initials: "PN" },
  client: { name: "Sam Rivera", title: "Freebeat End Client", initials: "SR" },
};

export const FREEBEAT_BRAND: Brand = {
  name: "Freebeat",
  description: "AI music-video app that turns any track into a beat-synced short video in seconds.",
  industry: "Consumer apps · Music & creator tools",
  audience: "Creators and music fans aged 18–34 who post short-form video",
  market: "United States (primary), English-speaking markets",
  url: "freebeat.ai",
  assets: ["Logo (SVG)", "Brand colors: Electric violet / Black", "3 approved launch videos"],
  status: "draft",
  source: "bd",
};

export const STATIC_CAMPAIGNS = [
  { id: "CMP-FB-SPRING", clientId: "freebeat", name: "Freebeat — Spring Launch (ended)", platform: "Meta", status: "Completed", spend: 4120, impressions: 580_281, cpm: 7.1, freq: 1.9 },
  { id: "CMP-B-SEARCH", clientId: "clientb", name: "Client B — Always-on Search", platform: "Google Ads", status: "Live (demo)", spend: 9310, impressions: 214_000, cpm: 43.5, freq: 1.2 },
  { id: "CMP-B-RETARGET", clientId: "clientb", name: "Client B — Retargeting Q3", platform: "Meta", status: "Paused", spend: 1880, impressions: 201_400, cpm: 9.33, freq: 3.1 },
  { id: "CMP-DIR-LOCAL", clientId: "direct", name: "Northwind — Local Awareness", platform: "Meta", status: "Draft idea", spend: 0, impressions: 0, cpm: 0, freq: 0 },
];

export const CREATIVES = [
  { id: "A-01", clientId: "freebeat", name: "“Drop the beat” 15s vertical", kind: "Video · 9:16", status: "Approved" },
  { id: "A-02", clientId: "freebeat", name: "Creator remix montage 30s", kind: "Video · 9:16", status: "Approved" },
  { id: "A-03", clientId: "freebeat", name: "“Any song → video” static", kind: "Image · 1:1", status: "Approved" },
  { id: "A-04", clientId: "freebeat", name: "Holiday teaser (concept)", kind: "Image · 4:5", status: "Internal draft" },
  { id: "B-01", clientId: "clientb", name: "Search ad copy set v4", kind: "Text", status: "Approved" },
  { id: "B-02", clientId: "clientb", name: "Retargeting carousel", kind: "Carousel", status: "Approved" },
  { id: "D-01", clientId: "direct", name: "Morning brew hero", kind: "Image · 1:1", status: "Approved" },
];

export const MAIN_TASK_ID = "T-1024";
export const MAIN_PROMPT =
  "Analyze Freebeat's current campaign and prepare a new Meta awareness campaign for the US market using approved creative assets.";

const MAIN_STAGES: LogEntry[] = [
  { stage: "Understanding task", agent: "Clayton", checked: "Request scope and client context", data: "Client: Freebeat · Channel: Meta · Objective: Awareness · Geo: US", tool: "Clayton task planner", result: "Scope confirmed; constraint: approved assets only", next: "Read Brand Context" },
  { stage: "Reading Brand Context", agent: "Clayton", checked: "Freebeat Brand Profile & tracking", data: "Audience 18–34 creators; Meta Pixel installed (demo)", tool: "Brand memory", result: "Brand context loaded", next: "Assign UA work" },
  { stage: "Assigning UA work", agent: "UA Agent", checked: "Spring Launch campaign performance (ended)", data: "Spend $4,120 · CPM $7.10 · Frequency 1.9 (demo data)", tool: "Meta reporting (simulated read)", result: "Frequency high on Feed; Reels most efficient", next: "Check creative" },
  { stage: "Checking approved creative assets", agent: "Creative", checked: "Creative library approvals", data: "3 approved · 1 internal draft excluded", tool: "Creative capability (existing assets only)", result: "A-01, A-02, A-03 selected", next: "Prepare proposal" },
  { stage: "Preparing Campaign Proposal", agent: "UA Agent", checked: "Budget & placement plan", data: "$200/day · $2,000 cap · Reels, Feed, Stories", tool: "UA planner", result: "Proposal Revision 1 drafted", next: "Check launch readiness" },
  { stage: "Checking launch readiness", agent: "Clayton", checked: "Accounts, access, wallet, creative", data: "Ad account assigned · Page access missing · Wallet $0", tool: "Readiness check", result: "Launch blocked until access and funding are resolved", next: "Resolve blockers" },
];

const GENERIC_STAGES = (label: string, agent: string): LogEntry[] => [
  { stage: "Understanding request", agent: "Clayton", checked: "Request scope", data: label, tool: "Clayton task planner", result: "Plan created", next: "Gather data" },
  { stage: "Gathering data", agent, checked: "Recent campaign & brand data", data: "Last 7 days (demo data)", tool: `${agent} (simulated)`, result: "Data collected", next: "Summarize" },
  { stage: "Summarizing findings", agent: "Clayton", checked: "Findings", data: "3 observations", tool: "Clayton summarizer", result: "Summary ready for review", next: "Review in workspace" },
];

/* ------------------------------------------------------------------ */
/* Initial state                                                       */
/* ------------------------------------------------------------------ */
function baseState(accessPath: AccessPath): State {
  const bd = accessPath === "bd";
  return {
    version: 3,
    accessPath,
    role: "admin",
    biz: "bluefocus",
    clientId: "freebeat",
    onboarded: false,
    onboarding: {
      step: 0,
      freeText: "",
      company: "BlueFocus",
      clientName: "Freebeat",
      url: "freebeat.ai",
      objective: "Awareness",
      channel: "Meta Ads",
    },
    clients: [
      { id: "freebeat", name: "Freebeat", biz: "bluefocus", industry: "Music & creator app", tagline: "AI music videos" },
      { id: "clientb", name: "Demo Client B", biz: "bluefocus", industry: "Skincare e-commerce", tagline: "DTC skincare" },
      { id: "direct", name: "Northwind Coffee", biz: "direct", industry: "Local F&B", tagline: "Direct customer" },
    ],
    brands: {
      ...(bd ? { freebeat: { ...FREEBEAT_BRAND } } : {}),
      clientb: { name: "Demo Client B", description: "DTC skincare brand selling clean daily routines online.", industry: "Beauty · E-commerce", audience: "Women 25–44 in urban US", market: "United States", url: "clientb.example", assets: ["Logo", "Product photography set"], status: "confirmed", source: "manual" },
      direct: { name: "Northwind Coffee", description: "Neighborhood specialty coffee roaster with 3 cafés.", industry: "Food & beverage", audience: "Local commuters and remote workers", market: "Seattle, WA", url: "northwind.example", assets: ["Logo"], status: "confirmed", source: "manual" },
    },
    pageAccess: "required",
    wallet: { balance: 0, activity: [] },
    tasks: [
      { id: "T-0991", clientId: "clientb", title: "Weekly search performance review", agent: "UA Agent", status: "completed", stage: 3, stages: GENERIC_STAGES("Weekly search review", "UA Agent"), result: "CPC down 6% WoW (demo). No action needed.", createdAt: "Mon 09:10" },
      { id: "T-0997", clientId: "clientb", title: "Retargeting creative refresh research", agent: "Creative", status: "failed", stage: 1, stages: GENERIC_STAGES("Creative research", "Creative"), result: "Simulated failure: competitor ad library timed out. Retry available.", createdAt: "Mon 11:42" },
      { id: "T-1003", clientId: "direct", title: "Local awareness idea for Northwind", agent: "AI AM", status: "completed", stage: 3, stages: GENERIC_STAGES("Local awareness idea", "AI AM"), result: "Suggested a 3km radius Meta campaign (draft idea).", createdAt: "Sun 16:20" },
    ],
    campaign: null,
    resumed: false,
    launch: { inFlight: false, requestId: null, dupBlocked: 0, error: null, failNext: false, providerId: "DEMO-META-1024", firstSpend: null },
    cases: [
      { id: "CASE-2038", clientId: "clientb", type: "Account Opening", owner: "Anita", taskId: "T-0997", status: "In Progress", updated: "Mon 12:05", diagnostics: ["New TikTok ad account requested", "Business verification document pending", "No credentials stored in case"], notes: ["Requested business registration from agency AM."] },
    ],
    report: { status: "none", external: "" },
    messages: [],
    notifications: bd
      ? [{ id: "N-1", text: "BD team pre-configured BlueFocus / Freebeat. Please review the prefilled setup.", to: "/", read: false }]
      : [],
    checks: [],
    clientAiAm: false,
    creativeLevel: "limited",
    portalActions: [
      { id: "PA-1", text: "Confirm US holiday blackout dates", done: false },
      { id: "PA-2", text: "Acknowledge awareness campaign plan", done: false },
    ],
    portalRequests: [],
    slackReplies: [],
    seq: 10,
  };
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */
const KEY = "hellyeah-prototype-state-v3";
const serverState = baseState("self");
let state: State = serverState;
const listeners = new Set<() => void>();
let hydrated = false;

function emit() {
  listeners.forEach((l) => l());
}
export function hydrateDemo() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === serverState.version) {
        state = parsed;
        emit();
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
}
export function useDemo(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => serverState,
  );
}
export function getDemo() {
  return state;
}
export function update(fn: (s: State) => void) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  emit();
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
function id(s: State, p: string) {
  s.seq += 1;
  return `${p}-${s.seq}`;
}
export function notify(s: State, text: string, to = "/overview") {
  s.notifications.unshift({ id: id(s, "N"), text, to, read: false });
}
export function check(s: State, c: string) {
  if (!s.checks.includes(c)) s.checks.push(c);
}
function say(s: State, from: Msg["from"], text: string, card?: Msg["card"], clientId = "freebeat") {
  s.messages.push({ id: id(s, "M"), clientId, from, text, card });
}
export function ownerFor(type: Case["type"]) {
  return type === "Meta Page Authorization" ? "Andy" : "Anita";
}

export const can = {
  editDraft: (r: Role) => r === "admin" || r === "member",
  approve: (r: Role) => r === "admin",
  fund: (r: Role) => r === "admin",
  launch: (r: Role) => r === "admin",
  ops: (r: Role) => r === "ops",
  agency: (r: Role) => r === "admin" || r === "member" || r === "ops",
};

export function brandFor(s: State, clientId: string): Brand | undefined {
  return s.brands[clientId];
}

export function readiness(s: State) {
  const brand = s.brands["freebeat"];
  const daily = s.campaign?.dailyBudget ?? 200;
  return [
    { key: "brand", label: "Brand Profile", ok: brand?.status === "confirmed", value: brand ? (brand.status === "confirmed" ? "Confirmed" : "Draft — needs confirmation") : "Missing" },
    { key: "account", label: "Meta Ad Account", ok: true, value: "Assigned · act_DEMO_88231" },
    { key: "page", label: "Meta Page Access", ok: s.pageAccess === "connected", value: s.pageAccess === "connected" ? "Connected (verified)" : s.pageAccess === "pending_support" ? "Waiting for Support" : "Authorization Required" },
    { key: "wallet", label: "Wallet", ok: s.wallet.balance >= daily, value: s.wallet.balance >= daily ? `Funded · $${s.wallet.balance.toLocaleString()}` : `Funding Required (min $${daily})` },
    { key: "creative", label: "Creative Assets", ok: true, value: "Ready · 3 approved" },
  ];
}
export function isReady(s: State) {
  return readiness(s).every((r) => r.ok);
}

/** Main task status is derived from the shared campaign / access state so every screen agrees. */
export function mainTaskView(s: State): { status: TaskStatus; detail: string } | null {
  const t = s.tasks.find((x) => x.id === MAIN_TASK_ID);
  if (!t) return null;
  if (t.stage < t.stages.length) return { status: "running", detail: `Stage ${t.stage + 1}/6 · ${t.stages[t.stage].stage}` };
  const c = s.campaign;
  if (c?.status === "live_verified") return { status: "completed", detail: "Campaign Live Verified" };
  if (s.launch.error) return { status: "failed", detail: s.launch.error };
  if (s.pageAccess === "pending_support") return { status: "blocked", detail: "Waiting for Support · Meta Page access" };
  if (s.pageAccess === "required") return { status: "blocked", detail: "Meta Page authorization required" };
  if (!s.resumed) return { status: "blocked", detail: "Access verified — ready to resume" };
  if (!c) return { status: "running", detail: "Preparing" };
  if (c.status === "awaiting_approval") return { status: "waiting_approval", detail: `Waiting for Admin approval · Rev ${c.revision}` };
  if (c.status === "draft") return { status: "waiting_approval", detail: c.changesRequested ? "Changes requested by Admin" : "Draft ready — submit for approval" };
  if (c.status === "approved") return { status: "running", detail: isReady(s) ? "Approved — ready to launch" : "Approved — readiness incomplete" };
  return { status: "running", detail: `Launch: ${STATUS_LABEL[c.status]}` };
}
export function taskView(s: State, t: Task) {
  if (t.id === MAIN_TASK_ID) return mainTaskView(s)!;
  return { status: t.status, detail: t.status === "running" ? `Stage ${t.stage + 1}/${t.stages.length}` : t.result ?? "" };
}

export const STATUS_FLOW: CampaignStatus[] = ["draft", "awaiting_approval", "approved", "submitted", "ops_review", "provider_accepted", "delivery_pending", "live_verified"];
export const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: "Draft",
  awaiting_approval: "Awaiting Approval",
  approved: "Approved",
  submitted: "Submitted",
  ops_review: "Ops Review",
  provider_accepted: "Provider Accepted",
  delivery_pending: "Delivery Pending",
  live_verified: "Live Verified",
};

/** Coherent demo metrics: CPM = spend/impressions*1000, frequency = impressions/reach. */
export const REPORT_METRICS = { spend: 18.42, impressions: 3070, reach: 2558, cpm: 6.0, frequency: 1.2, freshness: "Updated 42 min ago (demo)" };
export const DEFAULT_EXTERNAL =
  "Your US awareness campaign is now live on Meta. In the first hours it reached 2,558 people at a $6.00 CPM, which is below the Spring Launch average. We'll keep frequency under 2.0 and share a full readout after 7 days.";

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */
export const actions = {
  reset(path?: AccessPath) {
    update((s) => {
      const keep = path ?? s.accessPath;
      Object.assign(s, baseState(keep));
    });
  },
  setAccessPath(p: AccessPath) {
    update((s) => Object.assign(s, baseState(p)));
  },
  setRole(r: Role) {
    update((s) => {
      s.role = r;
      if (r === "client") {
        s.biz = "bluefocus";
        s.clientId = "freebeat";
        check(s, "c16");
      }
    });
  },
  setContext(ctx: "freebeat" | "clientb" | "direct") {
    update((s) => {
      s.biz = ctx === "direct" ? "direct" : "bluefocus";
      if (s.clientId === "freebeat" && ctx === "clientb") check(s, "c3");
      s.clientId = ctx;
    });
  },
  setClient(cid: string) {
    update((s) => {
      if (s.clientId !== cid && cid !== "all") check(s, "c3");
      s.clientId = cid;
    });
  },
  addClient(name: string) {
    update((s) => {
      const cid = `client-${s.seq + 1}`;
      s.seq += 1;
      s.clients.push({ id: cid, name, biz: "bluefocus", industry: "Not set", tagline: "New client (demo)" });
      s.clientId = cid;
      notify(s, `Client “${name}” added to BlueFocus (simulated).`, "/brand");
    });
  },
  onboarding(patch: Partial<State["onboarding"]>) {
    update((s) => Object.assign(s.onboarding, patch));
  },
  setBrand(cid: string, b: Brand) {
    update((s) => {
      s.brands[cid] = b;
    });
  },
  confirmBrand(cid: string, b?: Brand) {
    update((s) => {
      const brand = b ?? s.brands[cid];
      if (!brand) return;
      s.brands[cid] = { ...brand, status: "confirmed" };
      if (brand.source === "bd") check(s, "c1");
      notify(s, `${brand.name} Brand Profile confirmed.`, "/brand");
    });
  },
  finishOnboarding() {
    update((s) => {
      s.onboarded = true;
      const o = s.onboarding;
      if (o.customerType === "own") {
        s.biz = "direct";
        s.clientId = "direct";
      } else {
        s.biz = "bluefocus";
        s.clientId = "freebeat";
        const fb = s.clients.find((c) => c.id === "freebeat");
        if (fb && o.clientName.trim()) fb.name = o.clientName.trim();
      }
      if (s.accessPath === "self") check(s, "c2");
      notify(s, "Onboarding complete. Your AI team is ready.", "/workspace");
    });
  },
  startMainTask() {
    update((s) => {
      if (s.tasks.some((t) => t.id === MAIN_TASK_ID)) return;
      s.tasks.unshift({ id: MAIN_TASK_ID, clientId: "freebeat", title: "Prepare Freebeat US Meta awareness campaign", agent: "Clayton → UA, Creative", status: "running", stage: 0, stages: MAIN_STAGES, campaignId: "CMP-FB-US-01", createdAt: now() });
      say(s, "user", MAIN_PROMPT);
      say(s, "clayton", "On it. I'll coordinate UA and Creative and show each step here.", "stages");
    });
  },
  startGenericTask(clientId: string, title: string, agent: string, prompt?: string) {
    update((s) => {
      const tid = id(s, "T");
      s.tasks.unshift({ id: tid, clientId, title, agent, status: "running", stage: 0, stages: GENERIC_STAGES(title, agent), createdAt: now() });
      if (prompt) say(s, "user", prompt, undefined, clientId);
      say(s, clientId === "direct" ? "aiam" : "clayton", `Started task ${tid}: “${title}”. I'll post the summary here.`, undefined, clientId);
    });
  },
  retryTask(tid: string) {
    update((s) => {
      const t = s.tasks.find((x) => x.id === tid);
      if (!t) return;
      t.status = "running";
      t.stage = 0;
      t.result = undefined;
    });
  },
  /** Called by the shell's runner on a fixed interval. */
  tick() {
    const s0 = state;
    if (!s0.tasks.some((t) => t.status === "running" && t.stage < t.stages.length)) return;
    update((s) => {
      for (const t of s.tasks) {
        if (t.status !== "running" || t.stage >= t.stages.length) continue;
        t.stage += 1;
        if (t.id === MAIN_TASK_ID) {
          if (t.stage === 5 && !s.campaign) {
            s.campaign = { id: "CMP-FB-US-01", clientId: "freebeat", name: "Freebeat — US Awareness Campaign", platform: "Meta", objective: "Awareness", geo: "United States", dailyBudget: 200, totalCap: 2000, audience: "US · 18–34 · Interests: music creation, TikTok/Reels creators", placements: ["Instagram Reels", "Facebook Feed", "Instagram Stories"], assets: 3, revision: 1, status: "draft", approvedRevision: null, revisions: [{ rev: 1, by: "UA Agent", change: "Initial proposal" }] };
            say(s, "ua", "UA contribution: Spring Launch showed Reels CPM 18% below Feed; I weighted Reels first. Proposal Revision 1 is ready.", "proposal");
          }
          if (t.stage === 6) {
            t.status = "blocked";
            check(s, "c6");
            say(s, "clayton", "Proposal is ready, but launch is blocked: Meta Page access isn't authorized and the Wallet isn't funded. You can request human help for access.", "readiness");
            notify(s, "T-1024 blocked: Meta Page authorization required.", "/workspace");
          }
        } else if (t.stage >= t.stages.length) {
          t.status = "completed";
          t.result = "Summary: spend pacing on track; frequency stable; recommend testing one new hook (demo).";
          say(s, t.clientId === "direct" ? "aiam" : "clayton", `${t.id} done — ${t.result}`, undefined, t.clientId);
          notify(s, `${t.id} completed: ${t.title}`, "/tasks");
        }
      }
    });
  },
  requestHumanHelp() {
    update((s) => {
      if (s.cases.some((c) => c.type === "Meta Page Authorization" && c.status !== "Closed")) return;
      const cid = "CASE-2041";
      s.cases.unshift({ id: cid, clientId: "freebeat", type: "Meta Page Authorization", owner: ownerFor("Meta Page Authorization"), taskId: MAIN_TASK_ID, status: "Open", updated: now(), diagnostics: ["Ad account act_DEMO_88231 assigned to BlueFocus BM", "Facebook Page “Freebeat” not shared with BlueFocus Business Manager", "Required permission: ADVERTISE on Page", "Customer conversation: summarized only (private messages not shared)", "Credentials: never stored in case"], notes: [] });
      s.pageAccess = "pending_support";
      const t = s.tasks.find((x) => x.id === MAIN_TASK_ID);
      if (t) t.caseId = cid;
      check(s, "c7");
      check(s, "c8");
      say(s, "clayton", `I opened ${cid} with Hellyeah Ops (routed to Andy, Meta authorization). Task T-1024 is paused — waiting for support. I'll tell you when access is verified.`);
      notify(s, `${cid} created and routed to Andy.`, "/ops");
    });
  },
  updateCase(cid: string, patch: Partial<Pick<Case, "status">>, note?: string) {
    update((s) => {
      const c = s.cases.find((x) => x.id === cid);
      if (!c) return;
      if (patch.status) c.status = patch.status;
      if (note?.trim()) c.notes.push(note.trim());
      c.updated = now();
      if (c.type === "Meta Page Authorization" && (c.status === "Resolved" || c.status === "Closed") && s.pageAccess !== "connected") {
        check(s, "c10");
        notify(s, `${cid} marked ${c.status}. Access still unverified — run Verify Connection.`, "/ops");
      }
    });
  },
  openCase(cid: string) {
    update((s) => {
      const c = s.cases.find((x) => x.id === cid);
      if (c?.type === "Account Opening" && c.owner === "Anita") check(s, "c9");
    });
  },
  verifyConnection(cid: string) {
    update((s) => {
      const c = s.cases.find((x) => x.id === cid);
      if (!c) return;
      if (c.status === "Open" || c.notes.length === 0) {
        c.recheck = `${now()} · Recheck failed: Page still not shared with BlueFocus BM. Update the case with the fix first.`;
        return;
      }
      c.recheck = `${now()} · Recheck passed: ADVERTISE permission confirmed (simulated).`;
      s.pageAccess = "connected";
      check(s, "c10");
      say(s, "clayton", "Good news — Meta Page access is verified. You can resume T-1024 and continue to approval.", "resume");
      notify(s, "Meta Page access verified. T-1024 can resume.", "/workspace");
    });
  },
  resumeTask() {
    update((s) => {
      if (s.pageAccess !== "connected") return;
      s.resumed = true;
      check(s, "c11");
      say(s, "clayton", "Resumed. Next step: submit the proposal for Admin approval and make sure the Wallet is funded.", "readiness");
    });
  },
  editCampaign(patch: Partial<Pick<Campaign, "dailyBudget" | "totalCap" | "audience" | "placements">>, change: string) {
    update((s) => {
      const c = s.campaign;
      if (!c || !can.editDraft(s.role)) return;
      if (STATUS_FLOW.indexOf(c.status) >= STATUS_FLOW.indexOf("submitted")) return;
      const hadApproval = c.status === "approved" || c.status === "awaiting_approval";
      Object.assign(c, patch);
      c.revision += 1;
      c.revisions.push({ rev: c.revision, by: USERS[s.role].name, change });
      if (hadApproval) {
        c.status = "draft";
        c.approvedRevision = null;
        check(s, "c12");
        notify(s, `Proposal edited to Revision ${c.revision}. Previous approval invalidated.`, "/campaigns");
      }
      say(s, "system", `Proposal updated to Revision ${c.revision}: ${change}${hadApproval ? " — prior approval invalidated." : ""}`);
    });
  },
  submitForApproval() {
    update((s) => {
      const c = s.campaign;
      if (!c || c.status !== "draft" || !can.editDraft(s.role)) return;
      c.status = "awaiting_approval";
      c.changesRequested = undefined;
      if (s.role === "member") check(s, "c4");
      notify(s, `Approval requested for Revision ${c.revision} by ${USERS[s.role].name}.`, "/campaigns");
      say(s, "system", `Revision ${c.revision} submitted for Admin approval.`);
    });
  },
  approve() {
    update((s) => {
      const c = s.campaign;
      if (!c || c.status !== "awaiting_approval" || !can.approve(s.role)) return;
      c.status = "approved";
      c.approvedRevision = c.revision;
      if (s.wallet.activity.some((a) => a.amount > 0)) check(s, "c5");
      notify(s, `Revision ${c.revision} approved by ${USERS[s.role].name}.`, "/campaigns");
      say(s, "system", `Admin approved Revision ${c.revision}.`);
    });
  },
  requestChanges(note: string) {
    update((s) => {
      const c = s.campaign;
      if (!c || c.status !== "awaiting_approval" || !can.approve(s.role)) return;
      c.status = "draft";
      c.changesRequested = note || "Changes requested";
      notify(s, `Changes requested on Revision ${c.revision}: ${c.changesRequested}`, "/campaigns");
    });
  },
  addFunds(amount: number) {
    update((s) => {
      if (!can.fund(s.role) || !(amount > 0)) return;
      s.wallet.balance += amount;
      s.wallet.activity.unshift({ id: id(s, "W"), text: "Simulated top-up (no real payment)", amount, by: USERS[s.role].name });
      if (s.campaign?.approvedRevision) check(s, "c5");
      notify(s, `Wallet funded with $${amount.toLocaleString()} (simulated).`, "/wallet");
    });
  },
  /** Idempotent launch: a second click while a request is in flight is rejected. */
  launch() {
    const s0 = state;
    if (s0.launch.inFlight) {
      update((s) => {
        s.launch.dupBlocked += 1;
        check(s, "c13");
      });
      return;
    }
    const c = s0.campaign;
    if (!c || c.status !== "approved" || c.approvedRevision !== c.revision || !isReady(s0) || !can.launch(s0.role)) return;
    update((s) => {
      s.launch.inFlight = true;
      s.launch.requestId = `LR-${c.revision}-${s.seq}`;
      s.launch.error = null;
    });
    setTimeout(() => {
      update((s) => {
        s.launch.inFlight = false;
        if (s.campaign && s.campaign.status === "approved") {
          s.campaign.status = "submitted";
          notify(s, "Launch submitted to Hellyeah Ops (simulated).", "/campaigns");
        }
      });
    }, 1600);
  },
  advanceLaunch() {
    update((s) => {
      const c = s.campaign;
      if (!c) return;
      const i = STATUS_FLOW.indexOf(c.status);
      if (i < STATUS_FLOW.indexOf("submitted") || c.status === "live_verified") return;
      const next = STATUS_FLOW[i + 1]!;
      if (next === "provider_accepted") {
        if (s.launch.failNext) {
          s.launch.failNext = false;
          s.launch.error = "Simulated provider error: Meta returned a temporary 503. Retry is safe (same request ID).";
          return;
        }
        if (!s.launch.providerId.trim()) {
          s.launch.error = "Provider campaign ID required to mark accepted.";
          return;
        }
      }
      if (next === "live_verified" && s.launch.firstSpend == null) {
        s.launch.error = "First spend confirmation required before Live Verified.";
        return;
      }
      s.launch.error = null;
      c.status = next;
      if (next === "live_verified") {
        check(s, "c14");
        s.report = { status: "draft", external: DEFAULT_EXTERNAL };
        say(s, "clayton", "Campaign is Live Verified (simulated). Here's the first Daily Performance Update — internal draft, not shared with the client.", "report");
        notify(s, "Freebeat US Awareness is Live Verified. T-1024 completed.", "/analytics");
      }
    });
  },
  setLaunch(patch: Partial<State["launch"]>) {
    update((s) => Object.assign(s.launch, patch));
  },
  retryLaunch() {
    update((s) => {
      s.launch.error = null;
    });
  },
  setReport(patch: Partial<State["report"]>) {
    update((s) => {
      Object.assign(s.report, patch);
      if (patch.status === "published") {
        check(s, "c15");
        notify(s, "Daily Performance Update published to the Freebeat Client Portal.", "/portal");
      }
    });
  },
  markAllRead() {
    update((s) => s.notifications.forEach((n) => (n.read = true)));
  },
  markCheck(c: string) {
    update((s) => check(s, c));
  },
  setClientAiAm(v: boolean) {
    update((s) => {
      s.clientAiAm = v;
    });
  },
  setCreativeLevel(v: State["creativeLevel"]) {
    update((s) => {
      if (s.role !== "ops") return;
      s.creativeLevel = v;
      notify(s, `Ops set Creative capability to ${v} (simulated entitlement change).`, "/capabilities");
    });
  },
  togglePortalAction(pid: string) {
    update((s) => {
      const a = s.portalActions.find((x) => x.id === pid);
      if (a) a.done = !a.done;
    });
  },
  contactAm(text: string) {
    update((s) => {
      s.portalRequests.push(text);
      notify(s, `Freebeat client request for AM: “${text}”`, "/overview");
    });
  },
  slackAsk() {
    update((s) => {
      const v = mainTaskView(s);
      s.slackReplies.push(v ? `T-1024 is ${v.status.replace("_", " ")} — ${v.detail}` : "No active Freebeat task yet.");
    });
  },
};
